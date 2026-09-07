import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import WorkspacePage from "../pages/WorkspacePage";

/**
 * Central route table. New pages from later features (Documents,
 * Conversations, Bookmarks, Settings) get added here as additional
 * <Route> entries -- this file is the one place that should ever need
 * to change when a new top-level page is introduced.
 *
 * "/" now redirects to "/dashboard", the new landing page, per the
 * product plan's navigation section.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/workspace" element={<WorkspacePage />} />
      {/* Safe fallback -- unknown paths redirect to the dashboard rather
          than rendering a blank screen. Replace with a real 404 page if
          that's ever preferred. */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}