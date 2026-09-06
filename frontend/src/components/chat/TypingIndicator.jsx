import { Bot } from "lucide-react";

/**
 * Conversational loading state shown between question submission and
 * answer arrival. Appears immediately (before the network call resolves)
 * so the interface always acknowledges the user's action right away.
 */
export default function TypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite" aria-busy="true">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
      >
        <Bot size={15} style={{ color: "var(--accent)" }} />
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
      >
        <span className="text-sm text-text-secondary">Thinking</span>
        <span className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
              style={{ backgroundColor: "var(--text-muted)", animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}