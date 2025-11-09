"""
langchain_workflow.py
--------------------------------------------------
LangChain workflow for CV parsing, job matching, CV tailoring, and emailing the recruiter
with a tailored PDF attachment.
"""

import os
import json
import sqlite3
import subprocess
from pathlib import Path
from typing import Dict, Any, List

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from modules.extract_cv_metadata_gemini import extract_metadata
from modules.job_matching import JobMatching
from modules.utils import (
    save_cv_to_db,
    save_user_action,
    send_email_to_recruiter,
)

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
DB_PATH = "database.db"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("❌ GEMINI_API_KEY not found in environment.")

MODEL_NAME = "gemini-2.5-flash-lite"
llm = ChatGoogleGenerativeAI(model=MODEL_NAME, google_api_key=GEMINI_API_KEY)
JM = JobMatching(model_name=MODEL_NAME)

# -----------------------------------------------------------------------------
# HELPERS: DB QUERIES
# -----------------------------------------------------------------------------
def get_user_from_db(user_id: str) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM cv_profiles WHERE id = ? ORDER BY created_at DESC LIMIT 1",
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise ValueError(f"User {user_id} not found in database")
    user = dict(row)
    cv_path = user.get("cv_file_path") or f"uploads/{user_id}_cv.pdf"
    return {
        "id": user["id"],
        "name": user.get("name"),
        "email": user.get("emails"),
        "cv_path": cv_path,
        "summary": user.get("summary", ""),
        "cv_text": user.get("raw_text", ""),
    }


def get_job_from_db(job_id: int) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM job_listings WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise ValueError(f"Job {job_id} not found in database")
    job = dict(row)
    return {
        "id": job["id"],
        "title": job["title"],
        "company": job["company"],
        "description": job.get("description", ""),
        "recruiter_email": job.get("recruiter_email"),
    }

# -----------------------------------------------------------------------------
# CORE STEPS
# -----------------------------------------------------------------------------
def parse_cv_if_needed(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Load an existing CV record from the database and construct a unified text prompt
    for the LLM to use. Does not re-parse or insert into the database.
    """

    cv_path = user.get("cv_path")
    if not cv_path or not os.path.exists(cv_path):
        print("⚠️ CV file not found, but proceeding with DB data only")

    if not user.get("raw_text"):
        raise ValueError(f"❌ No raw_text found in DB for user {user.get('id')}")

    # Build a rich prompt string for the LLM using database fields
    prompt_text = f"""
    Candidate Profile
    ------------------
    Name: {user.get('name', '')}
    Email(s): {user.get('email', '')}
    Phone(s): {user.get('phones', '')}
    LinkedIn: {user.get('linkedin', '')}
    GitHub: {user.get('github', '')}

    Summary:
    {user.get('summary', '')}

    Skills:
    {user.get('skills', '')}

    Education:
    {user.get('education', '')}

    Experience:
    {user.get('experience', '')}

    Projects:
    {user.get('projects', '')}

    Languages:
    {user.get('languages', '')}

    Industries:
    {user.get('industries', '')}

    Full CV Text:
    {user.get('raw_text', '')}
    """

    print("ℹ️ Using existing CV record from database for LLM prompt")

    return {
        "cv_parsed": {
            "summary": user.get("summary", ""),
            "skills": user.get("skills", ""),
            "education": user.get("education", ""),
            "experience": user.get("experience", ""),
            "projects": user.get("projects", ""),
        },
        "cv_text": prompt_text.strip(),
        "assistant_message": "✅ CV loaded from database and converted to LLM prompt",
    }



def tailor_cv(cv_text: str, job: Dict[str, Any], user_id: str) -> Path:
    """Generate LaTeX → PDF for tailored CV and return PDF path."""
    prompt_template = PromptTemplate(
        input_variables=["cv_text", "title", "company"],
        template="""
        You are a professional LaTeX CV writer.

        Write a complete LaTeX CV optimized for:
        Job Title: {title}
        Company: {company}

        Use this CV text as base:
        {cv_text}

        Keep it concise, professional, and truthful.
        The output must start with \\documentclass and end with \\end{{document}}.
        """,
    )
    latex_chain = LLMChain(llm=llm, prompt=prompt_template)
    latex_code = latex_chain.run(cv_text=cv_text, title=job["title"], company=job["company"])

    out_dir = Path("generated_cvs")
    out_dir.mkdir(exist_ok=True)
    tex_path = out_dir / f"user_{user_id}_job_{job['id']}.tex"
    pdf_path = out_dir / f"user_{user_id}_job_{job['id']}.pdf"
    tex_path.write_text(latex_code, encoding="utf-8")

    subprocess.run(["pdflatex", "-interaction=nonstopmode", tex_path.name],
                   cwd=out_dir, capture_output=True)

    if pdf_path.exists():
        print(f"✅ Tailored CV created for {job['title']}")
        return pdf_path
    else:
        raise RuntimeError("⚠️ Failed to compile CV")


def generate_cover_letter(job: Dict[str, Any]) -> str:
    prompt = PromptTemplate(
        input_variables=["title", "company"],
        template="Write a short 3-line cover letter for {title} at {company}.",
    )
    cover_chain = LLMChain(llm=llm, prompt=prompt)
    return cover_chain.run(title=job["title"], company=job["company"])

# -----------------------------------------------------------------------------
# MAIN AGENT PIPELINE
# -----------------------------------------------------------------------------
def run_langchain_pipeline(user_id: str, job_id: int):
    """End-to-end pipeline that fetches user/job from DB, tailors CV, and emails PDF."""
    # 1️⃣ Fetch user & job from DB
    user = get_user_from_db(user_id)
    job = {
            "id": 5,
            "title": "Research Engineer",
            "company": "DeepMind",
            "description": "Conduct applied ML research and build scalable experiments. Publish and collaborate with leading AI researchers.",
            "recruiter_email": "",
        }

    # 2️⃣ Parse or load CV
    parsed = parse_cv_if_needed(user)
    print(parsed)

    # 3️⃣ Tailor CV for job
    pdf_path = tailor_cv(parsed["cv_text"], job, user_id)
    print(pdf_path)

    # 4️⃣ Generate cover letter
    cover_letter = generate_cover_letter(job)
    print(cover_letter)

    # 5️⃣ Send email with PDF attachment
    send_email_to_recruiter(
        to_email="kichujyothis@gmail.com",
        subject=f"Application for {job['title']} at {job['company']}",
        body=cover_letter,
        attachment_path=str(pdf_path),
    )

    # 6️⃣ Log user action
    save_user_action(user_id, job_id, "apply")

    # 7️⃣ Return output
    result = {
        "assistant_message": f"✅ Application sent to {job['company']} with tailored CV.",
        "email_status": "sent",
        "pdf_path": str(pdf_path),
        "user": {"name": user["name"], "email": user["email"]},
        "job": {"title": job["title"], "company": job["company"]},
    }
    print(json.dumps(result, indent=2))
    return result
