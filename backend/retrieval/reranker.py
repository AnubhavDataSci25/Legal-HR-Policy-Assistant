"""
reranker.py
Re-scores the hybrid-retrieved chunks using a local cross-encoder
model. Unlike the embedding model (which scores query and chunk
independently), a cross-encoder reads the query and chunk together --
much more accurate at judging true relevance, at the cost of being
slower per-pair. Runs entirely on CPU, no API key, no rate limits.
"""

import math

from sentence_transformers import CrossEncoder

# Loaded once at import time -- ~90MB model, downloads on first run.
_reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", max_length=512)


def _sigmoid(x: float) -> float:
    """Squashes a raw cross-encoder logit into a 0-1 confidence score."""
    return 1 / (1 + math.exp(-x))


def rerank(query: str, chunks: list[dict], top_n: int = 5) -> list[dict]:
    """
    Re-scores each (query, chunk) pair and returns the top_n highest
    scoring chunks.

    Args:
        query: The user's natural language question.
        chunks: Candidate chunks from hybrid_retrieve().
        top_n: How many chunks to keep after reranking.

    Returns:
        A list of chunk dicts sorted by relevance, each with:
        - "rerank_score": raw cross-encoder logit (~-10 to +10)
        - "confidence": sigmoid-normalized score in [0, 1], used by the
          generation guardrail to decide whether to answer at all
    """
    if not chunks:
        return []

    pairs = [[query, c["text"]] for c in chunks]
    raw_scores = _reranker.predict(pairs).tolist()

    ranked = sorted(zip(chunks, raw_scores), key=lambda pair: pair[1], reverse=True)

    return [
        {
            **chunk,
            "rerank_score": round(float(score), 4),
            "confidence": round(_sigmoid(float(score)), 4),
        }
        for chunk, score in ranked[:top_n]
    ]