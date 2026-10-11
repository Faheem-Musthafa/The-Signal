import { internalMutation, internalQuery, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const DAILY_DIGEST_LIMIT = 3;

function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function nextUtcMidnight(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

async function readUsage(ctx: QueryCtx, accountId: string, limit: number) {
  const now = Date.now();
  const row = await ctx.db
    .query("dailyUsage")
    .withIndex("by_accountId_and_dayKey", (q) => q.eq("accountId", accountId).eq("dayKey", utcDayKey(now)))
    .unique();
  const used = row?.count ?? 0;
  return { used, remaining: Math.max(0, limit - used), limit, resetsAt: nextUtcMidnight(now) };
}

async function applyDailyQuota(
  ctx: MutationCtx,
  accountId: string,
  dailyMax: number,
): Promise<{ allowed: boolean; remaining: number; limit: number; dayKey: string }> {
  const now = Date.now();
  const dayKey = utcDayKey(now);

  const existing = await ctx.db
    .query("dailyUsage")
    .withIndex("by_accountId_and_dayKey", (q) => q.eq("accountId", accountId).eq("dayKey", dayKey))
    .unique();

  if (!existing) {
    await ctx.db.insert("dailyUsage", {
      accountId,
      dayKey,
      count: 1,
      lastUsedAt: now,
    });
    return { allowed: true, remaining: dailyMax - 1, limit: dailyMax, dayKey };
  }

  if (existing.count >= dailyMax) {
    return { allowed: false, remaining: 0, limit: dailyMax, dayKey };
  }

  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
    lastUsedAt: now,
  });

  return { allowed: true, remaining: dailyMax - existing.count - 1, limit: dailyMax, dayKey };
}

export const getMyUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }
    return readUsage(ctx, identity.subject, DAILY_DIGEST_LIMIT);
  },
});

export const getUsageInternal = internalQuery({
  args: { accountId: v.string() },
  handler: async (ctx, { accountId }) => {
    return readUsage(ctx, accountId, DAILY_DIGEST_LIMIT);
  },
});

export const checkAndIncrementDailyByAccountInternal = internalMutation({
  args: {
    accountId: v.string(),
    dailyMax: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, dailyMax }) => {
    return applyDailyQuota(ctx, accountId, dailyMax ?? DAILY_DIGEST_LIMIT);
  },
});

// Gives back one unit consumed by a generation that failed. `dayKey` is the key
// returned at consumption time so a refund after midnight hits the right row.
export const refundDailyQuotaInternal = internalMutation({
  args: {
    accountId: v.string(),
    dayKey: v.string(),
  },
  handler: async (ctx, { accountId, dayKey }) => {
    const existing = await ctx.db
      .query("dailyUsage")
      .withIndex("by_accountId_and_dayKey", (q) => q.eq("accountId", accountId).eq("dayKey", dayKey))
      .unique();
    if (!existing || existing.count <= 0) return null;
    await ctx.db.patch(existing._id, { count: existing.count - 1 });
    return null;
  },
});
