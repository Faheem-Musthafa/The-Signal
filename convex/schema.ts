import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const storyValidator = v.object({
  headline: v.string(),
  category: v.string(),
  summary: v.string(),
  importance: v.number(),
  signal: v.string(),
  source: v.string(),
});

export default defineSchema({
  digests: defineTable({
    shareId: v.string(),
    ownerAccountId: v.optional(v.string()),
    topics: v.array(v.string()),
    topicsKey: v.optional(v.string()),
    stories: v.array(storyValidator),
    model: v.string(),
    generatedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_shareId", ["shareId"])
    .index("by_topicsKey_and_generatedAt", ["topicsKey", "generatedAt"])
    .index("by_ownerAccountId_and_generatedAt", ["ownerAccountId", "generatedAt"]),

  rateLimits: defineTable({
    ip: v.string(),
    count: v.number(),
    windowStart: v.number(),
  }).index("by_ip", ["ip"]),

  dailyUsage: defineTable({
    accountId: v.string(),
    dayKey: v.string(),
    count: v.number(),
    lastUsedAt: v.number(),
  }).index("by_accountId_and_dayKey", ["accountId", "dayKey"]),

  subscribers: defineTable({
    email: v.string(),
    timezone: v.string(),
    topics: v.array(v.string()),
    deliveryHour: v.number(),
    active: v.boolean(),
    lastDeliveredAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  emailQueue: defineTable({
    email: v.string(),
    digestId: v.id("digests"),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    createdAt: v.number(),
  }),
});
