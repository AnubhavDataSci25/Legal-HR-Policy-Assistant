import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";

export default function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden transition-colors duration-micro"
      style={{
        backgroundColor: expanded ? "var(--surface-hover)" : "var(--surface-elevated)",
        border: `1px solid ${expanded ? "var(--border-strong)" : "var(--border)"}`,
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={expanded}
        aria-controls={`source-excerpt-${index}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={13} style={{ color: "var(--accent)" }} className="shrink-0" />
          <span className="text-sm font-medium">Page {source.page_num}</span>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
        </motion.span>
      </button>

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