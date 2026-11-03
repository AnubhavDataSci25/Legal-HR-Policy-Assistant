import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import IconButton from "../common/IconButton";
import { getStoredPanelWidths, setStoredPanelWidth } from "../../utils/storage";

const DEFAULT_DOC_WIDTH = 340;
const DEFAULT_SOURCE_WIDTH = 320;
const MIN_PANEL_WIDTH = 260;
const MAX_PANEL_WIDTH = 640;
const MIN_CHAT_WIDTH = 380;

/**
 * Owns the responsive workspace layout:
 *   - Desktop (md+ for document, lg+ for sources): persistent, resizable sidebars
 *     with interactive draggable dividers to give users full control if text is collapsing.
 *   - Below breakpoints: slide-in drawer overlays.
 */
export default function AppShell({
  header,
  documentPanel,
  chatPanel,
  sourcePanel,
  docPanelOpen,
  sourcePanelOpen,
  onCloseDocPanel,
  onCloseSourcePanel,
  resizable = true,
}) {
  const [docWidth, setDocWidth] = useState(() => {
    const { docWidth: stored } = getStoredPanelWidths();
    return stored || DEFAULT_DOC_WIDTH;
  });

  const [sourceWidth, setSourceWidth] = useState(() => {
    const { sourceWidth: stored } = getStoredPanelWidths();
    return stored || DEFAULT_SOURCE_WIDTH;
  });

  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const [isDraggingSource, setIsDraggingSource] = useState(false);

  // References for live drag coordinates
  const dragStartRef = useRef({ startX: 0, startWidth: 0 });

  // Clamp widths when window resizes to always protect minimum chat space
  useEffect(() => {
    const handleWindowResize = () => {
      const windowWidth = window.innerWidth;
      const currentSource = sourcePanel ? sourceWidth : 0;
      const maxDoc = Math.min(MAX_PANEL_WIDTH, windowWidth - currentSource - MIN_CHAT_WIDTH);
      if (maxDoc > MIN_PANEL_WIDTH && docWidth > maxDoc) {
        setDocWidth(maxDoc);
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [docWidth, sourceWidth, sourcePanel]);

  // Document panel drag listeners
  const startDocDrag = useCallback(
    (clientX) => {
      setIsDraggingDoc(true);
      dragStartRef.current = { startX: clientX, startWidth: docWidth };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [docWidth]
  );

  useEffect(() => {
    if (!isDraggingDoc) return;

    const onMouseMove = (e) => {
      const delta = e.clientX - dragStartRef.current.startX;
      const requestedWidth = dragStartRef.current.startWidth + delta;
      const currentSource = sourcePanel ? sourceWidth : 0;
      const maxAllowed = Math.min(
        MAX_PANEL_WIDTH,
        window.innerWidth - currentSource - MIN_CHAT_WIDTH
      );
      const clamped = Math.max(MIN_PANEL_WIDTH, Math.min(maxAllowed, requestedWidth));
      setDocWidth(clamped);
      setStoredPanelWidth("doc", clamped);
    };

    const onMouseUp = () => {
      setIsDraggingDoc(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        onMouseMove(e.touches[0]);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [isDraggingDoc, sourceWidth, sourcePanel]);

  // Source panel drag listeners
  const startSourceDrag = useCallback(
    (clientX) => {
      setIsDraggingSource(true);
      dragStartRef.current = { startX: clientX, startWidth: sourceWidth };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sourceWidth]
  );

  useEffect(() => {
    if (!isDraggingSource) return;

    const onMouseMove = (e) => {
      const delta = dragStartRef.current.startX - e.clientX;
      const requestedWidth = dragStartRef.current.startWidth + delta;
      const currentDoc = documentPanel ? docWidth : 0;
      const maxAllowed = Math.min(
        MAX_PANEL_WIDTH,
        window.innerWidth - currentDoc - MIN_CHAT_WIDTH
      );
      const clamped = Math.max(MIN_PANEL_WIDTH, Math.min(maxAllowed, requestedWidth));
      setSourceWidth(clamped);
      setStoredPanelWidth("source", clamped);
    };

    const onMouseUp = () => {
      setIsDraggingSource(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        onMouseMove(e.touches[0]);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [isDraggingSource, docWidth, documentPanel]);

  // Keyboard accessibility handler for document panel resizer
  const handleDocKeyDown = (e) => {
    const step = e.shiftKey ? 30 : 15;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const currentSource = sourcePanel ? sourceWidth : 0;
      const maxAllowed = Math.min(MAX_PANEL_WIDTH, window.innerWidth - currentSource - MIN_CHAT_WIDTH);
      const next = Math.min(maxAllowed, docWidth + step);
      setDocWidth(next);
      setStoredPanelWidth("doc", next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const next = Math.max(MIN_PANEL_WIDTH, docWidth - step);
      setDocWidth(next);
      setStoredPanelWidth("doc", next);
    } else if (e.key === "Enter" || e.key === "Home") {
      e.preventDefault();
      setDocWidth(DEFAULT_DOC_WIDTH);
      setStoredPanelWidth("doc", DEFAULT_DOC_WIDTH);
    }
  };

  // Keyboard accessibility handler for sources panel resizer
  const handleSourceKeyDown = (e) => {
    const step = e.shiftKey ? 30 : 15;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const currentDoc = documentPanel ? docWidth : 0;
      const maxAllowed = Math.min(MAX_PANEL_WIDTH, window.innerWidth - currentDoc - MIN_CHAT_WIDTH);
      const next = Math.min(maxAllowed, sourceWidth + step);
      setSourceWidth(next);
      setStoredPanelWidth("source", next);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = Math.max(MIN_PANEL_WIDTH, sourceWidth - step);
      setSourceWidth(next);
      setStoredPanelWidth("source", next);
    } else if (e.key === "Enter" || e.key === "Home") {
      e.preventDefault();
      setSourceWidth(DEFAULT_SOURCE_WIDTH);
      setStoredPanelWidth("source", DEFAULT_SOURCE_WIDTH);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "var(--background)" }}>
      {header}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop persistent document sidebar */}
        {documentPanel && (
          <div
            className="hidden md:block shrink-0 border-r overflow-y-auto"
            style={{
              width: `${docWidth}px`,
              borderColor: "var(--border)",
            }}
          >
            {documentPanel}
          </div>
        )}

        {/* Adjustable divider between Document panel and Chat */}
        {resizable && documentPanel && (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize document panel"
            aria-valuenow={docWidth}
            aria-valuemin={MIN_PANEL_WIDTH}
            aria-valuemax={MAX_PANEL_WIDTH}
            title="Drag to resize panel (Double-click to reset)"
            onMouseDown={(e) => {
              e.preventDefault();
              startDocDrag(e.clientX);
            }}
            onTouchStart={(e) => {
              if (e.touches && e.touches[0]) startDocDrag(e.touches[0].clientX);
            }}
            onDoubleClick={() => {
              setDocWidth(DEFAULT_DOC_WIDTH);
              setStoredPanelWidth("doc", DEFAULT_DOC_WIDTH);
            }}
            onKeyDown={handleDocKeyDown}
            className={`hidden md:flex w-2.5 -ml-1.5 shrink-0 cursor-col-resize items-center justify-center relative select-none z-20 group transition-colors duration-micro focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              isDraggingDoc ? "bg-accent/20" : "hover:bg-accent/15"
            }`}
          >
            {/* Visual divider line */}
            <div
              className="w-[2px] h-full transition-colors duration-micro group-hover:bg-accent"
              style={{
                backgroundColor: isDraggingDoc ? "var(--accent)" : "transparent",
              }}
            />
            {/* Visual grip handle */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-7 rounded-full flex items-center justify-center shadow-md pointer-events-none transition-all duration-micro ${
                isDraggingDoc
                  ? "opacity-100 scale-105"
                  : "opacity-0 group-hover:opacity-100 group-focus:opacity-100"
              }`}
              style={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--accent)",
              }}
            >
              <GripVertical size={11} style={{ color: "var(--accent)" }} />
            </div>
          </div>
        )}

        {/* Chat -- always the dominant, full-height center column */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">{chatPanel}</main>

        {/* Adjustable divider between Chat and Sources panel */}
        {resizable && sourcePanel && (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize sources panel"
            aria-valuenow={sourceWidth}
            aria-valuemin={MIN_PANEL_WIDTH}
            aria-valuemax={MAX_PANEL_WIDTH}
            title="Drag to resize panel (Double-click to reset)"
            onMouseDown={(e) => {
              e.preventDefault();
              startSourceDrag(e.clientX);
            }}
            onTouchStart={(e) => {
              if (e.touches && e.touches[0]) startSourceDrag(e.touches[0].clientX);
            }}
            onDoubleClick={() => {
              setSourceWidth(DEFAULT_SOURCE_WIDTH);
              setStoredPanelWidth("source", DEFAULT_SOURCE_WIDTH);
            }}
            onKeyDown={handleSourceKeyDown}
            className={`hidden lg:flex w-2.5 -mr-1.5 shrink-0 cursor-col-resize items-center justify-center relative select-none z-20 group transition-colors duration-micro focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              isDraggingSource ? "bg-accent/20" : "hover:bg-accent/15"
            }`}
          >
            {/* Visual divider line */}
            <div
              className="w-[2px] h-full transition-colors duration-micro group-hover:bg-accent"
              style={{
                backgroundColor: isDraggingSource ? "var(--accent)" : "transparent",
              }}
            />
            {/* Visual grip handle */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-7 rounded-full flex items-center justify-center shadow-md pointer-events-none transition-all duration-micro ${
                isDraggingSource
                  ? "opacity-100 scale-105"
                  : "opacity-0 group-hover:opacity-100 group-focus:opacity-100"
              }`}
              style={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--accent)",
              }}
            >
              <GripVertical size={11} style={{ color: "var(--accent)" }} />
            </div>
          </div>
        )}

        {/* Desktop persistent sources panel */}
        {sourcePanel && (
          <div
            className="hidden lg:block shrink-0 border-l overflow-y-auto"
            style={{
              width: `${sourceWidth}px`,
              borderColor: "var(--border)",
            }}
          >
            {sourcePanel}
          </div>
        )}

        {/* Mobile/tablet: document drawer overlay */}
        {documentPanel && (
          <Drawer open={docPanelOpen} onClose={onCloseDocPanel} side="left" title="Document" className="md:hidden">
            {documentPanel}
          </Drawer>
        )}

        {/* Mobile/tablet: sources drawer overlay */}
        {sourcePanel && (
          <Drawer open={sourcePanelOpen} onClose={onCloseSourcePanel} side="right" title="Sources" className="lg:hidden">
            {sourcePanel}
          </Drawer>
        )}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, side, title, children, className }) {
  const isLeft = side === "left";

  return (
    <AnimatePresence>
      {open && (
        <div className={clsxRoot(className)}>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-30"
            aria-hidden="true"
          />
          {/* Panel */}
          <motion.div
            initial={{ x: isLeft ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isLeft ? "-100%" : "100%" }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed top-0 ${isLeft ? "left-0" : "right-0"} h-full w-[85%] max-w-sm z-40 flex flex-col`}
            style={{ backgroundColor: "var(--surface)" }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div
              className="flex items-center justify-between h-14 px-4 border-b shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-semibold text-sm">{title}</span>
              <IconButton aria-label={`Close ${title.toLowerCase()} panel`} onClick={onClose}>
                <X size={16} />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Tiny local helper so this file doesn't need a full clsx import just for one call
function clsxRoot(className) {
  return className || "";
}
