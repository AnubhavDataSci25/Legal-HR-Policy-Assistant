import re
from pathlib import Path
from typing import Optional

import fitz
from fastapi import APIRouter, HTTPException, Query, Response

router = APIRouter()

BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploaded_docs"
DOC_ID_REGEX = re.compile(r"^[A-Za-z0-9-]{8}$")


@router.get("/document/{doc_id}/page/{page_num}")
def get_document_page(
    doc_id: str,
    page_num: int,
    q: Optional[str] = Query(None, description="Optional text excerpt to highlight"),
    zoom: float = Query(1.6, description="Zoom/scale factor for rendering"),
):
    """
    Renders a single page of an ingested document as a PNG image,
    optionally highlighting the specified query excerpt.
    """
    # 1. Validate doc_id against ^[A-Za-z0-9-]{8}$
    if not DOC_ID_REGEX.match(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    # 2. Validate q length (max 500 characters)
    if q is not None and len(q) > 500:
        raise HTTPException(
            status_code=400,
            detail="Query string 'q' exceeds maximum allowed length of 500 characters.",
        )

    # 3. Find file by scanning uploaded_docs/ for names that start with f"{doc_id}_" and end with .pdf
    if not UPLOAD_DIR.exists():
        raise HTTPException(status_code=404, detail="Document not found.")

    prefix = f"{doc_id}_"
    matched_file = None
    for entry in UPLOAD_DIR.iterdir():
        if entry.is_file() and entry.name.startswith(prefix) and entry.name.lower().endswith(".pdf"):
            # Build path only from validated directory entry
            matched_file = UPLOAD_DIR / entry.name
            break

    if not matched_file or not matched_file.exists():
        raise HTTPException(status_code=404, detail="Document not found.")

    # 4. Open document and validate page_num
    try:
        doc = fitz.open(matched_file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to open document.") from exc

    try:
        if page_num < 1 or page_num > doc.page_count:
            raise HTTPException(
                status_code=404,
                detail=f"Page {page_num} not found. Document has {doc.page_count} pages.",
            )

        page = doc[page_num - 1]

        # 5. Search and highlight
        if q:
            q_norm = " ".join(q.split())
            if q_norm:
                hits = page.search_for(q_norm)
                if not hits:
                    # Split into overlapping windows of about 6-8 words
                    words = q_norm.split()
                    window_size = 7
                    step = 4
                    hits = []
                    for i in range(0, len(words), step):
                        window = words[i : i + window_size]
                        if not window:
                            continue
                        sub_q = " ".join(window)
                        sub_hits = page.search_for(sub_q)
                        if sub_hits:
                            hits.extend(sub_hits)

                # Combine all hits and apply page.add_highlight_annot(...)
                seen_rects = set()
                for rect in hits:
                    key = (round(rect.x0, 1), round(rect.y0, 1), round(rect.x1, 1), round(rect.y1, 1))
                    if key not in seen_rects:
                        seen_rects.add(key)
                        page.add_highlight_annot(rect)

        # 6. Clamp zoom between 1.0 and 3.0
        clamped_zoom = max(1.0, min(3.0, float(zoom) if zoom is not None else 1.6))

        # 7. Render pixmap to PNG
        matrix = fitz.Matrix(clamped_zoom, clamped_zoom)
        pix = page.get_pixmap(matrix=matrix)
        png_bytes = pix.tobytes("png")

        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={"Cache-Control": "private, max-age=300"},
        )
    finally:
        # Always close document in memory; never save to disk
        doc.close()
