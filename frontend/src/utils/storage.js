/**
 * storage.js
 * Minimal localStorage-backed persistence -- just enough to make the
 * Dashboard show real data (recent documents, last question asked,
 * a running question count) instead of being permanently empty.
 *
 * Deliberately NOT a full conversation-history or bookmarking system --
 * that's a separate, larger feature. This only stores what the current
 * Dashboard actually displays.
 *
 * Storage is best-effort: if localStorage is unavailable (private
 * browsing, quota exceeded, etc.) every function fails silently and
 * returns a safe empty value rather than crashing the app.
 */

const RECENT_DOCS_KEY = "policy-assistant:recent-documents";
const QUESTION_COUNT_KEY = "policy-assistant:question-count";
const MAX_RECENT_DOCS = 5;

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full -- the app continues working, it just
    // won't remember this across visits.
  }
}

/** Recent documents, most-recently-opened first. */
export function getRecentDocuments() {
  return safeGet(RECENT_DOCS_KEY, []);
}

/** Same as getRecentDocuments()[0], but named for what it's used for. */
export function getActiveDocument() {
  return getRecentDocuments()[0] || null;
}

/**
 * Adds or updates a document in the recent list and moves it to the
 * front. Called once, right after a successful upload.
 */
export function upsertRecentDocument({ doc_id, filename, chunks_stored }) {
  const existing = getRecentDocuments();
  const now = new Date().toISOString();

  const withoutThisDoc = existing.filter((d) => d.docId !== doc_id);
  const entry = {
    docId: doc_id,
    filename,
    chunksStored: chunks_stored,
    uploadedAt: existing.find((d) => d.docId === doc_id)?.uploadedAt || now,
    lastOpenedAt: now,
    lastQuestion: existing.find((d) => d.docId === doc_id)?.lastQuestion || null,
    lastPageCited: existing.find((d) => d.docId === doc_id)?.lastPageCited || null,
  };

  const updated = [entry, ...withoutThisDoc].slice(0, MAX_RECENT_DOCS);
  safeSet(RECENT_DOCS_KEY, updated);
}

/**
 * Removes a document from the recent documents list in localStorage.
 */
export function removeRecentDocument(docId) {
  if (!docId) return [];
  const existing = getRecentDocuments();
  const updated = existing.filter((d) => d.docId !== docId);
  safeSet(RECENT_DOCS_KEY, updated);
  return updated;
}

/**
 * Clears all recent documents from localStorage.
 */
export function clearRecentDocuments() {
  safeSet(RECENT_DOCS_KEY, []);
  return [];
}

/**
 * Records the most recent question asked against a document, so the
 * Dashboard's "Continue where you left off" card has something real to
 * show. Called once per successfully answered question.
 */
export function recordLastQuestion(docId, question, pageCited) {
  const existing = getRecentDocuments();
  const now = new Date().toISOString();

  const updated = existing.map((d) =>
    d.docId === docId
      ? { ...d, lastQuestion: question, lastPageCited: pageCited ?? null, lastOpenedAt: now }
      : d
  );
  safeSet(RECENT_DOCS_KEY, updated);
}

/** Total questions asked across all documents/sessions, for the Overview card. */
export function getQuestionCount() {
  return safeGet(QUESTION_COUNT_KEY, 0);
}

export function incrementQuestionCount() {
  const next = getQuestionCount() + 1;
  safeSet(QUESTION_COUNT_KEY, next);
  return next;
}

export function resetQuestionCount() {
  safeSet(QUESTION_COUNT_KEY, 0);
  return 0;
}

const BRIEF_KEY_PREFIX = "policy-assistant:brief:";

/** Retrieves a cached Document Brief from localStorage. */
export function getStoredBrief(docId) {
  if (!docId) return null;
  return safeGet(`${BRIEF_KEY_PREFIX}${docId}`, null);
}

/** Saves a Document Brief to localStorage for instant reuse across sessions. */
export function setStoredBrief(docId, brief) {
  if (!docId || !brief) return;
  safeSet(`${BRIEF_KEY_PREFIX}${docId}`, brief);
}

/** Removes a cached Document Brief from localStorage. */
export function removeStoredBrief(docId) {
  if (!docId) return;
  try {
    localStorage.removeItem(`${BRIEF_KEY_PREFIX}${docId}`);
  } catch {
    // Storage unavailable
  }
}

const DOC_PANEL_WIDTH_KEY = "policy-assistant:panel-doc-width";
const SOURCE_PANEL_WIDTH_KEY = "policy-assistant:panel-source-width";

/** Retrieves stored workspace panel widths with fallback defaults. */
export function getStoredPanelWidths() {
  return {
    docWidth: safeGet(DOC_PANEL_WIDTH_KEY, 340),
    sourceWidth: safeGet(SOURCE_PANEL_WIDTH_KEY, 320),
  };
}

/** Persists customized workspace panel width to localStorage. */
export function setStoredPanelWidth(panel, width) {
  if (panel === "doc") {
    safeSet(DOC_PANEL_WIDTH_KEY, width);
  } else if (panel === "source") {
    safeSet(SOURCE_PANEL_WIDTH_KEY, width);
  }
}
