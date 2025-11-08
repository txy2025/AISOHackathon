"""
agentkit_extract_metadata_cv_gemini.py
--------------------------------------
Local CV metadata extractor using Google Gemini (1.5 Pro or Flash).

Steps:
1️⃣ Extract text and contact info locally (PDF / DOCX).
2️⃣ Send everything to Gemini for structured metadata extraction.
3️⃣ Save and return JSON with: name, summary, education, experience,
    projects, skills, languages, industries, and contact info.
"""

import os
import re
import json
from PyPDF2 import PdfReader
import docx
import google.generativeai as genai

# ======================================================
# CONFIGURATION
# ======================================================
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


if not GEMINI_API_KEY:
    raise EnvironmentError("❌ Please set GEMINI_API_KEY in your environment.")

genai.configure(api_key=GEMINI_API_KEY)

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
        # Attempt to extract JSON content
        start = raw_output.find("{")
        end = raw_output.rfind("}") + 1
        json_str = raw_output[start:end]
        parsed = json.loads(json_str)
        return parsed
    except Exception as e:
        print(f"⚠️ Gemini parse error: {e}")
        return {"raw_text": text, "contact_info": contact_info}


# ======================================================
# MAIN PIPELINE
# ======================================================
def extract_metadata(file_path: str) -> dict:
    """End-to-end metadata extraction pipeline."""
    print(f"📄 Processing: {file_path}")
    text = extract_text(file_path)
    contact_info = extract_contact_info(text)
    metadata = enrich_with_gemini(text, contact_info)

    metadata.setdefault("contact_info", contact_info)
    metadata.setdefault("raw_text", text)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(
        OUTPUT_DIR,
        f"profile_{os.path.splitext(os.path.basename(file_path))[0]}.json"
    )
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"✅ Profile saved → {output_path}")
    return metadata


# ======================================================
# CLI ENTRY POINT
# ======================================================
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python agentkit_extract_metadata_cv_gemini.py <cv_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    extract_metadata(file_path)
