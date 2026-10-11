import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const convex = await getAuthedConvexClient();
    const usage = await convex.query(api.rateLimits.getMyUsage, {});
    return NextResponse.json(usage, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[usage] failed", error);
    return NextResponse.json({ error: "Could not load usage" }, { status: 503 });
  }
}
