import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Bot, ThumbsDown, ThumbsUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

import { sendFeedback } from "../../services/api";

/**
 * The primary content surface of the app. Renders markdown so answers
 * with lists/emphasis from the LLM display cleanly instead of as a
 * single unformatted paragraph.
 *
 * Includes answer feedback (thumbs up / thumbs down) with optional comment
 * upon thumbs down. Ratings are disabled after selection and preserved in
 * message state across scrolling and dashboard navigation.
 */
export default function AssistantMessage({
  text,
  confidence,
  streaming = false,
  messageId,
  rating = null,
  feedbackComment = "",
  feedbackSubmitted = false,
  feedbackInputDismissed = false,
  question = "",
  pages = [],
  docId = "",
  onFeedback,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [commentText, setCommentText] = useState(feedbackComment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLowConfidence = confidence === "low";
  const normalizedText = (text || "").toLowerCase();
  const isFallback =
    normalizedText.includes("i don't have enough information") ||
    normalizedText.includes("i ran into an error answering that");

  // Only eligible completed answers can be rated (not streaming, not low confidence, not fallback)
  const canRate = !streaming && !isLowConfidence && !isFallback && Boolean(text?.trim());
  const isRated = Boolean(rating);
  const showCommentInput = canRate && rating === "down" && !feedbackInputDismissed;

  const handleRate = async (selectedRating) => {
    if (isRated || !canRate) return;

    // Immediately update message state so rating persists
    onFeedback?.({
      rating: selectedRating,
      feedbackSubmitted: true,
      feedbackInputDismissed: selectedRating === "up",
    });

    toast("Thanks for your feedback", {
      id: `feedback-toast-${messageId || "global"}`,
      duration: 2500,
    });

    try {
      await sendFeedback({
        doc_id: docId || "unknown",
        question: question || "Document query",
        answer: (text || "").slice(0, 4000),
        rating: selectedRating,
        comment: null,
        pages: Array.isArray(pages) ? pages : [],
      });
    } catch (err) {
      // Fail soft: never disrupt the user's conversation on network/db error
      console.warn("Feedback submission error:", err);
    }
  };

  const handleCommentSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      handleCommentSkip();
      return;
    }

    setIsSubmitting(true);
    onFeedback?.({
      feedbackComment: trimmed,
      feedbackCommentSubmitted: true,
      feedbackInputDismissed: true,
    });

    toast("Thanks for your feedback", {
      id: `feedback-comment-toast-${messageId || "global"}`,
      duration: 2500,
    });

    try {
      await sendFeedback({
        doc_id: docId || "unknown",
        question: question || "Document query",
        answer: (text || "").slice(0, 4000),
        rating: "down",
        comment: trimmed.slice(0, 500),
        pages: Array.isArray(pages) ? pages : [],
      });
    } catch (err) {
      console.warn("Feedback comment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSkip = () => {
    onFeedback?.({
      feedbackInputDismissed: true,
    });
  };

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

      <div className="flex flex-col gap-2 max-w-[75%] min-w-0">
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
              Low confidence — the document may not contain enough information to answer this fully.
            </p>
          </div>
        )}

        {/* Feedback buttons for eligible completed answers */}
        {canRate && (
          <div className="flex flex-col gap-1.5 px-1 pt-0.5">
            <div className="flex items-center gap-1.5" role="group" aria-label="Answer rating">
              <button
                type="button"
                onClick={() => handleRate("up")}
                disabled={isRated}
                aria-label="Thumbs up, answer was helpful"
                aria-pressed={rating === "up"}
                className={`p-1.5 rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                  isRated
                    ? rating === "up"
                      ? "text-[var(--success)] bg-[var(--success-soft)] border border-[var(--success)] opacity-100"
                      : "text-[var(--text-muted)] opacity-35 cursor-not-allowed"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                }`}
              >
                <ThumbsUp size={14} />
              </button>

              <button
                type="button"
                onClick={() => handleRate("down")}
                disabled={isRated}
                aria-label="Thumbs down, answer was not helpful"
                aria-pressed={rating === "down"}
                className={`p-1.5 rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                  isRated
                    ? rating === "down"
                      ? "text-[var(--danger)] bg-[var(--danger-soft)] border border-[var(--danger)] opacity-100"
                      : "text-[var(--text-muted)] opacity-35 cursor-not-allowed"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                }`}
              >
                <ThumbsDown size={14} />
              </button>
            </div>

            {/* Optional one-line comment input for thumbs down */}
            {showCommentInput && (
              <form
                onSubmit={handleCommentSubmit}
                className="flex items-center gap-1.5 mt-1 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What was wrong? (optional)"
                  maxLength={500}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "#FFFFFF",
                  }}
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={handleCommentSkip}
                  className="text-xs px-2 py-1.5 rounded-lg transition-colors hover:text-[var(--text-primary)] focus:outline-none"
                  style={{ color: "var(--text-muted)" }}
                >
                  Skip
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
