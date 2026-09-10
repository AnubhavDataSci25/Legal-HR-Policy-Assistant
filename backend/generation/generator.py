"""
generator.py
Takes the reranked chunks and the user's question, and produces a
grounded answer using Groq's free-tier LLM API. Refuses to answer
(rather than hallucinate) when the reranker's confidence is too low.
"""

import os
import logging
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)

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

FOLLOWUP_SYSTEM_PROMPT = """You suggest short follow-up questions a user might naturally ask next,
based on the document excerpts and the question/answer that just happened. Follow these rules strictly:
 
1. Suggest exactly 3 follow-up questions.
2. Every question must be answerable from the document excerpts provided -- never generic,
   never about topics the excerpts don't cover.
3. Questions must relate to the same topic/subject as the previous question and answer --
   do not jump to an unrelated part of the document.
4. Do not repeat or simply reword the question that was just answered.
5. Keep each question short and natural -- under 12 words.
6. Respond with ONLY a JSON array of exactly 3 strings. No other text, no markdown.
   Example: ["Question one?", "Question two?", "Question three?"]
"""
 
 
def _parse_followup_questions(raw: str) -> list[str]:
    """Best-effort parsing of the model's follow-up suggestions.
 
    Real models often don't follow "respond with ONLY a JSON array"
    exactly -- they wrap it in ```json fences, or add a preamble
    sentence first. This handles both:
      1. Strip markdown code fences, then try strict JSON.
      2. Fall back to line-splitting, keeping only lines that end in
         "?" -- a strong filter that naturally excludes preambles,
         fence markers, and other non-question noise.
    """
    import json
    import re
 
    if isinstance(raw, list):
        raw = "\n".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in raw
        )
    elif not isinstance(raw, str):
        raw = str(raw or "")
    raw = raw.strip()
    if not raw:
        return []
    # Strip ```json ... ``` or ``` ... ``` wrapping, if present.
    fenced = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
    fenced = re.sub(r"\n?```$", "", fenced).strip()
 
    # Extract a JSON array from anywhere in the text -- handles both a
    # clean response and one with a preamble sentence or trailing text
    # around the actual array.
    array_match = re.search(r"\[.*\]", fenced, re.DOTALL)
    if array_match:
        candidate = array_match.group(0)
        parsed = None
        try:
            parsed = json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            # Some models produce single-quoted Python-style list literals
            # instead of strict JSON -- ast.literal_eval handles those too.
            try:
                import ast
                parsed = ast.literal_eval(candidate)
            except (ValueError, SyntaxError):
                parsed = None
 
        if isinstance(parsed, list):
            questions = [str(q).strip() for q in parsed if str(q).strip()]
            if questions:
                return questions
 
    # Some responses are a JSON object rather than a bare array.
    try:
        object_candidate = json.loads(fenced)
        if isinstance(object_candidate, dict):
            for key in ("questions", "follow_ups", "followUps"):
                values = object_candidate.get(key)
                if isinstance(values, list):
                    return [str(value).strip() for value in values if str(value).strip()][:3]
    except (json.JSONDecodeError, TypeError, ValueError):
        pass

    lines = [line.strip() for line in fenced.splitlines() if line.strip()]
    cleaned = [
        re.sub(r"^[\-\*\d\.\)\s]+", "", line).strip().strip('"').rstrip(",")
        for line in lines
    ]
    # Accept bullet/numbered output even when the model omitted the final
    # question mark. Reject obvious wrapper text and keep the result useful.
    questions = []
    for item in cleaned:
        if len(item) < 8 or item.lower() in {"questions:", "follow-up questions:"}:
            continue
        if not item.endswith("?"):
            item = f"{item}?"
        questions.append(item)
    if questions:
        return questions[:3]

    # Last fallback for a single-line response containing several questions.
    inline = re.findall(r"[^?]{8,}\?", fenced)
    return [item.strip(" -•\"'") for item in inline if item.strip()][:3]
 
 
def generate_followup_questions(question: str, answer: str, chunks: list[dict]) -> list[str]:
    """
    Suggests up to 3 follow-up questions grounded in the same document
    context as the answer that was just given, so suggestions stay on
    the current topic instead of being generic or random.
 
    This is intentionally best-effort: any failure (bad JSON, API error,
    no chunks) returns an empty list rather than raising, since follow-up
    suggestions are a nice-to-have and must never break the chat flow.
 
    Args:
        question: The question that was just answered.
        answer: The answer that was just given.
        chunks: The same reranked chunks used to generate that answer.
 
    Returns:
        A list of 0-3 short follow-up question strings.
    """
    if not chunks:
        logger.warning("Follow-up generation skipped: no retrieved chunks")
        return []
 
    context = _build_context(chunks)
    user_content = (
        f"Document excerpts:\n{context}\n\n"
        f"Previous question: {question}\n"
        f"Previous answer: {answer}\n\n"
        f"Suggest 3 follow-up questions."
    )
 
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.4,
            max_tokens=300,
            # GPT-OSS can spend the entire small token budget on hidden
            # reasoning, leaving message.content empty. Follow-up questions
            # only need a short final JSON response.
            reasoning_effort="low",
            include_reasoning=False,
        )
        content = response.choices[0].message.content or ""
        questions = _parse_followup_questions(content)
        if not questions:
            logger.warning(
                "Follow-up model returned no parseable questions; content_type=%s raw=%r",
                type(content).__name__,
                str(content)[:1000],
            )
        return questions[:3]
    except Exception:
        logger.exception("Follow-up model request failed")
        return []
