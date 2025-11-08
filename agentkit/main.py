# main.py
from fastapi import FastAPI, UploadFile, Form
from graph import build_graph
from tools import get_jobs_for_embedding

app = FastAPI(title="LangGraph CV Assistant")
workflow = build_graph()

@app.post("/upload_cv")
async def upload_cv(user_id: str = Form(...), file: UploadFile = None):
    """User uploads CV (text or PDF)."""
    content = await file.read()
    try:
        cv_text = content.decode("utf-8")
    except Exception:
        # fallback: PDF bytes, store as base64 or use PDF text extraction
        cv_text = "PDF upload placeholder"
    state = {"user_id": user_id, "cv_text": cv_text}
    result = workflow.invoke(state)
    return {"message": result.get("assistant_message", ""), "cv_id": result.get("cv_id")}

@app.get("/show_jobs")
def show_jobs(user_id: str):
    """Fetch matching jobs (mocked for now)."""
    # In real app, get user embedding from DB
    jobs = get_jobs_for_embedding([0.1]*32, top_k=3)
    return {"jobs": jobs}

@app.post("/action")
def action(user_id: str = Form(...), job_id: int = Form(...), action: str = Form(...)):
    """User likes/saves/applies a job."""
    mock_job = {
        "id": job_id,
        "title": "Machine Learning Engineer",
        "company": "Google Research",
        "description": "Develop AI systems, deploy models, work with distributed training.",
        "recruiter_email": "recruiter@google.com",
    }
    state = {
        "user_id": user_id,
        "selected_job": mock_job,
        "user_action": action,
        "cv_text": "Existing CV text",
    }
    result = workflow.invoke(state)
    return {"message": result.get("assistant_message", ""), "email_status": result.get("email_status")}
