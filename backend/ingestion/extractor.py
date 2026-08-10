"""
extractor.py
Extracts raw text from PDF files, page by page, using PyMuPDF.
"""

import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> list[dict]:
    """
    Opens a PDF and returns a list of page-level text blocks.

    Args:
        file_path: Path to the PDF file on disk.

    Returns:
        A list of dicts, one per non-empty page:
        [{"page_num": 1, "text": "..."}, {"page_num": 2, "text": "..."}, ...]
    """
    doc = fitz.open(file_path)
    pages = []

    for i, page in enumerate(doc):
        text = page.get_text("text")
        if text.strip():
            pages.append({"page_num": i + 1, "text": text})

    doc.close()
    return pages


if __name__ == "__main__":
    # Quick manual test: python extractor.py path/to/file.pdf
    import sys

    if len(sys.argv) < 2:
        print("Usage: python extractor.py <path_to_pdf>")
        sys.exit(1)

    result = extract_text_from_pdf(sys.argv[1])
    print(f"Extracted {len(result)} non-empty pages.")
    if result:
        print("\n--- Preview of page 1 ---")
        print(result[0]["text"][:500])