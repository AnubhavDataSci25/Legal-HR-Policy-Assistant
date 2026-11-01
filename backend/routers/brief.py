"""
brief.py
Endpoints for generating and retrieving a structured Document Brief
immediately after document ingestion.

POST /documents/{document_id}/brief
GET /documents/{document_id}/brief
"""

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from generation.generator import generate_document_brief
from ingestion.embedder import collection_exists, get_chroma_collection

router = APIRouter()
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploaded_docs"


class KeyClause(BaseModel):
    title: str
    description: str
    page: Optional[int] = None
    source_excerpt: Optional[str] = None


class DateOrDeadline(BaseModel):
    item: str
    value: str
    context: Optional[str] = None
    page: Optional[int] = None


class AmountOrFinancialTerm(BaseModel):
    item: str
    value: str
    context: Optional[str] = None
    page: Optional[int] = None


class Obligation(BaseModel):
    party: str
    obligation: str
    page: Optional[int] = None


class RiskOrCondition(BaseModel):
    item: str
    condition: str
    page: Optional[int] = None


class UnspecifiedInfo(BaseModel):
    item: str
    description: str


class DocumentBriefResponse(BaseModel):
    document_id: str
    status: str = "completed"
    summary: str
    key_clauses: list[KeyClause] = Field(default_factory=list)
    dates_and_deadlines: list[DateOrDeadline] = Field(default_factory=list)
    amounts_and_financial_terms: list[AmountOrFinancialTerm] = Field(default_factory=list)
    obligations: list[Obligation] = Field(default_factory=list)
    risks_and_conditions: list[RiskOrCondition] = Field(default_factory=list)
    unspecified_information: list[UnspecifiedInfo] = Field(default_factory=list)
    generated_at: str


def _get_cached_brief(document_id: str) -> Optional[dict]:
    cache_path = UPLOAD_DIR / f"{document_id}_brief.json"
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning("Failed to read cached brief for %s: %s", document_id, e)
    return None


def _save_cached_brief(document_id: str, brief_data: dict) -> None:
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cache_path = UPLOAD_DIR / f"{document_id}_brief.json"
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(brief_data, f, indent=2)
    except Exception as e:
        logger.warning("Failed to cache brief on disk for %s: %s", document_id, e)


def _process_brief(document_id: str, force_refresh: bool = False) -> dict:
    # 1. Check local cache first if refresh is not forced
    if not force_refresh:
        cached = _get_cached_brief(document_id)
        if cached:
            return cached

    # 2. Validate document existence in indexed storage
    if not collection_exists(document_id):
        raise HTTPException(
            status_code=404,
            detail=f"Document '{document_id}' not found. Please upload and index the document first.",
        )

    # 3. Retrieve chunks
    try:
        collection = get_chroma_collection(document_id)
        data = collection.get(include=["documents", "metadatas"])
        docs = data.get("documents") or []
        metas = data.get("metadatas") or []
        if not docs:
            raise HTTPException(
                status_code=422,
                detail=f"No text chunks found for document '{document_id}'.",
            )

        chunks = [
            {"text": doc, "page_num": meta.get("page_num", 1), "chunk_id": f"c_{i}"}
            for i, (doc, meta) in enumerate(zip(docs, metas))
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to retrieve chunks for brief generation: %s", e)
        raise HTTPException(
            status_code=500, detail=f"Failed to access indexed chunks: {str(e)}"
        )

    # 4. Generate brief via Groq
    try:
        brief_data = generate_document_brief(document_id, chunks)
        _save_cached_brief(document_id, brief_data)
        return brief_data
    except Exception as e:
        logger.exception("Failed to generate brief for %s: %s", document_id, e)
        raise HTTPException(
            status_code=500, detail=f"Document brief generation failed: {str(e)}"
        )


@router.post(
    "/documents/{document_id}/brief",
    response_model=DocumentBriefResponse,
    summary="Generate or retrieve a structured Document Brief",
)
def create_or_get_brief(
    document_id: str, force_refresh: bool = Query(False, description="Bypass cache and regenerate")
):
    """
    Generates a comprehensive, structured Document Brief for an uploaded document
    using the existing indexed chunks and Groq integration. Reuses cached briefs
    when available to prevent unnecessary repeat LLM calls.
    """
    return _process_brief(document_id, force_refresh)


@router.get(
    "/documents/{document_id}/brief",
    response_model=DocumentBriefResponse,
    summary="Retrieve an existing Document Brief",
)
def get_brief(
    document_id: str, force_refresh: bool = Query(False, description="Bypass cache and regenerate")
):
    return _process_brief(document_id, force_refresh)
