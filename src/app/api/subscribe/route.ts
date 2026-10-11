import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexError } from "convex/values";
import { SubscribeRequestSchema } from "@/types/digest";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

// ConvexError payloads are user-facing; anything else is an infrastructure failure.
function errorResponse(error: unknown, fallback: string) {
  if (error instanceof ConvexError) {
    const message = typeof error.data === "string" ? error.data : fallback;
    return NextResponse.json({ error: message }, { status: 400 });
  }
  console.error(`[subscribe] ${error instanceof Error ? error.message : String(error)}`);
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const convex = await getAuthedConvexClient();
    const subscription = await convex.query(api.subscribers.getMySubscription, {});
    return NextResponse.json({ subscription });
  } catch (error) {
    return errorResponse(error, "Couldn't load your newsletter settings. Please try again.");
  }
}

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

  const validated = SubscribeRequestSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Invalid subscription settings", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const convex = await getAuthedConvexClient();
    await convex.mutation(api.subscribers.upsertSubscriber, validated.data);
    const subscription = await convex.query(api.subscribers.getMySubscription, {});
    return NextResponse.json({ subscription });
  } catch (error) {
    return errorResponse(error, "Couldn't save your subscription. Please try again.");
  }
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const convex = await getAuthedConvexClient();
    await convex.mutation(api.subscribers.deactivateMySubscription, {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Couldn't unsubscribe. Please try again.");
  }
}
