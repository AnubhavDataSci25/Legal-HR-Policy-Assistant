import { CheckCircle2, FileText, RotateCcw } from "lucide-react";
import { truncateFilename } from "../../utils/formatFileName";
import IconButton from "../common/IconButton";

/**
 * Small sticky header above the conversation so users never lose track
 * of which document they're grounded on, even after scrolling through a
 * long chat history.
 */
export default function ChatHeader({ document, onReset }) {
  if (!document) return null;

  return (
    <div
      className="flex items-center justify-between px-4 md:px-6 py-3 border-b shrink-0"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={14} style={{ color: "var(--text-secondary)" }} className="shrink-0" />
        <span className="text-sm font-medium truncate" title={document.filename}>
          {truncateFilename(document.filename, 40)}
        </span>
        <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--success)" }}>
          <CheckCircle2 size={12} />
          Indexed
        </span>
      </div>

      <IconButton aria-label="Clear conversation" onClick={onReset} className="w-8 h-8">
        <RotateCcw size={14} />
      </IconButton>
    </div>
  );
}