"""
langchain_workflow.py
--------------------------------------------------
LangChain workflow for CV parsing, job matching, CV tailoring,
and emailing the recruiter with a tailored PDF attachment.
"""

import os
import json
import sqlite3
import subprocess
from pathlib import Path
from typing import Dict, Any

# ✅ Correct imports for LangChain 1.0+
from langchain_classic.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from modules.utils import (
    save_user_action,
    send_email_to_recruiter,
)


# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
DB_PATH = "assistant.db"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("❌ GEMINI_API_KEY not found in environment.")

MODEL_NAME = "gemini-2.5-flash-lite"
llm = ChatGoogleGenerativeAI(model=MODEL_NAME, google_api_key=GEMINI_API_KEY)


# -----------------------------------------------------------------------------
# HELPERS: DB QUERIES
# -----------------------------------------------------------------------------
def get_user_from_db(user_id: str) -> Dict[str, Any]:
    """Fetch a user's latest CV record from the database."""
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
        "name": user.get("name", ""),
        "email": user.get("emails", ""),
        "phones": user.get("phones", ""),
        "linkedin": user.get("linkedin", ""),
        "github": user.get("github", ""),
        "summary": user.get("summary", ""),
        "skills": user.get("skills", ""),
        "education": user.get("education", ""),
        "experience": user.get("experience", ""),
        "projects": user.get("projects", ""),
        "languages": user.get("languages", ""),
        "industries": user.get("industries", ""),
        "raw_text": user.get("raw_text", ""),
        "cv_path": cv_path,
    }


# -----------------------------------------------------------------------------
# CORE STEPS
# -----------------------------------------------------------------------------
def parse_cv_if_needed(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use the existing CV data from the database to construct a rich LLM prompt.
    Does not re-parse or modify the database.
    """

    cv_path = user.get("cv_path")
    if not cv_path or not os.path.exists(cv_path):
        print("⚠️ CV file not found, proceeding with DB data only")

    if not user.get("raw_text"):
        raise ValueError(f"❌ No raw_text found in DB for user {user.get('id')}")

    # Build unified prompt for LLM
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

    print("ℹ️ Loaded CV record from database for LLM prompt")

    return {
        "cv_parsed": {
            "summary": user.get("summary", ""),
            "skills": user.get("skills", ""),
            "education": user.get("education", ""),
            "experience": user.get("experience", ""),
            "projects": user.get("projects", ""),
        },
        "cv_text": prompt_text.strip(),
        "assistant_message": "✅ CV loaded from DB and formatted for LLM",
    }


def tailor_cv(cv_text: str, job: Dict[str, Any], user_id: str) -> Path:
    """Generate a LaTeX → PDF CV tailored for a specific job."""
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
    print(prompt_template)
    chain = prompt_template | llm
    result = chain.invoke({"cv_text": cv_text, "title": job["title"], "company": job["company"]})
    print(result)
    latex_code = result.content if hasattr(result, "content") else str(result)


    out_dir = Path("generated_cvs")
    out_dir.mkdir(exist_ok=True)
    tex_path = out_dir / f"user_{user_id}_job_{job['id']}.tex"
    pdf_path = out_dir / f"user_{user_id}_job_{job['id']}.pdf"
    tex_path.write_text(latex_code, encoding="utf-8")

    subprocess.run(
        ["pdflatex", "-interaction=nonstopmode", tex_path.name],
        cwd=out_dir,
        capture_output=True,
    )

    if pdf_path.exists():
        print(f"✅ Tailored CV created for {job['title']}")
        return pdf_path
    else:
        raise RuntimeError("⚠️ Failed to compile CV")


def generate_cover_letter(user: Dict[str, Any], job: Dict[str, Any]) -> str:
    """
    Generate a concise 3–5 line professional cover letter using Gemini,
    personalized with both user and job information.
    """

    prompt = PromptTemplate(
        input_variables=["name", "summary", "experience", "skills", "title", "company", "description"],
        template=(
            "You are an expert career writer. Write a short, 3–5 line professional email-style cover letter.\n"
            "Make it sound natural, confident, and aligned with the candidate’s profile and job description.\n\n"
            "Candidate Name: {name}\n"
            "Summary: {summary}\n"
            "Experience: {experience}\n"
            "Skills: {skills}\n\n"
            "Job Title: {title}\n"
            "Company: {company}\n"
            "Job Description: {description}\n\n"
            "Cover Letter:"
        ),
    )

    chain = prompt | llm
    result = chain.invoke({
        "name": user.get("name", ""),
        "summary": user.get("summary", ""),
        "experience": user.get("experience", ""),
        "skills": user.get("skills", ""),
        "title": job["title"],
        "company": job["company"],
        "description": job.get("description", ""),
    })

    cover_letter = result.content if hasattr(result, "content") else str(result)
    print("✅ Generated personalized cover letter")
    return cover_letter.strip()


# -----------------------------------------------------------------------------
# MAIN PIPELINE
# -----------------------------------------------------------------------------
def run_langchain_pipeline(user_id: str, job_id: int):
    """
    Full workflow:
      1. Fetch user & job
      2. Generate CV prompt
      3. Tailor CV (LaTeX → PDF)
      4. Generate cover letter
      5. Send email with PDF attachment
      6. Save user action
    """

    # 1️⃣ Fetch user (from DB)
    user = get_user_from_db(user_id)

    # 2️⃣ Mock job (until DB job table is ready)
    job = {
        "id": 5,
        "title": "Research Engineer",
        "company": "DeepMind",
        "description": "Conduct applied ML research and build scalable experiments. Publish and collaborate with leading AI researchers.",
        "recruiter_email": "kichujyothis@gmail.com",
    }

    # 3️⃣ Prepare CV prompt
    parsed = parse_cv_if_needed(user)
    print(parsed["assistant_message"])

    # 4️⃣ Generate tailored LaTeX → PDF
    pdf_path = tailor_cv(parsed["cv_text"], job, user_id)
    print(f"PDF path: {pdf_path}")

    # 5️⃣ Generate cover letter
    cover_letter = generate_cover_letter(user, job)
    print("Cover Letter:\n", cover_letter)

    # 6️⃣ Email recruiter with PDF attached
    send_email_to_recruiter(
        to="jyothisgm@gmail.com",
        subject=f"Application for {job['title']} at {job['company']}",
        body=cover_letter,
        attachment_path=str(pdf_path),
    )

    # 7️⃣ Log action
    # save_user_action(user_id, job, "apply")

    # 8️⃣ Return summary
    result = {
        "assistant_message": f"✅ Application sent to {job['company']} with tailored CV.",
        "email_status": "sent",
        "pdf_path": str(pdf_path),
        "user": {"name": user["name"], "email": user["email"]},
        "job": {"title": job["title"], "company": job["company"]},
    }

    print(json.dumps(result, indent=2))
    return result
