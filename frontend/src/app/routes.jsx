import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import DashboardPage from "../pages/DashboardPage";
import WorkspacePage from "../pages/WorkspacePage";

/**
 * Central route table. New pages from later features (Documents,
 * Conversations, Bookmarks, Settings) get added here as additional
 * <Route> entries -- this file is the one place that should ever need
 * to change when a new top-level page is introduced.
 *
 * "/" now renders the marketing LandingPage (previously it redirected
 * straight into the app at "/dashboard", since there was no landing
 * page yet). The app itself still lives at "/dashboard" and
 * "/workspace", unchanged -- LandingPage's own CTAs link to "/workspace"
 * to jump straight into the product.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/workspace" element={<WorkspacePage />} />
      {/* Safe fallback -- unknown paths redirect to the landing page
          (the site's homepage) rather than rendering a blank screen. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}