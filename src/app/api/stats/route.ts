import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const convex = getConvexClient();
  const stats = await convex.query(api.digests.landingStats, {});
  return NextResponse.json(stats);
}
