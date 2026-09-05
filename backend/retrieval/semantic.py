"""
semantic.py
Retrieves the most semantically similar chunks to a query using
ChromaDB's vector similarity search (cosine distance under the hood).
"""

from ingestion.embedder import get_embedding_model, get_chroma_collection


def semantic_search(query: str, doc_id: str, top_k: int = 10) -> list[dict]:
    """
    Embeds the query and finds the top_k most similar chunks stored
    for this document.

    Args:
        query: The user's natural language question.
        doc_id: Which document's ChromaDB collection to search.
        top_k: How many chunks to retrieve.

    Returns:
        A list of dicts: [{"text", "page_num", "score"}, ...]
        score is a similarity score in [0, 1] (higher = more relevant).
    """
    model = get_embedding_model()
    collection = get_chroma_collection(doc_id)

    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    # ChromaDB may return no results if the collection is empty.
    if not results["documents"] or not results["documents"][0]:
        return []

    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # Chroma's default distance is cosine distance (0 = identical).
        # Convert to a similarity score where higher is better.
        similarity = 1 - dist
        chunks.append({"text": doc, "page_num": meta["page_num"], "score": similarity})

    return chunks