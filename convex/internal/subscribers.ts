import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { generateDigestStories } from "../lib/llm";
import { buildDigestEmail, buildWelcomeEmail, type EmailStory } from "../lib/emailTemplate";
import { buildFooterLinks, loadEmailConfig, sendEmail } from "../lib/resend";
import {
  MAX_ACCOUNT_ID_LENGTH,
  MAX_UNSUB_TOKEN_LENGTH,
  verifyUnsubToken,
} from "../lib/unsubToken";

const BATCH_SIZE = 5;
const MAX_PER_DAY = 90;
const MAX_ATTEMPTS_PER_DAY = 3;
// Subscribers stay due for this many hours after their delivery hour so failed sends get retried.
const RETRY_WINDOW_HOURS = 3;
const CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000;
// Continuations stop after this so a chain never overlaps the next hourly cron run.
const CHAIN_MAX_DURATION_MS = 45 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function localHour(now: number, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hourCycle: "h23",
  });
  return parseInt(fmt.format(new Date(now)), 10) % 24;
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

// Returns the local day the current delivery window belongs to, or null if outside the window.
// A window that crosses midnight (e.g. 22:00-01:59) is attributed to the day it started on.
function deliveryDayKey(now: number, timezone: string, deliveryHour: number): string | null {
  const offset = (localHour(now, timezone) - deliveryHour + 24) % 24;
  if (offset > RETRY_WINDOW_HOURS) return null;
  return localDayKey(now - offset * HOUR_MS, timezone);
}

function topicsKeyOf(topics: string[]): string {
  return [...topics].sort().join("|");
}

export const listDueSubscribers = internalQuery({
  args: {
    nowMs: v.number(),
    limit: v.number(),
    exclude: v.array(v.id("subscribers")),
  },
  handler: async (ctx, { nowMs, limit, exclude }) => {
    const excluded = new Set<string>(exclude);
    const candidates = await ctx.db
      .query("subscribers")
      .withIndex("by_active_and_deliveryHour", (q) => q.eq("active", true))
      .take(1000);

    const due: Array<{ _id: Id<"subscribers">; accountId: string; dayKey: string }> = [];

    for (const sub of candidates) {
      if (excluded.has(sub._id)) continue;
      try {
        const dayKey = deliveryDayKey(nowMs, sub.timezone, sub.deliveryHour);
        if (!dayKey) continue;
        if (sub.lastDeliveredDayKey === dayKey) continue;
        const attempts = sub.attemptDayKey === dayKey ? (sub.attemptCount ?? 0) : 0;
        if (attempts >= MAX_ATTEMPTS_PER_DAY) continue;
        due.push({ _id: sub._id, accountId: sub.accountId, dayKey });
        if (due.length >= limit) break;
      } catch {
        // skip subscribers with malformed timezone strings
      }
    }

    return due;
  },
});

// Atomically records a delivery attempt. Returns the fresh subscriber data, or null when the
// subscriber is gone, inactive, already delivered for this day, or out of attempts.
export const claimDeliveryAttempt = internalMutation({
  args: { id: v.id("subscribers"), dayKey: v.string() },
  handler: async (ctx, { id, dayKey }) => {
    const sub = await ctx.db.get("subscribers", id);
    if (!sub || !sub.active) return null;
    if (sub.lastDeliveredDayKey === dayKey) return null;
    const attempts = sub.attemptDayKey === dayKey ? (sub.attemptCount ?? 0) : 0;
    if (attempts >= MAX_ATTEMPTS_PER_DAY) return null;
    await ctx.db.patch("subscribers", id, { attemptDayKey: dayKey, attemptCount: attempts + 1 });
    return {
      accountId: sub.accountId,
      email: sub.email,
      topics: sub.topics,
      timezone: sub.timezone,
      deliveryHour: sub.deliveryHour,
      attempt: attempts + 1,
    };
  },
});

export const completeDelivery = internalMutation({
  args: {
    id: v.id("subscribers"),
    dayKey: v.string(),
    digestId: v.id("digests"),
  },
  handler: async (ctx, { id, dayKey, digestId }) => {
    const sub = await ctx.db.get("subscribers", id);
    if (!sub) return null;
    const now = Date.now();
    await ctx.db.patch("subscribers", id, { lastDeliveredDayKey: dayKey, lastDeliveredAt: now });
    await ctx.db.insert("emailQueue", {
      accountId: sub.accountId,
      email: sub.email,
      digestId,
      status: "sent",
      createdAt: now,
    });
    return null;
  },
});

export const recordEmailQueueEntry = internalMutation({
  args: {
    accountId: v.string(),
    email: v.string(),
    digestId: v.optional(v.id("digests")),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Don't resurrect PII for an account purged while the send was in flight.
    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();
    if (!sub) return null;
    await ctx.db.insert("emailQueue", { ...args, createdAt: Date.now() });
    return null;
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
    await ctx.db.patch("subscribers", sub._id, { active: false });
    return { changed: true };
  },
});

export const sendDueDigests = internalAction({
  args: {
    exclude: v.optional(v.array(v.id("subscribers"))),
    chainStartedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const config = loadEmailConfig("[newsletter.cron]");
    if (!config) return { skipped: "missing config" };

    const chainStartedAt = args.chainStartedAt ?? Date.now();
    const exclude = args.exclude ?? [];

    const sentToday: number = await ctx.runQuery(internal.internal.subscribers.countTodayDeliveries, {});
    const remainingBudget = Math.max(0, MAX_PER_DAY - sentToday);
    if (remainingBudget === 0) {
      console.error(
        `[newsletter.cron] DAILY SEND CAP REACHED (${sentToday}/${MAX_PER_DAY} in last 24h); due subscribers are being skipped this run`,
      );
      return { skipped: "daily cap reached" };
    }

    const limit = Math.min(BATCH_SIZE, remainingBudget);
    const due = await ctx.runQuery(internal.internal.subscribers.listDueSubscribers, {
      nowMs: Date.now(),
      limit,
      exclude,
    });

    if (due.length === 0) {
      return { delivered: 0, failed: 0 };
    }

    let delivered = 0;
    let failed = 0;

    for (const item of due) {
      exclude.push(item._id);
      const sub = await ctx.runMutation(internal.internal.subscribers.claimDeliveryAttempt, {
        id: item._id,
        dayKey: item.dayKey,
      });
      if (!sub) continue;

      try {
        const topicsKey = topicsKeyOf(sub.topics);
        const cached: Doc<"digests"> | null = await ctx.runQuery(internal.digests.getRecentByTopicsKey, {
          topicsKey,
          maxAgeMs: CACHE_MAX_AGE_MS,
        });

        let stories: EmailStory[];
        let digestId: Id<"digests">;
        let shareId: string;
        let generatedAt: number;
        const adopted = cached
          ? await ctx.runMutation(internal.digests.adoptCachedDigestInternal, {
              accountId: sub.accountId,
              digestId: cached._id,
            })
          : null;
        if (cached && adopted) {
          stories = cached.stories;
          digestId = adopted.id;
          shareId = adopted.shareId;
          generatedAt = cached.generatedAt;
        } else {
          const generated = await generateDigestStories(sub.topics);
          const saved = await ctx.runMutation(internal.digests.saveDigestInternal, {
            accountId: sub.accountId,
            topics: sub.topics,
            stories: generated.stories,
            model: generated.model,
            topicsKey,
          });
          stories = generated.stories;
          digestId = saved.id;
          shareId = saved.shareId;
          generatedAt = Date.now();
        }

        const links = await buildFooterLinks(config, sub.accountId);
        const email = buildDigestEmail({
          stories,
          generatedAt,
          topics: sub.topics,
          timezone: sub.timezone,
          deliveryHour: sub.deliveryHour,
          shareUrl: `${config.siteUrl}/share/${encodeURIComponent(shareId)}`,
          ...links,
        });

        await sendEmail({
          apiKey: config.resendKey,
          from: config.emailFrom,
          to: sub.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          listUnsubscribeUrl: links.unsubUrl,
        });

        await ctx.runMutation(internal.internal.subscribers.completeDelivery, {
          id: item._id,
          dayKey: item.dayKey,
          digestId,
        });
        delivered++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[newsletter.cron] failed accountId=${sub.accountId} attempt=${sub.attempt}/${MAX_ATTEMPTS_PER_DAY} error=${message.slice(0, 240)}`,
        );
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
        failed++;
      }
    }

    const budgetLeft = remainingBudget - delivered;
    if (due.length === limit && budgetLeft > 0) {
      if (Date.now() - chainStartedAt < CHAIN_MAX_DURATION_MS) {
        await ctx.scheduler.runAfter(0, internal.internal.subscribers.sendDueDigests, {
          exclude,
          chainStartedAt,
        });
      } else {
        console.warn("[newsletter.cron] chain time budget used; remaining subscribers wait for the next run");
      }
    }

    return { delivered, failed };
  },
});

export const getSubscriberForWelcome = internalQuery({
  args: { id: v.id("subscribers") },
  handler: async (ctx, { id }) => {
    const sub = await ctx.db.get("subscribers", id);
    if (!sub || !sub.active) return null;
    return {
      accountId: sub.accountId,
      email: sub.email,
      topics: sub.topics,
      timezone: sub.timezone,
      deliveryHour: sub.deliveryHour,
    };
  },
});

export const markWelcomed = internalMutation({
  args: { id: v.id("subscribers") },
  handler: async (ctx, { id }) => {
    const sub = await ctx.db.get("subscribers", id);
    if (!sub) return null;
    const now = Date.now();
    await ctx.db.patch("subscribers", id, { welcomedAt: now });
    await ctx.db.insert("emailQueue", {
      accountId: sub.accountId,
      email: sub.email,
      status: "sent",
      createdAt: now,
    });
    return null;
  },
});

export const sendWelcomeEmail = internalAction({
  args: { id: v.id("subscribers") },
  handler: async (ctx, { id }) => {
    const config = loadEmailConfig("[newsletter.welcome]");
    if (!config) return null;

    const sub = await ctx.runQuery(internal.internal.subscribers.getSubscriberForWelcome, { id });
    if (!sub) return null;

    try {
      const links = await buildFooterLinks(config, sub.accountId);
      const email = buildWelcomeEmail({
        topics: sub.topics,
        deliveryHour: sub.deliveryHour,
        timezone: sub.timezone,
        ...links,
      });
      await sendEmail({
        apiKey: config.resendKey,
        from: config.emailFrom,
        to: sub.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        listUnsubscribeUrl: links.unsubUrl,
      });
      await ctx.runMutation(internal.internal.subscribers.markWelcomed, { id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[newsletter.welcome] failed accountId=${sub.accountId} error=${message.slice(0, 240)}`);
      try {
        await ctx.runMutation(internal.internal.subscribers.recordEmailQueueEntry, {
          accountId: sub.accountId,
          email: sub.email,
          status: "failed",
          error: `welcome: ${message.slice(0, 480)}`,
        });
      } catch {
        // queue write failure is logged separately by Convex
      }
    }
    return null;
  },
});

// Public because the Next.js unsubscribe route calls it without auth; the HMAC token is the credential.
export const unsubscribeByToken = action({
  args: {
    accountId: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { accountId, token }): Promise<{ ok: boolean }> => {
    if (
      accountId.length === 0 ||
      accountId.length > MAX_ACCOUNT_ID_LENGTH ||
      token.length === 0 ||
      token.length > MAX_UNSUB_TOKEN_LENGTH
    ) {
      return { ok: false };
    }

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
