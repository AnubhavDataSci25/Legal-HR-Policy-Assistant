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
  evaluation/     # RAGAs evaluation suite with test_set.json
  main.py         # FastAPI app entrypoint

frontend/
  src/pages/      # Landing, Dashboard, and Workspace pages
  src/components/ # Upload, chat, source, layout components
  src/services/   # API calls (including streaming parser)
```

## API endpoints

- `GET /` -> API health check
- `POST /ingest` -> upload PDF, returns `doc_id`
- `POST /query` -> standard grounded answer + sources + confidence
- `POST /query/stream` -> token stream + `[[SOURCES]]{...}` metadata tail
- `POST /followup` -> up to 3 follow-up question suggestions

## Local setup

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (or copy from `backend/.env.example`):

```env
GROQ_API_KEY=your_key_here
# Optional configuration:
# GROQ_MODEL=openai/gpt-oss-20b
# CHROMA_PERSIST_DIR=./chroma_store
```

Run API:

```bash
uvicorn main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
```

Optional `frontend/.env` (or copy from `frontend/.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run UI:

```bash
npm run dev
```

### 3) Offline Evaluation (Optional)

Run the RAGAs pipeline evaluation in a separate environment to avoid library conflicts:

```bash
cd backend
python -m venv .venv-eval
source .venv-eval/bin/activate   # Windows: .venv-eval\Scripts\activate
pip install -r evaluation/requirements-eval.txt
python evaluation/evaluate.py --doc-id <your_doc_id>
```

## Typical usage

1. Open the frontend app at `http://localhost:5173`.
2. Upload a PDF policy/handbook/contract.
3. Ask questions in the workspace chat.
4. Review cited sources and follow-up suggestions.
