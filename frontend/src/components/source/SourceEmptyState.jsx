import { FileSearch } from "lucide-react";

export default function SourceEmptyState({ hasDocument }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-4">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--surface-hover)" }}
      >
        <FileSearch size={18} style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-sm text-text-muted max-w-[200px]">
        {hasDocument
          ? "Sources will appear here when the assistant answers from the document."
          : "Upload a document to see cited sources here."}
      </p>
    </div>
  );
}