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


def get_embedding_model():
    """Exposes the shared embedding model instance for reuse in retrieval."""
    return _model