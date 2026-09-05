from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import ingest, query

app = FastAPI(
    title="Legal and HR Policy RAG API",
    description="Backend for the Legal & HR Policy Assistant RAG app.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=["*"],
    allow_origins=["*"],
    allow_methods=["*"],
)

app.include_router(ingest.router)
app.include_router(query.router)

app.get("/")
def health_check():
    return {"status": "ok", "service": "rag-policy-assisstant-api"}
