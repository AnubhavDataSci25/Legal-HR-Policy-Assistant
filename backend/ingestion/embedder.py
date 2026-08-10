"""
embedder.py
Embeds text chunks locally using sentence-transformers and stores
them in a persistent ChromaDB collection. No API key required --
this runs entirely on your machine, free.
"""

import os
from sentence_transformers import SentenceTransformer
import chromadb

# Loaded once at import time -- ~80MB model, downloads on first run.
_model = SentenceTransformer("all-MiniLM-L6-v2")

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_store")


def get_chroma_collection(doc_id: str):
    """Returns (creating if needed) the ChromaDB collection for a document."""
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    return client.get_or_create_collection(name=doc_id)


def embed_and_store(chunks: list[dict], doc_id: str) -> int:
    """
    Embeds a list of chunks and stores them in a ChromaDB collection
    unique to this document.

    Args:
        chunks: Output of chunk_pages() -- [{"text", "page_num", "chunk_id"}, ...]
        doc_id: Unique identifier for this document (used as the collection name).

    Returns:
        The number of chunks stored.
    """
    if not chunks:
        return 0

    collection = get_chroma_collection(doc_id)
    texts = [c["text"] for c in chunks]

    embeddings = _model.encode(texts, show_progress_bar=True).tolist()

    collection.add(
        documents=texts,
        embeddings=embeddings,
        ids=[c["chunk_id"] for c in chunks],
        metadatas=[{"page_num": c["page_num"]} for c in chunks],
    )
    return len(chunks)


if __name__ == "__main__":
    # Quick manual test
    sample_chunks = [
        {"text": "Employees get 24 paid leave days per year.", "page_num": 1, "chunk_id": "test_c0"},
        {"text": "Resignation requires 30 days notice.", "page_num": 2, "chunk_id": "test_c1"},
    ]
    count = embed_and_store(sample_chunks, doc_id="test_doc")
    print(f"Stored {count} chunks in ChromaDB at '{CHROMA_DIR}'.")

    # Verify retrieval works
    collection = get_chroma_collection("test_doc")
    query_embedding = _model.encode(["How many leave days?"]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=1)
    print("\n--- Test query result ---")
    print(results["documents"])