import { NextRequest, NextResponse } from "next/server";
import { ShareRequestSchema } from "@/types/digest";
import { getConvexClient } from "@/lib/convexServer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = ShareRequestSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Invalid share payload", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const convex = getConvexClient();
    const shareId = (await convex.mutation(
      "digests:saveDigest" as never,
      {
        topics: validated.data.topics,
        stories: validated.data.stories,
        model: validated.data.model,
      } as never,
    )) as string;

    return NextResponse.json({ shareId });
  } catch (error) {
    let message = "Failed to create share digest";
    if (error instanceof Error && error.message) {
      message = error.message;
    } else if (typeof error === "string" && error) {
      message = error;
    } else if (error && typeof error === "object") {
      message = JSON.stringify(error);
    }

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
