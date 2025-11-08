"""
agentkit_extract_metadata_cv.py
--------------------------------
Local CV metadata extractor with direct ChatGPT-Nano enrichment.

Steps:
1️⃣ Extract text and contact info locally (PDF / DOCX).
2️⃣ Send everything to ChatGPT-Nano for structured metadata extraction.
3️⃣ Save and return JSON with: name, summary, education, experience,
    projects, skills, languages, industries, and contact info.
"""

import os
import re
import json
import requests
from PyPDF2 import PdfReader
import docx
from openai import OpenAI

# === CONFIG ===
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # fallback if Nano not set
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise EnvironmentError("❌ Please set OPENAI_API_KEY in your environment.")

client = OpenAI(api_key=OPENAI_KEY)

# ----------------------------------------------------
# TEXT EXTRACTION
# ----------------------------------------------------
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

# ----------------------------------------------------
# CONTACT INFO
# ----------------------------------------------------
def extract_contact_info(text: str) -> dict:
    """Regex-based contact extraction."""
    return {
        "emails": re.findall(r'[\w\.-]+@[\w\.-]+', text),
        "phones": re.findall(r'\+?\d[\d\s\-]{7,}\d', text),
        "linkedin": re.findall(r'(?:https?://)?(?:www\.)?linkedin\.com/[A-Za-z0-9_/.\-]+', text),
        "github": re.findall(r'(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_/.\-]+', text),
        "websites": re.findall(r'(?:https?://)?(?:www\.)?[A-Za-z0-9\-]+\.[a-z]{2,}(?:/[A-Za-z0-9_\-./]*)?', text),
    }

# ----------------------------------------------------
# CHATGPT-NANO ENRICHMENT
# ----------------------------------------------------
def enrich_with_nano(text: str, contact_info: dict) -> dict:
    """Send extracted text directly to ChatGPT-Nano for structured parsing."""
    prompt = f"""
    You are a structured CV metadata extractor.

    Extract all professional information from this resume as **valid JSON**.

    Include the following fields:
    {{
      "name": "",
      "summary": "",
      "education": [{{"degree": "", "field": "", "institution": "", "start": "", "end": ""}}],
      "experience": [{{"title": "", "company": "", "start": "", "end": "", "description": ""}}],
      "projects": [{{"name": "", "description": "", "tech_stack": []}}],
      "skills": [],
      "languages": [],
      "industries": [],
      "contact_info": {json.dumps(contact_info)}
    }}

    Resume text:
    {text}
    """

    try:
        completion = client.chat.completions.create(
            model=OPENAI_MODEL,  # or "gpt-nano" if you have access
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"⚠️ ChatGPT-Nano enrichment failed: {e}")
        return {"raw_text": text, "contact_info": contact_info}

# ----------------------------------------------------
# MAIN PIPELINE
# ----------------------------------------------------
def extract_metadata(file_path: str) -> dict:
    """End-to-end metadata extraction pipeline."""
    print(f"📄 Processing: {file_path}")
    text = extract_text(file_path)
    contact_info = extract_contact_info(text)
    metadata = enrich_with_nano(text, contact_info)

    # ensure fallback fields
    metadata.setdefault("contact_info", contact_info)
    metadata.setdefault("raw_text", text)

    # save output JSON
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(
        OUTPUT_DIR,
        f"profile_{os.path.splitext(os.path.basename(file_path))[0]}.json"
    )
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"✅ Profile saved → {output_path}")
    return metadata

# ----------------------------------------------------
# CLI ENTRY POINT
# ----------------------------------------------------
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python agentkit_extract_metadata_cv.py <cv_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    extract_metadata(file_path)
