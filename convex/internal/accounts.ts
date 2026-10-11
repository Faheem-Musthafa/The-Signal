import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

const BATCH_SIZE = 100;
const MAX_EMAIL_LENGTH = 320;

// Deletes everything tied to a (deleted) Clerk account in batches; each run
// stays within transaction limits and reschedules itself until done.
export const purgeAccount = internalMutation({
  args: { accountId: v.string() },
  handler: async (ctx, { accountId }) => {
    if (accountId.length === 0) return null;

    const subscribers = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .take(BATCH_SIZE);
    for (const row of subscribers) await ctx.db.delete("subscribers", row._id);

    const digests = await ctx.db
      .query("digests")
      .withIndex("by_ownerAccountId_and_generatedAt", (q) => q.eq("ownerAccountId", accountId))
      .take(BATCH_SIZE);
    for (const row of digests) await ctx.db.delete("digests", row._id);

    const usage = await ctx.db
      .query("dailyUsage")
      .withIndex("by_accountId_and_dayKey", (q) => q.eq("accountId", accountId))
      .take(BATCH_SIZE);
    for (const row of usage) await ctx.db.delete("dailyUsage", row._id);

    const emails = await ctx.db
      .query("emailQueue")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .take(BATCH_SIZE);
    for (const row of emails) await ctx.db.delete("emailQueue", row._id);

    const more = [subscribers, digests, usage, emails].some((rows) => rows.length === BATCH_SIZE);
    if (more) {
      await ctx.scheduler.runAfter(0, internal.internal.accounts.purgeAccount, { accountId });
    } else {
      console.log(`[accounts.purge] completed accountId=${accountId}`);
    }
    return null;
  },
});

// Keeps the newsletter address in sync when the user changes their primary email in Clerk.
export const syncPrimaryEmail = internalMutation({
  args: { accountId: v.string(), email: v.string() },
  handler: async (ctx, { accountId, email }) => {
    const normalized = email.trim();
    if (normalized.length === 0 || normalized.length > MAX_EMAIL_LENGTH || !normalized.includes("@")) {
      return { changed: false };
    }
    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .unique();
    if (!sub || sub.email === normalized) return { changed: false };
    await ctx.db.patch("subscribers", sub._id, { email: normalized });
    return { changed: true };
  },
});
