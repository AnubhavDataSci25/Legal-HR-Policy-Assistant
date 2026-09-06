import { useState } from "react";
import { Send } from "lucide-react";
import { MAX_QUESTION_LENGTH } from "../../constants/ui";

/**
 * Modern AI-chat composer. Enter sends, Shift+Enter inserts a newline,
 * empty/whitespace-only input can't submit, and the whole control
 * disables while a request is in flight.
 */
export default function MessageInput({ onSend, disabled, value, onChange }) {
  const [internalText, setInternalText] = useState("");
  const isControlled = value !== undefined;
  const text = isControlled ? value : internalText;
  const setText = isControlled ? onChange : setInternalText;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 pt-2 shrink-0">
      <div
        className="flex items-end gap-2 rounded-xl px-3 py-2.5 transition-colors duration-standard"
        style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the document..."
          rows={1}
          disabled={disabled}
          aria-label="Ask a question"
          className="flex-1 resize-none bg-transparent outline-none text-sm py-1.5 max-h-32 placeholder:text-text-muted"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Send question"
          className="p-2.5 rounded-lg shrink-0 transition-all duration-micro disabled:opacity-40 active:scale-95"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Send size={16} color="#FFFFFF" />
        </button>
      </div>
      <div className="flex justify-between px-1 pt-1.5">
        <span className="text-xs text-text-muted hidden sm:block">
          Enter to send · Shift+Enter for a new line
        </span>
        <span className="text-xs text-text-muted ml-auto">
          {text.length}/{MAX_QUESTION_LENGTH}
        </span>
      </div>
    </div>
  );
}