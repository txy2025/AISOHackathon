
from __future__ import annotations
from dataclasses import dataclass
from langgraph.store.memory import InMemoryStore

# For hackathon speed we use an in-memory store.
# Swap this for a DB-backed store in production.
def make_store() -> InMemoryStore:
    return InMemoryStore()

@dataclass
class LTNamespaces:
    users = ("users",)
    prefs = ("prefs",)
