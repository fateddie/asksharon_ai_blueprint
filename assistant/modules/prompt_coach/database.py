"""
Prompt Coach Database
=====================
Storage for completed coaching sessions.
Uses existing memory.db with CREATE TABLE IF NOT EXISTS pattern.
"""

import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from sqlalchemy import create_engine, text
from datetime import datetime

# Database connection (same as email module)
_project_root = Path(__file__).parent.parent.parent.parent
_db_path = _project_root / "assistant" / "data" / "memory.db"
DB_PATH = f"sqlite:///{_db_path}"
engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})


def _ensure_table():
    """Create table if it doesn't exist"""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS prompt_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    original_prompt TEXT NOT NULL,
                    final_prompt TEXT NOT NULL,
                    overall_score INTEGER,
                    lessons_json TEXT,
                    template_name TEXT
                )
            """
            )
        )


# Ensure table exists on module load
_ensure_table()


def save_session(
    original_prompt: str,
    final_prompt: str,
    overall_score: int,
    lessons: List[str],
    template_name: Optional[str] = None,
) -> int:
    """
    Save a completed coaching session.

    Returns:
        The ID of the saved session
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                INSERT INTO prompt_sessions
                (original_prompt, final_prompt, overall_score, lessons_json, template_name)
                VALUES (:original, :final, :score, :lessons, :name)
            """
            ),
            {
                "original": original_prompt,
                "final": final_prompt,
                "score": overall_score,
                "lessons": json.dumps(lessons),
                "name": template_name,
            },
        )
        return result.lastrowid or 0


def get_saved_sessions(limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent saved sessions"""
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT id, created_at, original_prompt, final_prompt,
                       overall_score, lessons_json, template_name
                FROM prompt_sessions
                ORDER BY created_at DESC
                LIMIT :limit
            """
            ),
            {"limit": limit},
        )

        sessions = []
        for row in result:
            sessions.append(
                {
                    "id": row[0],
                    "created_at": row[1],
                    "original_prompt": row[2],
                    "final_prompt": row[3],
                    "overall_score": row[4],
                    "lessons": json.loads(row[5]) if row[5] else [],
                    "template_name": row[6],
                }
            )
        return sessions


def get_session_by_id(session_id: int) -> Optional[Dict[str, Any]]:
    """Get a specific session by ID"""
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM prompt_sessions WHERE id = :id"),
            {"id": session_id},
        )
        row = result.fetchone()
        if row:
            return {
                "id": row[0],
                "created_at": row[1],
                "original_prompt": row[2],
                "final_prompt": row[3],
                "overall_score": row[4],
                "lessons": json.loads(row[5]) if row[5] else [],
                "template_name": row[6],
            }
        return None
