import { nanoid } from "nanoid";
import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { storyValidator } from "./schema";
import { SUPPORTED_TOPICS } from "./lib/llm";
import type { Doc } from "./_generated/dataModel";

export const DIGEST_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const SHOWCASE_ACCOUNT_ID = "system:showcase";
const HISTORY_MAX_ITEMS = 30;
const LANDING_COUNT_CAP = 1000;

const PREVIEW_WINDOW_MS = 48 * 60 * 60 * 1000;
// Showcase runs every 6h, so ~8 digests per 48h; headroom for manual runs.
const PREVIEW_MAX_DIGESTS = 16;
const PREVIEW_MAX_STORIES = 7;
const PREVIEW_MIN_EXACT = 3;
// When too few stories match, pad with other showcase stories up to this many.
const PREVIEW_TOPUP_TARGET = 5;
const PREVIEW_MAX_INPUT_TOPICS = 16;

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
      expiresAt: now + DIGEST_RETENTION_MS,
    });
    return { id, shareId, generatedAt: now };
  },
});

// Gives `accountId` its own copy of a shared-cache digest so it shows in their
// history and its share link survives the original owner deleting their account.
// At most one copy per (account, source digest), so cache hits can't grow the table.
export const adoptCachedDigestInternal = internalMutation({
  args: {
    accountId: v.string(),
    digestId: v.id("digests"),
  },
  handler: async (ctx, { accountId, digestId }) => {
    const source = await ctx.db.get("digests", digestId);
    if (!source) return null;
    if (source.ownerAccountId === accountId) {
      return { id: source._id, shareId: source.shareId, generatedAt: source.generatedAt };
    }

    const existing = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_topicsKey_and_generatedAt", (q) =>
        q.eq("ownerAccountId", accountId).eq("topicsKey", source.topicsKey).gte("generatedAt", source.generatedAt),
      )
      .first();
    if (existing) {
      return { id: existing._id, shareId: existing.shareId, generatedAt: existing.generatedAt };
    }

    const shareId = nanoid(12);
    const id = await ctx.db.insert("digests", {
      shareId,
      ownerAccountId: accountId,
      topics: source.topics,
      topicsKey: source.topicsKey,
      stories: source.stories,
      model: source.model,
      generatedAt: source.generatedAt,
      expiresAt: Date.now() + DIGEST_RETENTION_MS,
    });
    return { id, shareId, generatedAt: source.generatedAt };
  },
});

// The signed-in user's own digests from the last 30 days, newest first.
export const listRecentByAccount = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }
    const maxItems = Math.max(1, Math.min(HISTORY_MAX_ITEMS, Math.floor(limit ?? HISTORY_MAX_ITEMS)));
    const now = Date.now();

    const docs = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_generatedAt", (q) =>
        q.eq("ownerAccountId", identity.subject).gte("generatedAt", now - DIGEST_RETENTION_MS),
      )
      .order("desc")
      .take(maxItems);

    return docs.filter((d) => d.expiresAt >= now);
  },
});

// Shared cross-user cache. Internal only: every digest is produced server-side
// by generate.ts / newsletter / showcase, so nothing user-supplied can land here.
export const getRecentByTopicsKey = internalQuery({
  args: {
    topicsKey: v.string(),
    maxAgeMs: v.optional(v.number()),
  },
  handler: async (ctx, { topicsKey, maxAgeMs }) => {
    const maxAge = maxAgeMs ?? DEFAULT_CACHE_MAX_AGE_MS;
    const now = Date.now();

    const digest = await ctx.db
      .query("digests")
      .withIndex("by_topicsKey_and_generatedAt", (q) =>
        q.eq("topicsKey", topicsKey).gte("generatedAt", now - maxAge),
      )
      .order("desc")
      .first();

    if (!digest || digest.expiresAt < now) return null;
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

// Public landing data. `latest` only ever comes from the system showcase
// digest so a real user's briefing is never exposed.
export const landingStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const latest = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_generatedAt", (q) => q.eq("ownerAccountId", SHOWCASE_ACCOUNT_ID))
      .order("desc")
      .first();

    const recent = await ctx.db
      .query("digests")
      .withIndex("by_generatedAt", (q) => q.gt("generatedAt", now - 86_400_000))
      .take(LANDING_COUNT_CAP);

    return {
      // Per-account copies of a cached digest share its topicsKey + generatedAt;
      // count each underlying briefing once.
      briefingsLast24h: new Set(recent.map((d) => `${d.topicsKey ?? d.shareId}@${d.generatedAt}`)).size,
      latest:
        latest && latest.expiresAt > now
          ? {
              topics: latest.topics,
              generatedAt: latest.generatedAt,
              stories: latest.stories.slice(0, 4).map((s) => ({
                headline: s.headline,
                category: s.category,
                importance: s.importance,
                signal: s.signal,
                source: s.source,
                url: s.url,
              })),
            }
          : null,
    };
  },
});

type Story = Doc<"digests">["stories"][number];

function normalizeHeadline(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// Public "try before sign-up" preview: a ready-made briefing for the requested
// topics, assembled only from recent system showcase digests (never a real
// user's briefing, and no AI cost). Unknown topics are ignored; no valid topics
// means all topics.
export const previewForTopics = query({
  args: { topics: v.array(v.string()) },
  handler: async (ctx, { topics }) => {
    const supported = new Set(SUPPORTED_TOPICS);
    const requested = new Set(
      topics.slice(0, PREVIEW_MAX_INPUT_TOPICS).filter((t) => supported.has(t)),
    );
    const wanted = requested.size > 0 ? requested : supported;

    const now = Date.now();
    const digests = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_generatedAt", (q) =>
        q.eq("ownerAccountId", SHOWCASE_ACCOUNT_ID).gt("generatedAt", now - PREVIEW_WINDOW_MS),
      )
      .order("desc")
      .take(PREVIEW_MAX_DIGESTS);

    // Newest digest first, so a duplicate headline resolves to its newest copy.
    const seen = new Set<string>();
    const candidates: { story: Story; generatedAt: number }[] = [];
    for (const digest of digests) {
      if (digest.expiresAt < now) continue;
      for (const story of digest.stories) {
        const key = normalizeHeadline(story.headline);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        candidates.push({ story, generatedAt: digest.generatedAt });
      }
    }
    // Stable sort keeps newer stories ahead on equal importance.
    candidates.sort((a, b) => b.story.importance - a.story.importance);

    const matched = candidates.filter((c) => wanted.has(c.story.category));
    let picked = matched.slice(0, PREVIEW_MAX_STORIES);
    const exact = picked.length >= PREVIEW_MIN_EXACT;
    if (!exact) {
      const others = candidates.filter((c) => !wanted.has(c.story.category));
      picked = [...picked, ...others.slice(0, Math.max(0, PREVIEW_TOPUP_TARGET - picked.length))];
    }

    const pickedCategories = new Set(picked.map((c) => c.story.category));
    return {
      stories: picked.map((c) => c.story),
      generatedAt: picked.length > 0 ? Math.max(...picked.map((c) => c.generatedAt)) : null,
      coveredTopics: SUPPORTED_TOPICS.filter((t) => wanted.has(t) && pickedCategories.has(t)),
      exact,
    };
  },
});
