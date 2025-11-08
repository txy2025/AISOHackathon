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
from langgraph.graph import StateGraph
from langchain_openai import ChatOpenAI
from utils import (
    save_cv_to_db,
    get_jobs_for_embedding,
    save_user_action,
    send_email_to_recruiter,
)

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
GPT5_API_BASE = "https://fj7qg3jbr3.execute-api.eu-west-1.amazonaws.com/v1"
GPT5_API_KEY = os.getenv("OPENAI_API_KEY")

llm = ChatOpenAI(
    model="gpt-5-nano",
    openai_api_base=GPT5_API_BASE,
    openai_api_key=GPT5_API_KEY,
)

# -----------------------------------------------------------------------------
# STATE
# -----------------------------------------------------------------------------
class AgentState(TypedDict, total=False):
    user_id: str
    user_email: Optional[str]
    mode: Optional[str]
    cv_id: Optional[str]
    cv_text: Optional[str]
    cv_parsed: Optional[Dict[str, Any]]
    cv_embedding: Optional[List[float]]
    jobs: Optional[List[Dict[str, Any]]]
    selected_job: Optional[Dict[str, Any]]
    user_action: Optional[str]
    updated_cv_text: Optional[str]
    updated_cv_pdf: Optional[bytes]
    email_status: Optional[str]
    assistant_message: Optional[str]

# -----------------------------------------------------------------------------
# DEBUG UTIL
# -----------------------------------------------------------------------------
def log_step(title: str, state: AgentState):
    print("\n" + "=" * 80)
    print(f"🧩 STEP: {title}")
    print(f"State keys: {list(state.keys())}")
    if "assistant_message" in state:
        print(f"Message: {state.get('assistant_message')}")
    if "user_action" in state:
        print(f"Action: {state.get('user_action')}")
    if "selected_job" in state and state["selected_job"]:
        print(f"Job: {state['selected_job'].get('title')} @ {state['selected_job'].get('company')}")
    print("=" * 80 + "\n")

# -----------------------------------------------------------------------------
# EMBEDDING
# -----------------------------------------------------------------------------
def get_embedding_with_gpt(text: str) -> List[float]:
    print("[Embedding] Generating embedding...")
    prompt = f"""
    Convert the following text into a compact numeric embedding vector of 32 float values.
    Respond with JSON list only, no explanation.

    TEXT:
    {text[:1000]}
    """
    response = llm.invoke([{"role": "user", "content": prompt}])
    try:
        emb = json.loads(response.content)
        print(f"[Embedding] Got {len(emb)}-dim vector.")
        return emb
    except Exception:
        print("[Embedding] Failed to parse, using fallback.")
        return [float(ord(c) % 100) / 100 for c in text[:32]]

# -----------------------------------------------------------------------------
# NODES
# -----------------------------------------------------------------------------
def upload_cv_node(state: AgentState) -> AgentState:
    log_step("upload_cv_node", state)
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
        print("[upload_cv_node] Parsed CV successfully.")
    except Exception:
        parsed = {"summary": response.content}
        print("[upload_cv_node] Failed to parse JSON, using fallback.")

    embedding = get_embedding_with_gpt(cv_text)
    cv_id = save_cv_to_db(state["user_id"], cv_text, parsed, embedding)
    print(f"[upload_cv_node] Saved CV with id={cv_id}")
    state.update({"cv_id": cv_id, "cv_parsed": parsed, "cv_embedding": embedding})
    return state


def match_jobs_node(state: AgentState) -> AgentState:
    log_step("match_jobs_node", state)
    jobs = get_jobs_for_embedding(state["cv_embedding"], top_k=10)
    print(f"[match_jobs_node] Found {len(jobs)} jobs.")
    state["jobs"] = jobs
    state["assistant_message"] = f"Found {len(jobs)} matching jobs."
    return state


def save_action_node(state: AgentState) -> AgentState:
    log_step("save_action_node", state)
    save_user_action(
        user_id=state["user_id"],
        job=state["selected_job"],
        action=state["user_action"],
    )
    state["assistant_message"] = (
        f"Recorded action '{state['user_action']}' for job "
        f"{state['selected_job'].get('title', '')}."
    )
    print(f"[save_action_node] Saved action '{state['user_action']}'.")
    return state


def update_cv_for_job_node(state: AgentState) -> AgentState:
    log_step("update_cv_for_job_node", state)
    job = state["selected_job"]
    cv_text = state["cv_text"]
    print(f"[update_cv_for_job_node] Customizing CV for job '{job['title']}'.")
    prompt = f"""
You are an expert CV formatter.
Given this CV and job description, rewrite the CV in professional LaTeX format.
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
        print("[update_cv_for_job_node] PDF compilation succeeded.")
    except Exception as e:
        state["assistant_message"] = f"LaTeX compilation failed: {e}"
        state["updated_cv_text"] = latex_code
        state["updated_cv_pdf"] = None
        print(f"[update_cv_for_job_node] PDF compilation failed: {e}")
    return state


def send_email_node(state: AgentState) -> AgentState:
    log_step("send_email_node", state)
    job = state["selected_job"]
    print(f"[send_email_node] Preparing email to {job['recruiter_email']}...")
    pdf_bytes = state.get("updated_cv_pdf")
    cover_letter_prompt = f"Write a short, professional cover letter for {job['title']} at {job['company']}."
    resp = llm.invoke([{"role": "user", "content": cover_letter_prompt}])
    cover_letter = resp.content
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
    print("[send_email_node] Email sent.")
    return state

# -----------------------------------------------------------------------------
# ROUTERS
# -----------------------------------------------------------------------------
def action_router(state: AgentState):
    next_step = "update_cv_for_job_node" if state.get("user_action") == "apply" else "end"
    print(f"[Router] action_router -> {next_step}")
    return next_step

def entry_router(state: AgentState):
    if state.get("user_action") is not None:
        print("[Router] entry_router -> save_action_node")
        return "save_action_node"
    if state.get("cv_text") is not None:
        print("[Router] entry_router -> upload_cv_node")
        return "upload_cv_node"
    print("[Router] entry_router -> end")
    return "end"

def router_node(state: AgentState) -> AgentState:
    print("[Router] Starting router_node")
    return state

# -----------------------------------------------------------------------------
# BUILD GRAPH
# -----------------------------------------------------------------------------
def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("router_node", router_node)
    graph.add_node("upload_cv_node", upload_cv_node)
    graph.add_node("match_jobs_node", match_jobs_node)
    graph.add_node("save_action_node", save_action_node)
    graph.add_node("update_cv_for_job_node", update_cv_for_job_node)
    graph.add_node("send_email_node", send_email_node)
    graph.add_node("end", lambda s: s)

    # Upload flow
    graph.add_edge("upload_cv_node", "match_jobs_node")
    graph.add_edge("match_jobs_node", "end")

    # Action flow
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

    # Entry routing
    graph.add_conditional_edges(
        "router_node",
        entry_router,
        {
            "upload_cv_node": "upload_cv_node",
            "save_action_node": "save_action_node",
            "end": "end",
        },
    )

    graph.set_entry_point("router_node")
    graph.set_finish_point("end")
    print("✅ LangGraph built successfully.")
    return graph.compile()
