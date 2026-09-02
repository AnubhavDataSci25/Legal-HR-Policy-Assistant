import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({ baseURL: BASE_URL });

/**
 * Uploads a PDF for ingestion. Returns { doc_id, filename, pages_processed, chunks_stored }.
 */
export function uploadDocument(file, onProgress) {
  const form = new FormData();
  form.append("file", file);

  return client.post("/ingest", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
}

/**
 * Asks a question against an ingested document.
 * (Wired up in Phase 2 once the /query endpoint exists.)
 */
export function askQuestion(docId, question) {
  return client.post("/query", { doc_id: docId, question });
}

export default client;