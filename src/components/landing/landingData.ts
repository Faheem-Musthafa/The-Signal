// Server-only: imported by the LandingHero server component (uses the Convex HTTP client).
import { cache } from "react";
import { getConvexClient } from "@/lib/convexServer";
import { ALLOWED_TOPICS } from "@/lib/topics";
import type { Story } from "@/types/digest";
import { api } from "../../../convex/_generated/api";

export type LandingPreview = {
  stories: Story[];
  /** epoch ms of the newest source briefing, or null when nothing is available */
  generatedAt: number | null;
};

export type LandingData = {
  preview: LandingPreview | null;
  briefingsLast24h: number | null;
};

const TIMEOUT_MS = 2500;

/** Resolves to null instead of throwing or hanging, so the landing page always renders. */
async function soft<T>(work: () => Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error("[landing] data fetch failed", error);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Today's ready-made briefing (system showcase briefings only — never a real
 * person's briefing) plus the live "briefings in the last 24h" count.
 * Deduped per request.
 */
export const getLandingData = cache(async (): Promise<LandingData> => {
  let convex: ReturnType<typeof getConvexClient>;
  try {
    convex = getConvexClient();
  } catch (error) {
    console.error("[landing] Convex is not configured", error);
    return { preview: null, briefingsLast24h: null };
  }

  const [preview, stats] = await Promise.all([
    soft(() => convex.query(api.digests.previewForTopics, { topics: [...ALLOWED_TOPICS] })),
    soft(() => convex.query(api.digests.landingStats, {})),
  ]);

  return {
    preview: preview
      ? {
          // Stories are validated against StorySchema when they are generated.
          stories: preview.stories as Story[],
          generatedAt: typeof preview.generatedAt === "number" ? preview.generatedAt : null,
        }
      : null,
    briefingsLast24h: stats && typeof stats.briefingsLast24h === "number" ? stats.briefingsLast24h : null,
  };
});

/** "just now", "12 minutes ago", "3 hours ago", "yesterday", "2 days ago". */
export function timeAgo(ms: number, now: number): string {
  const diff = Math.max(0, now - ms);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
