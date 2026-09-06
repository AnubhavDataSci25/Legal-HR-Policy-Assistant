/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background:        "var(--background)",
        surface:            "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-hover":    "var(--surface-hover)",
        border:              "var(--border)",
        "border-strong":    "var(--border-strong)",
        text:                "var(--text-primary)",
        "text-secondary":  "var(--text-secondary)",
        "text-muted":       "var(--text-muted)",
        accent:              "var(--accent)",
        "accent-hover":     "var(--accent-hover)",
        "accent-soft":      "var(--accent-soft)",
        success:             "var(--success)",
        "success-soft":     "var(--success-soft)",
        warning:             "var(--warning)",
        "warning-soft":     "var(--warning-soft)",
        danger:              "var(--danger)",
        "danger-soft":      "var(--danger-soft)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["13.5px", { lineHeight: "1.5" }],
        base: ["15px", { lineHeight: "1.6" }],
        md: ["16px", { lineHeight: "1.6" }],
        lg: ["19px", { lineHeight: "1.4", fontWeight: "600" }],
        xl: ["24px", { lineHeight: "1.3", fontWeight: "700" }],
      },
      spacing: {
        // Extra steps for the tighter density this workspace needs
        4.5: "1.125rem",
        18: "4.5rem",
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.15)",
        elevated: "0 4px 16px -4px rgb(0 0 0 / 0.25)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        micro: "150ms",
        standard: "220ms",
        panel: "280ms",
      },
      screens: {
        xs: "480px",
        sm: "640px",
        md: "900px",
        lg: "1280px",
      },
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { opacity: "0.35", transform: "scale(0.85)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 220ms cubic-bezier(0.4,0,0.2,1) both",
        "pulse-dot": "pulseDot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};