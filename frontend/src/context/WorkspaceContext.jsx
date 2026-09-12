import { createContext, useContext, useState } from "react";

const WorkspaceContext = createContext(null);

/**
 * Holds the active document and conversation state for the Workspace,
 * lifted above the router (see App.jsx) so it survives navigating away
 * to the Dashboard and back. Previously this state lived inside
 * WorkspacePage itself as local useState, which React destroys
 * completely whenever a route unmounts -- switching to Dashboard and
 * back via the plain "Workspace" nav link lost the uploaded document
 * every time.
 *
 * This state only ever clears when the user explicitly removes/replaces
 * the document (UploadPanel's "Upload another document" flow) or
 * resets the conversation (ChatHeader's reset button) -- never as a
 * side effect of navigating between pages.
 */
export function WorkspaceProvider({ children }) {
  const [document, setDocument] = useState(null); // { doc_id, filename, chunks_stored, uploadedAtLocal }
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [followupQuestions, setFollowupQuestions] = useState([]);

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