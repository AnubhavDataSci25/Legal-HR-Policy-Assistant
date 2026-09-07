export default function OverviewStat({ label, value, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--accent-soft)" }}
      >
        <Icon size={16} style={{ color: "var(--accent)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}