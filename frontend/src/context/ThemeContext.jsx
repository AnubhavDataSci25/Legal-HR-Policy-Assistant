import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext(null);

const STORAGE_KEY = "policy-assistant-theme"; // "light" | "dark" | "system"

function getSystemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeClass(theme) {
  const isDark = theme === "dark" || (theme === "system" && getSystemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE_KEY) || "dark");

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyThemeClass("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}