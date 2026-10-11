import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DigestRequestSchema } from "@/types/digest";
import { getAuthedConvexClient, getConvexErrorData } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";
export const maxDuration = 60;

const STATUS_BY_CODE: Record<string, number> = {
  UNAUTHENTICATED: 401,
  INVALID_TOPICS: 400,
  QUOTA_EXCEEDED: 429,
  UPSTREAM_TIMEOUT: 503,
  UPSTREAM_FAILED: 503,
  BAD_MODEL_OUTPUT: 502,
  CONFIG: 500,
};

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    userId = (await auth()).userId;
  } catch {
    return NextResponse.json(
      { error: "Authentication is not configured correctly", code: "CONFIG" },
      { status: 500 },
    );
  }

  if (!userId) {
    return NextResponse.json({ error: "Authentication required", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "INVALID_TOPICS" }, { status: 400 });
  }

  const validated = DigestRequestSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Invalid topics payload", code: "INVALID_TOPICS", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  let convex;
  try {
    convex = await getAuthedConvexClient();
  } catch (error) {
    console.error("[digest.route] convexAuthFailed", error);
    return NextResponse.json({ error: "Backend authentication is misconfigured", code: "CONFIG" }, { status: 500 });
  }

  try {
    const result = await convex.action(api.generate.generateDigest, { topics: validated.data.topics });
    return NextResponse.json({
      stories: result.stories,
      generatedAt: new Date(result.generatedAt).toISOString(),
      model: result.model,
      shareId: result.shareId,
      cached: result.cached,
      remaining: result.remaining,
      limit: result.limit,
    });
  } catch (error) {
    const data = getConvexErrorData(error);
    if (!data?.code) {
      console.error("[digest.route] unexpectedError", error);
      return NextResponse.json(
        { error: "Briefing service unavailable, try again shortly", code: "UPSTREAM_FAILED" },
        { status: 503 },
      );
    }

    const status = STATUS_BY_CODE[data.code] ?? 500;
    const payload: Record<string, unknown> = { error: data.message ?? "Request failed", code: data.code };
    if (typeof data.remaining === "number") payload.remaining = data.remaining;
    if (typeof data.limit === "number") payload.limit = data.limit;

    const headers: Record<string, string> = {};
    if (data.code === "UPSTREAM_TIMEOUT") headers["Retry-After"] = "15";

    return NextResponse.json(payload, { status, headers });
  }
}
