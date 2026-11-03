import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  Check,
  Moon,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useTheme } from "../../hooks/useTheme";
import { useSettings } from "../../context/SettingsContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { clearRecentDocuments, resetQuestionCount } from "../../utils/storage";

export default function SettingsDropdown({ open, onClose, triggerRef }) {
  const location = useLocation();
  const dropdownRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const { theme, setTheme } = useTheme();
  const {
    answerStyle,
    setAnswerStyle,
    topSources,
    setTopSources,
    showScores,
    setShowScores,
  } = useSettings();
  const { setMessages, setSources, setFollowupQuestions, clearWorkspace } = useWorkspace();

  const [confirmingAction, setConfirmingAction] = useState(null); // 'recentDocs' | 'chatHistory' | 'stats' | null

  // Close on route change
  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on outside click or Esc
  useEffect(() => {
    if (!open) {
      setConfirmingAction(null);
      return;
    }

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Initial focus on open
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, triggerRef]);

  const handleClearRecentDocs = () => {
    if (confirmingAction !== "recentDocs") {
      setConfirmingAction("recentDocs");
      return;
    }
    clearRecentDocuments();
    clearWorkspace();
    setConfirmingAction(null);
    toast.success("Recent documents cleared");
  };

  const handleClearChatHistory = () => {
    if (confirmingAction !== "chatHistory") {
      setConfirmingAction("chatHistory");
      return;
    }
    setMessages([]);
    setSources([]);
    setFollowupQuestions([]);
    setConfirmingAction(null);
    toast.success("Chat history cleared");
  };

  const handleResetStats = () => {
    if (confirmingAction !== "stats") {
      setConfirmingAction("stats");
      return;
    }
    resetQuestionCount();
    setConfirmingAction(null);
    toast.success("Usage statistics reset");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          role="dialog"
          aria-label="Settings"
          aria-modal="false"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-4 md:right-6 top-16 mt-2 w-84 sm:w-96 rounded-2xl p-5 shadow-2xl z-50 overflow-y-auto max-h-[calc(100vh-5rem)] border select-none"
          style={{
            backgroundColor: "var(--surface-elevated)",
            borderColor: "var(--border-strong)",
            color: "var(--text-primary)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-bold tracking-tight">Settings</h2>
            </div>
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-5 text-xs">
            {/* 1. Appearance */}
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                Appearance
              </span>
              <div
                className="grid grid-cols-3 p-1 rounded-xl border gap-1"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                role="radiogroup"
                aria-label="Appearance theme"
              >
                {[
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: SlidersHorizontal },
                ].map(({ id, label, icon: Icon }) => {
                  const isActive = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setTheme(id)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive
                          ? "bg-[var(--surface-elevated)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                          : "text-text-muted hover:text-text-primary hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <Icon size={13} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Answer Style */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                  Answer style
                </span>
                <span className="text-text-muted text-[11px]">
                  Concise (2–4 sentences) or thorough structured answers
                </span>
              </div>
              <div
                className="grid grid-cols-2 p-1 rounded-xl border gap-1"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                role="radiogroup"
                aria-label="Answer style"
              >
                {[
                  { id: "concise", label: "Concise" },
                  { id: "detailed", label: "Detailed" },
                ].map(({ id, label }) => {
                  const isActive = answerStyle === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setAnswerStyle(id)}
                      className={`py-1.5 rounded-lg font-medium text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive
                          ? "bg-[var(--surface-elevated)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                          : "text-text-muted hover:text-text-primary hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Sources to retrieve */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                  Sources to retrieve
                </span>
                <span className="text-text-muted text-[11px]">
                  Number of relevant citation excerpts per answer
                </span>
              </div>
              <div
                className="grid grid-cols-3 p-1 rounded-xl border gap-1"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                role="radiogroup"
                aria-label="Sources to retrieve"
              >
                {[3, 5, 7].map((count) => {
                  const isActive = topSources === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setTopSources(count)}
                      className={`py-1.5 rounded-lg font-medium text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive
                          ? "bg-[var(--surface-elevated)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                          : "text-text-muted hover:text-text-primary hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Show confidence scores toggle */}
            <div
              className="flex items-center justify-between p-3 rounded-xl border"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex flex-col pr-2">
                <span className="font-medium text-text-primary text-[12px]">
                  Show confidence scores
                </span>
                <span className="text-text-muted text-[11px]">
                  Display relevance percentage on source cards
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showScores}
                aria-label="Toggle confidence scores"
                onClick={() => setShowScores(!showScores)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  showScores ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showScores ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 5. Clear data */}
            <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                Clear Data
              </span>

              <div className="flex flex-col gap-1.5">
                {/* Clear recent documents */}
                <div className="flex items-center justify-between gap-2">
                  {confirmingAction === "recentDocs" ? (
                    <div className="flex items-center gap-1.5 w-full animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={handleClearRecentDocs}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-danger hover:bg-danger/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        Confirm clear recent documents
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingAction(null)}
                        className="py-1.5 px-2.5 rounded-lg text-xs border text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        style={{ borderColor: "var(--border)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearRecentDocs}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-left border hover:bg-surface-hover text-text-secondary hover:text-danger hover:border-danger/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                    >
                      <span className="font-medium text-xs">Clear recent documents</span>
                      <Trash2 size={13} className="shrink-0 text-text-muted" />
                    </button>
                  )}
                </div>

                {/* Clear chat history */}
                <div className="flex items-center justify-between gap-2">
                  {confirmingAction === "chatHistory" ? (
                    <div className="flex items-center gap-1.5 w-full animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={handleClearChatHistory}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-danger hover:bg-danger/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        Confirm clear chat history
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingAction(null)}
                        className="py-1.5 px-2.5 rounded-lg text-xs border text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        style={{ borderColor: "var(--border)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearChatHistory}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-left border hover:bg-surface-hover text-text-secondary hover:text-danger hover:border-danger/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                    >
                      <span className="font-medium text-xs">Clear chat history</span>
                      <Trash2 size={13} className="shrink-0 text-text-muted" />
                    </button>
                  )}
                </div>

                {/* Reset stats */}
                <div className="flex items-center justify-between gap-2">
                  {confirmingAction === "stats" ? (
                    <div className="flex items-center gap-1.5 w-full animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={handleResetStats}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-danger hover:bg-danger/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        Confirm reset stats
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingAction(null)}
                        className="py-1.5 px-2.5 rounded-lg text-xs border text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        style={{ borderColor: "var(--border)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetStats}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-left border hover:bg-surface-hover text-text-secondary hover:text-danger hover:border-danger/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                    >
                      <span className="font-medium text-xs">Reset stats</span>
                      <RotateCcw size={13} className="shrink-0 text-text-muted" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
