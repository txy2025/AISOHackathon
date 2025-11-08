
from __future__ import annotations
from langchain.chat_models import init_chat_model

def get_model(model_name: str):
    """Return a configured chat model using the latest init_chat_model API."""
    # You can add provider-specific params here if desired
    return init_chat_model(model_name, temperature=0.3)
