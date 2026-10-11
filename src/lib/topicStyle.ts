import { ALLOWED_TOPICS, type Topic } from "./topics";

/**
 * Per-topic "broadcast" identity: colour, soft tint, labels and a glyph.
 * Pure data (no React) so it is safe in server components, OG images and tests.
 * Render the glyph with <TopicGlyph topic=… /> from "@/components/ui".
 */

export type TopicKey =
  | "ai"
  | "funding"
  | "bigtech"
  | "devtools"
  | "crypto"
  | "policy"
  | "hardware"
  | "layoffs"
  | "other";

export type TopicStyle = {
  /** Machine key — matches the Tailwind colour names: bg-topic-{key}, bg-topic-{key}-soft */
  key: TopicKey;
  /** Full display label (the topic string itself for known topics) */
  label: string;
  /** Short label for tight spaces (chips, rings, tab tiles) */
  short: string;
  /** Broadcast colour (hex). White text passes WCAG AA on it. */
  color: string;
  /** Light tint of the colour (hex) for soft chips / tile backgrounds */
  soft: string;
  /** Text colour to use ON `soft` (AA) */
  onSoft: string;
  /** CSS var references, for when you want the token instead of the literal */
  cssVar: string;
  cssVarSoft: string;
  /**
   * Glyph as stroke path data for a 24×24 viewBox
   * (fill="none" stroke="currentColor" strokeLinecap/Join="round", width ≈ 1.8).
   */
  glyph: readonly string[];
};

const STYLES: Record<Topic, Omit<TopicStyle, "cssVar" | "cssVarSoft" | "label">> = {
  "AI & LLMs": {
    key: "ai",
    short: "AI",
    color: "#4338CA",
    soft: "#E0E7FF",
    onSoft: "#3730A3",
    glyph: ["M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z", "M18.5 3v4", "M16.5 5h4", "M5.5 17v3", "M4 18.5h3"],
  },
  "Startup Funding": {
    key: "funding",
    short: "Funding",
    color: "#047857",
    soft: "#D1FAE5",
    onSoft: "#065F46",
    glyph: ["M3 17l6-6 4 4 8-8", "M14.5 7H21v6.5"],
  },
  "Big Tech": {
    key: "bigtech",
    short: "Big Tech",
    color: "#27272A",
    soft: "#E4E4E7",
    onSoft: "#27272A",
    glyph: ["M4.5 21V4.8a.8.8 0 0 1 .8-.8h7.4a.8.8 0 0 1 .8.8V21", "M13.5 9h5.2a.8.8 0 0 1 .8.8V21", "M3 21h18", "M8 8h2.5", "M8 12h2.5", "M8 16h2.5", "M16 13h1", "M16 17h1"],
  },
  "Developer Tools": {
    key: "devtools",
    short: "Dev Tools",
    color: "#0369A1",
    soft: "#E0F2FE",
    onSoft: "#075985",
    glyph: ["M8 7.5L3.5 12 8 16.5", "M16 7.5l4.5 4.5-4.5 4.5", "M13.6 4.5l-3.2 15"],
  },
  "Crypto & Web3": {
    key: "crypto",
    short: "Crypto",
    color: "#C2410C",
    soft: "#FFEDD5",
    onSoft: "#9A3412",
    glyph: ["M12 2.8l7.8 4.5v9.4L12 21.2l-7.8-4.5V7.3z", "M4.2 7.3L12 11.8l7.8-4.5", "M12 11.8v9.4"],
  },
  "Policy & Regulation": {
    key: "policy",
    short: "Policy",
    color: "#9F1239",
    soft: "#FFE4E6",
    onSoft: "#9F1239",
    glyph: ["M12 3.5v17", "M6.5 20.5h11", "M5 7.5h14", "M5 7.5l-2.5 6a2.6 2.6 0 0 0 5 0z", "M19 7.5l-2.5 6a2.6 2.6 0 0 0 5 0z"],
  },
  "Hardware & Chips": {
    key: "hardware",
    short: "Chips",
    color: "#0F766E",
    soft: "#CCFBF1",
    onSoft: "#115E59",
    glyph: ["M7 6.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5z", "M10 10h4v4h-4z", "M9.5 3v3.5", "M14.5 3v3.5", "M9.5 17.5V21", "M14.5 17.5V21", "M3 9.5h3.5", "M3 14.5h3.5", "M17.5 9.5H21", "M17.5 14.5H21"],
  },
  "Layoffs & Hiring": {
    key: "layoffs",
    short: "Jobs",
    color: "#86198F",
    soft: "#FAE8FF",
    onSoft: "#86198F",
    glyph: ["M9 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 9 11z", "M2.8 20a6.2 6.2 0 0 1 12.4 0", "M15.5 4.4a3.4 3.4 0 0 1 0 6.4", "M17.6 14.3A6.2 6.2 0 0 1 21.2 20"],
  },
};

/** The Signal's wave mark — used as the fallback glyph for unknown categories. */
export const SIGNAL_WAVE_PATH = "M2 12c3.6 0 3.6-6.5 7.8-6.5S13.4 18.5 17.6 18.5c2.6 0 3-3.2 4.4-6.5";

const FALLBACK: Omit<TopicStyle, "label" | "short"> = {
  key: "other",
  color: "#3B4256",
  soft: "#EEF0F6",
  onSoft: "#3B4256",
  cssVar: "var(--topic-other)",
  cssVarSoft: "var(--topic-other-soft)",
  glyph: [SIGNAL_WAVE_PATH],
};

function isTopic(value: string): value is Topic {
  return (ALLOWED_TOPICS as readonly string[]).includes(value);
}

/** Style for a topic. Unknown / malformed categories get a neutral slate fallback (never throws). */
export function topicStyle(topic: Topic | string | null | undefined): TopicStyle {
  const value = typeof topic === "string" ? topic.trim() : "";
  if (isTopic(value)) {
    const s = STYLES[value];
    return {
      ...s,
      label: value,
      cssVar: `var(--topic-${s.key})`,
      cssVarSoft: `var(--topic-${s.key}-soft)`,
    };
  }
  const label = value || "General";
  return { ...FALLBACK, label, short: label.length > 12 ? `${label.slice(0, 11)}…` : label };
}

/** All 8 topics in canonical order with their styles. */
export const TOPIC_STYLES: ReadonlyArray<TopicStyle & { topic: Topic }> = ALLOWED_TOPICS.map((topic) => ({
  ...topicStyle(topic),
  topic,
}));

/**
 * CSS background for a "story ring" made of several topics (conic gradient of
 * their colours). One topic → that solid colour. Empty → brand signal.
 */
export function topicGradient(topics: ReadonlyArray<string>): string {
  const colors = Array.from(new Set(topics.map((t) => topicStyle(t).color)));
  if (colors.length === 0) return "#2F4BFF";
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`);
  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}
