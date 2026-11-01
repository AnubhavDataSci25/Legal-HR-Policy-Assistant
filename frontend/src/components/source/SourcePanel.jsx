import { useState } from "react";
import SourceCard from "./SourceCard";
import SourceEmptyState from "./SourceEmptyState";
import SourceViewer from "./SourceViewer";

/**
 * Right-hand citation panel. Rendered inside AppShell's persistent
 * lg+ column and reused inside the mobile drawer.
 *
 * Accepts docId prop to enable click-to-view page modal with citation highlight.
 */
export default function SourcePanel({ sources, hasDocument, docId }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeViewerIndex, setActiveViewerIndex] = useState(0);

  const handleOpenViewer = (index) => {
    setActiveViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="p-4 flex flex-col gap-3 h-full">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide sticky top-0">
        Sources
      </h2>

      {(!sources || sources.length === 0) ? (
        <SourceEmptyState hasDocument={hasDocument} />
      ) : (
        <div className="flex flex-col gap-2">
          {sources.map((source, i) => (
            <SourceCard
              key={i}
              source={source}
              index={i}
              onViewPage={docId ? handleOpenViewer : undefined}
            />
          ))}
        </div>
      )}

      {/* Page Viewer Modal */}
      {hasDocument && docId && (
        <SourceViewer
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          docId={docId}
          sources={sources || []}
          index={activeViewerIndex}
          onNavigate={(newIdx) => setActiveViewerIndex(newIdx)}
        />
      )}
    </div>
  );
}
