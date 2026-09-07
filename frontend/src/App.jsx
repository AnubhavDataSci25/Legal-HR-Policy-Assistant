import AppRoutes from "./app/routes";

/**
 * App is now just the router root. All the actual document Q&A logic
 * that used to live here has moved, unchanged, to pages/WorkspacePage.jsx
 * -- see that file for the real implementation. This keeps App.jsx stable
 * as new pages (Dashboard, Documents, Conversations, ...) get added to
 * app/routes.jsx over time, without this file needing to change.
 */
export default function App() {
  return <AppRoutes />;
}