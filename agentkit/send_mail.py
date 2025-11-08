# google_auth.py
import os
import json
import base64
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from email.mime.text import MIMEText

router = APIRouter()

# ---------------------------------------------------------------------
# Load credentials from client_secret.json
# ---------------------------------------------------------------------
GOOGLE_CLIENT_CONFIG = json.load(open("google_client_secretv.json"))
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# ---------------------------------------------------------------------
# STEP 1: Redirect user to Google OAuth consent screen
# ---------------------------------------------------------------------
@router.get("/auth/google")
def auth_google():
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
# STEP 2: Handle OAuth callback and store tokens
# ---------------------------------------------------------------------
@router.get("/auth/callback")
def auth_callback(request: Request):
    state = request.query_params.get("state")
    code = request.query_params.get("code")

    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=GOOGLE_CLIENT_CONFIG["web"]["redirect_uris"][0],
    )
    flow.fetch_token(code=code)

    creds = flow.credentials

    # Save credentials (here we just return them for demo)
    # In production, store creds.refresh_token securely in DB.
    token_info = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    return JSONResponse(token_info)


# ---------------------------------------------------------------------
# STEP 3: Send email using Gmail API
# ---------------------------------------------------------------------
def send_gmail_api_email(token_info: dict, to: str, subject: str, body: str):
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

    result = (
        service.users()
        .messages()
        .send(userId="me", body={"raw": raw_message})
        .execute()
    )

    print("✅ Gmail API sent:", result["id"])
    return result
