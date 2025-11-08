
from __future__ import annotations
from langgraph.checkpoint.memory import InMemorySaver

def make_checkpointer() -> InMemorySaver:
    """Short-term memory using in-memory saver (swap for Postgres in prod)."""
    return InMemorySaver()
