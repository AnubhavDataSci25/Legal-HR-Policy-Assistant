"""
bm25_search.py
Retrieves chunks using BM25 -- a classic keyword/lexical ranking
algorithm. This catches exact terms (e.g. "notice period", "PTO")
that semantic search can sometimes miss or under-rank.
"""

from rank_bm25 import BM25Okapi

from ingestion.embedder import get_chroma_collection


def bm25_search(query: str, doc_id: str, top_k: int = 10) -> list[dict]:
    """
    Runs BM25 keyword search over every chunk stored for this document.

    Note: this re-tokenizes the full corpus on every call, which is
    fine for documents up to a few hundred pages. For much larger
    corpora you'd cache the BM25Okapi index instead of rebuilding it
    per request.

    Args:
        query: The user's natural language question.
        doc_id: Which document's ChromaDB collection to search.
        top_k: How many chunks to retrieve.

    Returns:
        A list of dicts: [{"text", "page_num", "score"}, ...]
    """
    collection = get_chroma_collection(doc_id)
    all_docs = collection.get(include=["documents", "metadatas"])

    corpus = all_docs["documents"]
    if not corpus:
        return []

    tokenized_corpus = [doc.lower().split() for doc in corpus]
    bm25 = BM25Okapi(tokenized_corpus)

    tokenized_query = query.lower().split()
    scores = bm25.get_scores(tokenized_query)

    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

    return [
        {
            "text": corpus[i],
            "page_num": all_docs["metadatas"][i]["page_num"],
            "score": float(scores[i]),
        }
        for i in top_indices
        if scores[i] > 0  # drop zero-score (irrelevant) matches
    ]