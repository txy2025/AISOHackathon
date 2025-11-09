# JobMatching

An **AI-powered job-matching and application assistant** that automatically analyzes user CVs, **reasons about which tools to call**, retrieves the most relevant job opportunities from a live job database, and helps tailor and apply to positions—all through intelligent reasoning and tool coordination.

---

## 🌟 Introduction

Finding the right job is a time-consuming process—reading hundreds of job descriptions, comparing skills, and tailoring a CV for every role.  
**JobMatching** solves this with **retrieval-augmented generation (RAG)**, **explicit tool-use reasoning**, and **automated CV adaptation**.

This agentic system acts like a personal career assistant that:
1. Understands a user’s CV in depth.  
2. **Decides which tools to call and in what order** to retrieve the most suitable jobs from a dynamic database.  
3. Highlights strengths and weaknesses for each match with an interpretable score.  
4. Automatically refines the user’s CV and helps apply via email.

---

## ⚙️ Main Functionalities

### 🧠 1) Automatic Job Matching from Uploaded CV (Reasoning + Tools)

**Goal:** Instantly provide a personalized shortlist of suitable jobs by **reasoning through a tool-use plan**.

**Workflow (high level):**
1. The user uploads a CV (PDF/DOCX) on the **frontend**.  
2. The backend (`main.py`) calls the **CV extractor** to create a compact profile summary in SQLite.  
3. The **Agent** then **reasons**:
   - *“I need the user summary”* → calls `get_user_cv_summary(user_id)` (SQLite).  
   - *“Now I can query the job space”* → calls `search_jobs(summary, top_k, summarize=True)` (Chroma + embeddings + Gemini summarizer).  
   - *“I must produce ranked, structured results”* → computes **Matching Score**, writes **Strength/Weakness**, enforces the JSON schema.  
4. The top results are returned to the UI.

**Standardized Output for Each Job:**
- `ID`
- `Company`
- `Salary`
- `JobTitle`
- `Remote` (“yes” or “not”)
- `Responsibility` (≤ 200 words)
- `Matching Score` (0–100)
- `Strength` (why the candidate is a good fit)
- `Weakness` (why it might not be perfect)
- `Email`

---

### ✍️ 2) Intelligent CV Tailoring and Auto-Application

**Goal:** Update the candidate’s CV for a selected job and optionally send a tailored application email.

**Workflow:**
1. User selects a job from the recommendations.  
2. Agent fetches the user profile + job description, **reasons which skills to emphasize**, rewrites sections, and can draft a concise cover letter.  
3. Optionally emails the recruiter via Gmail OAuth.

**Result:** A **tailored CV** and an **application email** aligned with the selected job.

---

## 🧠 Agent Reasoning & Tool Orchestration (What Judges Should See)

The agent uses a **ReAct-style** loop: *think → act (tool) → observe → think → act…* until it can produce the final structured answer.

### Tool Contracts
- **`get_user_cv_summary(user_id)`** → returns the ~100‑word profile summary from SQLite.  
- **`search_jobs(query, top_k, summarize=True)`** → runs semantic retrieval (Chroma + OpenAI embeddings) and asks Gemini to normalize/summarize each job into comparable JSON fields.

### Reasoning Plan (Deterministic Outline)
1. **Plan**: If the user_id is present, **first** fetch the CV summary.  
2. **Retrieve**: Use the summary text as the query to `search_jobs`.  
3. **Summarize**: Condense job text to uniform fields (Company, JobTitle, Remote, Responsibility, Email…).  
4. **Score**: Compute `Matching Score (0–100)` using a weighted heuristic over:  
   - Skills overlap (primary), seniority, domain match, location/remote.  
5. **Explain**: Populate `Strength` and `Weakness` from explicit comparisons (e.g., *“has X but lacks Y”*).  
6. **Conform**: Enforce schema + length cap (Responsibility ≤ 200 words; Remote ∈ {“yes”, “not”}).  
7. **Return**: Emit a strict JSON list ordered by `Matching Score` (top first).

### Example Reasoning Trace (Abbreviated)
```
Thought: Need profile context.  
Action: get_user_cv_summary(user_id=42)  
Observation: "Senior ML engineer with 8y Python, MLOps, LLM finetuning..."

Thought: Use summary as semantic query.  
Action: search_jobs(query=summary, top_k=10, summarize=True)  
Observation: 10 normalized job docs with requirements, location, email.

Thought: Score and justify.  
Action: compute scores + strengths/weaknesses; cap responsibility ≤ 200 words; enforce Remote ∈ {"yes","not"}  
Observation: 4 best entries prepared as JSON.
```

### Failure Handling & Fallbacks
- Missing summary → instruct the CV extractor to run and retry.  
- No jobs returned → relax filters, increase top_k, and widen embeddings search radius.  
- Incomplete fields (e.g., missing email) → mark as `"N/A"` while keeping schema integrity.

---

## 🌐 Web API and Deployment

### FastAPI Server (`main.py`)

`main.py` exposes a minimal REST API and triggers the **agent’s reasoning** on demand.

#### Key Endpoints
| Method | Endpoint | What it does |
|---|---|---|
| `POST /upload_cv/` | Uploads CV; runs extractor; stores summary in SQLite. |
| `GET /recommend_jobs/{user_id}` | **Runs the agent** → fetch summary → search jobs → summarize → score → return JSON. |
| `POST /apply_job/` | Tailors CV for a selected job and (optionally) emails recruiter. |
| `GET /health` | Health-check endpoint. |

**CORS** is enabled so the browser app can call these endpoints directly.

### Frontend and Backend

| Component | Address | Description |
|---|---|---|
| **Frontend** | http://95.179.153.155:8000 | Web UI for CV upload and job browsing. |
| **Backend** | http://95.179.153.155:9000 | FastAPI service for reasoning, retrieval, summarization, and email. |

---

## 🔬 Example Job Agent Output

```json
{
  "ID": 1324,
  "Company": "datadog",
  "Salary": "N/A",
  "JobTitle": "AI Research Scientist – Datadog AI Research (DAIR)",
  "Remote": "not",
  "Responsibility": "Conduct cutting-edge research in Generative AI and Machine Learning, aiming to build specialized Foundation Models and AI Agents for observability, site reliability engineering, and code repair. Leverage large-scale distributed training infrastructure to pre-train and post-train state-of-the-art models on diverse, real-world telemetry data. Build simulated environments to facilitate on-policy agentic training and evaluation. Lead and contribute to research publications, present findings at top-tier conferences (e.g., NeurIPS, ICLR, ICML), and help open-source key model artifacts and benchmarks. Collaborate with cross-functional teams (e.g., Product, Engineering) to integrate advanced AI capabilities – like multi-modal analysis or automated incident resolution planning – into Datadog’s product ecosystem.",
  "Matching Score": 90,
  "Strength": "Strong alignment with the user's AI and ML background. The focus on research, foundation models, and AI agents matches the user's expertise. The Paris location could be suitable depending on preferences.",
  "Weakness": "Requires a PhD or equivalent experience. The role is not remote.",
  "Email": "N/A"
}
```

---

## 🧩 System Architecture

```
Frontend (Port 8000)
   │
   ▼
Backend API (FastAPI, Port 9000)
   │
   ├── POST /upload_cv → extract_cv_metadata_gemini.py
   ├── GET /recommend_jobs/{user_id} → agent.py (reasoning + tools)
   └── POST /apply_job → action_agent.py
   │
   ▼
JobMatching Core (Chroma + Embeddings + SQLite)
   │
   ▼
LangChain Agent (Reasoning Engine)
   ├── get_user_cv_summary()
   ├── search_jobs()
   └── summarize, score, explain → JSON output
```

---

## 🚀 Quickstart

```bash
# 1) Environment
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
echo "OPENAI_API_KEY=sk-..." >> .env
echo "GEMINI_API_KEY=..." >> .env

# 2) Run backend
uvicorn agentkit.main:app --host 0.0.0.0 --port 9000 --reload
# Visit the frontend at http://95.179.153.155:8000
```

---

## 🔧 Extension Ideas

- Hybrid retrieval (BM25 + dense) and cross-encoder re‑ranking.  
- Preference learning from user feedback (liked/applied).  
- Multilingual CV parsing & matching.  
- Dockerized multi-service deployment with CI/CD.  
- Live job API connectors (LinkedIn, Indeed) + deduplication.  

---

## 🧭 Project Structure

```
JobMatching/
├─ JobMatching.ipynb
├─ JobMatchAgent.py
├─ agentkit/
│  ├─ main.py               # FastAPI backend
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

**Frontend:** http://95.179.153.155:8000  
**Backend API:** http://95.179.153.155:9000  

**License:** MIT  
**Authors:** Team JobMatching  
**Purpose:** Competition project showcasing **reasoning AI agents** that **decide which tools to use** for personalized, explainable recruitment automation.
