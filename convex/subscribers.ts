import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { SUPPORTED_TOPICS } from "./lib/llm";

const ALLOWED_TOPICS = new Set<string>(SUPPORTED_TOPICS);

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function validateInput(args: { topics: string[]; timezone: string; deliveryHour: number }) {
  if (args.topics.length < 1 || args.topics.length > 8) {
    throw new ConvexError("Pick between 1 and 8 topics.");
  }
  for (const t of args.topics) {
    if (!ALLOWED_TOPICS.has(t)) throw new ConvexError(`Unsupported topic: ${t.slice(0, 64)}`);
  }
  if (!Number.isInteger(args.deliveryHour) || args.deliveryHour < 0 || args.deliveryHour > 23) {
    throw new ConvexError("Delivery hour must be a whole hour between 0 and 23.");
  }
  if (args.timezone.length === 0 || args.timezone.length > 64 || !isValidTimezone(args.timezone)) {
    throw new ConvexError("Unrecognized timezone.");
  }
}

export const upsertSubscriber = mutation({
  args: {
    topics: v.array(v.string()),
    timezone: v.string(),
    deliveryHour: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const accountId = identity.subject;
    const email =
      typeof identity.email === "string" && identity.email.length > 0
        ? identity.email
        : null;
    if (!email) {
      throw new ConvexError("Your account has no email address; add one in account settings to subscribe.");
    }

    const topics = [...new Set(args.topics)];
    validateInput({ ...args, topics });

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .unique();

    if (existing) {
      await ctx.db.patch("subscribers", existing._id, {
        email,
        topics,
        timezone: args.timezone,
        deliveryHour: args.deliveryHour,
        active: true,
      });
      if (!existing.active) {
        await ctx.scheduler.runAfter(0, internal.internal.subscribers.sendWelcomeEmail, { id: existing._id });
      }
      return existing._id;
    }

    const id = await ctx.db.insert("subscribers", {
      accountId,
      email,
      topics,
      timezone: args.timezone,
      deliveryHour: args.deliveryHour,
      active: true,
    });
    await ctx.scheduler.runAfter(0, internal.internal.subscribers.sendWelcomeEmail, { id });
    return id;
  },
});

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", identity.subject))
      .unique();

    if (!sub) return null;

    return {
      topics: sub.topics,
      timezone: sub.timezone,
      deliveryHour: sub.deliveryHour,
      active: sub.active,
      email: sub.email,
      lastDeliveredAt: sub.lastDeliveredAt ?? null,
    };
  },
});

export const deactivateMySubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", identity.subject))
      .unique();

    if (!sub) return { changed: false };

    await ctx.db.patch("subscribers", sub._id, { active: false });
    return { changed: true };
  },
});
