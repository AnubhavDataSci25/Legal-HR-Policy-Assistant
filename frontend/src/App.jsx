import { useState } from "react";
import toast from "react-hot-toast";

import AppShell from "@/components/layout/AppShell";
import AppHeader from "@/components/layout/AppHeader";
import UploadPanel from "@/components/document/UploadPanel";
import ChatWindow from "@/components/chat/ChatWindow";
import MessageInput from "@/components/chat/MessageInput";
import SourcePanel from "@/components/source/SourcePanel";
import { askQuestion, askQuestionStream } from "./services/api";
import { formatQueryError } from "./utils/formatError";

export default function App() {
  const [document, setDocument] = useState(null); // { doc_id, filename, chunks_stored, uploadedAtLocal }
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mobile/tablet drawer visibility (desktop ignores these -- see AppShell)
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);

  const handleIngested = (docInfo) => {
    setDocument(docInfo);
    setMessages([]); // fresh conversation for the newly indexed document
    setSources([]);
    setDocPanelOpen(false);
  };

  const handleReset = () => {
    setMessages([]);
    setSources([]);
  };

  /**
   * Updates the text of the currently-streaming assistant message (always
   * the last item in the list -- MessageInput is disabled while a request
   * is in flight, so there's never more than one in-progress answer).
   */
  const appendToStreamingMessage = (chunk) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = { ...updated[lastIndex], text: updated[lastIndex].text + chunk };
      return updated;
    });
  };

  const finalizeStreamingMessage = (patch) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = { ...updated[lastIndex], ...patch, streaming: false };
      return updated;
    });
  };

  /**
   * Falls back to the original, non-streaming /query endpoint. Used only
   * when the stream fails before any text has arrived, so a hiccup in the
   * new streaming path can never make the assistant fail to answer at all
   * -- worst case, it just degrades to the previous, proven behavior.
   */
  const askViaFallback = async (question) => {
    try {
      const res = await askQuestion(document.doc_id, question);
      const { answer, sources: newSources, confidence } = res.data;
      finalizeStreamingMessage({ text: answer, confidence });
      setSources(newSources || []);
    } catch (err) {
      const message = formatQueryError(err);
      toast.error(message);
      finalizeStreamingMessage({
        text: "I ran into an error answering that. Please try again.",
        confidence: "low",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (question) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "assistant", text: "", streaming: true },
    ]);
    setLoading(true);

    let receivedAnyToken = false;

    await askQuestionStream(document.doc_id, question, {
      onToken: (chunk) => {
        receivedAnyToken = true;
        setLoading(false); // first token arrived -- swap the "Thinking" indicator for real text
        appendToStreamingMessage(chunk);
      },
      onComplete: ({ sources: newSources, confidence }) => {
        setLoading(false);
        finalizeStreamingMessage({ confidence });
        setSources(newSources || []);
      },
      onError: async (err) => {
        if (receivedAnyToken) {
          // Answer was partway through -- keep the partial text visible
          // rather than discarding it, and flag it so the person knows
          // it may be incomplete.
          toast.error("The response was interrupted. Please try again.");
          finalizeStreamingMessage({ confidence: "low" });
          setLoading(false);
          return;
        }
        // Nothing streamed yet -- silently degrade to the reliable,
        // non-streaming endpoint instead of surfacing an error.
        await askViaFallback(question);
      },
    });
  };

  return (
    <AppShell
      header={
        <AppHeader
          hasDocument={!!document}
          onToggleDocPanel={() => setDocPanelOpen((v) => !v)}
          onToggleSourcePanel={() => setSourcePanelOpen((v) => !v)}
        />
      }
      documentPanel={<UploadPanel document={document} onIngested={handleIngested} />}
      chatPanel={
        <>
          <ChatWindow
            document={document}
            messages={messages}
            loading={loading}
            onReset={handleReset}
            onSuggestionClick={handleAsk}
          />
          {document && <MessageInput onSend={handleAsk} disabled={loading} />}
        </>
      }
      sourcePanel={<SourcePanel sources={sources} hasDocument={!!document} />}
      docPanelOpen={docPanelOpen}
      sourcePanelOpen={sourcePanelOpen}
      onCloseDocPanel={() => setDocPanelOpen(false)}
      onCloseSourcePanel={() => setSourcePanelOpen(false)}
    />
  );
}