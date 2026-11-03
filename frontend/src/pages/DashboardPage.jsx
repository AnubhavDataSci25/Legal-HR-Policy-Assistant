import { useEffect, useState } from "react";
import { AlertTriangle, FileUp, Loader2, MessageSquareText, ThumbsUp, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import AppHeader from "../components/layout/AppHeader";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import OverviewStat from "../components/dashboard/OverviewStat";
import RecentDocumentCard from "../components/dashboard/RecentDocumentCard";
import ContinueCard from "../components/dashboard/ContinueCard";
import DashboardEmptyState from "../components/dashboard/DashboardEmptyState";
import Button from "../components/common/Button";
import {
  getRecentDocuments,
  getQuestionCount,
  removeRecentDocument,
  removeStoredBrief,
  clearRecentDocuments,
} from "../utils/storage";
import { deleteDocument, getFeedbackSummary } from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext";
import { truncateFilename } from "../utils/formatFileName";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * DashboardPage - The landing hub. Displays overview statistics, continue prompt,
 * and recent documents with the ability to remove documents and clear chat history
 * from application memory whenever a task is finished.
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { clearWorkspace } = useWorkspace();

  const [recentDocuments, setRecentDocuments] = useState(getRecentDocuments);
  const [docToDelete, setDocToDelete] = useState(null);
  const [showClearAll, setShowClearAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    getFeedbackSummary()
      .then((res) => {
        if (mounted && res.data) {
          setFeedbackSummary(res.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const questionCount = getQuestionCount();
  const activeDocument = recentDocuments[0] || null;
  const hasDocuments = recentDocuments.length > 0;

  const goToWorkspace = (docId) => {
    if (docId) {
      navigate("/workspace", { state: { intent: "continue", docId } });
    } else {
      navigate("/workspace", { state: { intent: "upload" } });
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    const { docId, filename } = docToDelete;

    try {
      // 1. Delete on backend (removes file, chroma vector collection, brief cache)
      await deleteDocument(docId).catch((err) => {
        console.warn("Backend deletion warning (non-critical):", err);
      });

      // 2. Clear from localStorage
      removeRecentDocument(docId);
      removeStoredBrief(docId);

      // 3. Clear active workspace memory if this document was loaded in state
      clearWorkspace(docId);

      // 4. Update local state
      setRecentDocuments((prev) => prev.filter((d) => d.docId !== docId));
      toast.success(`Removed "${truncateFilename(filename, 26)}" and cleared chat history.`);
    } catch {
      toast.error("Could not remove document. Please try again.");
    } finally {
      setDeleting(false);
      setDocToDelete(null);
    }
  };

  const handleConfirmClearAll = async () => {
    setDeleting(true);
    try {
      // Best-effort cleanup for all docs on server
      await Promise.allSettled(
        recentDocuments.map((d) => {
          removeStoredBrief(d.docId);
          return deleteDocument(d.docId);
        })
      );

      // Clear from localStorage and reset active workspace in memory
      clearRecentDocuments();
      clearWorkspace();

      setRecentDocuments([]);
      toast.success("All documents and conversation histories have been removed.");
    } catch {
      toast.error("Could not clear all documents.");
    } finally {
      setDeleting(false);
      setShowClearAll(false);
    }
  };

  return (
    <AppShell
      header={<AppHeader />}
      chatPanel={
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
            {/* Greeting */}
            <div>
              <h1 className="text-xl font-bold">{getGreeting()} 👋</h1>
              <p className="text-sm text-text-muted mt-1">
                Continue your document research, review recent policies, or upload a new document.
              </p>
            </div>

            {!hasDocuments ? (
              <DashboardEmptyState onUpload={() => goToWorkspace()} />
            ) : (
              <>
                {/* Quick action */}
                <QuickActionCard
                  icon={FileUp}
                  label="Upload a document"
                  description="Add a new policy, contract, or handbook"
                  primary
                  onClick={() => goToWorkspace()}
                />

                {/* Continue where you left off -- only when real data exists */}
                {activeDocument?.lastQuestion && (
                  <ContinueCard
                    document={activeDocument}
                    onContinue={() => goToWorkspace(activeDocument.docId)}
                  />
                )}

                {/* Overview metrics */}
                <div
                  className={`grid gap-3 ${
                    feedbackSummary && feedbackSummary.total > 0 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"
                  }`}
                >
                  <OverviewStat label="Documents" value={recentDocuments.length} icon={FileUp} />
                  <OverviewStat label="Questions asked" value={questionCount} icon={MessageSquareText} />
                  {feedbackSummary && feedbackSummary.total > 0 && (
                    <OverviewStat
                      label="Helpful answers"
                      value={`${feedbackSummary.up} of ${feedbackSummary.total}`}
                      icon={ThumbsUp}
                    />
                  )}
                </div>

                {/* Recent documents list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                      Recent Documents
                    </h2>
                    {recentDocuments.length > 1 && (
                      <button
                        onClick={() => setShowClearAll(true)}
                        className="text-xs text-text-muted hover:text-danger transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recentDocuments.map((doc) => (
                      <RecentDocumentCard
                        key={doc.docId}
                        document={doc}
                        onOpen={() => goToWorkspace(doc.docId)}
                        onRemove={(d) => setDocToDelete(d)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Delete Single Document Confirmation Modal */}
          <AnimatePresence>
            {docToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => !deleting && setDocToDelete(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
                  aria-hidden="true"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.2 }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-doc-title"
                  className="relative z-10 w-full max-w-md rounded-2xl p-5 border shadow-2xl flex flex-col gap-4"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border-strong)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--danger-soft)" }}
                      >
                        <Trash2 size={20} style={{ color: "var(--danger)" }} />
                      </div>
                      <div>
                        <h3 id="delete-doc-title" className="text-sm font-semibold text-text-primary">
                          Remove Document
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          Clear document and conversation from memory
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => !deleting && setDocToDelete(null)}
                      disabled={deleting}
                      aria-label="Cancel"
                      className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    Are you sure you want to remove{" "}
                    <strong className="text-text-primary">
                      "{truncateFilename(docToDelete.filename, 35)}"
                    </strong>
                    ? This will delete the document from the server, clear its vector index, and remove all chat history from memory.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <Button
                      variant="secondary"
                      onClick={() => setDocToDelete(null)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={deleting}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--danger)",
                        color: "#FFFFFF",
                      }}
                    >
                      {deleting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          <span>Remove Document</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Clear All Documents Confirmation Modal */}
          <AnimatePresence>
            {showClearAll && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => !deleting && setShowClearAll(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
                  aria-hidden="true"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.2 }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="clear-all-title"
                  className="relative z-10 w-full max-w-md rounded-2xl p-5 border shadow-2xl flex flex-col gap-4"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border-strong)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--danger-soft)" }}
                      >
                        <AlertTriangle size={20} style={{ color: "var(--danger)" }} />
                      </div>
                      <div>
                        <h3 id="clear-all-title" className="text-sm font-semibold text-text-primary">
                          Clear All Documents
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          Remove all {recentDocuments.length} documents
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => !deleting && setShowClearAll(false)}
                      disabled={deleting}
                      aria-label="Cancel"
                      className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    This will remove all documents from the dashboard, delete their vector embeddings, and clear all active conversations from memory.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <Button
                      variant="secondary"
                      onClick={() => setShowClearAll(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <button
                      type="button"
                      onClick={handleConfirmClearAll}
                      disabled={deleting}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--danger)",
                        color: "#FFFFFF",
                      }}
                    >
                      {deleting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Clearing...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          <span>Clear All</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      }
    />
  );
}
