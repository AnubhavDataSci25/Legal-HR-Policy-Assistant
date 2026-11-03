import { ArrowRight, FileText, Trash2 } from "lucide-react";
import { truncateFilename } from "../../utils/formatFileName";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

export default function RecentDocumentCard({ document, onOpen, onRemove }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="text-left rounded-xl p-4 flex flex-col justify-between gap-3 transition-colors duration-standard group cursor-pointer relative focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      style={{
        backgroundColor: "var(--surface-elevated)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--accent-soft)" }}
          >
            <FileText size={16} style={{ color: "var(--accent)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" title={document.filename}>
              {truncateFilename(document.filename, 28)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {document.chunksStored} chunks · {formatRelativeTime(document.lastOpenedAt)}
            </p>
          </div>
        </div>

        {/* Delete document button */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(document);
            }}
            title="Remove document and chat history"
            aria-label={`Remove ${document.filename}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger-soft transition-colors shrink-0"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div
        className="flex items-center justify-between text-xs font-medium pt-1 border-t"
        style={{ borderColor: "var(--border)", color: "var(--accent)" }}
      >
        <span>Open workspace</span>
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}
