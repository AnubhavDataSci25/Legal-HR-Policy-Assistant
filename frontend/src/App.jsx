import { useState } from "react";
import Navbar from "./components/layout/Navbar";
import UploadPanel from "./components/upload/UploadPanel";

export default function App() {
  const [document, setDocument] = useState(null); // { doc_id, filename, chunks_stored }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Upload & document management (Phase 1) */}
        <aside className="w-80 shrink-0 border-r p-4" style={{ borderColor: "var(--color-border)" }}>
          <UploadPanel onIngested={setDocument} />
        </aside>

        {/* Center: Chat window -- built in Phase 2/3 once /query exists */}
        <main className="flex-1 flex items-center justify-center p-6">
          {document ? (
            <p className="text-small opacity-70 text-center max-w-sm">
              "{document.filename}" is indexed ({document.chunks_stored} chunks).
              <br />
              Chat interface arrives in the next phase.
            </p>
          ) : (
            <p className="text-small opacity-70 text-center max-w-sm">
              Upload a policy document on the left to get started.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}