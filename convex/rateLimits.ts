import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const checkAndIncrement = mutation({
  args: {
    ip: v.string(),
    max: v.optional(v.number()),
    windowMs: v.optional(v.number()),
  },
  handler: async (ctx, { ip, max, windowMs }) => {
    const WINDOW = windowMs ?? 60 * 60 * 1000;
    const MAX = max ?? 10;
    const now = Date.now();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_ip", (q) => q.eq("ip", ip))
      .unique();

    if (!existing || now - existing.windowStart > WINDOW) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }

      await ctx.db.insert("rateLimits", { ip, count: 1, windowStart: now });
      return { allowed: true, remaining: MAX - 1 };
    }

    if (existing.count >= MAX) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: WINDOW - (now - existing.windowStart),
      };
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, remaining: MAX - existing.count - 1 };
  },
});

export const checkAndIncrementDailyByAccount = mutation({
  args: {
    accountId: v.string(),
    dailyMax: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, dailyMax }) => {
    const MAX = dailyMax ?? 3;
    const now = Date.now();
    const dayKey = new Date(now).toISOString().slice(0, 10);

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
      return { allowed: true, remaining: MAX - 1 };
    }

    if (existing.count >= MAX) {
      return { allowed: false, remaining: 0, limit: MAX };
    }

    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      lastUsedAt: now,
    });

    return { allowed: true, remaining: MAX - existing.count - 1 };
  },
});
