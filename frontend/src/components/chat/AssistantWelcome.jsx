import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SUGGESTED_PROMPTS } from "../../constants/ui";

/**
 * Shown once, right after a document is indexed, in place of a plain
 * system sentence. Suggestion chips are entirely frontend-generated --
 * clicking one just populates the normal question flow through the
 * existing askQuestion() call, no new backend endpoint involved.
 */
export default function AssistantWelcome({ chunksStored, onSuggestionClick }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-xl p-5 max-w-xl"
      style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
        </div>
        <span className="font-semibold text-sm">Document ready</span>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">
        Your PDF is indexed ({chunksStored} chunks) and ready for questions. Ask anything about
        its contents — I'll answer using only what's in the document and show you exactly where
        each answer came from.
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggestionClick(prompt)}
            className="text-xs font-medium rounded-full px-3 py-1.5 transition-colors duration-micro"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </motion.div>
  );
}