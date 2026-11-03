import { createContext, useContext, useState } from "react";

const WorkspaceContext = createContext(null);

/**
 * Holds the active document and conversation state for the Workspace,
 * lifted above the router (see App.jsx) so it survives navigating away
 * to the Dashboard and back.
 *
 * Also holds the Document Brief state (generated upon upload / indexing),
 * including loading and error states for non-blocking UI rendering.
 */
export function WorkspaceProvider({ children }) {
  const [document, setDocument] = useState(null); // { doc_id, filename, chunks_stored, uploadedAtLocal }
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [followupQuestions, setFollowupQuestions] = useState([]);
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState(null);

  /**
   * Resets active document and conversation state from memory.
   * If docId is passed, only resets if the active document matches docId.
   */
  const clearWorkspace = (docId = null) => {
    if (!docId || document?.doc_id === docId) {
      setDocument(null);
      setMessages([]);
      setSources([]);
      setFollowupQuestions([]);
      setBrief(null);
      setBriefLoading(false);
      setBriefError(null);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        document,
        setDocument,
        messages,
        setMessages,
        sources,
        setSources,
        followupQuestions,
        setFollowupQuestions,
        brief,
        setBrief,
        briefLoading,
        setBriefLoading,
        briefError,
        setBriefError,
        clearWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
