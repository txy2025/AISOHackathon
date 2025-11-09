from email.mime.application import MIMEApplication
import os
import json
import sqlite3
from typing import Any, Dict, List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# ---------- Simple local SQLite setup ----------
DB_PATH = os.path.join(os.path.dirname(__file__), "assistant.db")


def _ensure_db():
    """Ensure the SQLite database and tables exist."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cvs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        text TEXT,
        parsed_json TEXT,
        embedding TEXT
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        company TEXT,
        description TEXT,
        recruiter_email TEXT
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        job_id INTEGER,
        action TEXT
    )
    """)
    conn.commit()
    conn.close()


# ---------- CV Management ----------
def save_cv_to_db(user_id: str, cv_text: str, parsed: Dict[str, Any], embedding: List[float]) -> int:
    """Save CV text, structured data, and embedding."""
    _ensure_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO cvs (user_id, text, parsed_json, embedding) VALUES (?, ?, ?, ?)",
        (user_id, cv_text, json.dumps(parsed), json.dumps(embedding)),
    )
    conn.commit()
    cv_id = cur.lastrowid
    conn.close()
    return cv_id


# ---------- Job Search ----------
def get_jobs_for_embedding(embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Return mock matching jobs. 
    (In real setup, you'd use vector similarity search.)
    """
    _ensure_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, title, company, description, recruiter_email FROM jobs LIMIT ?", (top_k,))
    rows = cur.fetchall()
    conn.close()

    if not rows:
        # return mock jobs if none in DB
        return [
            {
                "id": 1,
                "title": "AI Engineer",
                "company": "OpenAI Labs",
                "description": "Work on LLM applications and RAG systems.",
                "recruiter_email": "recruiter@openai.com",
            },
            {
                "id": 2,
                "title": "Data Scientist",
                "company": "DeepData",
                "description": "Analyze health data and build predictive models.",
                "recruiter_email": "jobs@deepdata.ai",
            },
        ]

    return [
        {
            "id": row[0],
            "title": row[1],
            "company": row[2],
            "description": row[3],
            "recruiter_email": row[4],
        }
        for row in rows
    ]


# ---------- User Actions ----------
def save_user_action(user_id: str, job: Dict[str, Any], action: str) -> None:
    """Record a user action like 'like', 'save', 'apply'."""
    _ensure_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO user_actions (user_id, job_id, action) VALUES (?, ?, ?)",
        (user_id, job["id"], action),
    )
    conn.commit()
    conn.close()


# ---------- Email Sending ----------
def send_email_to_recruiter(to: str, subject: str, body: str, attachment_path: str) -> str:
    """
    Send email to recruiter.
    Uses Gmail SMTP if credentials are configured, otherwise just logs to console.
    """
    sender_email = os.getenv("SMTP_EMAIL")
    sender_pass = os.getenv("SMTP_PASS")

    if not sender_email or not sender_pass:
        print(f"[MOCK EMAIL] To: {to}\nSubject: {subject}\n\n{body}")
        return "mock-sent"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))\

    # ---- 2️⃣ Add the PDF attachment if it exists ----
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            part = MIMEApplication(f.read(), _subtype="pdf")
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{os.path.basename(attachment_path)}"',
            )
            msg.attach(part)
        print(f"📎 Attached file: {attachment_path}")
    else:
        print("⚠️ No valid attachment found, skipping file attach")


    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_pass)
            server.send_message(msg)
        return "sent"
    except Exception as e:
        print(f"Email failed: {e}")
        return f"error: {e}"
