/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        text: "var(--color-text)",
        border: "var(--color-border)",
      },
      fontFamily: {
        // Single sans-serif typeface across the app.
        // Use font weight (font-semibold, font-bold, etc.) to
        // differentiate headings from body text, not a second family.
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        h1: ["40px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["32px", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        body: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      screens: {
        sm: "640px",
        md: "1024px",
        lg: "1280px",
      },
    },
  },
  plugins: [],
};