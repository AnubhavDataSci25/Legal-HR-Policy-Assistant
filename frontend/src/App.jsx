import AppRoutes from "./app/routes";
import { WorkspaceProvider } from "./context/WorkspaceContext";

/**
 * App is the router root, wrapped in WorkspaceProvider so the active
 * document + conversation state lives above the routes and survives
 * navigating between pages (e.g. Dashboard <-> Workspace) -- only an
 * explicit user action (removing/replacing the document, resetting the
 * conversation) clears it, never just switching tabs.
 *
 * All the actual document Q&A logic lives in pages/WorkspacePage.jsx --
 * see that file for the real implementation. This keeps App.jsx stable
 * as new pages get added to app/routes.jsx over time.
 */
export default function App() {
  return (
    <WorkspaceProvider>
      <AppRoutes />
    </WorkspaceProvider>
  );
}