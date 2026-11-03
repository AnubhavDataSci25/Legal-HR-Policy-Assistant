import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Loader2, X } from "lucide-react";
import { getSourcePageUrl } from "../../services/api";

/**
 * SourceViewer - Modal overlay displaying the rendered PDF page with citation highlight.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - docId: string
 * - sources: array of { page_num: number, excerpt: string }
 * - index: number (active source index)
 * - onNavigate: (newIndex: number) => void
 */
export default function SourceViewer({
  open,
  onClose,
  docId,
  sources = [],
  index = 0,
  onNavigate,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(index);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const previousFocusRef = useRef(null);
  const dialogRef = useRef(null);

  // Sync internal index when prop index or open changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(index);
    }
  }, [open, index]);

  const currentSource = sources[currentIndex] || sources[0];
  const pageNum = currentSource?.page_num;
  const excerpt = currentSource?.excerpt;
  const totalSources = sources.length;

  const imageUrl = docId && pageNum ? getSourcePageUrl(docId, pageNum, excerpt) : null;

  // Reset loading and error when target page/excerpt changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [docId, pageNum, excerpt]);

  // Focus management & body scroll lock
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });

      return () => {
        document.body.style.overflow = originalOverflow;
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [open]);

  // Keyboard navigation & Esc close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight" && currentIndex < totalSources - 1) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, totalSources]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      const next = currentIndex - 1;
      setCurrentIndex(next);
      onNavigate?.(next);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalSources - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      onNavigate?.(next);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Modal / Mobile Sheet */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-viewer-title"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl flex flex-col rounded-none md:rounded-2xl overflow-hidden shadow-2xl focus:outline-none"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-strong)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{
                backgroundColor: "var(--surface-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--accent-soft)" }}
                >
                  <FileText size={15} style={{ color: "var(--accent)" }} />
                </div>
                <div className="min-w-0">
                  <h2 id="source-viewer-title" className="text-sm font-semibold truncate text-text-primary">
                    Page {pageNum ?? "—"}
                  </h2>
                  {totalSources > 1 && (
                    <p className="text-[11px] text-text-muted">
                      Source {currentIndex + 1} of {totalSources}
                    </p>
                  )}
                </div>
              </div>

              {/* Prev / Next & Close */}
              <div className="flex items-center gap-1.5">
                {totalSources > 1 && (
                  <div
                    className="flex items-center rounded-lg border mr-1 overflow-hidden"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      aria-label="Previous cited source"
                      className="p-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="w-[1px] h-4 bg-border" />
                    <button
                      onClick={handleNext}
                      disabled={currentIndex >= totalSources - 1}
                      aria-label="Next cited source"
                      className="p-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <button
                  onClick={onClose}
                  aria-label="Close page viewer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-surface-hover"
                  style={{
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Area (Scrollable image + excerpt fallback) */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Image Container */}
              <div
                className="relative rounded-xl overflow-hidden border min-h-[300px] flex items-center justify-center"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                {/* Loading skeleton */}
                {imageLoading && !imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 animate-pulse">
                    <Loader2 size={24} className="animate-spin text-accent" />
                    <span className="text-xs text-text-muted font-medium">
                      Rendering page {pageNum}...
                    </span>
                  </div>
                )}

                {/* Error fallback */}
                {imageError ? (
                  <div className="p-6 flex flex-col items-center text-center gap-2 max-w-md">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--warning-soft)" }}
                    >
                      <AlertCircle size={20} style={{ color: "var(--warning)" }} />
                    </div>
                    <p className="text-xs font-semibold text-text-primary">
                      Page preview unavailable
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Page preview unavailable. The original file may no longer be on the server.
                    </p>
                  </div>
                ) : (
                  imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`Page ${pageNum} preview with highlighted excerpt`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                      className={`w-full h-auto block transition-opacity duration-200 ${
                        imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                    />
                  )
                )}
              </div>

              {/* Cited Excerpt Card (Always visible below image as fallback) */}
              {excerpt && (
                <div
                  className="rounded-xl p-3.5 border flex flex-col gap-1.5 shrink-0"
                  style={{
                    backgroundColor: "var(--surface-elevated)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                      Cited Excerpt
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      Page {pageNum}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed italic border-l-2 pl-2.5 border-accent/40">
                    "{excerpt}"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
