import { toast } from "sonner";
import { safeExternalUrl } from "@/components/siteUrl";

/**
 * Minimal story shape the player needs. `Story` from "@/types/digest" satisfies it;
 * so do looser API payloads (category as plain string, url nullable).
 */
export type StoryLike = {
  headline: string;
  category: string;
  summary: string;
  signal: string;
  source: string;
  importance: number;
  url?: string | null;
};

export type StoryMeta = {
  /** ISO string or epoch ms */
  generatedAt?: string | number;
  topics?: ReadonlyArray<string>;
  /** When present, Share uses `${origin}/share/${shareId}` and saved stories remember it. */
  shareId?: string;
  model?: string;
  cached?: boolean;
};

/** Stable id for a story (no ids in the data contract): hash of url || headline. */
export function storyKey(story: Pick<StoryLike, "headline" | "url">): string {
  const basis = `${story.url ?? ""}|${story.headline}`.toLowerCase();
  let h = 5381;
  for (let i = 0; i < basis.length; i++) h = ((h << 5) + h + basis.charCodeAt(i)) | 0;
  return `s_${(h >>> 0).toString(36)}`;
}

const WPM = 220;

/** Auto-advance duration: words / 220wpm + 3s, clamped to 7–20s. */
export function readingDurationMs(story: Pick<StoryLike, "headline" | "summary" | "signal">): number {
  const words = `${story.headline} ${story.signal} ${story.summary}`.trim().split(/\s+/).filter(Boolean).length;
  const seconds = (words / WPM) * 60 + 3;
  return Math.round(Math.min(20, Math.max(7, seconds)) * 1000);
}

/** Light haptic tick where supported (Android Chrome); no-op elsewhere. */
export function haptic(pattern: number | number[] = 8) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // vibration blocked (iframe / permissions policy) — ignore
  }
}

export function briefingShareUrl(shareId: string): string {
  return `${window.location.origin}/share/${encodeURIComponent(shareId)}`;
}

/**
 * Web Share API with clipboard fallback. Resolves to how it was shared.
 * User-cancelled share sheets are silent; failures toast an error with the URL.
 */
export async function shareOrCopy({
  url,
  title,
  text,
  copiedMessage = "Link copied",
}: {
  url: string;
  title?: string;
  text?: string;
  copiedMessage?: string;
}): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const safe = url.startsWith("/") ? url : safeExternalUrl(url);
  if (!safe) return "failed";
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      const data = { url: safe, title, text };
      if (!navigator.canShare || navigator.canShare(data)) {
        await navigator.share(data);
        return "shared";
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    // fall through to copy
  }
  try {
    await navigator.clipboard.writeText(safe);
    toast.success(copiedMessage);
    return "copied";
  } catch {
    toast.error(`Couldn't copy automatically. Share this link: ${safe}`);
    return "failed";
  }
}

export function formatDateline(value: string | number | undefined): string {
  if (value === undefined) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
}
