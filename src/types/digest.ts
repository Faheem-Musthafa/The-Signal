import { z } from "zod";
import { ALLOWED_TOPICS } from "@/lib/topics";

export const StorySchema = z.object({
  headline: z.string().min(5).max(120),
  category: z.enum(ALLOWED_TOPICS),
  summary: z.string().min(50).max(500),
  importance: z.number().int().min(1).max(5),
  signal: z.string().max(200),
  source: z.string().max(100),
  url: z.string().url().max(2048).optional(),
});

export const DigestRequestSchema = z.object({
  topics: z.array(z.enum(ALLOWED_TOPICS)).min(1).max(8),
});

export const DigestResponseSchema = z.object({
  stories: z.array(StorySchema).min(2).max(7),
  generatedAt: z.string().datetime(),
  model: z.string(),
  shareId: z.string().optional(),
  cached: z.boolean().optional(),
  remaining: z.number().int().optional(),
  limit: z.number().int().optional(),
});

export const SubscribeRequestSchema = z.object({
  topics: z.array(z.enum(ALLOWED_TOPICS)).min(1).max(8),
  timezone: z.string().min(1).max(64),
  deliveryHour: z.number().int().min(0).max(23),
});

export type Story = z.infer<typeof StorySchema>;
export type DigestRequest = z.infer<typeof DigestRequestSchema>;
export type DigestResponse = z.infer<typeof DigestResponseSchema>;
export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;
