import type { ImageResponse } from "next/og";

/**
 * Shared "Broadcast" pieces for the next/og images (root + /share/[id]).
 * Private folder (`_og`) so it is never routed.
 *
 * Fonts are fetched from Google Fonts as TTF subsets (only the glyphs in `text`).
 * Every failure (offline build, timeout, API change) degrades to next/og's
 * built-in font — an OG image must never break the build or the page.
 */

export const OG = {
  paper: "#F6F7FB",
  surface: "#FFFFFF",
  surface2: "#EEF0F6",
  ink: "#0E1220",
  ink2: "#3B4256",
  mute: "#6A7287",
  faint: "#C9CEDB",
  rule: "#E3E6EF",
  signal: "#2F4BFF",
  signalSoft: "#E8ECFF",
  flare: "#FF5A36",
} as const;

export const FONT = {
  display: "'Archivo Expanded', 'Archivo', sans-serif",
  body: "'Archivo', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

type FontOptions = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;

async function googleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
    const css = await fetch(cssUrl, { signal: AbortSignal.timeout(4000) }).then((r) => (r.ok ? r.text() : ""));
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src, { signal: AbortSignal.timeout(4000) });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/**
 * Archivo expanded 800 (display), Archivo 500 (body), JetBrains Mono 600 (datelines).
 * Returns `undefined` when nothing loaded so ImageResponse falls back to its default font
 * (an empty array would leave Satori with no font at all).
 */
export async function broadcastFonts(text: string): Promise<FontOptions | undefined> {
  const glyphs = Array.from(new Set(`${text}0123456789/·…—–-:.,'’ `)).join("");
  const [display, body, mono] = await Promise.all([
    googleFont("Archivo:wdth,wght@125,800", glyphs),
    googleFont("Archivo:wght@500", glyphs),
    googleFont("JetBrains+Mono:wght@600", glyphs),
  ]);
  const fonts: FontOptions = [];
  if (display) fonts.push({ name: "Archivo Expanded", data: display, weight: 800, style: "normal" });
  if (body) fonts.push({ name: "Archivo", data: body, weight: 500, style: "normal" });
  if (mono) fonts.push({ name: "JetBrains Mono", data: mono, weight: 600, style: "normal" });
  return fonts.length > 0 ? fonts : undefined;
}

export function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** The wave mark in a rounded brand tile. */
export function OgLogo({ size = 44, inverse = false }: { size?: number; inverse?: boolean }) {
  const glyph = Math.round(size * 0.56);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: inverse ? "#ffffff" : OG.signal,
      }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 32 32" fill="none">
        <path
          d="M2 16c5 0 5-9 11-9s5 18 11 18 5-9 6-9"
          stroke={inverse ? OG.signal : "#ffffff"}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="1.8" fill={inverse ? OG.signal : "#ffffff"} />
      </svg>
    </div>
  );
}

/** Importance as phone-style signal bars (value 5 → flare top bar). */
export function OgBars({ value, color, height = 26 }: { value: number; color: string; height?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  const bar = Math.max(4, Math.round(height / 5));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: Math.round(bar * 0.6), height }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: bar,
            height: Math.round((i / 5) * height),
            borderRadius: bar / 2,
            background: v === 5 && i === 5 ? OG.flare : color,
            opacity: i <= v ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

/** Topic glyph (24×24 stroke paths from topicStyle). */
export function OgGlyph({ paths, size, color }: { paths: readonly string[]; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
