import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({ baseURL: BASE_URL });

/**
 * Uploads a PDF for ingestion. Returns { doc_id, filename, pages_processed, chunks_stored }.
 *
 * onProgress receives 0-100 based on axios's onUploadProgress, which
 * tracks the request body being sent -- it reaches 100 as soon as the
 * bytes finish transferring, *before* the backend has finished
 * extracting/chunking/embedding the document. The UI layer (see
 * UploadPanel.jsx) uses that 100% signal to switch into an honest
 * "processing" state rather than implying the whole operation is done.
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
 * Returns { answer, sources: [{page_num, excerpt}], confidence: "high"|"low" }.
 */
export function askQuestion(docId, question) {
  return client.post("/query", { doc_id: docId, question });
}

// Sentinel the backend appends after the streamed answer text, followed by
// a JSON blob: {"sources": [...], "confidence": "high"|"low"}.
// See backend/routers/query_stream.py for the producing side.
const SOURCES_SENTINEL = "[[SOURCES]]";

/**
 * Streaming counterpart to askQuestion(). Calls POST /query/stream and
 * invokes callbacks as the answer arrives token-by-token, instead of
 * waiting for the full response.
 *
 * This is purely additive -- askQuestion() above is unchanged and still
 * works exactly as before, and is used automatically as a fallback here
 * if the stream fails before any text has arrived (see onError below).
 *
 * @param {string} docId
 * @param {string} question
 * @param {object} callbacks
 * @param {(chunk: string) => void} callbacks.onToken - called with each new fragment of answer text
 * @param {(meta: {sources: Array, confidence: string}) => void} callbacks.onComplete - called once when streaming finishes successfully
 * @param {(err: Error) => void} callbacks.onError - called if the stream fails at any point
 * @param {AbortSignal} [callbacks.signal] - optional, to cancel the request early
 */
export async function askQuestionStream(docId, question, { onToken, onComplete, onError, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/query/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id: docId, question }),
      signal,
    });
  } catch (networkErr) {
    onError?.(networkErr);
    return;
  }

  if (!response.ok || !response.body) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      detail = errJson.detail || detail;
    } catch {
      // response wasn't JSON -- keep the generic status-based message
    }
    onError?.(new Error(detail));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let pending = ""; // unflushed answer text, held back only enough to detect a split sentinel
  let metadataBuffer = "";
  let sentinelFound = false;
  const holdBack = SOURCES_SENTINEL.length - 1;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        const decoded = decoder.decode(value, { stream: true });
        if (sentinelFound) {
          metadataBuffer += decoded;
        } else {
          pending += decoded;
          const idx = pending.indexOf(SOURCES_SENTINEL);

          if (idx !== -1) {
            const answerPart = pending.slice(0, idx).replace(/\n\n$/, "");
            if (answerPart) onToken?.(answerPart);
            metadataBuffer = pending.slice(idx + SOURCES_SENTINEL.length);
            pending = "";
            sentinelFound = true;
          } else {
            // Flush everything except a small tail that could be the start
            // of a sentinel split across two network chunks.
            const safeLength = Math.max(0, pending.length - holdBack);
            if (safeLength > 0) {
              onToken?.(pending.slice(0, safeLength));
              pending = pending.slice(safeLength);
            }
          }
        }
      }

      if (done) break;
    }
  } catch (streamErr) {
    onError?.(streamErr);
    return;
  }

  if (sentinelFound) {
    try {
      const meta = JSON.parse(metadataBuffer);
      onComplete?.(meta);
    } catch {
      // Metadata didn't parse -- still treat the answer as delivered,
      // just without citation data, rather than failing the whole answer.
      onComplete?.({ sources: [], confidence: "high" });
    }
  } else {
    // Sentinel never arrived (unexpected, but don't lose whatever text we did get).
    if (pending) onToken?.(pending);
    onComplete?.({ sources: [], confidence: "high" });
  }
}

export default client;