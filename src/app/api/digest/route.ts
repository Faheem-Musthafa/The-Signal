import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DigestRequestSchema, StorySchema } from "@/types/digest";
import { buildDigestPrompt } from "@/lib/prompt";
import { extractJsonArray } from "@/lib/json";
import { runFirecrawlAndOpenRouter } from "@/lib/llm";
import { getAuthedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";
export const maxDuration = 60;
const DIGEST_CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000;

function buildTopicsKey(topics: string[]) {
  return [...topics].sort().join("|");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseStories(rawText: string) {
  const jsonArray = extractJsonArray(rawText);
  if (!jsonArray) {
    throw new Error("Model response did not contain a JSON array");
  }

  const parsed = JSON.parse(jsonArray);
  if (!Array.isArray(parsed)) {
    throw new Error("Model response array is invalid");
  }

  return parsed
    .map((item) => StorySchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    const authData = await auth();
    userId = authData.userId;
  } catch {
    return NextResponse.json(
      { error: "Authentication is not configured correctly. Ensure Clerk proxy runs from src/proxy.ts." },
      { status: 500 },
    );
  }

  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = DigestRequestSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Invalid topics payload", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  const { topics } = validated.data;
  const topicsKey = buildTopicsKey(topics);
  const generatedAt = new Date().toISOString();
  const prompt = buildDigestPrompt({ date: generatedAt, topics });
  const model = process.env.PRIMARY_MODEL ?? process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

  const convex = await getAuthedConvexClient();

  let daily: { allowed: boolean; remaining: number; limit?: number };
  try {
    daily = await convex.mutation(api.rateLimits.checkAndIncrementDailyByAccount, {
      dailyMax: 3,
    });
  } catch (error) {
    console.error("Daily quota check failed", error);
    return NextResponse.json(
      { error: "Quota service unavailable, try again shortly" },
      { status: 503 },
    );
  }

  if (!daily.allowed) {
    return NextResponse.json(
      {
        error: "Daily limit reached (3 digests per account)",
        remaining: 0,
        limit: daily.limit ?? 3,
      },
      { status: 429 },
    );
  }

  try {
    const cached = await convex.query(api.digests.getRecentByTopicsKey, {
      topicsKey,
      maxAgeMs: DIGEST_CACHE_MAX_AGE_MS,
    });

    if (cached) {
      return NextResponse.json({
        stories: cached.stories,
        generatedAt: new Date(cached.generatedAt).toISOString(),
        model: cached.model,
        shareId: cached.shareId,
        cached: true,
      });
    }
  } catch {
    // Cache lookup failure should not block digest generation.
  }

  let rawResponse = "";
  try {
    rawResponse = await runFirecrawlAndOpenRouter(topics, prompt);
  } catch (upstreamError) {
    await sleep(5000);
    try {
      rawResponse = await runFirecrawlAndOpenRouter(topics, prompt);
    } catch {
      const message = upstreamError instanceof Error ? upstreamError.message : "Upstream failed";
      return NextResponse.json({ error: message }, { status: 503 });
    }
  }

  let stories;
  try {
    stories = await parseStories(rawResponse);
    if (stories.length < 2) {
      console.warn(`[digest.parse] tooFewStories count=${stories.length} rawLen=${rawResponse.length}`);
      return NextResponse.json(
        { error: "Model output did not contain enough valid stories" },
        { status: 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid model output" },
      { status: 500 },
    );
  }

  let shareId: string | undefined;
  try {
    shareId = await convex.mutation(api.digests.saveDigest, {
      topics,
      topicsKey,
      stories,
      model,
    });
  } catch {
    shareId = undefined;
  }

  return NextResponse.json({
    stories,
    generatedAt,
    model,
    shareId,
  });
}
