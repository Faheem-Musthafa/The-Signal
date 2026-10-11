import { cache } from "react";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

// Deduped per request so the page, generateMetadata and the OG image share one fetch.
export const getSharedDigest = cache(async (shareId: string) => {
  if (!SHARE_ID_PATTERN.test(shareId)) return null;
  return getConvexClient().query(api.digests.getByShareId, { shareId });
});
