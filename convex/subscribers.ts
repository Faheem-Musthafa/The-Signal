import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertSubscriber = mutation({
  args: {
    email: v.string(),
    timezone: v.string(),
    topics: v.array(v.string()),
    deliveryHour: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        active: true,
      });
      return existing._id;
    }

    return ctx.db.insert("subscribers", {
      ...args,
      active: true,
    });
  },
});

export const listActiveSubscribers = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("subscribers").collect();
    return all.filter((item) => item.active);
  },
});
