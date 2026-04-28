import { nanoid } from "nanoid";
import { v } from "convex/values";
import { internalMutation, mutation, query, type QueryCtx } from "./_generated/server";

const storyValidator = v.object({
  headline: v.string(),
  category: v.string(),
  summary: v.string(),
  importance: v.number(),
  signal: v.string(),
  source: v.string(),
});

async function requireAccountId(ctx: QueryCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

function dayStartMs(now = Date.now()): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export const saveDigest = mutation({
  args: {
    topics: v.array(v.string()),
    stories: v.array(storyValidator),
    model: v.string(),
    topicsKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerAccountId = await requireAccountId(ctx);
    const shareId = nanoid(12);
    const now = Date.now();
    await ctx.db.insert("digests", {
      shareId,
      ownerAccountId,
      ...args,
      generatedAt: now,
      expiresAt: now + 86_400_000,
    });

    return shareId;
  },
});

export const saveDigestInternal = internalMutation({
  args: {
    accountId: v.string(),
    topics: v.array(v.string()),
    stories: v.array(storyValidator),
    model: v.string(),
    topicsKey: v.optional(v.string()),
  },
  handler: async (ctx, { accountId, ...rest }) => {
    const shareId = nanoid(12);
    const now = Date.now();
    const id = await ctx.db.insert("digests", {
      shareId,
      ownerAccountId: accountId,
      ...rest,
      generatedAt: now,
      expiresAt: now + 86_400_000,
    });
    return { id, shareId };
  },
});

export const getTodayByAccount = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const accountId = await requireAccountId(ctx);
    const maxItems = Math.max(1, Math.min(20, limit ?? 10));
    const dayStart = dayStartMs();

    const docs = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_generatedAt", (q) => q.eq("ownerAccountId", accountId).gte("generatedAt", dayStart))
      .order("desc")
      .take(maxItems);

    return docs.filter((d) => d.expiresAt >= Date.now());
  },
});

export const getTodayByAccountAndTopicsKey = query({
  args: {
    topicsKey: v.string(),
  },
  handler: async (ctx, { topicsKey }) => {
    const accountId = await requireAccountId(ctx);
    const dayStart = dayStartMs();

    const match = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_topicsKey_and_generatedAt", (q) =>
        q.eq("ownerAccountId", accountId).eq("topicsKey", topicsKey).gte("generatedAt", dayStart),
      )
      .order("desc")
      .first();

    if (!match || match.expiresAt < Date.now()) return null;
    return match;
  },
});

export const getRecentByTopicsKey = query({
  args: {
    topicsKey: v.string(),
    maxAgeMs: v.optional(v.number()),
  },
  handler: async (ctx, { topicsKey, maxAgeMs }) => {
    const maxAge = maxAgeMs ?? 3 * 60 * 60 * 1000;
    const now = Date.now();

    const recent = await ctx.db
      .query("digests")
      .withIndex("by_topicsKey_and_generatedAt", (q) => q.eq("topicsKey", topicsKey))
      .order("desc")
      .take(1);

    const digest = recent[0];
    if (!digest) return null;
    if (digest.expiresAt < now) return null;
    if (now - digest.generatedAt > maxAge) return null;

    return digest;
  },
});

export const getByShareId = query({
  args: { shareId: v.string() },
  handler: async (ctx, { shareId }) => {
    const digest = await ctx.db
      .query("digests")
      .withIndex("by_shareId", (q) => q.eq("shareId", shareId))
      .unique();

    if (!digest || digest.expiresAt < Date.now()) {
      return null;
    }

    return {
      shareId: digest.shareId,
      topics: digest.topics,
      topicsKey: digest.topicsKey,
      stories: digest.stories,
      model: digest.model,
      generatedAt: digest.generatedAt,
      expiresAt: digest.expiresAt,
    };
  },
});
