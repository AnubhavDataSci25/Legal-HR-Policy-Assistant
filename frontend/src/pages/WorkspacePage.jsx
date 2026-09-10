import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import AppHeader from "../components/layout/AppHeader";
import UploadPanel from "../components/document/UploadPanel";
import ChatWindow from "../components/chat/ChatWindow";
import MessageInput from "../components/chat/MessageInput";
import FollowupChips from "../components/chat/FollowupChips";
import SourcePanel from "../components/source/SourcePanel";
import { askQuestion, askQuestionStream, getFollowupQuestions } from "../services/api";
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
 * directly in App.jsx, plus small additions from later features (each
 * clearly marked below):
 *
 *   1. Dashboard integration -- restoring a specific recent document on
 *      arrival, and recording uploads/answers via utils/storage.js.
 *   2. Follow-up questions -- after each successful, confident answer,
 *      fetches up to 3 on-topic follow-up suggestions and shows them as
 *      chips above the input. Fails silently if generation doesn't
 *      succeed (see services/api.js getFollowupQuestions), so it can
 *      never disrupt the core chat flow.
 */
export default function WorkspacePage() {
  const location = useLocation();

  const [document, setDocument] = useState(null); // { doc_id, filename, chunks_stored, uploadedAtLocal }
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followupQuestions, setFollowupQuestions] = useState([]);

  // Mobile/tablet drawer visibility (desktop ignores these -- see AppShell)
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);

  // Guards against a slow /followup response landing after the user has
  // already moved on to a newer question -- only the most recent request's
  // result is ever applied.
  const followupRequestId = useRef(0);

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
    setFollowupQuestions([]);
    setDocPanelOpen(false);
    upsertRecentDocument(docInfo); // Dashboard integration -- record for "Recent Documents"
  };

  const handleReset = () => {
    setMessages([]);
    setSources([]);
    setFollowupQuestions([]);
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
   * Fetches follow-up suggestions for the answer that was just given.
   * Skipped for low-confidence answers -- suggesting "next questions"
   * right after the assistant admits it doesn't know the current one
   * would be more confusing than helpful. Guarded by requestId so a
   * response for an older question can never overwrite newer chips.
   */
  const fetchFollowups = async (question, answer, confidence, requestId) => {
    if (confidence === "low") return;
    const questions = await getFollowupQuestions(document.doc_id, question, answer);
    if (requestId === followupRequestId.current) {
      setFollowupQuestions(questions);
    }
  };

  /**
   * Falls back to the original, non-streaming /query endpoint. Used only
   * when the stream fails before any text has arrived, so a hiccup in the
   * new streaming path can never make the assistant fail to answer at all
   * -- worst case, it just degrades to the previous, proven behavior.
   */
  const askViaFallback = async (question, requestId) => {
    try {
      const res = await askQuestion(document.doc_id, question);
      const { answer, sources: newSources, confidence } = res.data;
      finalizeStreamingMessage({ text: answer, confidence });
      setSources(newSources || []);
      recordForDashboard(question, newSources);
      fetchFollowups(question, answer, confidence, requestId);
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
    const requestId = ++followupRequestId.current;
    setFollowupQuestions([]); // clear last turn's suggestions immediately

    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "assistant", text: "", streaming: true },
    ]);
    setLoading(true);

    let receivedAnyToken = false;
    let streamedAnswerText = "";

    await askQuestionStream(document.doc_id, question, {
      onToken: (chunk) => {
        receivedAnyToken = true;
        streamedAnswerText += chunk;
        setLoading(false); // first token arrived -- swap the "Thinking" indicator for real text
        appendToStreamingMessage(chunk);
      },
      onComplete: ({ sources: newSources, confidence }) => {
        setLoading(false);
        finalizeStreamingMessage({ confidence });
        setSources(newSources || []);
        recordForDashboard(question, newSources);
        fetchFollowups(question, streamedAnswerText, confidence, requestId);
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
        await askViaFallback(question, requestId);
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
          {document && (
            <>
              <FollowupChips questions={followupQuestions} onSelect={handleAsk} />
              <MessageInput onSend={handleAsk} disabled={loading} />
            </>
          )}
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