import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const convex = await getAuthedConvexClient();
    const history = await convex.query(api.digests.listRecentByAccount, { limit: 30 });

    return NextResponse.json({
      items: history.map((item) => ({
        shareId: item.shareId,
        topics: item.topics,
        stories: item.stories,
        model: item.model,
        generatedAt: new Date(item.generatedAt).toISOString(),
        cached: false,
      })),
    });
  } catch (error) {
    console.error("[digest.history] failed", error);
    return NextResponse.json({ error: "Could not load briefing history" }, { status: 503 });
  }
}
