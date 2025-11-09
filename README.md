# JobMatching

An **AI-powered job-matching and application assistant** that automatically analyzes user CVs, retrieves the most relevant job opportunities from a live job database, and helps tailor and apply to positions—all through intelligent reasoning and tool coordination.

---

## 🌟 Introduction

Finding the right job is a time-consuming process—reading hundreds of job descriptions, comparing skills, and tailoring a CV for every role.  
**JobMatching** solves this problem by combining **retrieval-augmented generation (RAG)**, **semantic reasoning**, and **automated CV adaptation**.

This agentic system acts like a personal career assistant that:
1. Understands a user’s CV in depth.
2. Finds and evaluates the most suitable jobs from a dynamic database.
3. Highlights strengths and weaknesses for each match.
4. Automatically refines the user’s CV and helps apply directly via email.

It demonstrates how modern **AI reasoning pipelines** can automate complex multi-step workflows with transparency, explainability, and personalization.

---

## ⚙️ Main Functionalities

### 🧠 1. Automatic Job Matching from Uploaded CV

**Goal:** Instantly provide a personalized shortlist of the most suitable jobs.

**Workflow:**
1. The user uploads a CV (PDF/DOCX).
2. The system extracts metadata and generates a professional summary using **Gemini**.
3. It automatically queries the **Job Query Service**, which maintains a live **Job Database**.
4. Using OpenAI embeddings and Chroma vector search, it retrieves and summarizes the top-matching roles.

**Output:**  
A ranked list of jobs, each including:

| Field | Description |
|--------|--------------|
| `ID` | Unique job identifier |
| `Company` | Employer name |
| `Salary` | Extracted or estimated salary range |
| `JobTitle` | Role title |
| `Remote` | “yes” or “not” |
| `Responsibility` | Concise (≤ 200 words) description of the role |
| `Matching Score` | 0–100 score based on semantic similarity |
| `Strength` | Why the candidate fits well |
| `Weakness` | Where the fit could improve |
| `Email` | Recruiter contact or HR email |

**Reasoning Process:**
- The agent first calls `get_user_cv_summary(user_id)` to retrieve the CV summary from SQLite.  
- Then it calls `search_jobs(summary, top_k, summarize=True)` to query the job DB via Chroma.  
- It evaluates each result with Gemini, computes the `Matching Score`, and produces structured, explainable JSON output.  
- Judges can see transparent reasoning (strengths/weaknesses) rather than opaque scoring.

This function transforms raw CV data into actionable, ranked insights within seconds.

---

### ✍️ 2. Intelligent CV Tailoring and Auto-Application

**Goal:** Help users adapt and send tailored CVs for their chosen job.

**Workflow:**
1. The user selects one of the recommended jobs.
2. The agent:
   - Retrieves the original CV and the selected job description.
   - Uses Gemini to rewrite and emphasize relevant skills, experiences, and metrics aligned with that role.
   - Optionally generates a short, customized cover letter.
3. The updated CV and message are sent automatically via Gmail (using secure OAuth credentials).

**Result:**
- The user gets a **professionally tailored CV** ready for submission.
- The recruiter receives a **personalized application email** aligned with the job posting.

**Why It Matters:**
- Manual CV tailoring is often neglected by candidates but dramatically increases interview chances.
- Automating this process demonstrates the **power of generative AI for personal productivity**.
- It integrates reasoning (deciding which skills to highlight) with action (updating and sending the CV).

---

## 🧩 System Architecture

```
User CV (PDF)
   │
   ▼
extract_cv_metadata_gemini.py ──► assistant.db (SQLite)
   │
   ▼
job_matching.py (Chroma + Embeddings)
   │
   ▼
LangChain Agent (reasoning engine)
   ├── get_user_cv_summary()
   ├── search_jobs()
   └── summarize & rank → JSON output
        │
        ▼
action_agent.py (CV tailoring + Gmail send)
```

The **agent’s reasoning loop**:
> “Retrieve user profile → Query job DB → Analyze & rank → Summarize → Tailor CV → Send.”

---

## 🧱 Technical Stack

| Component | Purpose |
|------------|----------|
| **OpenAI Embeddings** | Semantic representation of job text and CV summaries |
| **Chroma Vector DB** | Fast, persistent job retrieval |
| **Gemini LLM** | Summarization, reasoning, and CV rewriting |
| **SQLite** | Local user data and CV summary storage |
| **LangChain Agent** | Orchestrates tool calls and logical reasoning |
| **FastAPI** | Optional REST interface for upload/search |
| **Google OAuth** | Secure Gmail send flow |

---

## 🚀 Quickstart

```bash
# 1. Setup
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Add API keys
echo "OPENAI_API_KEY=sk-..." >> .env
echo "GEMINI_API_KEY=..." >> .env

# 3. Run the pipeline
python agentkit/main.py
```

Or interactively:
```python
from agentkit.modules.agent import get_job_recommendation
get_job_recommendation(user_id=1)
```

---

## 🔬 Example Output

```json
[
  {
    "ID": "J1023",
    "Company": "TechNova",
    "Salary": "€70k–€90k",
    "JobTitle": "Data Engineer",
    "Remote": "yes",
    "Responsibility": "Design and maintain ETL pipelines...",
    "Matching Score": 92,
    "Strength": "Strong experience with Python and distributed data systems.",
    "Weakness": "Limited experience with Airflow orchestration.",
    "Email": "hr@technova.com"
  }
]
```

---

## 💡 Why It’s Meaningful

- **Personalization at scale:** Automates job discovery and CV tailoring for each individual.  
- **Transparency:** Provides clear reasoning behind match scores.  
- **Efficiency:** Converts a 2-hour manual process into seconds.  
- **Applicability:** Demonstrates real-world AI agency in recruitment workflows.  
- **Innovation:** Combines retrieval, reasoning, and real-world action (email) in one loop.

This project exemplifies how **AI agents** can autonomously understand human documents, reason through multi-step tasks, and act meaningfully—bridging **semantic intelligence and automation**.

---

## 🔧 Extension Ideas

- Integrate hybrid retrieval (BM25 + dense + reranker).  
- Add user feedback loop (liked/applied jobs).  
- Support multilingual CV parsing.  
- Build a web dashboard for interactive feedback and explainability.  
- Connect to live job APIs (LinkedIn, Indeed).

---

## 🧭 Project Structure

```
JobMatching/
├─ JobMatching.ipynb
├─ JobMatchAgent.py
├─ agentkit/
│  ├─ main.py
│  ├─ datastore/joblist_clean_for_rag.csv
│  └─ modules/
│     ├─ job_matching.py
│     ├─ extract_cv_metadata_gemini.py
│     ├─ agent.py
│     ├─ action_agent.py
│     ├─ google_auth.py
│     ├─ utils.py
```

---

**License:** MIT  
**Authors:** Team JobMatching  
**Purpose:** Competition project showcasing intelligent agent workflows for personalized recruitment automation.
