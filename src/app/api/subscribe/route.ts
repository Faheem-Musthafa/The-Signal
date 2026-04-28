import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SubscribeRequestSchema } from "@/types/digest";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const convex = await getAuthedConvexClient();
  const subscription = await convex.query(api.subscribers.getMySubscription, {});

  return NextResponse.json({ subscription });
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
      { error: "Invalid subscribe payload", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const convex = await getAuthedConvexClient();
    await convex.mutation(api.subscribers.upsertSubscriber, validated.data);
    const subscription = await convex.query(api.subscribers.getMySubscription, {});
    return NextResponse.json({ subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save subscription";
    return NextResponse.json({ error: message }, { status: 503 });
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
    const message = error instanceof Error ? error.message : "Failed to unsubscribe";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
