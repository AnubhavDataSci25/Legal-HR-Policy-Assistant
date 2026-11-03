"""
feedback.py
POST /feedback -- stores user ratings ('up' or 'down') and optional comments for answers.
GET /feedback/summary -- aggregates total, up, and down counts overall or per document.

Fully additive: uses standard sqlite3, failing soft on database error with HTTP 500
so it never affects chat or retrieval operations.
"""

import json
import logging
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "feedback.db"


def get_db_path() -> Path:
    env_path = os.getenv("FEEDBACK_DB_PATH")
    if env_path:
        return Path(env_path)
    return DEFAULT_DB_PATH


def init_db() -> Path:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                doc_id TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                rating TEXT NOT NULL,
                comment TEXT,
                pages TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()
    return db_path


class FeedbackRequest(BaseModel):
    doc_id: str
    question: str = Field(..., min_length=1, max_length=1000)
    answer: str = Field(..., max_length=4000)
    rating: Literal["up", "down"]
    comment: Optional[str] = Field(None, max_length=500)
    pages: list[int] = Field(default_factory=list)


@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    try:
        db_path = init_db()
        created_at = datetime.now(timezone.utc).isoformat()
        pages_json = json.dumps(req.pages)
        conn = sqlite3.connect(db_path)
        try:
            conn.execute(
                """
                INSERT INTO feedback (created_at, doc_id, question, answer, rating, comment, pages)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    created_at,
                    req.doc_id,
                    req.question,
                    req.answer,
                    req.rating,
                    req.comment,
                    pages_json,
                ),
            )
            conn.commit()
        finally:
            conn.close()
        return {"status": "ok"}
    except Exception as e:
        logger.error("Failed to save feedback: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save feedback.")


@router.get("/feedback/summary")
def get_feedback_summary(doc_id: Optional[str] = Query(None)):
    try:
        db_path = init_db()
        conn = sqlite3.connect(db_path)
        try:
            cursor = conn.cursor()
            if doc_id:
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total,
                        COALESCE(SUM(CASE WHEN rating = 'up' THEN 1 ELSE 0 END), 0) as up,
                        COALESCE(SUM(CASE WHEN rating = 'down' THEN 1 ELSE 0 END), 0) as down
                    FROM feedback
                    WHERE doc_id = ?
                    """,
                    (doc_id,),
                )
            else:
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total,
                        COALESCE(SUM(CASE WHEN rating = 'up' THEN 1 ELSE 0 END), 0) as up,
                        COALESCE(SUM(CASE WHEN rating = 'down' THEN 1 ELSE 0 END), 0) as down
                    FROM feedback
                    """
                )
            row = cursor.fetchone()
            total = int(row[0]) if row and row[0] is not None else 0
            up = int(row[1]) if row and row[1] is not None else 0
            down = int(row[2]) if row and row[2] is not None else 0
            return {"total": total, "up": up, "down": down}
        finally:
            conn.close()
    except Exception as e:
        logger.error("Failed to retrieve feedback summary: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve feedback summary.")
