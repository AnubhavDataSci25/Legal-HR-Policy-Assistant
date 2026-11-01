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
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

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


# ---------------------------------------------------------------------------
# Document Brief Generation
# ---------------------------------------------------------------------------

BRIEF_SYSTEM_PROMPT = """You are an expert legal and HR policy document analyst. Your job is to extract an accurate, structured Document Brief from the provided document excerpts.

Follow these strict rules:
1. ONLY extract information explicitly supported by the excerpts. Never use outside knowledge or assume terms not in the text.
2. If a section has no relevant information found in the excerpts, return an empty array for that list. Do not invent or guess information.
3. For all extracted items, preserve exact values, dates, amounts, parties, conditions, and qualifiers.
4. Distinguish explicit statements from interpretations. Do not state something is an obligation unless the text explicitly says so (e.g. "shall", "must", "agrees to").
5. Source page references: Every chunk begins with [Page X]. Always cite the exact page number where the fact was found (as an integer). If an item spans multiple or cannot be tied to a specific page, set page to null. Never invent a page number.
6. Provide a concise source excerpt (max 150 characters) demonstrating the exact backing statement for key clauses and significant terms.
7. Return your response as a valid JSON object matching the exact structure below. Output ONLY JSON, without markdown fences or preamble text.

Schema:
{
  "summary": "Concise 2-4 sentence plain-language overview of the document's purpose, scope, and subject matter.",
  "key_clauses": [
    {
      "title": "Clause Title (e.g. Termination, Scope of Work, Confidentiality)",
      "description": "Plain language explanation of what the clause provides.",
      "page": 4,
      "source_excerpt": "Exact or near-exact quote from document backing this clause"
    }
  ],
  "dates_and_deadlines": [
    {
      "item": "Name of date/deadline (e.g. Notice Period, Effective Date, Expiry Date)",
      "value": "Exact date, timeframe, or period (e.g. 30 days, 11 months, within 7 days)",
      "context": "Conditions or circumstances under which this applies",
      "page": 2
    }
  ],
  "amounts_and_financial_terms": [
    {
      "item": "Name of financial term (e.g. Monthly Rent, Security Deposit, Overtime Rate, Penalty)",
      "value": "Exact monetary figure or calculation formula (e.g. $2,500/month, Rs. 15,000, 10% penalty)",
      "context": "Payment terms, due date, or conditions",
      "page": 3
    }
  ],
  "obligations": [
    {
      "party": "Party with obligation (e.g. Employee, Employer, Tenant, Landlord)",
      "obligation": "Clear description of the explicit duty or requirement",
      "page": 5
    }
  ],
  "risks_and_conditions": [
    {
      "item": "Risk, penalty, or restrictive condition (e.g. Forfeiture of deposit, Non-compete, Default interest)",
      "condition": "Triggering event or specific consequence stated in document",
      "page": 6
    }
  ],
  "unspecified_information": [
    {
      "item": "Notable omission or missing clause (e.g. Dispute Resolution Venue, Renewal Terms, Severability)",
      "description": "Explanation of why this standard detail appears absent from the document"
    }
  ]
}"""


def select_brief_chunks(chunks: list[dict], max_chunks: int = 18) -> list[dict]:
    """
    Selects representative, bounded, token-aware chunks across a document
    for Document Brief generation.
    """
    if len(chunks) <= max_chunks:
        return chunks

    PRIORITY_KEYWORDS = [
        "clause", "section", "article", "purpose", "scope", "definition",
        "date", "effective", "commence", "period", "term", "month", "year", "day", "deadline", "notice", "renewal", "expiry",
        "rent", "deposit", "payment", "fee", "amount", "charge", "salary", "compensation", "cost", "interest", "penalty", "rupees", "dollar", "inr", "$", "rs",
        "shall", "must", "agrees", "responsible", "duty", "obligation", "undertake", "covenant", "comply",
        "terminate", "termination", "default", "breach", "remedy", "liable", "liability", "indemnif", "dispute", "prohibit", "restrict", "forfeit", "jurisdiction", "governing law"
    ]

    head_chunks = chunks[:3]
    tail_chunks = chunks[-2:]
    head_ids = {c.get("chunk_id", i) for i, c in enumerate(head_chunks)}
    tail_ids = {c.get("chunk_id", len(chunks) - 2 + i) for i, c in enumerate(tail_chunks)}

    middle_candidates = [
        (i, c) for i, c in enumerate(chunks[3:-2], start=3)
        if c.get("chunk_id", i) not in head_ids and c.get("chunk_id", i) not in tail_ids
    ]

    budget_middle = max_chunks - len(head_chunks) - len(tail_chunks)

    scored_middle = []
    for orig_idx, chunk in middle_candidates:
        text_lower = chunk["text"].lower()
        score = sum(1 for kw in PRIORITY_KEYWORDS if kw in text_lower)
        scored_middle.append((score, orig_idx, chunk))

    scored_middle.sort(key=lambda x: x[0], reverse=True)

    selected_middle = []
    seen_pages = set()
    remaining = []
    for score, orig_idx, chunk in scored_middle:
        pg = chunk.get("page_num")
        if pg not in seen_pages and len(selected_middle) < budget_middle:
            seen_pages.add(pg)
            selected_middle.append((orig_idx, chunk))
        else:
            remaining.append((orig_idx, chunk))

    for orig_idx, chunk in remaining:
        if len(selected_middle) >= budget_middle:
            break
        selected_middle.append((orig_idx, chunk))

    all_selected = [(i, c) for i, c in enumerate(head_chunks)]
    all_selected.extend(selected_middle)
    all_selected.extend([(len(chunks) - 2 + i, c) for i, c in enumerate(tail_chunks)])
    all_selected.sort(key=lambda x: x[0])
    return [c for _, c in all_selected]


def _parse_brief_json(raw: str) -> dict:
    import json
    import re

    raw = raw.strip()
    fenced = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
    fenced = re.sub(r"\n?```$", "", fenced).strip()

    match = re.search(r"\{.*\}", fenced, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    try:
        return json.loads(fenced)
    except Exception as e:
        logger.warning("Failed strict JSON parse for brief: %s", e)
        return {}


def generate_document_brief(doc_id: str, chunks: list[dict]) -> dict:
    """
    Generates a structured Document Brief for an ingested document using Groq.
    Preserves exact citations, page metadata, and grounded findings.
    """
    from datetime import datetime, timezone

    if not chunks:
        raise ValueError("Cannot generate brief for empty chunks")

    selected_chunks = select_brief_chunks(chunks, max_chunks=18)
    context = _build_context(selected_chunks)

    user_content = (
        "Document excerpts:\n"
        + context
        + "\n\nGenerate the comprehensive Document Brief conforming to the JSON schema."
    )

    kwargs = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": BRIEF_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.1,
        "max_tokens": 2000,
    }

    if "gpt-oss" in MODEL:
        kwargs["reasoning_effort"] = "low"
        kwargs["include_reasoning"] = False

    try:
        response = client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content or ""
        parsed = _parse_brief_json(content)
    except Exception as e:
        logger.exception("Groq API call for Document Brief failed: %s", e)
        raise RuntimeError(f"Brief generation failed: {str(e)}") from e

    def sanitize_items(items, page_key="page"):
        if not isinstance(items, list):
            return []
        cleaned = []
        for it in items:
            if not isinstance(it, dict):
                continue
            item_copy = dict(it)
            if page_key in item_copy:
                val = item_copy[page_key]
                if val is not None:
                    try:
                        item_copy[page_key] = int(val)
                    except (ValueError, TypeError):
                        item_copy[page_key] = None
            cleaned.append(item_copy)
        return cleaned

    brief = {
        "document_id": doc_id,
        "status": "completed",
        "summary": parsed.get("summary") or "Executive summary not available for this document.",
        "key_clauses": sanitize_items(parsed.get("key_clauses")),
        "dates_and_deadlines": sanitize_items(parsed.get("dates_and_deadlines")),
        "amounts_and_financial_terms": sanitize_items(parsed.get("amounts_and_financial_terms")),
        "obligations": sanitize_items(parsed.get("obligations")),
        "risks_and_conditions": sanitize_items(parsed.get("risks_and_conditions")),
        "unspecified_information": sanitize_items(parsed.get("unspecified_information")),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    return brief
