import SourceCard from "./SourceCard";
import SourceEmptyState from "./SourceEmptyState";

/**
 * Right-hand citation panel. Rendered inside AppShell's persistent
 * lg+ column and reused inside the mobile drawer -- identical content,
 * different container.
 */
export default function SourcePanel({ sources, hasDocument }) {
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
            <SourceCard key={i} source={source} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}