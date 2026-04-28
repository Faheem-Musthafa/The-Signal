import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ShareRequestSchema } from "@/types/digest";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

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
    const convex = await getAuthedConvexClient();
    const shareId = await convex.mutation(api.digests.saveDigest, {
      topics: validated.data.topics,
      stories: validated.data.stories,
      model: validated.data.model,
    });

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
