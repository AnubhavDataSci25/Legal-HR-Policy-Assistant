import { ArrowRight, MessageCircle } from "lucide-react";
import { truncateFilename } from "../../utils/formatFileName";

/**
 * Only rendered by DashboardPage when a recent document actually has a
 * lastQuestion recorded -- never shown with placeholder/fabricated content.
 */
export default function ContinueCard({ document, onContinue }) {
  return (
    <button
      onClick={onContinue}
      className="w-full text-left rounded-xl p-5 flex items-start gap-4 transition-colors duration-standard"
      style={{ backgroundColor: "var(--accent-soft)", border: "1px solid var(--accent)" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <MessageCircle size={18} color="#FFFFFF" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          Continue where you left off
        </p>
        <p className="text-sm font-medium mt-1.5 truncate">"{document.lastQuestion}"</p>
        <p className="text-xs text-text-muted mt-1">
          {truncateFilename(document.filename, 40)}
          {document.lastPageCited ? ` · Page ${document.lastPageCited}` : ""}
        </p>
      </div>

      <ArrowRight size={16} className="shrink-0 mt-1" style={{ color: "var(--accent)" }} />
    </button>
  );
}