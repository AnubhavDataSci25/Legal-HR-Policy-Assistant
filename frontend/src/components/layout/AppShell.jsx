import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import IconButton from "../common/IconButton";

/**
 * Owns the three-column desktop layout (document | chat | sources) and
 * degrades it into overlay drawers below the `lg` breakpoint, per the
 * design plan's responsive strategy:
 *   - Desktop (lg+): all three columns persistent.
 *   - Below lg: document + source panels become slide-in drawers,
 *     chat takes the full remaining width.
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
}) {
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "var(--background)" }}>
      {header}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop persistent document sidebar -- only rendered when a
            documentPanel is actually provided (workspace pages only) */}
        {documentPanel && (
          <div
            className="hidden md:block w-80 shrink-0 border-r overflow-y-auto"
            style={{ borderColor: "var(--border)" }}
          >
            {documentPanel}
          </div>
        )}

        {/* Chat -- always the dominant, full-height center column */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">{chatPanel}</main>

        {/* Desktop persistent sources panel -- same conditional rendering */}
        {sourcePanel && (
          <div
            className="hidden lg:block w-80 shrink-0 border-l overflow-y-auto"
            style={{ borderColor: "var(--border)" }}
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