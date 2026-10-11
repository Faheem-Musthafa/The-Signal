import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Shared story shape. `url` is optional so digests saved before source links
// existed still validate.
export const storyValidator = v.object({
  headline: v.string(),
  category: v.string(),
  summary: v.string(),
  importance: v.number(),
  signal: v.string(),
  source: v.string(),
  url: v.optional(v.string()),
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
    .index("by_ownerAccountId_and_generatedAt", ["ownerAccountId", "generatedAt"])
    .index("by_ownerAccountId_and_topicsKey_and_generatedAt", ["ownerAccountId", "topicsKey", "generatedAt"])
    .index("by_expiresAt", ["expiresAt"])
    .index("by_generatedAt", ["generatedAt"]),

  rateLimits: defineTable({
    ip: v.string(),
    count: v.number(),
    windowStart: v.number(),
  })
    .index("by_ip", ["ip"])
    .index("by_windowStart", ["windowStart"]),

  dailyUsage: defineTable({
    accountId: v.string(),
    dayKey: v.string(),
    count: v.number(),
    lastUsedAt: v.number(),
  })
    .index("by_accountId_and_dayKey", ["accountId", "dayKey"])
    .index("by_lastUsedAt", ["lastUsedAt"]),

  subscribers: defineTable({
    accountId: v.string(),
    email: v.string(),
    topics: v.array(v.string()),
    timezone: v.string(),
    deliveryHour: v.number(),
    active: v.boolean(),
    lastDeliveredDayKey: v.optional(v.string()),
    lastDeliveredAt: v.optional(v.number()),
    // Retry bookkeeping: attempts made on `attemptDayKey` (subscriber-local day).
    attemptDayKey: v.optional(v.string()),
    attemptCount: v.optional(v.number()),
    welcomedAt: v.optional(v.number()),
  })
    .index("by_accountId", ["accountId"])
    .index("by_active_and_deliveryHour", ["active", "deliveryHour"]),

  emailQueue: defineTable({
    accountId: v.string(),
    email: v.string(),
    digestId: v.optional(v.id("digests")),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_digestId", ["digestId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_accountId", ["accountId"]),
});
