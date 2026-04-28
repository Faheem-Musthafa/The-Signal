import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // New editorial palette
        paper: "var(--paper)",
        "paper-soft": "var(--paper-soft)",
        "paper-deep": "var(--paper-deep)",
        "paper-card": "var(--paper-card)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-mute": "var(--ink-mute)",
        "ink-dim": "var(--ink-dim)",
        "ink-faint": "var(--ink-faint)",
        rule: "var(--rule)",
        "rule-strong": "var(--rule-strong)",
        "rule-bold": "var(--rule-bold)",
        signal: "var(--signal)",
        "signal-deep": "var(--signal-deep)",
        "signal-soft": "var(--signal-soft)",
        "signal-yellow": "var(--signal-yellow)",
        amber: "var(--amber)",
        moss: "var(--moss)",
        sky: "var(--sky)",

        // Legacy aliases (so old components keep compiling)
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        "bg-3": "var(--bg-3)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "border-bright": "var(--border-bright)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        warm: "var(--warm)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-warm": "var(--accent-warm)",
        "accent-soft": "var(--accent-soft)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
