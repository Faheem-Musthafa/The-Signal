import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convexServer";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const convex = getConvexClient();
  const history = (await convex.query(
    "digests:getTodayByAccount" as never,
    {
      accountId: userId,
      limit: 8,
    } as never,
  )) as Array<{
    shareId: string;
    topics: string[];
    stories: Array<{
      headline: string;
      category: string;
      summary: string;
      importance: number;
      signal: string;
      source: string;
    }>;
    model: string;
    generatedAt: number;
    topicsKey?: string;
  }>;

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
