import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_TOPICS = new Set([
  "AI & LLMs",
  "Startup Funding",
  "Big Tech",
  "Developer Tools",
  "Crypto & Web3",
  "Policy & Regulation",
  "Hardware & Chips",
  "Layoffs & Hiring",
]);

function validateInput(args: { topics: string[]; timezone: string; deliveryHour: number }) {
  if (args.topics.length < 1 || args.topics.length > 8) {
    throw new Error("topics must contain 1-8 entries");
  }
  for (const t of args.topics) {
    if (!ALLOWED_TOPICS.has(t)) throw new Error(`Unsupported topic: ${t}`);
  }
  if (!Number.isInteger(args.deliveryHour) || args.deliveryHour < 0 || args.deliveryHour > 23) {
    throw new Error("deliveryHour must be an integer 0-23");
  }
  if (typeof args.timezone !== "string" || args.timezone.length === 0 || args.timezone.length > 64) {
    throw new Error("timezone must be a non-empty IANA tz string");
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
    if (!identity) throw new Error("Not authenticated");

    const accountId = identity.subject;
    const email =
      typeof identity.email === "string" && identity.email.length > 0
        ? identity.email
        : null;
    if (!email) {
      throw new Error("Clerk identity is missing an email; cannot subscribe");
    }

    validateInput(args);

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        topics: args.topics,
        timezone: args.timezone,
        deliveryHour: args.deliveryHour,
        active: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscribers", {
      accountId,
      email,
      topics: args.topics,
      timezone: args.timezone,
      deliveryHour: args.deliveryHour,
      active: true,
    });
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
    if (!identity) throw new Error("Not authenticated");

    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_accountId", (q) => q.eq("accountId", identity.subject))
      .unique();

    if (!sub) return { changed: false };

    await ctx.db.patch(sub._id, { active: false });
    return { changed: true };
  },
});
