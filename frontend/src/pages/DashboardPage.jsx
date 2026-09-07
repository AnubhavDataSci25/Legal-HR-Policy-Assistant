import { FileUp, MessageSquareText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import AppHeader from "../components/layout/AppHeader";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import OverviewStat from "../components/dashboard/OverviewStat";
import RecentDocumentCard from "../components/dashboard/RecentDocumentCard";
import ContinueCard from "../components/dashboard/ContinueCard";
import DashboardEmptyState from "../components/dashboard/DashboardEmptyState";
import { getRecentDocuments, getQuestionCount } from "../utils/storage";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The landing page. Deliberately scoped to only what real, locally-known
 * data can support right now:
 *   - Recent Documents (from the /ingest response, cached in localStorage)
 *   - A "Continue where you left off" card (only when a last question
 *     is actually on record)
 *   - Two Overview stats (Documents, Questions asked) -- no Conversations
 *     or Bookmarks stat, since those features don't exist yet and showing
 *     a fake "0" for them would be misleading rather than useful.
 *
 * Reuses AppShell/AppHeader exactly as the Workspace does, just without
 * the document/source side panels -- AppShell only renders those columns
 * when they're actually provided, so this page gets a single full-width
 * scrollable content column instead.
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const recentDocuments = getRecentDocuments();
  const questionCount = getQuestionCount();
  const activeDocument = recentDocuments[0] || null;
  const hasDocuments = recentDocuments.length > 0;

  const goToWorkspace = (docId) => {
    if (docId) {
      navigate("/workspace", { state: { intent: "continue", docId } });
    } else {
      navigate("/workspace", { state: { intent: "upload" } });
    }
  };

  return (
    <AppShell
      header={<AppHeader />}
      chatPanel={
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
            {/* Greeting */}
            <div>
              <h1 className="text-xl font-bold">{getGreeting()} 👋</h1>
              <p className="text-sm text-text-muted mt-1">
                Continue your document research or upload a new policy to get started.
              </p>
            </div>

            {!hasDocuments ? (
              <DashboardEmptyState onUpload={() => goToWorkspace()} />
            ) : (
              <>
                {/* Quick action */}
                <QuickActionCard
                  icon={FileUp}
                  label="Upload a document"
                  description="Add a new policy, contract, or handbook"
                  primary
                  onClick={() => goToWorkspace()}
                />

                {/* Continue where you left off -- only when real data exists */}
                {activeDocument?.lastQuestion && (
                  <ContinueCard
                    document={activeDocument}
                    onContinue={() => goToWorkspace(activeDocument.docId)}
                  />
                )}

                {/* Overview -- only metrics we actually have real numbers for */}
                <div className="grid grid-cols-2 gap-3">
                  <OverviewStat label="Documents" value={recentDocuments.length} icon={FileUp} />
                  <OverviewStat label="Questions asked" value={questionCount} icon={MessageSquareText} />
                </div>

                {/* Recent documents */}
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                    Recent Documents
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recentDocuments.map((doc) => (
                      <RecentDocumentCard
                        key={doc.docId}
                        document={doc}
                        onOpen={() => goToWorkspace(doc.docId)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      }
    />
  );
}