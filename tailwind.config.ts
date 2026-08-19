import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },
      // Type scale — 4 steps only. Use these instead of ad-hoc text-xl/text-2xl/etc.
      // The one accepted exception is all-caps micro-labels (eyebrow field
      // labels, small pill badges) and inline SVG <text> (which can't take
      // Tailwind classes at all) — those may go below `caption`, each with a
      // comment at the call site explaining why.
      fontSize: {
        display: ["28px", { lineHeight: "1.25", fontWeight: "700", letterSpacing: "-0.01em" }],
        title: ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "1.45", fontWeight: "400" }],
      },
      colors: {
        bg: "var(--color-bg)",
        "bg-subtle": "var(--color-bg-subtle)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-active": "var(--color-accent-active)",
        "accent-tint": "var(--color-accent-tint)",
        "accent-line": "var(--color-accent-line)",
        "on-accent": "var(--color-on-accent)",
        // Secondary "headline number" accent — used for the ratio/percentile
        // hero numbers and gold-tier badges. Neutral amber on the light
        // theme; /kr's .kr-theme override (globals.css) turns it into the
        // brighter gold that matches its accent green.
        warn: "var(--color-warn)",
        "warn-tint": "var(--color-warn-tint)",
        "warn-line": "var(--color-warn-line)",
        overlay: "var(--color-overlay)",
        danger: "var(--color-danger)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
