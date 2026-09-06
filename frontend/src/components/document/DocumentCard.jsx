import { CheckCircle2, FileText, RotateCcw } from "lucide-react";
import { truncateFilename } from "../../utils/formatFileName";

/**
 * The "active document" card. Only displays metadata the backend
 * actually returns from POST /ingest (filename, chunks_stored) plus
 * a client-side upload timestamp -- nothing fabricated.
 */
export default function DocumentCard({ document, onReplace }) {
  const uploadedAt = document.uploadedAtLocal
    ? new Date(document.uploadedAtLocal).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border-strong)" }}
    >
      {/* Active accent indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: "var(--accent)" }} />

      <div className="flex items-start gap-3 pl-1">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          <FileText size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" title={document.filename}>
            {truncateFilename(document.filename)}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 size={12} style={{ color: "var(--success)" }} />
            <span className="text-xs" style={{ color: "var(--success)" }}>
              Indexed and ready
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between text-xs text-text-muted pl-1 pt-2 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <span>{document.chunks_stored} chunks indexed</span>
        {uploadedAt && <span>Uploaded {uploadedAt}</span>}
      </div>

      <button
        onClick={onReplace}
        className="flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-2 mt-1 transition-colors duration-micro"
        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <RotateCcw size={13} />
        Upload another document
      </button>
    </div>
  );
}