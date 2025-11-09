import os
import shutil
from fastapi import FastAPI, UploadFile, Form
# from modules.graph import build_graph
# from modules.utils import get_jobs_for_embedding
from modules.action_agent import run_langchain_pipeline
from modules.google_auth import router as google_router
from modules.extract_cv_metadata_gemini import extract_metadata
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from modules.agent import get_job_recommendation
from modules.job_matching import JobMatching
import json


app = FastAPI(title="LangGraph CV Assistant")
app.include_router(google_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # All origins
    allow_credentials=False,    # Credentials not allowed with '*'
    allow_methods=["*"],        # All HTTP methods
    allow_headers=["*"],        # All headers
)
# workflow = build_graph()

SAVE_DIR = "saved_cvs"
os.makedirs(SAVE_DIR, exist_ok=True)


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
    _ = extract_metadata(file_path)

    return JSONResponse(
            content={
                "message": "CV processed successfully.",
                "status": "ok"
            },
            status_code=200
        )



@app.get("/show_jobs")
def show_jobs(user_id: str):
    """Show top matching jobs (mocked fallback)."""
    import re
    try:
        raw_result = get_job_recommendation(user_id)
        # Try parsing if it's still a string
        if isinstance(raw_result, str):
            cleaned = re.sub(r"^```json|```$", "", raw_result.strip(), flags=re.MULTILINE).strip()
            cleaned = cleaned.replace("```", "").strip()

            if "```json" in raw_result:
                raw_result = raw_result.split("```json")[-1].split("```")[0]
            parsed = json.loads(raw_result)
        else:
            parsed = raw_result

        return JSONResponse(
            content={
                "status": "ok",
                "user_id": user_id,
                "recommendations": parsed,
            },
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content={
                "status": "error",
                "error": str(e)
            },
            status_code=500
        )



@app.post("/action")
def action(user_id: str = Form(...), job_id: int = Form(...), action: str = Form(...)):
    """User applies/likes/saves a job."""
    result = run_langchain_pipeline(user_id, job_id)
    return {
        "message": result.get("assistant_message", ""),
        "email_status": result.get("email_status"),
        "pdf_path": result.get("pdf_path"),
    }
