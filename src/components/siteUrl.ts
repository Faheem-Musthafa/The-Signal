const FALLBACK_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      // fall through to the local default on a malformed value
    }
  }
  return new URL(FALLBACK_SITE_URL);
}

export function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

export function safeExternalUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export const SITE_NAME = "The Signal";
export const SITE_TITLE = "The Signal — Tech intelligence, distilled.";
export const SITE_DESCRIPTION =
  "Real-time tech briefings. Curated by AI, refined for humans who don't have time to read everything.";
