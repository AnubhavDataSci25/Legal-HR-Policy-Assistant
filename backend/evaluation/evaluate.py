"""
evaluate.py
Standalone offline evaluation script -- quantifies the RAG pipeline's
quality using RAGAs (faithfulness, answer relevancy, context precision,
context recall) against a real, already-ingested document.

THIS IS A CLI TOOL, NOT PART OF THE RUNNING API.
It is never imported by main.py or any router, and calling it can never
affect the live app -- it only *reads* from the same ChromaDB store the
app already writes to, using the exact same retrieval/generation
functions the app uses (imported unchanged, not reimplemented).

Run from the backend/ directory, in the SEPARATE evaluation virtual
environment (see README.md in this folder for why):

    cd backend
    python evaluation/evaluate.py --doc-id <your_doc_id>

Requires GROQ_API_KEY in backend/.env (same key the app already uses --
RAGAs' LLM-based metrics need a judge model, and this uses Groq instead
of defaulting to OpenAI, keeping the whole project free-tier-only).
"""

import argparse
import json
import os
import sys

# Make sure `retrieval`, `generation`, `ingestion` (the actual backend
# package) are importable regardless of the current working directory.
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate the RAG pipeline with RAGAs.")
    parser.add_argument("--doc-id", required=True, help="doc_id of an already-ingested document")
    parser.add_argument(
        "--test-set",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_set.json"),
        help="Path to the test set JSON file (default: evaluation/test_set.json)",
    )
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "results.json"),
        help="Where to write the full results JSON (default: evaluation/results.json)",
    )
    parser.add_argument(
        "--chroma-dir",
        default=None,
        help="Override CHROMA_PERSIST_DIR (defaults to the same value the running app uses)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only run the first N test cases (useful for a quick smoke test)",
    )
    parser.add_argument(
        "--top-k", type=int, default=10, help="Hybrid retrieval candidate count (matches app default)"
    )
    parser.add_argument(
        "--top-n", type=int, default=5, help="Reranked chunks kept (matches app default)"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # Must happen BEFORE importing ingestion/retrieval modules, since
    # embedder.py reads CHROMA_PERSIST_DIR at import time.
    if args.chroma_dir:
        os.environ["CHROMA_PERSIST_DIR"] = args.chroma_dir

    from dotenv import load_dotenv

    load_dotenv(os.path.join(BACKEND_ROOT, ".env"))

    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: GROQ_API_KEY not found. Add it to backend/.env (same key the app uses).")
        sys.exit(1)

    # Imported here, after env setup -- these are the app's real,
    # unmodified retrieval/generation functions.
    from retrieval.hybrid import hybrid_retrieve
    from retrieval.reranker import rerank
    from generation.generator import generate_answer

    with open(args.test_set) as f:
        test_data = json.load(f)
    test_cases = test_data["test_cases"]
    if args.limit:
        test_cases = test_cases[: args.limit]

    print(f"Running {len(test_cases)} test case(s) against doc_id='{args.doc_id}'...\n")

    rows = []
    low_confidence_count = 0

    for i, case in enumerate(test_cases, start=1):
        question = case["question"]
        print(f"[{i}/{len(test_cases)}] {question}")

        candidates = hybrid_retrieve(question, args.doc_id, top_k=args.top_k)
        reranked = rerank(question, candidates, top_n=args.top_n)
        result = generate_answer(question, reranked)

        if result["confidence"] == "low":
            low_confidence_count += 1
            print("    -> low confidence (excluded from context, still scored)")

        rows.append(
            {
                "question": question,
                "answer": result["answer"],
                # Full chunk text, not the 200-char excerpt the API
                # returns to the frontend -- RAGAs needs the real context.
                "contexts": [c["text"] for c in reranked] or [""],
                "ground_truth": case["ground_truth"],
            }
        )

    if not rows:
        print("No test cases to evaluate.")
        sys.exit(1)

    print("\nRunning RAGAs scoring (this calls the judge LLM/embeddings per question)...\n")

    from datasets import Dataset
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_groq import ChatGroq
    from ragas import evaluate as ragas_evaluate
    from ragas.metrics import answer_relevancy, context_precision, context_recall, faithfulness

    dataset = Dataset.from_list(rows)

    judge_llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name="openai/gpt-oss-20b",
        temperature=0,
    )
    # Same local embedding model the app already uses for ingestion --
    # keeps this evaluation free-tier-only, no OpenAI key anywhere.
    judge_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    result = ragas_evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
        llm=judge_llm,
        embeddings=judge_embeddings,
    )

    df = result.to_pandas()

    print("=" * 60)
    print("AGGREGATE SCORES")
    print("=" * 60)
    aggregate = {}
    for metric_name in ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]:
        if metric_name in df.columns:
            avg = round(float(df[metric_name].mean()), 4)
            aggregate[metric_name] = avg
            print(f"  {metric_name:20s} {avg}")
    print("=" * 60)
    print(f"Test cases run: {len(rows)}  |  Low-confidence answers: {low_confidence_count}")

    output_payload = {
        "doc_id": args.doc_id,
        "test_cases_run": len(rows),
        "low_confidence_count": low_confidence_count,
        "aggregate_scores": aggregate,
        "per_question": json.loads(df.to_json(orient="records")),
    }
    with open(args.output, "w") as f:
        json.dump(output_payload, f, indent=2)
    print(f"\nFull results written to {args.output}")

    # Ready-to-paste Markdown table, matching the format used in the
    # project README for reporting these numbers.
    print("\n--- Markdown table for your README ---\n")
    print("| Metric | Score | What it measures |")
    print("|---|---|---|")
    descriptions = {
        "faithfulness": "Answer is grounded in retrieved context",
        "answer_relevancy": "Answer directly addresses the question",
        "context_precision": "Retrieved chunks are actually relevant",
        "context_recall": "All necessary info was retrieved",
    }
    for metric_name, score in aggregate.items():
        print(f"| {metric_name.replace('_', ' ').title()} | {score} | {descriptions.get(metric_name, '')} |")


if __name__ == "__main__":
    main()