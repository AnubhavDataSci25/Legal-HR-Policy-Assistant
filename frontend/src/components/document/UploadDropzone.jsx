import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

/**
 * The empty-state dropzone. Handles drag-over visual feedback and
 * click-to-browse. Rendered only when no document is active or the
 * user has asked to replace the current one.
 */
export default function UploadDropzone({ onFileSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload a PDF document"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer text-center transition-all duration-standard ease-smooth py-12 px-5"
      style={{
        borderColor: isDragging ? "var(--accent)" : "var(--border)",
        backgroundColor: isDragging ? "var(--accent-soft)" : "var(--surface-elevated)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-standard"
        style={{
          backgroundColor: isDragging ? "var(--accent-soft)" : "var(--surface-hover)",
        }}
      >
        <UploadCloud size={22} style={{ color: "var(--accent)" }} />
      </div>

      <div>
        <p className="text-sm font-medium">Upload a document</p>
        <p className="text-xs text-text-muted mt-1 max-w-[220px] mx-auto">
          Drag and drop a PDF here, or click to browse
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFileSelected(e.target.files[0])}
      />
    </div>
  );
}