import ChatHeader from "./ChatHeader";
import AssistantWelcome from "./AssistantWelcome";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import TypingIndicator from "./TypingIndicator";
import { useAutoScroll } from "../../hooks/useAutoScroll";

/**
 * Central chat surface. Composes the sticky contextual header, the
 * scrollable message list (with smart auto-scroll that doesn't yank
 * the user downward while reading history), and the loading state.
 */
export default function ChatWindow({ document, messages, loading, onReset, onSuggestionClick }) {
  const { containerRef, bottomRef } = useAutoScroll([messages, loading]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ChatHeader document={document} onReset={onReset} />

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-5">
        {!document && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-text-muted text-center max-w-xs">
              Upload a policy document to get started.
            </p>
          </div>
        )}

        {document && messages.length === 0 && !loading && (
          <AssistantWelcome chunksStored={document.chunks_stored} onSuggestionClick={onSuggestionClick} />
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage key={i} text={msg.text} />
          ) : (
            <AssistantMessage key={i} text={msg.text} confidence={msg.confidence} streaming={msg.streaming} />
          )
        )}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}