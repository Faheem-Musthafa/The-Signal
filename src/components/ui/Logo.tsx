import Link from "next/link";
import type { Route } from "next";

/** The Signal's wave glyph (the original mark). Decorative. */
export function SignalGlyph({ size = 22, className = "", strokeWidth = 2.4 }: { size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M2 16c5 0 5-9 11-9s5 18 11 18 5-9 6-9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

type LogoSize = "sm" | "md" | "lg";

const SIZE: Record<LogoSize, { mark: string; glyph: number; word: string; tag: string }> = {
  sm: { mark: "size-7 rounded-[9px]", glyph: 16, word: "text-[15px]", tag: "text-[12px]" },
  md: { mark: "size-9 rounded-[11px]", glyph: 20, word: "text-[18px]", tag: "text-[12px]" },
  lg: { mark: "size-12 rounded-[14px]", glyph: 26, word: "text-[24px]", tag: "text-[12.5px]" },
};

export type LogoProps = {
  size?: LogoSize;
  /** Show "The Signal" next to the mark (default true) */
  wordmark?: boolean;
  /** Show the "Tech intelligence" tagline under the wordmark */
  tagline?: boolean;
  /** default: blue mark + ink text · inverse: white mark/text for dark or coloured backgrounds */
  tone?: "default" | "inverse";
  /** Wrap in a link (e.g. "/") — gets aria-label "The Signal — home" */
  href?: string;
  className?: string;
};

export function Logo({ size = "md", wordmark = true, tagline = false, tone = "default", href, className = "" }: LogoProps) {
  const s = SIZE[size];
  const inverse = tone === "inverse";
  const body = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center ${s.mark} ${inverse ? "bg-white text-signal" : "bg-signal text-white shadow-glow"}`}
      >
        <SignalGlyph size={s.glyph} />
      </span>
      {wordmark && (
        <span className="flex flex-col">
          <span
            className={`font-display stretch-wider font-extrabold leading-none tracking-[-0.02em] ${s.word} ${inverse ? "text-white" : "text-ink"}`}
          >
            The Signal
          </span>
          {tagline && (
            <span className={`mt-1 font-mono uppercase tracking-[0.14em] leading-none ${s.tag} ${inverse ? "text-white/70" : "text-ink-mute"}`}>
              Tech intelligence
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!href) return body;
  return (
    <Link
      href={href as Route}
      aria-label="The Signal — home"
      className="inline-flex rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
    >
      {body}
    </Link>
  );
}
