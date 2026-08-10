"""
ingest.py
POST /ingest -- accepts a PDF upload, runs it through the full
ingestion pipeline (extract -> chunk -> embed -> store), and
returns a doc_id the frontend uses for all future queries.
"""

import os
import shutil
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from ingestion.chunker import chunk_pages
from ingestion.embedder import embed_and_store
from ingestion.extractor import extract_text_from_pdf

router = APIRouter()

UPLOAD_DIR = "uploaded_docs"
ALLOWED_EXTENSION = ".pdf"
MAX_FILE_SIZE_MB = 20


@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    # --- Validation ---
    if not file.filename.lower().endswith(ALLOWED_EXTENSION):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    doc_id = str(uuid.uuid4())[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    size_mb = os.path.getsize(save_path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        os.remove(save_path)
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Max size is {MAX_FILE_SIZE_MB}MB.",
        )

    # --- Pipeline ---
    try:
        pages = extract_text_from_pdf(save_path)
        if not pages:
            raise HTTPException(
                status_code=422,
                detail="No extractable text found. The PDF may be scanned/image-based.",
            )

        chunks = chunk_pages(pages)
        chunks_stored = embed_and_store(chunks, doc_id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "pages_processed": len(pages),
        "chunks_stored": chunks_stored,
    }