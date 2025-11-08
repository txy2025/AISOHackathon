from __future__ import annotations
import datetime
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

load_dotenv(override=True)

from langchain.agents import create_agent
from agentkit.models import get_model
from agentkit.tools import (
    Context,  # ensure optional fields as shown above
    get_weather_for_location,
    get_user_location,
    web_search,
    save_user_prefs,
    get_user_prefs,
)

today = datetime.datetime.today().strftime("%Y-%m-%d")
SYSTEM_PROMPT = (
    f"You are a helpful research assistant. You will be given a query and you will need to search the web for the most relevant information then extract content to gain more insights. The date today is {today}. "
    "Use the tools to help answer user queries."
)

def build_agent(model_name: str):
    model = get_model(model_name)
    tools = [get_user_location, get_weather_for_location, web_search, save_user_prefs, get_user_prefs]
    return create_agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=tools,
        context_schema=Context,
        # No checkpointer/store in API runtime
    )

agent = build_agent("google_genai:gemini-2.5-flash-lite")
