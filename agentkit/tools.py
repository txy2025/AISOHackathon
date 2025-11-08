
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Any

from langchain.tools import tool, ToolRuntime
from langchain_tavily import TavilySearch, TavilyExtract

# ---------- Demo context schema ----------
@dataclass
class Context:
    user_id: Optional[str] = None

# ---------- Simple demo tools ----------
@tool
def get_weather_for_location(city: str) -> str:
    """Get weather for a given city (demo stub)."""
    return f"It's always sunny in {city}!"

@tool
def get_user_location(runtime: ToolRuntime[Context]) -> str:
    """Retrieve user location for the current user."""
    user_id = runtime.context.user_id
    return "Florida" if user_id == "1" else "SF"



# ---------- Web Search (Tavily preferred, DuckDuckGo fallback) ----------
def _tavily_search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    print("searcg vt travily")
    try:
        from tavily import TavilyClient
        import os
        key = os.getenv("TAVILY_API_KEY")
        if not key:
            raise RuntimeError("TAVILY_API_KEY not set")
        client = TavilyClient(api_key=key)
        res = client.search(query=query, max_results=max_results)
        # Normalize
        out = []
        for r in res.get("results", []):
            out.append({"title": r.get("title"), "url": r.get("url"), "content": r.get("content")})
        return out
    except Exception as e:
        return [{"title": "Search backend not configured", "url": "", "content": str(e)}]

def _ddg_search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    try:
        from duckduckgo_search import DDGS
        out = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                out.append({"title": r.get("title"), "url": r.get("href"), "content": r.get("body")})
        return out
    except Exception as e:
        return [{"title": "Search backend not available", "url": "", "content": str(e)}]

@tool
def web_search(query: str, max_results: int = 5) -> str:
    """General web search. Returns a short textual summary of results (uses Tavily if configured, else DuckDuckGo)."""
    results = _tavily_search(query, max_results=max_results)
    if results and "Search backend not configured" not in results[0]["title"]:
        pass
    else:
        results = _ddg_search(query, max_results=max_results)
    lines = []
    for i, r in enumerate(results, 1):
        lines.append(f"{i}. {r.get('title')} — {r.get('url')}")
    return "\n".join(lines) if lines else "No results."

# ---------- Long-term memory tools (read/write) ----------
@tool
def save_user_prefs(prefs: dict, runtime: ToolRuntime[Context]) -> str:
    """Save user preferences (writes long-term memory in the `prefs` namespace)."""
    store = runtime.store
    user_id = runtime.context.user_id
    store.put(("prefs",), user_id, prefs)
    return "Saved user preferences."

@tool
def get_user_prefs(runtime: ToolRuntime[Context]) -> str:
    """Get user preferences (reads long-term memory from the `prefs` namespace)."""
    store = runtime.store
    user_id = runtime.context.user_id
    item = store.get(("prefs",), user_id)
    return str(item.value) if item else "No preferences saved."
