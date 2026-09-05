"""
query.py
POST /query -- takes a doc_id and a question, runs the full RAG
pipeline (hybrid retrieve -> rerank -> generate), and returns a
grounded, cited answer.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from retrieval.hybrid import hybrid_retrieve
from retrieval.reranker import rerank
from generation.generator import generate_answer

router = APIRouter()


class QueryRequest(BaseModel):
    doc_id: str = Field(..., description="doc_id returned by POST /ingest")
    question: str = Field(..., min_length=1, max_length=1000)


class SourceExcerpt(BaseModel):
    page_num: int
    excerpt: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceExcerpt]
    confidence: str  # "high" | "low"


@router.post("/query", response_model=QueryResponse)
def query_document(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        candidates = hybrid_retrieve(req.question, req.doc_id, top_k=10)
        reranked = rerank(req.question, candidates, top_n=5)
        result = generate_answer(req.question, reranked)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

    return result