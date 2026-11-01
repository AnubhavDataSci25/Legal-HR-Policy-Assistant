import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  HelpCircle,
  ListChecks,
  RefreshCw,
  Scale,
  Sparkles,
} from "lucide-react";

/**
 * Renders an accordion section with a header, item count, and expandable body.
 */
function BriefSection({
  icon: Icon,
  title,
  count = 0,
  isOpen,
  onToggle,
  children,
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden transition-colors"
      style={{
        borderColor: isOpen ? "var(--border-strong)" : "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2.5 text-left transition-colors duration-micro hover:bg-white/[0.02]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} style={{ color: "var(--accent)" }} className="shrink-0" />
          <span className="text-xs font-semibold truncate text-text-primary">
            {title}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0"
            style={{
              backgroundColor: count > 0 ? "var(--accent-soft)" : "var(--surface-elevated)",
              color: count > 0 ? "var(--accent)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {count}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-text-muted shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-text-muted shrink-0" />
        )}
      </button>

      {isOpen && (
        <div
          className="p-3 pt-1 flex flex-col gap-2.5 border-t text-xs"
          style={{ borderColor: "var(--border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Small source page pill tag.
 */
function PageBadge({ page }) {
  if (page === null || page === undefined) return null;
  return (
    <span
      className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 font-mono"
      style={{
        backgroundColor: "var(--surface-hover)",
        color: "var(--accent)",
        border: "1px solid var(--border)",
      }}
      title={`Located on page ${page} of the source document`}
    >
      Page {page}
    </span>
  );
}

/**
 * Document Brief component: renders an executive summary and structured,
 * expandable findings (clauses, dates, financials, duties, risks, missing info)
 * immediately after document indexing.
 */
export default function DocumentBrief({
  brief,
  loading,
  error,
  onRetry,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({
    clauses: true,
    dates: true,
    financials: true,
    obligations: false,
    risks: false,
    unspecified: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const allOpen = Object.values(openSections).every(Boolean);
    const nextState = !allOpen;
    setOpenSections({
      clauses: nextState,
      dates: nextState,
      financials: nextState,
      obligations: nextState,
      risks: nextState,
      unspecified: nextState,
    });
  };

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div
        className="rounded-xl p-3.5 flex flex-col gap-3 border animate-pulse"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--accent)" }} className="animate-spin" />
            <span className="text-xs font-semibold text-text-primary">
              Generating Document Brief...
            </span>
          </div>
          <span className="text-[10px] text-text-muted">AI Analysis</span>
        </div>

        <div className="flex flex-col gap-2">
          <div
            className="h-3 rounded w-3/4"
            style={{ backgroundColor: "var(--surface-hover)" }}
          />
          <div
            className="h-2.5 rounded w-full"
            style={{ backgroundColor: "var(--surface-hover)" }}
          />
          <div
            className="h-2.5 rounded w-5/6"
            style={{ backgroundColor: "var(--surface-hover)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div
            className="h-8 rounded"
            style={{ backgroundColor: "var(--surface-hover)" }}
          />
          <div
            className="h-8 rounded"
            style={{ backgroundColor: "var(--surface-hover)" }}
          />
        </div>
        <p className="text-[11px] text-text-muted text-center mt-1">
          Extracting key clauses, deadlines, financial terms & obligations...
        </p>
      </div>
    );
  }

  // 2. Error State (non-blocking, with retry action)
  if (error) {
    return (
      <div
        className="rounded-xl p-3.5 flex flex-col gap-2.5 border"
        style={{
          backgroundColor: "var(--warning-soft)",
          borderColor: "var(--warning)",
        }}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={15}
            style={{ color: "var(--warning)" }}
            className="shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "var(--warning)" }}>
              Brief generation paused
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <RefreshCw size={12} />
          Retry Document Brief
        </button>
      </div>
    );
  }

  // 3. No brief available yet
  if (!brief) return null;

  const keyClauses = brief.key_clauses || [];
  const dates = brief.dates_and_deadlines || [];
  const amounts = brief.amounts_and_financial_terms || [];
  const obligations = brief.obligations || [];
  const risks = brief.risks_and_conditions || [];
  const unspecified = brief.unspecified_information || [];

  return (
    <div
      className="rounded-xl border flex flex-col gap-3 p-3.5 transition-all"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-strong)",
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Document Brief
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
            title={collapsed ? "Expand brief" : "Collapse brief"}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Executive Summary */}
          {brief.summary && (
            <div
              className="rounded-lg p-3 text-xs leading-relaxed border"
              style={{
                backgroundColor: "var(--accent-soft)",
                borderColor: "var(--border)",
              }}
            >
              <p className="font-semibold text-[11px] uppercase tracking-wide mb-1 text-accent">
                Executive Summary
              </p>
              <p className="text-text-primary">{brief.summary}</p>
            </div>
          )}

          {/* Quick toggle all */}
          <div className="flex justify-end -my-1">
            <button
              onClick={toggleAll}
              className="text-[10px] text-text-muted hover:text-accent transition-colors"
            >
              {Object.values(openSections).every(Boolean)
                ? "Collapse all sections"
                : "Expand all sections"}
            </button>
          </div>

          {/* Structured Sections */}
          <div className="flex flex-col gap-2">
            {/* 1. Key Clauses */}
            <BriefSection
              icon={Scale}
              title="Key Clauses"
              count={keyClauses.length}
              isOpen={openSections.clauses}
              onToggle={() => toggleSection("clauses")}
            >
              {keyClauses.length === 0 ? (
                <p className="text-text-muted italic">Not specified in the document</p>
              ) : (
                keyClauses.map((clause, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-surface-elevated/40 border border-border flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-text-primary text-[11px]">
                        {clause.title}
                      </span>
                      <PageBadge page={clause.page} />
                    </div>
                    <p className="text-text-secondary text-[11px] leading-relaxed">
                      {clause.description}
                    </p>
                    {clause.source_excerpt && (
                      <p className="text-[10px] text-text-muted italic border-l-2 pl-2 mt-0.5 border-accent/40">
                        "{clause.source_excerpt}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </BriefSection>

            {/* 2. Important Dates & Deadlines */}
            <BriefSection
              icon={Calendar}
              title="Dates & Deadlines"
              count={dates.length}
              isOpen={openSections.dates}
              onToggle={() => toggleSection("dates")}
            >
              {dates.length === 0 ? (
                <p className="text-text-muted italic">Not specified in the document</p>
              ) : (
                dates.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-surface-elevated/40 border border-border flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-text-primary text-[11px]">
                        {d.item}
                      </span>
                      <PageBadge page={d.page} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--surface-hover)",
                          color: "var(--accent)",
                        }}
                      >
                        {d.value}
                      </span>
                    </div>
                    {d.context && (
                      <p className="text-text-secondary text-[10px] mt-0.5">
                        {d.context}
                      </p>
                    )}
                  </div>
                ))
              )}
            </BriefSection>

            {/* 3. Amounts & Financial Terms */}
            <BriefSection
              icon={DollarSign}
              title="Amounts & Financial Terms"
              count={amounts.length}
              isOpen={openSections.financials}
              onToggle={() => toggleSection("financials")}
            >
              {amounts.length === 0 ? (
                <p className="text-text-muted italic">Not specified in the document</p>
              ) : (
                amounts.map((amt, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-surface-elevated/40 border border-border flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-text-primary text-[11px]">
                        {amt.item}
                      </span>
                      <PageBadge page={amt.page} />
                    </div>
                    <div>
                      <span
                        className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded text-success"
                        style={{ backgroundColor: "var(--success-soft)" }}
                      >
                        {amt.value}
                      </span>
                    </div>
                    {amt.context && (
                      <p className="text-text-secondary text-[10px] mt-0.5">
                        {amt.context}
                      </p>
                    )}
                  </div>
                ))
              )}
            </BriefSection>

            {/* 4. Obligations & Responsibilities */}
            <BriefSection
              icon={ListChecks}
              title="Obligations & Responsibilities"
              count={obligations.length}
              isOpen={openSections.obligations}
              onToggle={() => toggleSection("obligations")}
            >
              {obligations.length === 0 ? (
                <p className="text-text-muted italic">Not specified in the document</p>
              ) : (
                obligations.map((ob, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-surface-elevated/40 border border-border flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-surface-hover text-text-primary border border-border">
                        {ob.party}
                      </span>
                      <PageBadge page={ob.page} />
                    </div>
                    <p className="text-text-secondary text-[11px] mt-0.5 leading-relaxed">
                      {ob.obligation}
                    </p>
                  </div>
                ))
              )}
            </BriefSection>

            {/* 5. Potential Risks & Conditions */}
            <BriefSection
              icon={AlertTriangle}
              title="Risks & Conditions"
              count={risks.length}
              isOpen={openSections.risks}
              onToggle={() => toggleSection("risks")}
            >
              {risks.length === 0 ? (
                <p className="text-text-muted italic">Not specified in the document</p>
              ) : (
                risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-surface-elevated/40 border border-border flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-text-primary text-[11px]">
                        {risk.item}
                      </span>
                      <PageBadge page={risk.page} />
                    </div>
                    <p
                      className="text-[11px] leading-relaxed p-1.5 rounded"
                      style={{
                        backgroundColor: "var(--warning-soft)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {risk.condition}
                    </p>
                  </div>
                ))
              )}
            </BriefSection>

            {/* 6. Missing or Unspecified Information */}
            <BriefSection
              icon={HelpCircle}
              title="Unspecified Information"
              count={unspecified.length}
              isOpen={openSections.unspecified}
              onToggle={() => toggleSection("unspecified")}
            >
              {unspecified.length === 0 ? (
                <p className="text-text-muted italic">No notable omissions observed</p>
              ) : (
                unspecified.map((un, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-surface-elevated/40 border border-border flex flex-col gap-1"
                  >
                    <span className="font-semibold text-text-primary text-[11px]">
                      {un.item}
                    </span>
                    <p className="text-text-secondary text-[11px] leading-relaxed">
                      {un.description}
                    </p>
                  </div>
                ))
              )}
            </BriefSection>
          </div>
        </>
      )}
    </div>
  );
}
