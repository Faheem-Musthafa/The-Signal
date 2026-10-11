import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generation runs in Convex, so the provider env vars live there; proxy the check.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const convex = await getAuthedConvexClient();
    const report = await convex.action(api.health.llmHealth, {});
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    console.error("[health.llm] failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Health check failed" },
      { status: 503 },
    );
  }
}
