import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { DigestGenerationError, generateDigestStories, SUPPORTED_TOPICS, type GeneratedStory } from "./lib/llm";

const CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const GENERATION_BUDGET_MS = 45_000;
const MAX_TOPICS = 8;

export type GenerateErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_TOPICS"
  | "QUOTA_EXCEEDED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_FAILED"
  | "BAD_MODEL_OUTPUT"
  | "CONFIG";

type GenerateResult = {
  stories: GeneratedStory[];
  generatedAt: number;
  model: string;
  shareId: string;
  cached: boolean;
  remaining: number;
  limit: number;
};

const PUBLIC_MESSAGES: Record<Exclude<GenerateErrorCode, "UNAUTHENTICATED" | "INVALID_TOPICS" | "QUOTA_EXCEEDED">, string> = {
  UPSTREAM_TIMEOUT: "Live sources are taking too long. Please try again in a moment.",
  UPSTREAM_FAILED: "Live news sources are unavailable right now. Please try again shortly.",
  BAD_MODEL_OUTPUT: "The model did not return a usable briefing. Please try again.",
  CONFIG: "Briefing generation is misconfigured. Please contact support.",
};

function fail(code: GenerateErrorCode, message: string, extra: Record<string, number> = {}): never {
  throw new ConvexError({ code, message, ...extra });
}

function normalizeTopics(topics: string[]): string[] {
  const allowed = new Set(SUPPORTED_TOPICS);
  const deduped = [...new Set(topics.map((t) => t.trim()))];
  if (deduped.length < 1 || deduped.length > MAX_TOPICS) {
    fail("INVALID_TOPICS", `Choose between 1 and ${MAX_TOPICS} topics`);
  }
  const unknown = deduped.filter((t) => !allowed.has(t));
  if (unknown.length > 0) {
    fail("INVALID_TOPICS", `Unsupported topics: ${unknown.slice(0, 3).join(", ")}`.slice(0, 200));
  }
  return deduped;
}

export const generateDigest = action({
  args: { topics: v.array(v.string()) },
  handler: async (ctx, args): Promise<GenerateResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) fail("UNAUTHENTICATED", "Authentication required");
    const accountId = identity.subject;

    const topics = normalizeTopics(args.topics);
    const topicsKey = [...topics].sort().join("|");

    // Cache hits never consume quota.
    const cached = await ctx.runQuery(internal.digests.getRecentByTopicsKey, {
      topicsKey,
      maxAgeMs: CACHE_MAX_AGE_MS,
    });
    if (cached) {
      const usage = await ctx.runQuery(internal.rateLimits.getUsageInternal, { accountId });
      const adopted = await ctx.runMutation(internal.digests.adoptCachedDigestInternal, {
        accountId,
        digestId: cached._id,
      });
      return {
        stories: cached.stories,
        generatedAt: cached.generatedAt,
        model: cached.model,
        shareId: adopted?.shareId ?? cached.shareId,
        cached: true,
        remaining: usage.remaining,
        limit: usage.limit,
      };
    }

    const quota = await ctx.runMutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, { accountId });
    if (!quota.allowed) {
      fail("QUOTA_EXCEEDED", `Daily limit reached (${quota.limit} briefings per day)`, {
        remaining: 0,
        limit: quota.limit,
      });
    }

    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATION_BUDGET_MS);

    try {
      const { stories, model } = await generateDigestStories(topics, { signal: controller.signal });
      if (stories.length < 2) {
        throw new DigestGenerationError("BAD_MODEL_OUTPUT", `Only ${stories.length} valid stories`);
      }

      const saved = await ctx.runMutation(internal.digests.saveDigestInternal, {
        accountId,
        topics,
        topicsKey,
        stories,
        model,
      });

      return {
        stories,
        generatedAt: saved.generatedAt,
        model,
        shareId: saved.shareId,
        cached: false,
        remaining: quota.remaining,
        limit: quota.limit,
      };
    } catch (error) {
      try {
        await ctx.runMutation(internal.rateLimits.refundDailyQuotaInternal, { accountId, dayKey: quota.dayKey });
      } catch (refundError) {
        console.error("[generate] quotaRefundFailed", refundError);
      }

      const code: GenerateErrorCode =
        controller.signal.aborted
          ? "UPSTREAM_TIMEOUT"
          : error instanceof DigestGenerationError
            ? error.code
            : "UPSTREAM_FAILED";
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        `[generate] generationFailed code=${code} durationMs=${Date.now() - startedAt} reason=${reason.slice(0, 300)}`,
      );
      fail(code, PUBLIC_MESSAGES[code as keyof typeof PUBLIC_MESSAGES] ?? PUBLIC_MESSAGES.UPSTREAM_FAILED, {
        remaining: quota.remaining + 1,
        limit: quota.limit,
      });
    } finally {
      clearTimeout(timer);
    }
  },
});
