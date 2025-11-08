
from __future__ import annotations
from dataclasses import dataclass

from langchain.agents import create_agent
from langchain_tavily import TavilySearch, TavilyExtract
from agentkit.models import get_model
from agentkit.memory import make_checkpointer
from agentkit.long_term import make_store
import datetime
from agentkit.tools import (
    Context,
    get_weather_for_location,
    get_user_location,
    web_search,
    save_user_prefs,
    get_user_prefs,
)

SYSTEM_PROMPT1 = """You are a helpful assistant.

You have access to tools:
- get_user_location: fetch the user's location
- get_weather_for_location: get weather for a city
- web_search: perform open web search
- save_user_prefs: store user preferences (long-term)
- get_user_prefs: read user preferences (long-term)

Use tools when needed. If you get the tools results, give you reply by your words.
"""

SYSTEM_PROMPT = (
    "You are a helpful reaserch assistant, you will be given a query and you will need to search the web for the most relevant information then extract content to gain more insights. The date today is {today}. "
    "Use the tool to help answer user queries."
)

# Initialize Tavily Search Tool
tavily_search_tool = TavilySearch(
    max_results=5,
    topic="general",
)
# Initialize Tavily Extract Tool
tavily_extract_tool = TavilyExtract()

# Set up Prompt with 'agent_scratchpad'
today = datetime.datetime.today().strftime("%D")

def build_agent(model_name: str):
    model = get_model(model_name)
    checkpointer = make_checkpointer()         # short-term memory
    store = make_store()                       # long-term memory
    tools = [get_user_location, get_weather_for_location, TavilySearch,TavilyExtract,save_user_prefs, get_user_prefs]
    #tools = [tavily_search_tool, tavily_extract_tool]
    agent = create_agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=tools,
        context_schema=Context,
        # checkpointer=checkpointer,
        # store=store,
    )
    return agent

#agent=build_agent("google_genai:gemini-2.5-flash-lite")
agent=build_agent("openai:gpt-4o-mini")
