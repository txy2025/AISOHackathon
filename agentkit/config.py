
from __future__ import annotations
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv(override=True)

DEFAULT_MODEL = os.getenv("MODEL", "openai:gpt-4o-mini")

@dataclass
class AppConfig:
    model: str = DEFAULT_MODEL
    user_id: str = os.getenv("APP_USER_ID", "user_123")
    thread_id: str = os.getenv("APP_THREAD_ID", "hackathon-thread")

CONFIG = AppConfig()
