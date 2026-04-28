import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const shareId = id;
  if (!shareId) {
    return NextResponse.json({ error: "Missing share id" }, { status: 400 });
  }

  const convex = getConvexClient();
  const digest = await convex.query(api.digests.getByShareId, { shareId });

  if (!digest) {
    return NextResponse.json(
      { error: "Digest not found or expired" },
      { status: 404 },
    );
  }

  return NextResponse.json(digest);
}
