import { FileText, Moon, Settings, Sun, User } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function Navbar() {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <header
      className="flex items-center justify-between h-16 px-6 border-b"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
    >
      {/* Logo + app name */}
      <div className="flex items-center gap-2">
        <FileText size={22} className="text-primary" style={{ color: "var(--color-primary)" }} />
        <span className="font-bold text-lg">Policy Assistant</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-lg transition hover:opacity-80"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          aria-label="Settings"
          className="p-2 rounded-lg transition hover:opacity-80"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <Settings size={18} />
        </button>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)" }}
          aria-label="User avatar placeholder"
        >
          <User size={18} />
        </div>
      </div>
    </header>
  );
}