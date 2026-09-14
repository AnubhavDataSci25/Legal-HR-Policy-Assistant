# Legal & HR Policy Assistant

AI-powered document Q&A app for Legal/HR policies using a Retrieval-Augmented Generation (RAG) pipeline.

## What’s implemented

- PDF ingestion pipeline: extract text -> chunk pages -> embed -> store in ChromaDB.
- Hybrid retrieval: semantic vector search + BM25 lexical search.
- Cross-encoder reranking for stronger relevance before generation.
- Guardrailed answer generation with confidence handling and source citations.
- Streaming answers endpoint with source metadata trailer.
- Follow-up question suggestions grounded in the same document context.
- React dashboard/workspace UI with:
  - Upload/replace document flow
  - Multi-turn chat experience
  - Source panel with cited excerpts
  - Recent documents + continue flow (local storage)

## Tech stack

- **Backend:** FastAPI, ChromaDB, sentence-transformers, rank-bm25, Groq SDK
- **Frontend:** React (Vite), Tailwind CSS, Axios, Framer Motion

## Project structure

```text
backend/
  ingestion/      # PDF extraction, chunking, embeddings, storage
  retrieval/      # semantic, BM25, hybrid retrieval, reranking
  generation/     # answer and follow-up generation
  routers/        # /ingest, /query, /query/stream, /followup
  main.py         # FastAPI app entrypoint

frontend/
  src/pages/      # Dashboard and workspace pages
  src/components/ # Upload, chat, source, layout components
  src/services/   # API calls (including streaming parser)
```

## API endpoints

- `POST /ingest` -> upload PDF, returns `doc_id`
- `POST /query` -> standard grounded answer + sources + confidence
- `POST /query/stream` -> token stream + `[[SOURCES]]{...}` metadata tail
- `POST /followup` -> up to 3 follow-up question suggestions

## Local setup

### 1) Backend

```bash
cd /home/runner/work/Legal-HR-Policy-Assistant/Legal-HR-Policy-Assistant/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_key_here
# optional
# CHROMA_PERSIST_DIR=./chroma_store
```

Run API:

```bash
uvicorn main:app --reload --port 8000
```

### 2) Frontend

```bash
cd /home/runner/work/Legal-HR-Policy-Assistant/Legal-HR-Policy-Assistant/frontend
npm install
```

Optional `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run UI:

```bash
npm run dev
```

## Typical usage

1. Open the frontend app.
2. Upload a PDF policy/handbook/contract.
3. Ask questions in the workspace chat.
4. Review cited sources and follow-up suggestions.