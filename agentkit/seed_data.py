# seed_data.py
import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "assistant.db")

# Connect or create db
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Ensure tables exist (in case you haven’t uploaded a CV yet)
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

# --------------------------------------------------------------------
# Clear existing data (optional)
# --------------------------------------------------------------------
cur.execute("DELETE FROM jobs;")
cur.execute("DELETE FROM cvs;")
cur.execute("DELETE FROM user_actions;")

# --------------------------------------------------------------------
# Insert mock jobs
# --------------------------------------------------------------------
jobs = [
    (
        "Machine Learning Engineer",
        "Google Research",
        "Develop AI systems, deploy models, and optimize distributed training pipelines.",
        "recruiter@google.com",
    ),
    (
        "Data Scientist",
        "Meta AI",
        "Work on data pipelines, predictive modeling, and business insights for AI products.",
        "jobs@meta.com",
    ),
    (
        "NLP Engineer",
        "Anthropic",
        "Build and improve conversational AI and LLM fine-tuning systems.",
        "hiring@anthropic.com",
    ),
    (
        "AI Product Manager",
        "OpenAI",
        "Define AI-driven product roadmaps and bridge engineering and design.",
        "recruiting@openai.com",
    ),
    (
        "Backend Developer",
        "DeepData",
        "Build scalable APIs for data analytics platforms.",
        "hr@deepdata.ai",
    ),
]

cur.executemany(
    "INSERT INTO jobs (title, company, description, recruiter_email) VALUES (?, ?, ?, ?)",
    jobs,
)
print(f"✅ Inserted {len(jobs)} mock jobs.")

# --------------------------------------------------------------------
# Insert a mock CV for testing
# --------------------------------------------------------------------
cv_text = """Tony Joy
Email: tony@example.com
Experience:
- Product Designer at Resolve to Save Lives (2021–Present)
- AI Research Intern at Leiden University
Skills: Python, FastAPI, LangGraph, UX Research, Data Visualization
Education: MSc Artificial Intelligence, Leiden University
"""
parsed = {
    "name": "Tony Joy",
    "email": "tony@example.com",
    "skills": ["Python", "FastAPI", "LangGraph", "UX Research", "Data Visualization"],
    "experience": [
        {"role": "Product Designer", "org": "Resolve to Save Lives", "years": "2021–Present"},
        {"role": "AI Research Intern", "org": "Leiden University", "years": "2020–2021"},
    ],
    "education": [{"degree": "MSc Artificial Intelligence", "university": "Leiden University"}],
}
embedding = [0.1] * 32

cur.execute(
    "INSERT INTO cvs (user_id, text, parsed_json, embedding) VALUES (?, ?, ?, ?)",
    ("1", cv_text, json.dumps(parsed), json.dumps(embedding)),
)
print("✅ Inserted mock CV for user_id=1")

# Commit and close
conn.commit()
conn.close()

print(f"🎉 Mock data added successfully to {DB_PATH}")
