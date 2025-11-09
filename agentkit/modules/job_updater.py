"""
job_updater.py
--------------------------------------------------
Asynchronous background system that periodically refreshes
the job listings table in assistant.db and rebuilds the RAG index
for JobMatching.
"""

import asyncio
import os
import sqlite3
import pandas as pd
from datetime import datetime
from modules.job_matching import JobMatching

DB_PATH = os.path.join(os.path.dirname(__file__), "assistant.db")
CSV_SOURCE = "joblist_clean_for_rag.csv"   # could be remote API in future
UPDATE_INTERVAL = 60 * 60 * 3              # every 3 hours


async def fetch_latest_jobs() -> pd.DataFrame:
    """Simulate fetching latest job listings from CSV or API."""
    print(f"[{datetime.now()}] 🔄 Fetching latest job listings...")
    df = pd.read_csv(CSV_SOURCE)
    df = df.fillna("")
    return df


def sync_db_with_jobs(df: pd.DataFrame):
    """Replace or upsert jobs in assistant.db."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            company TEXT,
            description TEXT,
            recruiter_email TEXT
        )
    """)

    existing = pd.read_sql_query("SELECT id, title, company FROM jobs", conn)
    print(f"[DB] Existing jobs: {len(existing)} | Incoming: {len(df)}")

    # Simple deduplication based on (title, company)
    for _, row in df.iterrows():
        cur.execute(
            "SELECT id FROM jobs WHERE title=? AND company=?",
            (row["title"], row["company"]),
        )
        exists = cur.fetchone()
        if exists:
            cur.execute(
                "UPDATE jobs SET description=?, recruiter_email=? WHERE id=?",
                (row["description"], row.get("recruiter_email", ""), exists[0]),
            )
        else:
            cur.execute(
                "INSERT INTO jobs (title, company, description, recruiter_email) VALUES (?, ?, ?, ?)",
                (row["title"], row["company"], row["description"], row.get("recruiter_email", "")),
            )
    conn.commit()
    conn.close()
    print("[DB] ✅ Job listings updated.")


async def periodic_job_refresh():
    """Main loop: runs indefinitely to keep RAG and DB fresh."""
    jm = JobMatching()
    while True:
        try:
            df = await fetch_latest_jobs()
            sync_db_with_jobs(df)

            # Optionally reload job matcher cache
            jm.load_jobs()
            print(f"[{datetime.now()}] ✅ RAG + DB refreshed successfully.")
        except Exception as e:
            print(f"[Updater] ⚠️ Error during job refresh: {e}")

        await asyncio.sleep(UPDATE_INTERVAL)
