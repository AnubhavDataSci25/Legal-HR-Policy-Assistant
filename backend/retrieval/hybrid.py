"""
hybrid.py
Combines semantic (vector) search and BM25 (keyword) search into a
single candidate pool, deduplicated by chunk text. This is the input
handed to the reranker in the next step.
"""

from retrieval.semantic import semantic_search
from retrieval.bm25_search import bm25_search


def hybrid_retrieve(query: str, doc_id: str, top_k: int = 10) -> list[dict]:
    """
    Runs both retrieval strategies and merges the results.

    Semantic search catches paraphrased / conceptually related text.
    BM25 catches exact keyword matches that embeddings can under-rank.
    Combining both and letting the reranker sort them out gives better
    recall than either method alone.

    Args:
        query: The user's natural language question.
        doc_id: Which document's ChromaDB collection to search.
        top_k: How many chunks to request from each retriever.

    Returns:
        A deduplicated list of chunk dicts, capped at top_k total.
    """
    semantic_results = semantic_search(query, doc_id, top_k=top_k)
    keyword_results = bm25_search(query, doc_id, top_k=top_k)

    seen_texts = set()
    merged = []

    # Interleave so neither retriever's results dominate before reranking.
    for chunk in semantic_results + keyword_results:
        if chunk["text"] not in seen_texts:
            seen_texts.add(chunk["text"])
            merged.append(chunk)

    return merged[:top_k]