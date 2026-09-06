"""
generator.py
Takes the reranked chunks and the user's question, and produces a
grounded answer using Groq's free-tier LLM API. Refuses to answer
(rather than hallucinate) when the reranker's confidence is too low.
"""

import os
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Groq free-tier models -- swap MODEL to try alternatives:
#   "llama-3.1-8b-instant"    -> fastest, recommended default
#   "llama-3.3-70b-versatile" -> smarter, better for complex legal text
#   "gemma2-9b-it"             -> concise, structured answers
MODEL = "openai/gpt-oss-20b"

# Below this confidence, the top retrieved chunk isn't a good enough
# match to answer from -- refuse instead of guessing.
CONFIDENCE_THRESHOLD = 0.3

SYSTEM_PROMPT = """You are a helpful assistant that answers questions strictly based on the
provided document excerpts. Follow these rules:

1. Only use information present in the excerpts below -- never use outside knowledge.
2. If the excerpts do not contain enough information to answer confidently, respond with
   exactly: "I don't have enough information in the document to answer this."
3. Always cite the page number(s) your answer came from, like "(Page 4)".
4. Keep answers concise and direct -- 2-4 sentences unless the question needs a list.
"""


def _build_context(chunks: list[dict]) -> str:
    return "\n\n".join(f"[Page {c['page_num']}]: {c['text']}" for c in chunks)


def generate_answer(query: str, chunks: list[dict]) -> dict:
    """
    Generates a grounded answer from the reranked chunks.

    Args:
        query: The user's natural language question.
        chunks: Reranked chunks from reranker.rerank() -- each must
                have a "confidence" field.

    Returns:
        {
            "answer": str,
            "sources": [{"page_num", "excerpt"}, ...],
            "confidence": "high" | "low",
        }
    """
    top_confidence = max((c.get("confidence", 0) for c in chunks), default=0)

    if not chunks or top_confidence < CONFIDENCE_THRESHOLD:
        return {
            "answer": "I don't have enough information in the document to answer this.",
            "sources": [],
            "confidence": "low",
        }

    context = _build_context(chunks)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Document excerpts:\n{context}\n\nQuestion: {query}"},
    ]

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.1,
        max_tokens=600,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": [
            {"page_num": c["page_num"], "excerpt": c["text"][:200]} for c in chunks
        ],
        "confidence": "high",
    }

def generate_answer_stream(query: str, chunks: list[dict]):
    """
    Streaming counterpart to generate_answer(). Same grounding rules and
    confidence guardrail, but yields the answer incrementally as it's
    generated instead of waiting for the full response.
 
    This is purely additive -- generate_answer() above is untouched and
    still powers the original, non-streaming /query endpoint exactly as
    before. This function only powers the new /query/stream endpoint.
 
    Args:
        query: The user's natural language question.
        chunks: Reranked chunks from reranker.rerank() -- each must
                have a "confidence" field.
 
    Yields:
        str fragments of the answer, in order, as Groq generates them.
        The caller (routers/query_stream.py) is responsible for building
        the "sources" list and "confidence" label itself, since it
        already has access to the same reranked `chunks`.
    """
    top_confidence = max((c.get("confidence", 0) for c in chunks), default=0)
 
    if not chunks or top_confidence < CONFIDENCE_THRESHOLD:
        yield "I don't have enough information in the document to answer this."
        return
 
    context = _build_context(chunks)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Document excerpts:\n{context}\n\nQuestion: {query}"},
    ]
 
    stream = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.1,
        max_tokens=600,
        stream=True,
    )
 
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta