"""
graph.py
--------------------------------------------------
LangGraph workflow for CV parsing, job matching, CV tailoring, and email sending.

Depends on:
- utils.py (SQLite + email)
- extract_cv_metadata_gemini.py (CV parsing)
- job_matching.py (SQLite + Gemini job matching)
"""

import os
import json
import subprocess
from pathlib import Path
from typing import TypedDict, Optional, List, Dict, Any
import google.generativeai as genai
from langgraph.graph import StateGraph

from modules.extract_cv_metadata_gemini import extract_metadata
from modules.job_matching import JobMatching
from modules.utils import save_cv_to_db, save_user_action, send_email_to_recruiter

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("❌ GEMINI_API_KEY not found in environment.")

genai.configure(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.5-flash-lite"

JM = JobMatching(model_name=MODEL_NAME)

# -----------------------------------------------------------------------------
# STATE
# -----------------------------------------------------------------------------
class AgentState(TypedDict, total=False):
    user_id: str
    cv_file_path: Optional[str]
    cv_text: Optional[str]
    cv_parsed: Optional[Dict[str, Any]]
    job_search_results: Optional[List[Dict[str, Any]]]
    selected_job: Optional[Dict[str, Any]]
    user_action: Optional[str]
    updated_cv_pdf: Optional[bytes]
    email_status: Optional[str]
    assistant_message: Optional[str]

# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------
def gemini_invoke(prompt: str) -> str:
    """Wrapper for Gemini text generation."""
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        print(f"[Gemini error] {e}")
        return ""

def log_step(name: str, state: AgentState):
    print(f"\n=== {name.upper()} ===")
    print("Keys:", list(state.keys()))
    print(state.get("assistant_message", ""), "\n")

# -----------------------------------------------------------------------------
# NODES
# -----------------------------------------------------------------------------
def parse_cv_node(state: AgentState) -> AgentState:
    log_step("parse_cv_node", state)
    file_path = state.get("cv_file_path")

    if not file_path or not os.path.exists(file_path):
        state["assistant_message"] = "❌ Missing CV file"
        return state

    metadata = extract_metadata(file_path)
    state["cv_parsed"] = metadata
    state["cv_text"] = metadata.get("raw_text", "")
    state["assistant_message"] = "✅ CV parsed successfully"
    return state


def job_search_node(state: AgentState) -> AgentState:
    log_step("job_search_node", state)
    summary = state.get("cv_parsed", {}).get("summary", "")
    if not summary:
        summary = state.get("cv_text", "")[:400]

    results = JM.exec_query(summary, top_k=5)
    state["job_search_results"] = results
    state["assistant_message"] = f"✅ Found {len(results)} job matches"
    return state


def update_cv_node(state: AgentState) -> AgentState:
    log_step("update_cv_node", state)
    job = state.get("selected_job")
    if not job:
        state["assistant_message"] = "⚠️ No job selected for tailoring"
        return state

    cv_text = state.get("cv_text", "")
    prompt = f"""
    You are a professional LaTeX CV writer.

    Write a complete LaTeX CV optimized for:
    Job Title: {job['title']}
    Company: {job['company']}

    Use this CV text as base:
    {cv_text}

    Keep it concise, professional, and truthful.
    The output must start with \\documentclass and end with \\end{{document}}.
    """
    latex_code = gemini_invoke(prompt)

    out_dir = Path("generated_cvs"); out_dir.mkdir(exist_ok=True)
    tex_path = out_dir / "cv_update_gemini.tex"
    pdf_path = out_dir / "cv_update_gemini.pdf"
    tex_path.write_text(latex_code, encoding="utf-8")

    try:
        subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", tex_path.name],
            cwd=out_dir,
            check=False,
            capture_output=True,
        )
        if pdf_path.exists():
            state["updated_cv_pdf"] = pdf_path.read_bytes()
            state["assistant_message"] = f"✅ Tailored CV created for {job['title']}"
        else:
            state["assistant_message"] = "⚠️ Failed to compile CV"
    except Exception as e:
        print("[update_cv_node] PDF compile error:", e)
        state["assistant_message"] = "❌ Error compiling CV"
    return state


def email_node(state: AgentState) -> AgentState:
    log_step("email_node", state)
    job = state.get("selected_job")
    if not job:
        state["assistant_message"] = "⚠️ No job selected for email"
        return state

    cover_letter = gemini_invoke(f"Write a short 3-line cover letter for {job['title']} at {job['company']}.")
    send_email_to_recruiter(job["recruiter_email"], f"Application for {job['title']}", cover_letter)
    state["email_status"] = "sent"
    state["assistant_message"] = f"📧 Application sent to {job['company']}"
    return state

# -----------------------------------------------------------------------------
# GRAPH BUILDER
# -----------------------------------------------------------------------------
def build_graph():
    g = StateGraph(AgentState)
    g.add_node("parse_cv_node", parse_cv_node)
    g.add_node("job_search_node", job_search_node)
    g.add_node("update_cv_node", update_cv_node)
    g.add_node("email_node", email_node)
    g.add_node("end", lambda s: s)

    g.add_edge("parse_cv_node", "job_search_node")
    g.add_edge("job_search_node", "update_cv_node")
    g.add_edge("update_cv_node", "email_node")
    g.add_edge("email_node", "end")

    g.set_entry_point("parse_cv_node")
    g.set_finish_point("end")

    print("✅ LangGraph built successfully (Gemini workflow).")
    return g.compile()

# -----------------------------------------------------------------------------
# RUN STANDALONE
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    g = build_graph()
    test_state = {"user_id": "1", "cv_file_path": "Amalia_Stuger_CV.pdf"}
    final = g.invoke(test_state)
    print(json.dumps({k: str(v)[:200] for k, v in final.items()}, indent=2))
