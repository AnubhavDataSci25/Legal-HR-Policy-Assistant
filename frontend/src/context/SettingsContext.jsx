import { createContext, useContext, useState } from "react";

const SETTINGS_STORAGE_KEY = "policy-assistant-settings";

export const DEFAULT_SETTINGS = {
  answerStyle: "concise", // "concise" | "detailed"
  topSources: 5,          // 3 | 5 | 7
  showScores: false,      // boolean
  profile: { name: "", role: "" },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      answerStyle: ["concise", "detailed"].includes(parsed.answerStyle)
        ? parsed.answerStyle
        : DEFAULT_SETTINGS.answerStyle,
      topSources: [3, 5, 7].includes(Number(parsed.topSources))
        ? Number(parsed.topSources)
        : DEFAULT_SETTINGS.topSources,
      showScores: typeof parsed.showScores === "boolean"
        ? parsed.showScores
        : DEFAULT_SETTINGS.showScores,
      profile: {
        name: typeof parsed.profile?.name === "string" ? parsed.profile.name : "",
        role: typeof parsed.profile?.role === "string" ? parsed.profile.role : "",
      },
    };
  } catch (err) {
    console.warn("Failed to read settings from localStorage:", err);
    return DEFAULT_SETTINGS;
  }
}

export const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadSettings);

  const updateSettings = (patch) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn("Failed to persist settings to localStorage:", err);
      }
      return next;
    });
  };

  const setAnswerStyle = (answerStyle) => updateSettings({ answerStyle });
  const setTopSources = (topSources) => updateSettings({ topSources });
  const setShowScores = (showScores) => updateSettings({ showScores });
  const setProfile = (profile) => updateSettings({ profile });

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        settings,
        updateSettings,
        setAnswerStyle,
        setTopSources,
        setShowScores,
        setProfile,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
