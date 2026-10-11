import type { Config } from "tailwindcss";

/** Channel-based colour so opacity modifiers work: bg-ink/60, bg-signal/10, ring-topic-ai/40 … */
const rgb = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Broadcast palette (see globals.css :root) ──
        paper: rgb("paper"),
        surface: rgb("surface"),
        "surface-2": rgb("surface-2"),
        "surface-3": rgb("surface-3"),
        ink: rgb("ink"),
        "ink-2": rgb("ink-2"),
        "ink-mute": rgb("ink-mute"),
        "ink-dim": rgb("ink-dim"),
        "ink-faint": rgb("ink-faint"),
        rule: rgb("rule"),
        "rule-strong": rgb("rule-strong"),
        signal: rgb("signal"),
        "signal-deep": rgb("signal-deep"),
        "signal-soft": rgb("signal-soft"),
        flare: rgb("flare"),
        "flare-soft": rgb("flare-soft"),
        danger: rgb("danger"),
        "danger-deep": rgb("danger-deep"),
        "danger-soft": rgb("danger-soft"),
        success: rgb("success"),
        "success-soft": rgb("success-soft"),
        topic: {
          ai: rgb("topic-ai"),
          funding: rgb("topic-funding"),
          bigtech: rgb("topic-bigtech"),
          devtools: rgb("topic-devtools"),
          crypto: rgb("topic-crypto"),
          policy: rgb("topic-policy"),
          hardware: rgb("topic-hardware"),
          layoffs: rgb("topic-layoffs"),
          other: rgb("topic-other"),
          "ai-soft": "var(--topic-ai-soft)",
          "funding-soft": "var(--topic-funding-soft)",
          "bigtech-soft": "var(--topic-bigtech-soft)",
          "devtools-soft": "var(--topic-devtools-soft)",
          "crypto-soft": "var(--topic-crypto-soft)",
          "policy-soft": "var(--topic-policy-soft)",
          "hardware-soft": "var(--topic-hardware-soft)",
          "layoffs-soft": "var(--topic-layoffs-soft)",
          "other-soft": "var(--topic-other-soft)",
        },
      },
      fontFamily: {
        display: ["var(--font-archivo)", "var(--font-geist)", "system-ui", "sans-serif"],
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        story: "var(--radius-story)",
        chip: "999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(14, 18, 32, 0.04), 0 6px 20px -10px rgba(14, 18, 32, 0.12)",
        lift: "0 2px 4px rgba(14, 18, 32, 0.04), 0 18px 40px -16px rgba(14, 18, 32, 0.22)",
        glow: "0 10px 28px -10px rgba(47, 75, 255, 0.6)",
        story: "0 30px 80px -20px rgba(14, 18, 32, 0.55)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
