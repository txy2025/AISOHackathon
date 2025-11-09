"""
agentkit_extract_metadata_cv_gemini_summary.py
----------------------------------------------
Local CV metadata extractor using Google Gemini (1.5 Pro or Flash).

Outputs:
1️⃣ profile_<name>.json  → structured metadata
2️⃣ summary_<name>.txt   → ~100-word professional summary
3️⃣ Saves metadata & summary into SQLite DB (cv_data.db)
"""

import os
import re
import json
import sqlite3
from datetime import datetime
from PyPDF2 import PdfReader
import docx
import google.generativeai as genai

# ======================================================
# CONFIGURATION
# ======================================================
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./")
DB_PATH = os.getenv("DB_PATH", "./cv_data.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if not GEMINI_API_KEY:
    raise EnvironmentError("❌ Please set GEMINI_API_KEY in your environment.")

genai.configure(api_key=GEMINI_API_KEY)

# ======================================================
# DATABASE SETUP
# ======================================================
def init_db():
    """Create SQLite table if not exists."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS cv_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            emails TEXT,
            phones TEXT,
            linkedin TEXT,
            github TEXT,
            summary TEXT,
            skills TEXT,
            education TEXT,
            experience TEXT,
            projects TEXT,
            languages TEXT,
            industries TEXT,
            raw_text TEXT,
            created_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()

# ======================================================
# TEXT EXTRACTION
# ======================================================
def extract_text(file_path: str) -> str:
    """Extract raw text from PDF or DOCX."""
    _, ext = os.path.splitext(file_path)
    text = ""

    if ext.lower() == ".pdf":
        reader = PdfReader(file_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    elif ext.lower() == ".docx":
        doc = docx.Document(file_path)
        text = "\n".join(p.text for p in doc.paragraphs)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    return re.sub(r"\s+", " ", text.strip())

# ======================================================
# CONTACT INFO EXTRACTION
# ======================================================
def extract_contact_info(text: str) -> dict:
    """Regex-based contact extraction."""
    return {
        "emails": re.findall(r'[\w\.-]+@[\w\.-]+', text),
        "phones": re.findall(r'\+?\d[\d\s\-]{7,}\d', text),
        "linkedin": re.findall(r'(?:https?://)?(?:www\.)?linkedin\.com/[A-Za-z0-9_/.\-]+', text),
        "github": re.findall(r'(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_/.\-]+', text),
        "websites": re.findall(r'(?:https?://)?(?:www\.)?[A-Za-z0-9\-]+\.[a-z]{2,}(?:/[A-Za-z0-9_\-./]*)?', text),
    }

# ======================================================
# GEMINI ENRICHMENT
# ======================================================
def enrich_with_gemini(text: str, contact_info: dict) -> dict:
    """Send extracted text to Gemini and ensure structured JSON output."""
    model = genai.GenerativeModel(GEMINI_MODEL)
    prompt = f"""
    You are a professional CV parser and data extractor.
    Read the following resume text and return a JSON object with this structure:

    {{
        "name": "",
        "summary": "",
        "education": [
            {{"degree": "", "field": "", "institution": "", "start": "", "end": ""}}
        ],
        "experience": [
            {{"title": "", "company": "", "start": "", "end": "", "description": ""}}
        ],
        "projects": [
            {{"name": "", "description": "", "tech_stack": []}}
        ],
        "skills": [],
        "languages": [],
        "industries": [],
        "contact_info": {json.dumps(contact_info, ensure_ascii=False)}
    }}

    Resume text:
    {text[:15000]}

    Only output valid JSON — no explanations, no markdown, nothing outside the braces.
    """

    try:
        response = model.generate_content(prompt)
        raw_output = response.text.strip()
        start = raw_output.find("{")
        end = raw_output.rfind("}") + 1
        json_str = raw_output[start:end]
        parsed = json.loads(json_str)
        return parsed
    except Exception as e:
        print(f"⚠️ Gemini parse error: {e}")
        return {"raw_text": text, "contact_info": contact_info}

# ======================================================
# GEMINI SUMMARY GENERATION
# ======================================================
def summarize_applicant(metadata: dict, text: str) -> str:
    """Generate a ~100-word summary of the applicant."""
    model = genai.GenerativeModel(GEMINI_MODEL)
    structured_context = json.dumps({
        "name": metadata.get("name", ""),
        "summary": metadata.get("summary", ""),
        "education": metadata.get("education", []),
        "experience": metadata.get("experience", []),
        "skills": metadata.get("skills", []),
        "industries": metadata.get("industries", []),
    }, ensure_ascii=False)

    prompt = f"""
    You are an AI resume summarizer.
    Write a concise, professional summary (~100 words) for a job application profile,
    based on this structured metadata and CV text.

    Metadata:
    {structured_context}

    CV Text:
    {text[:10000]}

    The summary should sound natural, positive, and highlight strengths, expertise, and key industries.
    Output only the summary paragraph.
    """

    try:
        response = model.generate_content(prompt)
        summary_text = response.text.strip()
        return summary_text or "Summary unavailable."
    except Exception as e:
        print(f"⚠️ Gemini summary error: {e}")
        return "Summary unavailable due to an error."

# ======================================================
# SAVE TO SQLITE
# ======================================================
def save_to_db(metadata: dict, summary: str):
    """Insert the parsed CV metadata and summary into SQLite DB."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Insert all key fields safely
    cursor.execute(
        """
        INSERT OR REPLACE INTO cv_profiles (
            id, name, emails, phones, linkedin, github, summary, skills,
            education, experience, projects, languages, industries, raw_text, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record_id,
            metadata.get("name", ""),
            ", ".join(metadata.get("contact_info", {}).get("emails", [])),
            ", ".join(metadata.get("contact_info", {}).get("phones", [])),
            ", ".join(metadata.get("contact_info", {}).get("linkedin", [])),
            ", ".join(metadata.get("contact_info", {}).get("github", [])),
            summary or metadata.get("summary", ""),
            ", ".join(metadata.get("skills", [])),
            json.dumps(metadata.get("education", []), ensure_ascii=False),
            json.dumps(metadata.get("experience", []), ensure_ascii=False),
            json.dumps(metadata.get("projects", []), ensure_ascii=False),
            json.dumps(metadata.get("languages", []), ensure_ascii=False),
            json.dumps(metadata.get("industries", []), ensure_ascii=False),
            metadata.get("raw_text", ""),
            datetime.utcnow().isoformat(),
        ),
    )

    conn.commit()
    conn.close()
    print("✅ Metadata and summary inserted into SQLite database.")

# ======================================================
# MAIN PIPELINE
# ======================================================
def extract_metadata(file_path: str) -> dict:
    """End-to-end metadata extraction pipeline."""
    print(f"📄 Processing: {file_path}")
    init_db()
    text = extract_text(file_path)
    contact_info = extract_contact_info(text)
    metadata = enrich_with_gemini(text, contact_info)

    metadata.setdefault("contact_info", contact_info)
    metadata.setdefault("raw_text", text)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(file_path))[0]

    json_path = os.path.join(OUTPUT_DIR, f"profile_{base_name}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    summary = summarize_applicant(metadata, text)

    summary_path = os.path.join(OUTPUT_DIR, f"summary_{base_name}.txt")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary)

    # Save both metadata & summary to DB
    save_to_db(metadata, summary)

    print(f"✅ Profile saved → {json_path}")
    print(f"✅ Summary saved → {summary_path}")
    return metadata

# ======================================================
# CLI ENTRY POINT
# ======================================================
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python agentkit_extract_metadata_cv_gemini_summary.py <cv_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    extract_metadata(file_path)

