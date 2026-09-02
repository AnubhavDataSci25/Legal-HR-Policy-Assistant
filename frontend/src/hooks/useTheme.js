import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Access the current theme ("light" | "dark" | "system") and setTheme().
 * Must be used within a <ThemeProvider>.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}