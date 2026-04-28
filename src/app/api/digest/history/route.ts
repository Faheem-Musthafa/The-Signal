import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const convex = await getAuthedConvexClient();
  const history = await convex.query(api.digests.getTodayByAccount, { limit: 8 });

  const uniqueByTopics = new Map<string, (typeof history)[number]>();
  for (const item of history) {
    const key = item.topicsKey ?? [...item.topics].sort().join("|");
    if (!uniqueByTopics.has(key)) {
      uniqueByTopics.set(key, item);
    }
  }

  const uniqueItems = Array.from(uniqueByTopics.values()).slice(0, 8);

  return NextResponse.json({
    items: uniqueItems.map((item) => ({
      shareId: item.shareId,
      topics: item.topics,
      stories: item.stories,
      model: item.model,
      generatedAt: new Date(item.generatedAt).toISOString(),
      cached: false,
    })),
  });
}
