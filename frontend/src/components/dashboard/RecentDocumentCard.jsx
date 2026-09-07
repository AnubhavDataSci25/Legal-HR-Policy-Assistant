import { ArrowRight, FileText } from "lucide-react";
import { truncateFilename } from "../../utils/formatFileName";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

export default function RecentDocumentCard({ document, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-xl p-4 flex flex-col gap-3 transition-colors duration-standard group"
      style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          <FileText size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" title={document.filename}>
            {truncateFilename(document.filename, 30)}
          </p>
          <p className="text-xs text-text-muted">
            {document.chunksStored} chunks · {formatRelativeTime(document.lastOpenedAt)}
          </p>
        </div>
      </div>

      <div
        className="flex items-center justify-between text-xs font-medium pt-1"
        style={{ color: "var(--accent)" }}
      >
        Open workspace
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}