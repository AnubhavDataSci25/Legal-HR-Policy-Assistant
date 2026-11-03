import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Eye, FileText } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

export default function SourceCard({ source, index, onViewPage }) {
  const [expanded, setExpanded] = useState(false);
  const { showScores } = useSettings();

  return (
    <div
      className="rounded-lg overflow-hidden transition-colors duration-micro"
      style={{
        backgroundColor: expanded ? "var(--surface-hover)" : "var(--surface-elevated)",
        border: `1px solid ${expanded ? "var(--border-strong)" : "var(--border)"}`,
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left select-none"
          aria-expanded={expanded}
          aria-controls={`source-excerpt-${index}`}
        >
          <FileText size={13} style={{ color: "var(--accent)" }} className="shrink-0" />
          <span className="text-sm font-medium">Page {source.page_num}</span>
          {showScores && source.confidence != null && (
            <span
              className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--accent-soft)",
                color: "var(--accent)",
              }}
              title={`Relevance score: ${(source.confidence * 100).toFixed(0)}%`}
            >
              {Math.round(source.confidence * 100)}%
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {onViewPage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewPage(index);
              }}
              title={`View page ${source.page_num} with highlighted citation`}
              aria-label={`View page ${source.page_num}`}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors hover:bg-surface-elevated"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Eye size={12} style={{ color: "var(--accent)" }} />
              <span>View page</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Collapse excerpt" : "Expand excerpt"}
            className="p-1 rounded hover:bg-surface-elevated transition-colors"
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.18 }}
              className="inline-block"
            >
              <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
            </motion.span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`source-excerpt-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="text-xs text-text-secondary leading-relaxed px-3 pb-3">
              {source.excerpt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
