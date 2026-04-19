import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DigestRequestSchema, StorySchema } from "@/types/digest";
import { buildDigestPrompt } from "@/lib/prompt";
import { extractJsonArray } from "@/lib/json";
import { runFirecrawlAndOpenRouter } from "@/lib/llm";
import { getConvexClient } from "@/lib/convexServer";

export const runtime = "nodejs";
export const maxDuration = 60;
const DIGEST_CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000;

function buildTopicsKey(topics: string[]) {
  return [...topics].sort().join("|");
}

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
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

  const ip = getClientIp(req);
  const convex = getConvexClient();

  try {
    const daily = (await convex.mutation(
      "rateLimits:checkAndIncrementDailyByAccount" as never,
      {
        accountId: userId,
        dailyMax: 3,
      } as never,
    )) as { allowed: boolean; remaining: number; limit?: number };

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

    const max = Number(process.env.RATE_LIMIT_MAX ?? "10");
    const windowSec = Number(process.env.RATE_LIMIT_WINDOW ?? "3600");
    const rl = (await convex.mutation(
      "rateLimits:checkAndIncrement" as never,
      {
        ip,
        max,
        windowMs: windowSec * 1000,
      } as never,
    )) as { allowed: boolean; retryAfter?: number };

    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rl.retryAfter ?? 0,
        },
        { status: 429 },
      );
    }
  } catch {
    // Rate limiting should not block digest generation in MVP.
  }

  try {
    const cached = (await convex.query(
      "digests:getRecentByTopicsKey" as never,
      {
        topicsKey,
        maxAgeMs: DIGEST_CACHE_MAX_AGE_MS,
      } as never,
    )) as
      | {
          stories: unknown[];
          generatedAt: number;
          model: string;
          shareId: string;
        }
      | null;

    if (cached) {
      let cachedShareId = cached.shareId;
      let cachedGeneratedAt = cached.generatedAt;
      try {
        const existingToday = (await convex.query(
          "digests:getTodayByAccountAndTopicsKey" as never,
          {
            accountId: userId,
            topicsKey,
          } as never,
        )) as { shareId: string; generatedAt: number } | null;

        if (existingToday) {
          cachedShareId = existingToday.shareId;
          cachedGeneratedAt = existingToday.generatedAt;
        } else {
          cachedShareId = (await convex.mutation(
            "digests:saveDigest" as never,
            {
              ownerAccountId: userId,
              topics,
              topicsKey,
              stories: cached.stories,
              model: cached.model,
            } as never,
          )) as string;
          cachedGeneratedAt = Date.now();
        }
      } catch {
        cachedShareId = cached.shareId;
        cachedGeneratedAt = cached.generatedAt;
      }

      return NextResponse.json({
        stories: cached.stories,
        generatedAt: new Date(cachedGeneratedAt).toISOString(),
        model: cached.model,
        shareId: cachedShareId,
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
    if (stories.length === 0) {
      return NextResponse.json(
        { error: "Model output parsed but contained no valid stories" },
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
    shareId = (await convex.mutation(
      "digests:saveDigest" as never,
      {
        ownerAccountId: userId,
        topics,
        topicsKey,
        stories,
        model: process.env.PRIMARY_MODEL ?? process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
      } as never,
    )) as string;
  } catch {
    shareId = undefined;
  }

  return NextResponse.json({
    stories,
    generatedAt,
    model: process.env.PRIMARY_MODEL ?? process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
    shareId,
  });
}
