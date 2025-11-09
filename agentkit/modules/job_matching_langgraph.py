"""
job_matching_langgraph.py
--------------------------------------------------
Job Matching Module — unified with assistant.db

This version removes Chroma and uses only the SQLite DB
managed by utils.py for both CVs and job listings.

Features:
1️⃣ Loads jobs directly from SQLite (via utils).
2️⃣ Performs keyword + Gemini-based semantic filtering.
3️⃣ Summarizes results via Gemini into structured JSON.
"""

import os
import json
import sqlite3
from typing import List, Dict, Any
import google.generativeai as genai

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("❌ Please set GEMINI_API_KEY in your environment.")

genai.configure(api_key=GEMINI_API_KEY)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

DB_PATH = os.path.join(os.path.dirname(__file__), "assistant.db")


# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------
def gemini_invoke(prompt: str) -> str:
    """Call Gemini and return plain text."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        print(f"[Gemini error] {e}")
        return ""


def _fetch_jobs_from_db(limit: int = 100) -> List[Dict[str, Any]]:
    """Return all jobs from SQLite."""
    if not os.path.exists(DB_PATH):
        return []

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, title, company, description, recruiter_email FROM jobs LIMIT ?", (limit,))
    rows = cur.fetchall()
    conn.close()

    jobs = []
    for r in rows:
        jobs.append({
            "id": r[0],
            "title": r[1],
            "company": r[2],
            "description": r[3],
            "recruiter_email": r[4],
        })
    return jobs


# -----------------------------------------------------------------------------
# JOB MATCHING
# -----------------------------------------------------------------------------
class JobMatchingGraph:
    def __init__(self):
        self.jobs = _fetch_jobs_from_db()

        if not self.jobs:
            # fallback mock data
            self.jobs = [
                {
                    "id": 1,
                    "title": "AI Engineer",
                    "company": "OpenAI Labs",
                    "description": "Build and optimize LLM applications for production.",
                    "recruiter_email": "recruiter@openai.com",
                },
                {
                    "id": 2,
                    "title": "Data Scientist",
                    "company": "DeepData Analytics",
                    "description": "Analyze health and climate data for predictive insights.",
                    "recruiter_email": "jobs@deepdata.ai",
                },
                {
                    "id": 3,
                    "title": "Machine Learning Intern",
                    "company": "VisionX",
                    "description": "Assist with model evaluation, preprocessing, and feature engineering.",
                    "recruiter_email": "hr@visionx.ai",
                },
            ]
        print(f"[JobMatchingGraph] Loaded {len(self.jobs)} jobs from DB.")

    # -------------------------------------------------------------------------
    # Simple similarity check
    # -------------------------------------------------------------------------
    def _basic_score(self, query: str, text: str) -> float:
        """Basic keyword overlap score."""
        q_words = set(query.lower().split())
        t_words = set(text.lower().split())
        return len(q_words & t_words) / max(len(q_words), 1)

    # -------------------------------------------------------------------------
    # Semantic search using Gemini
    # -------------------------------------------------------------------------
    def exec_query(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Return top-k relevant jobs using text overlap + Gemini reasoning."""
        if not query.strip():
            return self.jobs[:top_k]

        # Step 1: Simple ranking
        scored = []
        for j in self.jobs:
            score = self._basic_score(query, j["title"] + " " + j["description"])
            scored.append((score, j))

        # Step 2: Sort and keep top candidates
        scored.sort(key=lambda x: x[0], reverse=True)
        top_jobs = [j for _, j in scored[: min(top_k * 2, len(scored))]]

        # Step 3: Let Gemini refine top-k
        jobs_text = "\n\n".join(
            [f"{i+1}. {j['title']} at {j['company']}\n{j['description']}" for i, j in enumerate(top_jobs)]
        )
        prompt = f"""
        You are an expert job recommender.
        User profile:
        {query}

        Here are potential jobs:
        {jobs_text}

        Choose the {top_k} most relevant ones and output
        STRICT JSON list with each element having:
        {{
            "title": "",
            "company": "",
            "description": "",
            "recruiter_email": "",
            "match_score": 0-100,
            "why_fit": "",
            "why_not_fit": ""
        }}
        Output only JSON.
        """

        try:
            raw = gemini_invoke(prompt)
            json_str = raw[raw.find("[") : raw.rfind("]") + 1]
            parsed = json.loads(json_str)
            return parsed
        except Exception as e:
            print(f"[exec_query] Gemini parsing failed: {e}")
            return top_jobs[:top_k]

    # -------------------------------------------------------------------------
    # Summarize selected job (optional)
    # -------------------------------------------------------------------------
    def summarize_job(self, job: Dict[str, Any]) -> str:
        """Generate a short summary paragraph for a job."""
        prompt = f"Summarize this job (≤100 words):\n\n{job['title']} at {job['company']}\n{job['description']}"
        return gemini_invoke(prompt)
