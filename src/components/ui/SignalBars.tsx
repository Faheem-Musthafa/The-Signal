import type { CSSProperties } from "react";

type Size = "xs" | "sm" | "md" | "lg";

const DIMENSIONS: Record<Size, { bar: number; height: number; gap: number }> = {
  xs: { bar: 2.5, height: 10, gap: 1.5 },
  sm: { bar: 3, height: 13, gap: 2 },
  md: { bar: 4, height: 17, gap: 2.5 },
  lg: { bar: 5, height: 24, gap: 3 },
};

export type SignalBarsProps = {
  /** Filled bars (importance 1–5). Clamped to 0…max. */
  value: number;
  max?: number;
  size?: Size;
  /** Colour for filled bars. Any CSS colour; defaults to currentColor. */
  color?: string;
  /** Colour for empty bars. Defaults to the fill colour at low opacity. */
  trackColor?: string;
  /** Paint the top bar in --flare when value === max (brief: importance 5 = flare). */
  flareAtMax?: boolean;
  /** Override the accessible label. Default "Importance {v} of {max}". */
  label?: string;
  /** Render purely decorative (aria-hidden) — use when the value is already spelled out nearby. */
  decorative?: boolean;
  className?: string;
};

/** Phone-style signal-strength bars — the importance meter of The Signal. */
export function SignalBars({
  value,
  max = 5,
  size = "sm",
  color = "currentColor",
  trackColor,
  flareAtMax = true,
  label,
  decorative = false,
  className = "",
}: SignalBarsProps) {
  const v = Math.max(0, Math.min(max, Math.round(Number.isFinite(value) ? value : 0)));
  const d = DIMENSIONS[size];
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": label ?? `Importance ${v} of ${max}`, title: label ?? `Importance ${v}/${max}` } as const);

  return (
    <span
      {...a11y}
      className={`inline-flex shrink-0 items-end ${className}`}
      style={{ gap: d.gap, height: d.height }}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < v;
        const isFlare = flareAtMax && v === max && i === max - 1;
        const style: CSSProperties = {
          width: d.bar,
          height: `${Math.round(((i + 1) / max) * 100)}%`,
          background: isFlare ? "var(--flare)" : filled ? color : trackColor ?? color,
          opacity: filled || trackColor ? 1 : 0.28,
          borderRadius: d.bar / 2,
        };
        return <span key={i} aria-hidden="true" className="block" style={style} />;
      })}
    </span>
  );
}
