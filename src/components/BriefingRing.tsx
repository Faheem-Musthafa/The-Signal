"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSyncExternalStore, type CSSProperties } from "react";
import { topicGradient, topicStyle } from "@/lib/topicStyle";
import { TopicGlyph } from "@/components/ui";

/* ──────────────────────────────────────────────────────────────────────────
 * Shared "now" clock (one interval for every ring on the page, ticks each
 * minute). Server snapshot is 0, so relative captions only render on the
 * client and never cause a hydration mismatch.
 * ────────────────────────────────────────────────────────────────────────── */

let nowValue = 0;
let timer: number | undefined;
const listeners = new Set<() => void>();

function subscribeNow(cb: () => void) {
  listeners.add(cb);
  if (timer === undefined) {
    nowValue = Date.now();
    timer = window.setInterval(() => {
      nowValue = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

function getNow() {
  if (!nowValue) nowValue = Date.now();
  return nowValue;
}

function getServerNow() {
  return 0;
}

function useNow() {
  return useSyncExternalStore(subscribeNow, getNow, getServerNow);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Short caption ("Just now", "5m ago", "2h ago", "Yesterday", "Mon", "Oct 3") + long form for screen readers. */
export function relativeBriefingTime(iso: string, now: number): { short: string; long: string } {
  const t = new Date(iso).getTime();
  if (!now || Number.isNaN(t)) return { short: "Briefing", long: "" };
  const diff = Math.max(0, now - t);
  if (diff < MINUTE) return { short: "Just now", long: "just now" };
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return { short: `${m}m ago`, long: `${m} minute${m === 1 ? "" : "s"} ago` };
  }
  const today = startOfDay(now);
  if (t >= today) {
    const h = Math.floor(diff / HOUR);
    return { short: `${h}h ago`, long: `${h} hour${h === 1 ? "" : "s"} ago` };
  }
  if (t >= today - 24 * HOUR) return { short: "Yesterday", long: "yesterday" };
  const d = new Date(t);
  if (t >= today - 6 * 24 * HOUR) {
    return {
      short: d.toLocaleDateString([], { weekday: "short" }),
      long: `on ${d.toLocaleDateString([], { weekday: "long" })}`,
    };
  }
  return {
    short: d.toLocaleDateString([], { month: "short", day: "numeric" }),
    long: `on ${d.toLocaleDateString([], { month: "long", day: "numeric" })}`,
  };
}

const SIZES = {
  sm: { box: 56, ring: 2.5, gap: 2.5, glyph: 20, glyphMulti: 15, caption: "text-[11px] max-w-[72px]" },
  md: { box: 72, ring: 3, gap: 3, glyph: 26, glyphMulti: 19, caption: "text-[12px] max-w-[88px]" },
  lg: { box: 92, ring: 3.5, gap: 3.5, glyph: 34, glyphMulti: 24, caption: "text-[13px] max-w-[108px]" },
} as const;

export type BriefingRingProps = {
  topics: string[];
  generatedAt: string;
  /** Caption under the ring; defaults to a relative time ("2h ago", "Yesterday"). */
  label?: string;
  onClick?: () => void;
  href?: string;
  size?: "sm" | "md" | "lg";
  /** Already watched — the ring renders muted. */
  seen?: boolean;
};

/**
 * Story-style ring for a briefing: a conic ring of the topics' broadcast
 * colours around the topic glyph(s), caption below. Renders a <button>
 * (onClick) or a Next <Link> (href).
 */
export function BriefingRing({ topics, generatedAt, label, onClick, href, size = "md", seen = false }: BriefingRingProps) {
  const now = useNow();
  const dims = SIZES[size];
  const time = relativeBriefingTime(generatedAt, now);
  const unique = Array.from(new Set(topics.map((t) => topicStyle(t).label)));
  const topicNames = unique.length > 0 ? unique.join(", ") : "General";
  const caption = label ?? time.short;
  const ariaLabel = `Open briefing: ${topicNames}${time.long ? ` — ${time.long}` : ""}${label && label !== time.short ? ` (${label})` : ""}`;

  const shown = unique.slice(0, 2);
  const extra = unique.length - shown.length;
  const primary = topicStyle(unique[0]);

  const ringStyle: CSSProperties = {
    width: dims.box,
    height: dims.box,
    padding: dims.ring,
  };
  const gradientStyle: CSSProperties = {
    background: seen ? "rgb(var(--rule-strong-rgb))" : topicGradient(unique),
  };

  const body = (
    <>
      <span className="relative block shrink-0 rounded-full" style={ringStyle}>
        {/* the coloured ring (spins a little on hover) */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full transition-transform duration-700 ease-out-expo group-hover:rotate-[120deg] motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
          style={gradientStyle}
        />
        {/* paper gap + inner disc */}
        <span
          className="relative flex size-full items-center justify-center rounded-full bg-paper"
          style={{ padding: dims.gap }}
        >
          <span
            aria-hidden="true"
            className={`grain relative flex size-full items-center justify-center overflow-hidden rounded-full text-white transition-[filter,opacity] duration-300 ${
              seen ? "opacity-60 saturate-[0.35]" : ""
            }`}
            style={{ background: shown.length > 1 ? "var(--ink)" : primary.color }}
          >
            {shown.length <= 1 ? (
              <TopicGlyph topic={unique[0] ?? ""} size={dims.glyph} strokeWidth={1.8} />
            ) : (
              <>
                <span
                  className="absolute left-[16%] top-[16%] flex items-center justify-center rounded-full"
                  style={{ background: topicStyle(shown[0]).color, padding: 3 }}
                >
                  <TopicGlyph topic={shown[0]} size={dims.glyphMulti} strokeWidth={2} />
                </span>
                <span
                  className="absolute bottom-[16%] right-[16%] flex items-center justify-center rounded-full ring-2 ring-ink"
                  style={{ background: topicStyle(shown[1]).color, padding: 3 }}
                >
                  <TopicGlyph topic={shown[1]} size={dims.glyphMulti} strokeWidth={2} />
                </span>
              </>
            )}
          </span>
        </span>
        {extra > 0 && (
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-paper bg-ink px-1 font-mono text-[10px] font-semibold tabular-nums text-white"
          >
            +{extra}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={`block truncate text-center font-mono font-medium tabular-nums leading-tight ${dims.caption} ${
          seen ? "text-ink-dim" : "text-ink-2"
        }`}
        suppressHydrationWarning
      >
        {caption}
      </span>
    </>
  );

  const classes =
    "group inline-flex shrink-0 select-none flex-col items-center gap-2 rounded-card p-1 outline-none transition-transform duration-150 ease-out active:scale-[0.94] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

  if (href !== undefined) {
    return (
      <Link href={href as Route} aria-label={ariaLabel} title={ariaLabel} onClick={onClick} className={classes}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} title={ariaLabel} className={classes}>
      {body}
    </button>
  );
}
