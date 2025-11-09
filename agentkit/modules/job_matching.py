"""
job_matching.py
--------------------------------------------------
Unified Job Matching Module using assistant.db + Gemini.

Replaces the old LangChain/Chroma version.

Features:
1️⃣ Loads jobs from the shared SQLite database (assistant.db).
2️⃣ Matches CV summaries to jobs using keyword overlap + Gemini reasoning.
3️⃣ Returns structured JSON summaries (Company, Title, Fit, etc.).

No external vector store. One database only.
"""

import os
import json
import sqlite3
from typing import List, Dict, Any
import google.generativeai as genai

# -----------------------------------------------------------------------------
# CONFIGURATION
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
    """Send a prompt to Gemini and return plain text."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        print(f"[Gemini error] {e}")
        return ""


def _fetch_jobs_from_db(limit: int = 100) -> List[Dict[str, Any]]:
    """Fetch all jobs from the assistant.db."""
    if not os.path.exists(DB_PATH):
        return []

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, title, company, description, recruiter_email FROM jobs LIMIT ?", (limit,))
    rows = cur.fetchall()
    conn.close()

    jobs = [
        {
            "id": r[0],
            "title": r[1],
            "company": r[2],
            "description": r[3],
            "recruiter_email": r[4],
        }
        for r in rows
    ]
    return jobs


# -----------------------------------------------------------------------------
# JOB MATCHING CLASS
# -----------------------------------------------------------------------------
class JobMatching:
    """
    Simplified semantic job search using SQLite + Gemini.

    Methods
    -------
    load_jobs():
        Load all jobs from assistant.db.

    exec_query(query, top_k):
        Find top matching jobs given a CV summary or query.

    refine_result(results):
        Summarize jobs into structured JSON using Gemini.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash-lite") -> None:
        self.model_name = model_name
        self.jobs = []
        self.load_jobs()

    # -------------------------------------------------------------------------
    def load_jobs(self):
        """Load jobs from the assistant.db or fallback to mock jobs."""
        self.jobs = _fetch_jobs_from_db()
        if not self.jobs:
            print("[JobMatching] ⚠️ No jobs found in DB. Using mock data.")
            self.jobs = [
                {
                    "id": 1,
                    "title": "AI Engineer",
                    "company": "OpenAI Labs",
                    "description": "Build and deploy large language models for production.",
                    "recruiter_email": "recruiter@openai.com",
                },
                {
                    "id": 2,
                    "title": "Data Scientist",
                    "company": "DeepData Analytics",
                    "description": "Analyze complex data and build machine learning pipelines.",
                    "recruiter_email": "jobs@deepdata.ai",
                },
                {
                    "id": 3,
                    "title": "Machine Learning Intern",
                    "company": "VisionX",
                    "description": "Assist with model evaluation and feature engineering.",
                    "recruiter_email": "hr@visionx.ai",
                },
            ]
        print(f"[JobMatching] Loaded {len(self.jobs)} jobs.")

    # -------------------------------------------------------------------------
    def _basic_score(self, query: str, text: str) -> float:
        """Simple keyword overlap score."""
        q_words = set(query.lower().split())
        t_words = set(text.lower().split())
        return len(q_words & t_words) / max(len(q_words), 1)

    # -------------------------------------------------------------------------
    def exec_query(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve top-k matching jobs by keyword + Gemini semantic reasoning.
        Returns structured JSON.
        """
        if not query.strip():
            return self.jobs[:top_k]

        # Step 1: Quick lexical ranking
        scored = []
        for j in self.jobs:
            score = self._basic_score(query, j["title"] + " " + j["description"])
            scored.append((score, j))
        scored.sort(key=lambda x: x[0], reverse=True)
        top_jobs = [j for _, j in scored[: min(top_k * 2, len(scored))]]

        # Step 2: Gemini reasoning refinement
        job_list_text = "\n\n".join(
            [f"{i+1}. {j['title']} at {j['company']}\n{j['description']}" for i, j in enumerate(top_jobs)]
        )
        prompt = f"""
        You are an expert AI job recommender.
        The user profile is:

        {query}

        These are potential jobs:
        {job_list_text}

        Pick the {top_k} best matches.
        Output STRICT JSON array, each item containing:
        {{
            "title": "",
            "company": "",
            "description": "",
            "recruiter_email": "",
            "match_score": 0-100,
            "strength": "",
            "weakness": ""
        }}
        Output JSON only.
        """

        try:
            raw = gemini_invoke(prompt)
            json_str = raw[raw.find("[") : raw.rfind("]") + 1]
            parsed = json.loads(json_str)
            print(f"[JobMatching] ✅ Gemini returned {len(parsed)} structured results.")
            return parsed
        except Exception as e:
            print(f"[JobMatching] ⚠️ JSON parse failed ({e}). Returning fallback list.")
            return top_jobs[:top_k]

    # -------------------------------------------------------------------------
    def refine_result(self, results: List[Dict[str, Any]]) -> List[str]:
        """Summarize job descriptions into concise JSON using Gemini."""
        summaries = []
        for job in results:
            desc = job["description"]
            prompt = (
                f"Summarize this job ({job['title']} at {job['company']}) "
                "as STRICT JSON with keys: Company, JobTitle, Remote, Description, Email. "
                "Limit Description to ≤ 150 words.\n\n"
                f"Description:\n{desc}"
            )
            summaries.append(gemini_invoke(prompt))
        print(f"[JobMatching] Summarized {len(summaries)} jobs.")
        return summaries


# -----------------------------------------------------------------------------
# TEST / STANDALONE MODE
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    jm = JobMatching()
    query = "AI engineer with Python, data science, and machine learning experience"
    results = jm.exec_query(query, top_k=3)
    for r in results:
        print("\n--- MATCH ---\n", json.dumps(r, indent=2))
