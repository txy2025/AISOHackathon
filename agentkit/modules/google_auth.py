"""
google_auth.py
--------------------------------------------------
Google OAuth + Gmail API integration for FastAPI.

Enables users to authenticate with Google and send emails
using their Gmail account via OAuth 2.0.
"""

import os
import json
import base64
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from email.mime.text import MIMEText

router = APIRouter(prefix="/google", tags=["Google Auth"])

# ---------------------------------------------------------------------
# Load credentials from client_secret.json
# ---------------------------------------------------------------------
CLIENT_SECRET_FILE = "google_client_secret.json"
if not os.path.exists(CLIENT_SECRET_FILE):
    raise FileNotFoundError("❌ Missing google_client_secret.json file.")

GOOGLE_CLIENT_CONFIG = json.load(open(CLIENT_SECRET_FILE))
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# ---------------------------------------------------------------------
# STEP 1: Redirect user to Google OAuth consent screen
# ---------------------------------------------------------------------
@router.get("/auth")
def auth_google():
    """Redirect user to Google OAuth screen."""
    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=GOOGLE_CLIENT_CONFIG["web"]["redirect_uris"][0],
    )

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return RedirectResponse(auth_url)

# ---------------------------------------------------------------------
# STEP 2: Handle OAuth callback and exchange code for tokens
# ---------------------------------------------------------------------
@router.get("/callback")
def auth_callback(request: Request):
    """Handle callback from Google after user grants access."""
    code = request.query_params.get("code")
    if not code:
        return JSONResponse({"error": "Missing authorization code"}, status_code=400)

    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=GOOGLE_CLIENT_CONFIG["web"]["redirect_uris"][0],
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    token_info = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    # In production, store securely in DB
    with open("google_token.json", "w") as f:
        json.dump(token_info, f)

    return JSONResponse({"message": "✅ Google authorization successful!", "token_info": token_info})

# ---------------------------------------------------------------------
# STEP 3: Send email using Gmail API
# ---------------------------------------------------------------------
def send_gmail_api_email(token_info: dict, to: str, subject: str, body: str):
    """Send email using Gmail API."""
    creds = Credentials(
        token=token_info["token"],
        refresh_token=token_info.get("refresh_token"),
        token_uri=token_info["token_uri"],
        client_id=token_info["client_id"],
        client_secret=token_info["client_secret"],
        scopes=token_info["scopes"],
    )

    service = build("gmail", "v1", credentials=creds)

    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    result = service.users().messages().send(userId="me", body={"raw": raw_message}).execute()

    print("✅ Gmail API sent:", result["id"])
    return result
