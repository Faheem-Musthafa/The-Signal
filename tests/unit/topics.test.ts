import { describe, expect, it } from "vitest";
import { ALLOWED_TOPICS, TOPIC_QUERY_MAP } from "@/lib/topics";
import { SUPPORTED_TOPICS } from "../../convex/lib/llm";

describe("topics", () => {
  it("has 8 unique allowed topics", () => {
    expect(ALLOWED_TOPICS).toHaveLength(8);
    expect(new Set(ALLOWED_TOPICS).size).toBe(8);
  });

  it("maps every topic to at least one search query", () => {
    for (const topic of ALLOWED_TOPICS) {
      expect(TOPIC_QUERY_MAP[topic]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("keeps the UI allowlist in sync with the Convex generation pipeline", () => {
    expect([...SUPPORTED_TOPICS].sort()).toEqual([...ALLOWED_TOPICS].sort());
  });
});
