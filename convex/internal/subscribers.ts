import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateDigestStories } from "../lib/llm";
import { buildDigestEmail } from "../lib/emailTemplate";
import { sendEmail } from "../lib/resend";
import { signUnsubToken, verifyUnsubToken } from "../lib/unsubToken";

const BATCH_SIZE = 5;
const MAX_PER_DAY = 90;

function localHour(now: number, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  return parseInt(fmt.format(new Date(now)), 10);
}

function localDayKey(now: number, timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(now));
}

export const listDueSubscribers = internalQuery({
  args: { nowMs: v.number(), limit: v.number() },
  handler: async (ctx, { nowMs, limit }) => {
    const candidates = await ctx.db
      .query("subscribers")
      .withIndex("by_active_and_deliveryHour", (q) => q.eq("active", true))
      .take(1000);

    const due: Array<{
      _id: typeof candidates[number]["_id"];
      accountId: string;
      email: string;
      topics: string[];
      localDayKey: string;
    }> = [];

    for (const sub of candidates) {
      try {
        if (localHour(nowMs, sub.timezone) !== sub.deliveryHour) continue;
        const dayKey = localDayKey(nowMs, sub.timezone);
        if (sub.lastDeliveredDayKey === dayKey) continue;
        due.push({
          _id: sub._id,
          accountId: sub.accountId,
          email: sub.email,
          topics: sub.topics,
          localDayKey: dayKey,
        });
        if (due.length >= limit) break;
      } catch {
        // skip subscribers with malformed timezone strings
      }
    }

    return due;
  },
});

export const markDelivered = internalMutation({
  args: {
    id: v.id("subscribers"),
    dayKey: v.string(),
  },
  handler: async (ctx, { id, dayKey }) => {
    await ctx.db.patch(id, {
      lastDeliveredDayKey: dayKey,
      lastDeliveredAt: Date.now(),
    });
  },
});

export const recordEmailQueueEntry = internalMutation({
  args: {
    accountId: v.string(),
    email: v.string(),
    digestId: v.optional(v.id("digests")),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailQueue", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const countTodayDeliveries = internalQuery({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("emailQueue")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .order("desc")
      .take(MAX_PER_DAY + 1);
    return recent.filter((row) => row.createdAt >= since).length;
  },
});

export const deactivateByAccountId = internalMutation({
  args: { accountId: v.string() },
  handler: async (ctx, { accountId }) => {
    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .unique();
    if (!sub) return { changed: false };
    if (!sub.active) return { changed: false };
    await ctx.db.patch(sub._id, { active: false });
    return { changed: true };
  },
});

export const sendDueDigests = internalAction({
  args: {},
  handler: async (ctx) => {
    const resendKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    const unsubSecret = process.env.UNSUB_SECRET;
    const siteUrl = process.env.SITE_URL;

    if (!resendKey || !emailFrom || !unsubSecret || !siteUrl) {
      console.warn("[newsletter.cron] missing config; skipping run");
      return { skipped: "missing config" };
    }

    const sentToday = await ctx.runQuery(internal.internal.subscribers.countTodayDeliveries, {});
    const remainingBudget = Math.max(0, MAX_PER_DAY - sentToday);
    if (remainingBudget === 0) {
      console.warn(`[newsletter.cron] daily cap reached (${MAX_PER_DAY})`);
      return { skipped: "daily cap reached" };
    }

    const limit = Math.min(BATCH_SIZE, remainingBudget);
    const due = await ctx.runQuery(internal.internal.subscribers.listDueSubscribers, {
      nowMs: Date.now(),
      limit,
    });

    if (due.length === 0) {
      return { delivered: 0, skipped: 0 };
    }

    let delivered = 0;
    let skipped = 0;

    for (const sub of due) {
      try {
        const quota = await ctx.runMutation(
          internal.rateLimits.checkAndIncrementDailyByAccountInternal,
          { accountId: sub.accountId },
        );
        if (!quota.allowed) {
          console.warn(`[newsletter.cron] quota exceeded accountId=${sub.accountId}`);
          await ctx.runMutation(internal.internal.subscribers.recordEmailQueueEntry, {
            accountId: sub.accountId,
            email: sub.email,
            status: "failed",
            error: "daily quota exceeded",
          });
          skipped++;
          continue;
        }

        const { stories, model } = await generateDigestStories(sub.topics);
        const topicsKey = [...sub.topics].sort().join("|");

        const saved = await ctx.runMutation(internal.digests.saveDigestInternal, {
          accountId: sub.accountId,
          topics: sub.topics,
          stories,
          model,
          topicsKey,
        });

        const token = await signUnsubToken(unsubSecret, sub.accountId);
        const unsubUrl = `${siteUrl.replace(/\/$/, "")}/api/unsubscribe?u=${encodeURIComponent(sub.accountId)}&t=${encodeURIComponent(token)}`;
        const shareUrl = `${siteUrl.replace(/\/$/, "")}/share/${saved.shareId}`;

        const email = buildDigestEmail({
          stories,
          generatedAt: Date.now(),
          topics: sub.topics,
          shareUrl,
          unsubUrl,
        });

        await sendEmail({
          apiKey: resendKey,
          from: emailFrom,
          to: sub.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          listUnsubscribeUrl: unsubUrl,
        });

        await ctx.runMutation(internal.internal.subscribers.recordEmailQueueEntry, {
          accountId: sub.accountId,
          email: sub.email,
          digestId: saved.id,
          status: "sent",
        });
        await ctx.runMutation(internal.internal.subscribers.markDelivered, {
          id: sub._id,
          dayKey: sub.localDayKey,
        });
        delivered++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[newsletter.cron] failed accountId=${sub.accountId} error=${message.slice(0, 240)}`);
        try {
          await ctx.runMutation(internal.internal.subscribers.recordEmailQueueEntry, {
            accountId: sub.accountId,
            email: sub.email,
            status: "failed",
            error: message.slice(0, 500),
          });
        } catch {
          // queue write failure is logged separately by Convex
        }
        skipped++;
      }
    }

    if (due.length === limit && remainingBudget > limit) {
      await ctx.scheduler.runAfter(0, internal.internal.subscribers.sendDueDigests, {});
    }

    return { delivered, skipped };
  },
});

export const unsubscribeByToken = action({
  args: {
    accountId: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { accountId, token }): Promise<{ ok: boolean }> => {
    const secret = process.env.UNSUB_SECRET;
    if (!secret) {
      console.error("[newsletter.unsub] UNSUB_SECRET not configured");
      return { ok: false };
    }

    const valid = await verifyUnsubToken(secret, accountId, token);
    if (!valid) return { ok: false };

    await ctx.runMutation(internal.internal.subscribers.deactivateByAccountId, { accountId });
    return { ok: true };
  },
});
