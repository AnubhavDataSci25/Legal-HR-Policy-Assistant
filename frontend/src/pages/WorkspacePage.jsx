import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import AppHeader from "../components/layout/AppHeader";
import UploadPanel from "../components/document/UploadPanel";
import ChatWindow from "../components/chat/ChatWindow";
import MessageInput from "../components/chat/MessageInput";
import SourcePanel from "../components/source/SourcePanel";
import { askQuestion, askQuestionStream } from "../services/api";
import { formatQueryError } from "../utils/formatError";
import {
  getRecentDocuments,
  upsertRecentDocument,
  recordLastQuestion,
  incrementQuestionCount,
} from "../utils/storage";

/**
 * WorkspacePage -- the core document Q&A experience: upload, chat, and
 * cited sources. This is the same logic and layout that used to live
 * directly in App.jsx, plus two small additions for the Dashboard
 * feature (both clearly marked below):
 *
 *   1. On mount, if the Dashboard sent us here to continue a specific
 *      recent document (via navigation state), restore that document's
 *      context instead of showing the upload prompt. A fresh, direct
 *      visit to /workspace (no state) behaves exactly as before --
 *      nothing changes for that case.
 *   2. Successful uploads/answers are recorded via utils/storage.js so
 *      the Dashboard has real data to show. This does not affect the
 *      request/response flow itself in any way.
 */
export default function WorkspacePage() {
  const location = useLocation();

  const [document, setDocument] = useState(null); // { doc_id, filename, chunks_stored, uploadedAtLocal }
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mobile/tablet drawer visibility (desktop ignores these -- see AppShell)
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);

  // --- Dashboard integration: restore a specific recent document -------
  // Only happens when arriving here via a Dashboard "Continue"/"Open"
  // click (navigation state carries the intent + docId). A plain visit
  // to /workspace with no state is completely unaffected.
  useEffect(() => {
    const state = location.state;
    if (state?.intent === "continue" && state.docId) {
      const match = getRecentDocuments().find((d) => d.docId === state.docId);
      if (match) {
        setDocument({
          doc_id: match.docId,
          filename: match.filename,
          chunks_stored: match.chunksStored,
          uploadedAtLocal: match.uploadedAt,
        });
      }
    }
    // Only ever needs to run once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIngested = (docInfo) => {
    setDocument(docInfo);
    setMessages([]); // fresh conversation for the newly indexed document
    setSources([]);
    setDocPanelOpen(false);
    upsertRecentDocument(docInfo); // Dashboard integration -- record for "Recent Documents"
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

  // Dashboard integration -- records the question so "Continue where you
  // left off" and the "Questions asked" stat have real data.
  const recordForDashboard = (question, newSources) => {
    recordLastQuestion(document.doc_id, question, newSources?.[0]?.page_num ?? null);
    incrementQuestionCount();
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
      recordForDashboard(question, newSources);
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
        recordForDashboard(question, newSources);
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