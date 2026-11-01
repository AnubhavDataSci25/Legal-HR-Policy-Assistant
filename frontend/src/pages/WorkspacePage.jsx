import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import AppShell from "../components/layout/AppShell";
import AppHeader from "../components/layout/AppHeader";
import UploadPanel from "../components/document/UploadPanel";
import ChatWindow from "../components/chat/ChatWindow";
import MessageInput from "../components/chat/MessageInput";
import FollowupChips from "../components/chat/FollowupChips";
import SourcePanel from "../components/source/SourcePanel";
import {
  askQuestion,
  askQuestionStream,
  getDocumentBrief,
  getFollowupQuestions,
} from "../services/api";
import { formatQueryError } from "../utils/formatError";
import { useWorkspace } from "../context/WorkspaceContext";
import {
  getRecentDocuments,
  upsertRecentDocument,
  recordLastQuestion,
  incrementQuestionCount,
  getStoredBrief,
  setStoredBrief,
} from "../utils/storage";

/**
 * WorkspacePage -- the core document Q&A experience: upload, document brief,
 * chat, and cited sources.
 *
 * State is stored in WorkspaceContext so navigating to the Dashboard and back
 * preserves the active document, conversation, and document brief.
 */
export default function WorkspacePage() {
  const location = useLocation();
  const {
    document, setDocument,
    messages, setMessages,
    sources, setSources,
    followupQuestions, setFollowupQuestions,
    brief, setBrief,
    briefLoading, setBriefLoading,
    briefError, setBriefError,
  } = useWorkspace();

  const [loading, setLoading] = useState(false);

  // Mobile/tablet drawer visibility
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);

  // Guards against a slow /followup response landing after the user moved on
  const followupRequestId = useRef(0);

  /**
   * Loads the Document Brief for the specified document ID.
   * Checks client-side localStorage cache first unless forceRefresh is true.
   * Non-blocking: failures display a retry button inside the brief panel
   * without blocking chat or ingestion.
   */
  const loadBrief = useCallback(async (docId, forceRefresh = false) => {
    if (!docId) return;

    if (!forceRefresh) {
      const cached = getStoredBrief(docId);
      if (cached) {
        setBrief(cached);
        setBriefLoading(false);
        setBriefError(null);
        return;
      }
    }

    setBriefLoading(true);
    setBriefError(null);

    try {
      const res = await getDocumentBrief(docId, forceRefresh);
      setBrief(res.data);
      setStoredBrief(docId, res.data);
      setBriefLoading(false);
    } catch (err) {
      console.error("Error loading document brief:", err);
      const message =
        err.response?.data?.detail ||
        "Could not generate document brief. Please check your network or try again.";
      setBriefError(message);
      setBriefLoading(false);
    }
  }, [setBrief, setBriefLoading, setBriefError]);

  // --- Dashboard integration: switch to a specific recent document -----
  useEffect(() => {
    const state = location.state;
    if (state?.intent === "continue" && state.docId && document?.doc_id !== state.docId) {
      const match = getRecentDocuments().find((d) => d.docId === state.docId);
      if (match) {
        setDocument({
          doc_id: match.docId,
          filename: match.filename,
          chunks_stored: match.chunksStored,
          uploadedAtLocal: match.uploadedAt,
        });
        setMessages([]);
        setSources([]);
        setFollowupQuestions([]);
        setBrief(null);
        loadBrief(match.docId);
      }
    }
  }, [location.state, document?.doc_id, setDocument, setMessages, setSources, setFollowupQuestions, setBrief, loadBrief]);

  // Automatically trigger brief generation if a document is active but has no brief yet
  useEffect(() => {
    if (document?.doc_id && !brief && !briefLoading && !briefError) {
      loadBrief(document.doc_id);
    }
  }, [document?.doc_id, brief, briefLoading, briefError, loadBrief]);

  const handleIngested = (docInfo) => {
    setDocument(docInfo);
    setMessages([]); // fresh conversation for the newly indexed document
    setSources([]);
    setFollowupQuestions([]);
    setDocPanelOpen(false);
    upsertRecentDocument(docInfo);
    setBrief(null);
    loadBrief(docInfo.doc_id);
  };

  const handleReset = () => {
    setMessages([]);
    setSources([]);
    setFollowupQuestions([]);
  };

  /**
   * Updates the text of the currently-streaming assistant message.
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

  const recordForDashboard = (question, newSources) => {
    recordLastQuestion(document.doc_id, question, newSources?.[0]?.page_num ?? null);
    incrementQuestionCount();
  };

  /**
   * Fetches follow-up suggestions for the answer that was just given.
   */
  const fetchFollowups = async (question, answer, confidence, requestId) => {
    if (confidence === "low") return;
    const questions = await getFollowupQuestions(document.doc_id, question, answer);
    if (requestId === followupRequestId.current) {
      setFollowupQuestions(questions);
    }
  };

  /**
   * Falls back to the original, non-streaming /query endpoint.
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

    const timestamp = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: `user-${timestamp}`, role: "user", text: question },
      { id: `asst-${timestamp + 1}`, role: "assistant", text: "", streaming: true },
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
          toast.error("The response was interrupted. Please try again.");
          finalizeStreamingMessage({ confidence: "low" });
          setLoading(false);
          return;
        }
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
      documentPanel={
        <UploadPanel
          document={document}
          onIngested={handleIngested}
          brief={brief}
          briefLoading={briefLoading}
          briefError={briefError}
          onRetryBrief={() => document?.doc_id && loadBrief(document.doc_id, true)}
        />
      }
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
      sourcePanel={<SourcePanel sources={sources} hasDocument={!!document} docId={document?.doc_id} />}
      docPanelOpen={docPanelOpen}
      sourcePanelOpen={sourcePanelOpen}
      onCloseDocPanel={() => setDocPanelOpen(false)}
      onCloseSourcePanel={() => setSourcePanelOpen(false)}
    />
  );
}
