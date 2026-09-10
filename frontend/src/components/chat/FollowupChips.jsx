import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CornerDownRight } from "lucide-react";

/**
 * Renders the (up to 3) follow-up questions suggested after the most
 * recent answer. Lives between the message list and MessageInput,
 * pinned to "the current turn" rather than attached to any specific
 * historical message -- it's replaced the moment a new question is
 * asked (see WorkspacePage.jsx), so it never shows stale suggestions.
 *
 * Renders nothing while empty, so there's no layout jump or empty
 * placeholder box while suggestions are being generated.
 */
export default function FollowupChips({ questions, onSelect }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {questions && questions.length > 0 && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 md:px-6 pb-2 flex flex-wrap gap-2 items-center"
        >
          <span className="text-xs text-text-muted shrink-0">Ask next:</span>
          {questions.map((question) => (
            <button
              key={question}
              onClick={() => onSelect(question)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-full pl-2.5 pr-3 py-1.5 transition-colors duration-micro"
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
              <CornerDownRight size={11} className="shrink-0 opacity-60" />
              {question}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}