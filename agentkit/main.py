import os
import shutil
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

from modules.graph import build_graph
from modules.utils import get_jobs_for_embedding
from modules.google_auth import router as google_router
from modules.extract_cv_metadata_gemini import extract_metadata


app = FastAPI(title="LangGraph CV Assistant")

# ✅ Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # ✅ Allow all domains
    allow_credentials=False,
    allow_methods=["*"],       # ✅ Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],       # ✅ Allow all headers
)

# ✅ Include routers
app.include_router(google_router)

# ✅ Initialize graph workflow
workflow = build_graph()

SAVE_DIR = "saved_cvs"
os.makedirs(SAVE_DIR, exist_ok=True)


# ---------- ROUTES ----------

@app.post("/upload_cv")
async def upload_cv(user_id: str = Form(...), file: UploadFile = None):
    """
    Upload CV (PDF/DOCX) → save → extract metadata using Gemini → run job match workflow.
    """
    # --- Step 1: Save file locally ---
    file_path = os.path.join(SAVE_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # --- Step 2: Extract metadata using Gemini ---
    metadata = extract_metadata(file_path)

    # --- Step 3: Return summary
    return {"message": "CV processed successfully.", "metadata": metadata}


@app.get("/show_jobs")
def show_jobs(user_id: str):
    """Show top matching jobs (mocked fallback)."""
    jobs = get_jobs_for_embedding([0.1] * 32, top_k=3)
    return {"jobs": jobs}


@app.post("/action")
def action(user_id: str = Form(...), job_id: int = Form(...), action: str = Form(...)):
    """User applies/likes/saves a job."""
    mock_job = {
        "id": job_id,
        "title": "Machine Learning Engineer",
        "company": "Google Research",
        "description": "Develop and deploy LLM systems at scale.",
        "recruiter_email": "kichujyothis@gmail.com",
    }

    state = {
        "user_id": user_id,
        "selected_job": mock_job,
        "user_action": action,
        "cv_text": "Existing CV text for user",
    }

    result = workflow.invoke(state)
    return {
        "message": result.get("assistant_message", ""),
        "email_status": result.get("email_status"),
    }
