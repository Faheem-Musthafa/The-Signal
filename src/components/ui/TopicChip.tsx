import type { CSSProperties, MouseEventHandler } from "react";
import { topicStyle } from "@/lib/topicStyle";

export type TopicGlyphProps = {
  topic: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Override colour; defaults to currentColor */
  color?: string;
};

/** The topic's glyph as an inline SVG (decorative). */
export function TopicGlyph({ topic, size = 16, strokeWidth = 1.8, className = "", color }: TopicGlyphProps) {
  const s = topicStyle(topic);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {s.glyph.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export type TopicChipVariant = "solid" | "soft" | "outline" | "onColor";

export type TopicChipProps = {
  topic: string;
  /**
   * solid   — topic colour bg, white text (default)
   * soft    — tinted bg, topic-coloured text
   * outline — surface bg, topic-coloured border dot
   * onColor — translucent white, for use ON a topic-coloured / dark surface (story cards)
   */
  variant?: TopicChipVariant;
  size?: "sm" | "md";
  /** Show the topic glyph (default true) */
  glyph?: boolean;
  /** Use the short label ("AI", "Chips", …) */
  short?: boolean;
  /** Makes it a toggle <button aria-pressed>. When selected, soft/outline render as solid. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  selected?: boolean;
  className?: string;
};

const SIZE = {
  sm: "h-6 gap-1 px-2 text-[12px]",
  md: "h-8 gap-1.5 px-3 text-[13px]",
} as const;

/** Pill label for a topic in its broadcast colour. */
export function TopicChip({
  topic,
  variant = "solid",
  size = "sm",
  glyph = true,
  short = false,
  onClick,
  selected,
  className = "",
}: TopicChipProps) {
  const s = topicStyle(topic);
  const effective: TopicChipVariant = selected && (variant === "soft" || variant === "outline") ? "solid" : variant;

  let style: CSSProperties;
  switch (effective) {
    case "soft":
      style = { background: s.soft, color: s.onSoft };
      break;
    case "outline":
      style = { background: "var(--surface)", color: "var(--ink-2)", boxShadow: `inset 0 0 0 1px var(--rule)` };
      break;
    case "onColor":
      style = { background: "rgba(255,255,255,0.16)", color: "#fff", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)" };
      break;
    default:
      style = { background: s.color, color: "#fff" };
  }

  const content = (
    <>
      {glyph && (
        <TopicGlyph topic={topic} size={size === "sm" ? 12 : 15} strokeWidth={2} color={effective === "outline" ? s.color : undefined} />
      )}
      <span className="truncate">{short ? s.short : s.label}</span>
    </>
  );

  const base = `inline-flex max-w-full shrink-0 items-center rounded-full font-semibold leading-none tracking-[-0.005em] whitespace-nowrap ${SIZE[size]} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected ?? false}
        className={`${base} transition-[transform,background-color,color] duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal`}
        style={style}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={base} style={style}>
      {content}
    </span>
  );
}
