"""
chunker.py
Splits page-level text into overlapping, sentence-aware chunks
ready for embedding.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_pages(pages: list[dict], chunk_size: int = 600, chunk_overlap: int = 100) -> list[dict]:
    """
    Splits each page's text into smaller overlapping chunks.

    RecursiveCharacterTextSplitter tries paragraph breaks first, then
    sentence breaks, then word breaks -- this keeps chunks semantically
    coherent instead of cutting mid-sentence.

    Args:
        pages: Output of extract_text_from_pdf() -- [{"page_num", "text"}, ...]
        chunk_size: Target characters per chunk.
        chunk_overlap: Overlap between consecutive chunks (helps preserve
                       context across chunk boundaries).

    Returns:
        A list of dicts, one per chunk:
        [{"text": "...", "page_num": 1, "chunk_id": "p1_c0"}, ...]
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for page in pages:
        splits = splitter.split_text(page["text"])
        for i, split in enumerate(splits):
            chunks.append(
                {
                    "text": split,
                    "page_num": page["page_num"],
                    "chunk_id": f"p{page['page_num']}_c{i}",
                }
            )
    return chunks


if __name__ == "__main__":
    # Quick manual test
    sample_pages = [
        {"page_num": 1, "text": "This is a sample HR policy. " * 40},
        {"page_num": 2, "text": "Employees must submit leave requests in advance. " * 40},
    ]
    result = chunk_pages(sample_pages)
    print(f"Generated {len(result)} chunks from {len(sample_pages)} pages.")
    print("\n--- First chunk ---")
    print(result[0])