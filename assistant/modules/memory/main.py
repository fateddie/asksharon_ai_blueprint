"""
Memory Module
=============
Provides endpoints to add/recall memory entries using the Context Manager.
"""

from fastapi import APIRouter
from assistant.core.context_manager import store, recall
import numpy as np

router = APIRouter()


def register(app, publish, subscribe):
    app.include_router(router, prefix="/memory")


@router.post("/add")
def add_memory(entry: dict):
    """
    Payload:
    { "content": "Remember to buy coffee" }
    """
    dummy_vector = np.random.rand(128).astype("float32")
    store(entry["content"], dummy_vector)
    return {"status": "stored"}


@router.get("/recall")
def recall_memory():
    dummy_query = np.random.rand(128).astype("float32")
    results = recall(dummy_query)
    return {"results": [r[1] for r in results]}
