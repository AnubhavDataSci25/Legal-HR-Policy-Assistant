"""
embedder.py
Embeds text chunks locally using sentence-transformers and stores
them in a persistent ChromaDB collection. No API key required --
this runs entirely on your machine, free.
"""

import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb

# Loaded once at import time -- ~80MB model, downloads on first run.
try:
    _model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
except Exception:
    _model = SentenceTransformer("all-MiniLM-L6-v2")

BACKEND_DIR = Path(__file__).resolve().parents[1]
_env_chroma_dir = os.getenv("CHROMA_PERSIST_DIR", str(BACKEND_DIR / "chroma_store"))
if not os.path.isabs(_env_chroma_dir):
    CHROMA_DIR = str((BACKEND_DIR / _env_chroma_dir).resolve())
else:
    CHROMA_DIR = _env_chroma_dir

_chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)


def get_chroma_collection(doc_id: str):
    """Returns (creating if needed) the ChromaDB collection for a document."""
    return _chroma_client.get_or_create_collection(name=doc_id)


def collection_exists(doc_id: str) -> bool:
    """Checks whether a ChromaDB collection exists and contains documents for the given doc_id."""
    try:
        col = _chroma_client.get_collection(name=doc_id)
        return col.count() > 0
    except Exception:
        return False


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
