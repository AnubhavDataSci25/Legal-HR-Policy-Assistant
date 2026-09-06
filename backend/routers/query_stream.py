"""
query_stream.py
POST /query/stream -- streaming counterpart to POST /query (routers/query.py,
left completely untouched). Runs the same hybrid retrieve -> rerank pipeline,
then streams the generated answer token-by-token instead of waiting for the
full response.

Wire protocol (kept deliberately simple -- plain text, no SSE library needed):
  1. The response body streams the answer text as plain chunks, in order.
  2. Once generation is complete, a sentinel line is appended:
         \n\n[[SOURCES]]{"sources": [...], "confidence": "high"|"low"}
     The frontend splits on "[[SOURCES]]" to separate the visible answer
     text from the citation metadata once streaming finishes.
"""

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from retrieval.hybrid import hybrid_retrieve
from retrieval.reranker import rerank
from generation.generator import CONFIDENCE_THRESHOLD, generate_answer_stream
from routers.query import QueryRequest  # reuse the existing, unmodified request model

router = APIRouter()


@router.post("/query/stream")
def query_document_stream(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        candidates = hybrid_retrieve(req.question, req.doc_id, top_k=10)
        reranked = rerank(req.question, candidates, top_n=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

    top_confidence = max((c.get("confidence", 0) for c in reranked), default=0)
    is_low_confidence = not reranked or top_confidence < CONFIDENCE_THRESHOLD

    # Built up front from the already-computed `reranked` chunks -- mirrors
    # exactly what generate_answer() returns in the non-streaming endpoint.
    sources = (
        []
        if is_low_confidence
        else [{"page_num": c["page_num"], "excerpt": c["text"][:200]} for c in reranked]
    )
    confidence_label = "low" if is_low_confidence else "high"

    def event_stream():
        try:
            for token in generate_answer_stream(req.question, reranked):
                yield token
        except Exception as e:
            yield f"\n\n[Error while generating the answer: {str(e)}]"
        finally:
            metadata = json.dumps({"sources": sources, "confidence": confidence_label})
            yield f"\n\n[[SOURCES]]{metadata}"

    return StreamingResponse(event_stream(), media_type="text/plain")