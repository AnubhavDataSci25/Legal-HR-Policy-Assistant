import { useRef, useState } from "react";
import { FileText, RotateCcw, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { uploadDocument } from "../../services/api";

/**
 * Upload Panel -- drag & drop zone, browse button, progress bar,
 * file details, and re-upload action. Calls POST /ingest (Phase 1
 * backend) and hands the resulting doc_id back up via onIngested.
 */
export default function UploadPanel({ onIngested }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (selected) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }

    setFile(selected);
    setStatus("uploading");
    setProgress(0);

    try {
      const res = await uploadDocument(selected, setProgress);
      setStatus("done");
      toast.success(`Document ready — ${res.data.chunks_stored} chunks indexed.`);
      onIngested?.(res.data);
    } catch (err) {
      setStatus("error");
      const message = err.response?.data?.detail || "Upload failed. Please try again.";
      toast.error(message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <h3 className="text-base font-semibold">Document</h3>

      {status !== "done" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload a PDF document"
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer py-10 px-4 text-center transition"
          style={{
            borderColor: isDragging ? "var(--color-primary)" : "var(--color-border)",
            backgroundColor: isDragging ? "var(--color-background)" : "transparent",
          }}
        >
          <Upload size={28} style={{ color: "var(--color-primary)" }} />
          <p className="text-small font-medium">Drag & drop a PDF here</p>
          <p className="text-small opacity-70">or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--color-background)" }}>
          <FileText size={20} style={{ color: "var(--color-success)" }} className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-small font-medium truncate">{file?.name}</p>
            <p className="text-small opacity-70">Indexed and ready for questions</p>
          </div>
          <button
            onClick={reset}
            aria-label="Upload another document"
            className="p-1.5 rounded-md hover:opacity-70"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}

      {status === "uploading" && (
        <div className="flex flex-col gap-1">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%`, backgroundColor: "var(--color-primary)" }}
            />
          </div>
          <span className="text-small opacity-70">{progress}% uploaded</span>
        </div>
      )}
    </div>
  );
}