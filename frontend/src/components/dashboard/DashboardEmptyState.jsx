import { FileUp } from "lucide-react";
import Button from "../common/Button";

export default function DashboardEmptyState({ onUpload }) {
  return (
    <div
      className="rounded-xl p-10 flex flex-col items-center text-center gap-3"
      style={{ backgroundColor: "var(--surface-elevated)", border: "1px dashed var(--border-strong)" }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--accent-soft)" }}
      >
        <FileUp size={20} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold">No documents yet</p>
        <p className="text-sm text-text-muted mt-1 max-w-xs">
          Upload your first PDF and start asking questions.
        </p>
      </div>
      <Button variant="primary" onClick={onUpload} className="mt-2">
        Upload PDF
      </Button>
    </div>
  );
}