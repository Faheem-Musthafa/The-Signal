import { nanoid } from "nanoid";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const storyValidator = v.object({
  headline: v.string(),
  category: v.string(),
  summary: v.string(),
  importance: v.number(),
  signal: v.string(),
  source: v.string(),
});

export const saveDigest = mutation({
  args: {
    ownerAccountId: v.optional(v.string()),
    topics: v.array(v.string()),
    stories: v.array(storyValidator),
    model: v.string(),
    topicsKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shareId = nanoid(10);
    const now = Date.now();
    await ctx.db.insert("digests", {
      shareId,
      ...args,
      generatedAt: now,
      expiresAt: now + 86_400_000,
    });

    return shareId;
  },
});

export const getTodayByAccount = query({
  args: {
    accountId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, limit }) => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const maxItems = Math.max(1, Math.min(20, limit ?? 10));

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
    accountId: v.string(),
    topicsKey: v.string(),
  },
  handler: async (ctx, { accountId, topicsKey }) => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const docs = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_generatedAt", (q) => q.eq("ownerAccountId", accountId).gte("generatedAt", dayStart))
      .order("desc")
      .take(50);

    const match = docs.find((d) => d.topicsKey === topicsKey && d.expiresAt >= Date.now());
    return match ?? null;
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

    return digest;
  },
});
