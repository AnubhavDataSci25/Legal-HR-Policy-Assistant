import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

/**
 * The primary content surface of the app. Renders markdown so answers
 * with lists/emphasis from the LLM display cleanly instead of as a
 * single unformatted paragraph.
 *
 * Confidence treatment: low confidence gets a small, calm inline notice
 * (not a loud badge) per design plan section 7.E -- high confidence
 * answers get no visual noise at all.
 */
export default function AssistantMessage({ text, confidence, streaming = false }) {
  const shouldReduceMotion = useReducedMotion();
  const isLowConfidence = confidence === "low";

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex gap-3"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
      >
        <Bot size={15} style={{ color: "var(--accent)" }} />
      </div>

      <div className="flex flex-col gap-2 max-w-[75%]">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3"
          style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <div className="markdown-body">
            <ReactMarkdown>{text}</ReactMarkdown>
            {streaming && (
              <span
                aria-hidden="true"
                className="inline-block w-[2px] h-[1em] align-middle ml-0.5 animate-pulse"
                style={{ backgroundColor: "var(--text-secondary)" }}
              />
            )}
          </div>
        </div>

        {!streaming && isLowConfidence && (
          <div className="flex items-start gap-1.5 px-1">
            <AlertTriangle size={13} style={{ color: "var(--warning)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "var(--warning)" }}>
              Low confidence — the document may not contain enough information to answer this
              fully.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}