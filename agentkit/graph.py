# graph.py
import os
import json
import tempfile
import subprocess
from pathlib import Path
from typing import TypedDict, Optional, List, Dict, Any
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from tools import (
    save_cv_to_db,
    get_jobs_for_embedding,
    save_user_action,
    send_email_to_recruiter,
)

# -----------------------------------------------------------------------------
# CONFIG: custom model endpoint (your deployed gpt-5-nano)
# -----------------------------------------------------------------------------
GPT5_API_BASE = "https://fj7qg3jbr3.execute-api.eu-west-1.amazonaws.com/v1"
GPT5_API_KEY = os.getenv("OPENAI_API_KEY")

llm = ChatOpenAI(
    model="gpt-5-nano",
    openai_api_base=GPT5_API_BASE,
    openai_api_key=GPT5_API_KEY,
)

# -----------------------------------------------------------------------------
# STATE: Shared memory between all nodes
# -----------------------------------------------------------------------------
class AgentState(TypedDict, total=False):
    user_id: str
    user_email: Optional[str]
    mode: Optional[str]  # 'upload_cv', 'show_jobs', 'action'

    cv_id: Optional[str]
    cv_text: Optional[str]
    cv_parsed: Optional[Dict[str, Any]]
    cv_embedding: Optional[List[float]]

    jobs: Optional[List[Dict[str, Any]]]
    selected_job: Optional[Dict[str, Any]]
    user_action: Optional[str]  # 'like', 'dislike', 'save', 'apply'

    updated_cv_text: Optional[str]
    updated_cv_pdf: Optional[bytes]
    email_status: Optional[str]
    assistant_message: Optional[str]

# -----------------------------------------------------------------------------
# HELPER: Generate embedding using gpt-5-nano
# -----------------------------------------------------------------------------
def get_embedding_with_gpt(text: str) -> List[float]:
    """Uses gpt-5-nano to generate a compact numeric embedding vector."""
    prompt = f"""
    Convert the following text into a compact numeric embedding vector of 32 float values.
    Respond with JSON list only, no explanation.

    TEXT:
    {text[:1000]}  # limit length
    """
    response = llm.invoke([{"role": "user", "content": prompt}])

    try:
        return json.loads(response.content)
    except Exception:
        # fallback: pseudo embedding
        return [float(ord(c) % 100) / 100 for c in text[:32]]

# -----------------------------------------------------------------------------
# NODE: Upload CV -> parse + embed + save
# -----------------------------------------------------------------------------
def upload_cv_node(state: AgentState) -> AgentState:
    cv_text = state["cv_text"]
    response = llm.invoke(
        [
            {
                "role": "system",
                "content": "Extract structured details from a CV (skills, experience, education) as JSON.",
            },
            {"role": "user", "content": cv_text},
        ]
    )

    try:
        parsed = json.loads(response.content)
    except Exception:
        parsed = {"summary": response.content}

    embedding = get_embedding_with_gpt(cv_text)
    cv_id = save_cv_to_db(state["user_id"], cv_text, parsed, embedding)

    state.update({"cv_id": cv_id, "cv_parsed": parsed, "cv_embedding": embedding})
    return state

# -----------------------------------------------------------------------------
# NODE: Match jobs from datastore
# -----------------------------------------------------------------------------
def match_jobs_node(state: AgentState) -> AgentState:
    jobs = get_jobs_for_embedding(state["cv_embedding"], top_k=10)
    state["jobs"] = jobs
    state["assistant_message"] = f"Found {len(jobs)} matching jobs."
    return state

# -----------------------------------------------------------------------------
# NODE: Save user action
# -----------------------------------------------------------------------------
def save_action_node(state: AgentState) -> AgentState:
    save_user_action(
        user_id=state["user_id"],
        job=state["selected_job"],
        action=state["user_action"],
    )
    return state

# -----------------------------------------------------------------------------
# NODE: Generate job-specific CV (LaTeX + PDF)
# -----------------------------------------------------------------------------
def update_cv_for_job_node(state: AgentState) -> AgentState:
    """
    Generate a job-specific LaTeX CV using gpt-5-nano and compile to PDF.
    """
    job = state["selected_job"]
    cv_text = state["cv_text"]

    prompt = f"""
You are an expert CV formatter.
Given this CV and job description, rewrite the CV in professional LaTeX format
(best practice structure: name, contact, summary, skills, experience, education).
Keep it truthful but emphasize parts relevant to the job.

Job title: {job['title']}
Company: {job['company']}
Description: {job['description']}

Original CV:
{cv_text}

Respond ONLY with valid LaTeX code (no explanations).
"""

    response = llm.invoke([{"role": "user", "content": prompt}])
    latex_code = response.content.strip()

    # --- Save LaTeX and compile to PDF ---
    tmp_dir = Path(tempfile.mkdtemp())
    tex_file = tmp_dir / "cv_updated.tex"
    pdf_file = tmp_dir / "cv_updated.pdf"

    tex_file.write_text(latex_code, encoding="utf-8")

    try:
        subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", tex_file.name],
            cwd=tmp_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        pdf_bytes = pdf_file.read_bytes()
        state["updated_cv_text"] = latex_code
        state["updated_cv_pdf"] = pdf_bytes
        state["assistant_message"] = f"CV customized and compiled to PDF for {job['title']}."
    except Exception as e:
        state["assistant_message"] = f"LaTeX compilation failed: {e}"
        state["updated_cv_text"] = latex_code
        state["updated_cv_pdf"] = None

    return state

# -----------------------------------------------------------------------------
# NODE: Send email with PDF attachment
# -----------------------------------------------------------------------------
def send_email_node(state: AgentState) -> AgentState:
    job = state["selected_job"]
    pdf_bytes = state.get("updated_cv_pdf")
    updated_cv_text = state.get("updated_cv_text", "")

    cover_letter_prompt = f"Write a short, professional cover letter for {job['title']} at {job['company']}."
    resp = llm.invoke([{"role": "user", "content": cover_letter_prompt}])
    cover_letter = resp.content

    # Build MIME message (for Gmail API or SMTP)
    msg = MIMEMultipart()
    msg["Subject"] = f"Application for {job['title']} at {job['company']}"
    msg["To"] = job["recruiter_email"]
    msg.attach(MIMEText(cover_letter, "plain"))

    if pdf_bytes:
        part = MIMEBase("application", "pdf")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment", filename="Updated_CV.pdf")
        msg.attach(part)

    send_email_to_recruiter(
        to=job["recruiter_email"],
        subject=msg["Subject"],
        body=cover_letter + "\n\n[CV attached as PDF]",
    )

    state["email_status"] = "sent"
    state["assistant_message"] = f"Applied to {job['title']} with tailored PDF CV."
    return state

# -----------------------------------------------------------------------------
# CONDITIONAL ROUTER
# -----------------------------------------------------------------------------
def action_router(state: AgentState):
    if state.get("user_action") == "apply":
        return "update_cv_for_job_node"
    return "end"

# -----------------------------------------------------------------------------
# BUILD GRAPH
# -----------------------------------------------------------------------------
def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("upload_cv_node", upload_cv_node)
    graph.add_node("match_jobs_node", match_jobs_node)
    graph.add_node("save_action_node", save_action_node)
    graph.add_node("update_cv_for_job_node", update_cv_for_job_node)
    graph.add_node("send_email_node", send_email_node)
    graph.add_node("end", lambda s: s)

    # Define edges
    graph.add_edge("upload_cv_node", "match_jobs_node")

    graph.add_conditional_edges(
        "save_action_node",
        action_router,
        {
            "update_cv_for_job_node": "update_cv_for_job_node",
            "end": "end",
        },
    )

    graph.add_edge("update_cv_for_job_node", "send_email_node")
    graph.add_edge("send_email_node", "end")

    graph.set_entry_point("upload_cv_node")
    graph.set_finish_point("end")

    return graph.compile()
