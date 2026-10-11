import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PARAM_LENGTH = 512;
const MAX_TOPICS = 16;
const MAX_TOPIC_LENGTH = 64;
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

// Signed-out preview: a ready-made briefing for the requested topics, built
// from recent showcase digests. `topics` is comma-separated; empty means all.
// Unknown topic names are ignored by the query.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("topics") ?? "";
  if (raw.length > MAX_PARAM_LENGTH) {
    return invalidTopics();
  }
  const topics = raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (topics.length > MAX_TOPICS || topics.some((t) => t.length > MAX_TOPIC_LENGTH)) {
    return invalidTopics();
  }

  try {
    const convex = getConvexClient();
    const preview = await convex.query(api.digests.previewForTopics, { topics: [...new Set(topics)] });
    return NextResponse.json(
      {
        stories: preview.stories,
        generatedAt: preview.generatedAt === null ? null : new Date(preview.generatedAt).toISOString(),
        coveredTopics: preview.coveredTopics,
        exact: preview.exact,
      },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (error) {
    console.error("[preview] failed", error);
    return NextResponse.json(
      { error: "Could not load a preview right now", code: "UPSTREAM_FAILED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

function invalidTopics() {
  return NextResponse.json(
    { error: "Invalid topics", code: "INVALID_TOPICS" },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}
