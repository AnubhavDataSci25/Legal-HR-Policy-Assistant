import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { uploadDocument } from "../../services/api";
import { formatUploadError } from "../../utils/formatError";
import UploadDropzone from "./UploadDropzone";
import UploadStatus from "./UploadStatus";
import DocumentCard from "./DocumentCard";
import Button from "../common/Button";

/**
 * Owns the full upload lifecycle:
 *   idle -> uploading -> processing -> success
 *                                   -> error
 * plus a lightweight replace-confirmation step once a document is active.
 *
 * "uploading" vs "processing" is the key fix requested: axios only tells
 * us when the request body has finished sending (upload progress hits
 * 100%). The backend then still has to extract text, chunk, and embed
 * the document before /ingest responds -- that gap is now shown
 * honestly as "processing" instead of a stalled 100% bar.
 */
export default function UploadPanel({ document, onIngested }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | processing | error
  const [progress, setProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const replaceInputRef = useRef(null);

  const runUpload = async (file) => {
    setPendingFile(file);
    setStatus("uploading");
    setProgress(0);
    setErrorMessage("");

    try {
      const res = await uploadDocument(file, (pct) => {
        setProgress(pct);
        // Upload bytes have fully arrived at the server -- the backend is
        // now doing real work (extract -> chunk -> embed) with no progress
        // signal of its own, so we switch to an honest indeterminate state.
        if (pct >= 100) setStatus("processing");
      });

      onIngested({ ...res.data, uploadedAtLocal: Date.now() });
      setStatus("idle");
      toast.success(`Document ready — ${res.data.chunks_stored} chunks indexed.`);
    } catch (err) {
      const message = formatUploadError(err);
      setErrorMessage(message);
      setStatus("error");
      toast.error(message);
    }
  };

  const handleFileSelected = (file) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }
    runUpload(file);
  };

  const handleRetry = () => pendingFile && runUpload(pendingFile);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        Document
      </h2>

      <AnimatePresence mode="wait">
        {/* --- Active document, nothing in flight --- */}
        {document && status === "idle" && !confirmingReplace && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DocumentCard document={document} onReplace={() => setConfirmingReplace(true)} />
          </motion.div>
        )}

        {/* --- Replace confirmation --- */}
        {document && confirmingReplace && status === "idle" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: "var(--warning-soft)", border: "1px solid var(--warning)" }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} style={{ color: "var(--warning)" }} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                Replacing the document will clear the current conversation. Continue?
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmingReplace(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => replaceInputRef.current?.click()}
              >
                Choose file
              </Button>
              <input
                ref={replaceInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setConfirmingReplace(false);
                  if (file) handleFileSelected(file);
                  e.target.value = ""; // allow re-selecting the same file later
                }}
              />
            </div>
          </motion.div>
        )}

        {/* --- Uploading / processing --- */}
        {(status === "uploading" || status === "processing") && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UploadStatus status={status} progress={progress} fileName={pendingFile?.name} />
          </motion.div>
        )}

        {/* --- Error --- */}
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: "var(--danger-soft)", border: "1px solid var(--danger)" }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} style={{ color: "var(--danger)" }} className="shrink-0 mt-0.5" />
              <p className="text-sm">{errorMessage}</p>
            </div>
            <Button variant="secondary" onClick={handleRetry}>
              <RefreshCw size={14} />
              Try again
            </Button>
          </motion.div>
        )}

        {/* --- Empty state --- */}
        {!document && status === "idle" && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UploadDropzone onFileSelected={handleFileSelected} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}