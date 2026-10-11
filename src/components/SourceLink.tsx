import type { MouseEventHandler, PointerEventHandler } from "react";
import { safeExternalUrl } from "./siteUrl";
import { SignalBars } from "./ui/SignalBars";

/** Display label for a source: explicit name, else the URL's hostname (only for http/https URLs). */
export function sourceLabel(source: string | null | undefined, url: string | null | undefined): string {
  if (source && source.trim()) return source.trim();
  const href = safeExternalUrl(url);
  return href ? new URL(href).hostname.replace(/^www\./, "") : "";
}

type SourceLinkProps = {
  source: string;
  url?: string | null;
  className?: string;
  tabIndex?: number;
  /**
   * inline  — underlined text link (default; lists, share page)
   * pill    — "Read on TechCrunch ↗" pill on paper
   * onColor — same pill, translucent white for coloured surfaces (story cards)
   */
  variant?: "inline" | "pill" | "onColor";
  /** Prefix for pill variants (default "Read on") */
  prefix?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  onPointerDown?: PointerEventHandler<HTMLAnchorElement>;
};

function ArrowGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

/**
 * Link to a story's original source. SAFETY: only http/https URLs ever become
 * links (javascript:, data: etc. render as plain text). Opens in a new tab.
 */
export function SourceLink({ source, url, className = "", tabIndex, variant = "inline", prefix = "Read on", onClick, onPointerDown }: SourceLinkProps) {
  const href = safeExternalUrl(url);
  const label = sourceLabel(source, url);
  if (!label) return null;

  if (variant !== "inline") {
    const pill =
      variant === "onColor"
        ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] hover:bg-white/25 focus-visible:outline-white"
        : "bg-surface text-ink shadow-[inset_0_0_0_1px_rgb(var(--rule-strong-rgb))] hover:bg-surface-2 focus-visible:outline-signal";
    const base = `inline-flex h-11 min-w-0 max-w-full items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-colors ${pill} ${className}`;
    if (!href) {
      return (
        <span className={`${base} pointer-events-none`}>
          <span className="truncate">Source: {label}</span>
        </span>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={tabIndex}
        onClick={onClick}
        onPointerDown={onPointerDown}
        className={`${base} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
      >
        <span className="truncate">
          {prefix} {label}
        </span>
        <ArrowGlyph size={13} />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }

  if (!href) {
    return <span className={className}>{label}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`inline-flex min-w-0 items-center gap-1 rounded-sm underline decoration-ink-faint decoration-[1.5px] underline-offset-[3px] transition-colors hover:text-signal hover:decoration-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${className}`}
    >
      <span className="truncate">{label}</span>
      <ArrowGlyph />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/**
 * Importance 1–5 as signal bars. Kept for existing callers; new code should use
 * <SignalBars value=… /> from "@/components/ui" directly.
 * `barClassName` is accepted for backward compatibility and ignored.
 */
export function ImportanceMeter({
  importance,
  size = "sm",
  color = "var(--signal)",
  className = "",
}: {
  importance: number;
  /** @deprecated ignored — use `size` */
  barClassName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  className?: string;
}) {
  return <SignalBars value={importance} size={size} color={color} className={`shrink-0 ${className}`} />;
}
