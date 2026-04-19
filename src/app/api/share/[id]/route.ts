import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convexServer";

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
  const digest = await convex.query(
    "digests:getByShareId" as never,
    { shareId } as never,
  );

  if (!digest) {
    return NextResponse.json(
      { error: "Digest not found or expired" },
      { status: 404 },
    );
  }

  return NextResponse.json(digest);
}
