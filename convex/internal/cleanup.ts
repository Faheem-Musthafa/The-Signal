import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

const BATCH_SIZE = 100;
const EMAIL_QUEUE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;
const DAILY_USAGE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export const purgeExpiredDigests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("digests")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .take(BATCH_SIZE);

    for (const item of expired) {
      await ctx.db.delete(item._id);
    }

    if (expired.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.internal.cleanup.purgeExpiredDigests, {});
    }

    return { deleted: expired.length };
  },
});

export const purgeOldEmailQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - EMAIL_QUEUE_RETENTION_MS;

    const stale = await ctx.db
      .query("emailQueue")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
      .take(BATCH_SIZE);

    let removed = 0;
    for (const row of stale) {
      if (row.status === "pending") continue;
      await ctx.db.delete(row._id);
      removed++;
    }

    if (stale.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.internal.cleanup.purgeOldEmailQueue, {});
    }

    return { deleted: removed };
  },
});

// The legacy IP rate limiter is gone; its rows only need draining.
export const purgeStaleRateLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RATE_LIMIT_RETENTION_MS;

    const stale = await ctx.db
      .query("rateLimits")
      .withIndex("by_windowStart", (q) => q.lt("windowStart", cutoff))
      .take(BATCH_SIZE);

    for (const row of stale) {
      await ctx.db.delete(row._id);
    }

    if (stale.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.internal.cleanup.purgeStaleRateLimits, {});
    }

    return { deleted: stale.length };
  },
});

export const purgeOldDailyUsage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - DAILY_USAGE_RETENTION_MS;

    const stale = await ctx.db
      .query("dailyUsage")
      .withIndex("by_lastUsedAt", (q) => q.lt("lastUsedAt", cutoff))
      .take(BATCH_SIZE);

    for (const row of stale) {
      await ctx.db.delete(row._id);
    }

    if (stale.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.internal.cleanup.purgeOldDailyUsage, {});
    }

    return { deleted: stale.length };
  },
});
