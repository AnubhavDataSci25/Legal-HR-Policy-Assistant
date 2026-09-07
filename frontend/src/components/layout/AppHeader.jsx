import { FileStack, LayoutGrid, Moon, PanelLeft, PanelRight, Settings, Sun, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import IconButton from "../common/IconButton";

/**
 * Top application bar, shared by every page.
 *
 * onToggleDocPanel / onToggleSourcePanel are workspace-only concerns
 * (the mobile document/source drawers -- see AppShell.jsx). They're
 * optional: pages that don't have those panels (like the Dashboard)
 * simply don't pass them, and the corresponding buttons don't render
 * at all, rather than rendering as dead controls.
 */
export default function AppHeader({ onToggleDocPanel, onToggleSourcePanel, hasDocument }) {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
    backgroundColor: isActive ? "var(--surface-hover)" : "transparent",
  });

  return (
    <header
      className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0 z-20"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile-only: toggle document drawer -- workspace pages only */}
        {onToggleDocPanel && (
          <IconButton aria-label="Toggle document panel" onClick={onToggleDocPanel} className="md:hidden">
            <PanelLeft size={17} />
          </IconButton>
        )}

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-soft)" }}
          >
            <FileStack size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[15px]">Policy Assistant</span>
            <span className="text-xs text-text-muted hidden sm:block">Document Q&A</span>
          </div>
        </div>

        {/* Minimal nav between the two real pages -- intentionally not a
            full sidebar with links to pages that don't exist yet. */}
        <nav className="hidden sm:flex items-center gap-1 ml-4">
          <NavLink
            to="/dashboard"
            style={navLinkStyle}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-micro"
          >
            <LayoutGrid size={14} />
            Dashboard
          </NavLink>
          <NavLink
            to="/workspace"
            style={navLinkStyle}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-micro"
          >
            Workspace
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <IconButton
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </IconButton>

        <IconButton aria-label="Settings">
          <Settings size={17} />
        </IconButton>

        {/* Mobile-only: toggle sources drawer -- workspace pages only */}
        {onToggleSourcePanel && (
          <IconButton
            aria-label="Toggle sources panel"
            onClick={onToggleSourcePanel}
            className="lg:hidden"
            disabled={!hasDocument}
          >
            <PanelRight size={17} />
          </IconButton>
        )}

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center ml-1"
          style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          aria-label="User account"
        >
          <User size={16} />
        </div>
      </div>
    </header>
  );
}