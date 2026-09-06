import { motion } from "framer-motion";
import { FileText, Loader2 } from "lucide-react";

/**
 * Renders the in-progress states of an upload. Crucially, this
 * distinguishes two very different moments that were previously both
 * shown as "upload complete":
 *
 *   1. "uploading"  -- the file bytes are being transferred (real,
 *                      measurable progress from axios onUploadProgress)
 *   2. "processing" -- the file has fully arrived at the server and the
 *                      backend is now extracting text, chunking, and
 *                      embedding it (no progress signal exists for this
 *                      today, so we show an indeterminate state with
 *                      honest, reassuring copy instead of a stalled
 *                      100% bar)
 *
 * This purely a frontend state -- no backend change or new endpoint
 * required. See design plan section 6.C.
 */
export default function UploadStatus({ status, progress, fileName }) {
  const isUploading = status === "uploading";
  const isProcessing = status === "processing";

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
          ) : (
            <FileText size={16} style={{ color: "var(--accent)" }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-text-muted">
            {isUploading && "Uploading…"}
            {isProcessing && "Reading and indexing document…"}
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-hover)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col gap-1.5">
          {/* Indeterminate shimmer -- honestly communicates "still working"
              without implying a knowable percentage the backend doesn't provide */}
          <div className="w-full h-1.5 rounded-full overflow-hidden relative" style={{ backgroundColor: "var(--surface-hover)" }}>
            <motion.div
              className="h-full rounded-full absolute"
              style={{ backgroundColor: "var(--accent)", width: "35%" }}
              animate={{ x: ["-40%", "220%"] }}
              transition={{ duration: 1.3, ease: "easeInOut", repeat: Infinity }}
            />
          </div>
          <p className="text-xs text-text-muted">
            This can take a few seconds for larger documents.
          </p>
        </div>
      )}
    </div>
  );
}