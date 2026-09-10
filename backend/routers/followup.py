"""
followup.py
POST /followup -- suggests up to 3 follow-up questions related to the
question/answer that just happened, grounded in the same document via
a fresh retrieval pass (not just the LLM guessing from memory).

Fully additive: does not touch /query, /query/stream, or their request
models. Designed to fail soft -- if anything goes wrong, it returns an
empty question list (HTTP 200) rather than an error, since suggestions
are a nice-to-have and must never disrupt the chat experience.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
import logging

from retrieval.hybrid import hybrid_retrieve
from retrieval.reranker import rerank
from generation.generator import generate_followup_questions

router = APIRouter()
logger = logging.getLogger(__name__)


class FollowupRequest(BaseModel):
    doc_id: str = Field(..., description="doc_id returned by POST /ingest")
    question: str = Field(..., min_length=1, max_length=1000)
    answer: str = Field(..., min_length=1, max_length=4000)


class FollowupResponse(BaseModel):
    questions: list[str]


@router.post("/followup", response_model=FollowupResponse)
def suggest_followups(req: FollowupRequest):
    try:
        # Re-ground in the document using the same question -- gives the
        # follow-up generator real context instead of guessing from the
        # answer text alone, which keeps suggestions on-topic.
        candidates = hybrid_retrieve(req.question, req.doc_id, top_k=10)
        reranked = rerank(req.question, candidates, top_n=5)
        questions = generate_followup_questions(req.question, req.answer, reranked)
    except Exception:
        # Fail soft -- never let a follow-up suggestion error surface to
        # the user or interrupt the conversation they're already having.
        logger.exception("Follow-up generation failed for doc_id=%s", req.doc_id)
        questions = []

    return {"questions": questions}
