import { describe, expect, it } from "vitest";
import { ALLOWED_TOPICS } from "@/lib/topics";
import { TOPIC_STYLES, topicGradient, topicStyle } from "@/lib/topicStyle";
import { readingDurationMs, storyKey } from "@/components/story/storyUtils";

describe("topicStyle", () => {
  it("covers every allowed topic with a distinct colour and key", () => {
    expect(TOPIC_STYLES).toHaveLength(ALLOWED_TOPICS.length);
    const colors = new Set(TOPIC_STYLES.map((t) => t.color));
    const keys = new Set(TOPIC_STYLES.map((t) => t.key));
    expect(colors.size).toBe(ALLOWED_TOPICS.length);
    expect(keys.size).toBe(ALLOWED_TOPICS.length);
    for (const t of TOPIC_STYLES) {
      expect(t.label).toBe(t.topic);
      expect(t.glyph.length).toBeGreaterThan(0);
      expect(t.cssVar).toBe(`var(--topic-${t.key})`);
    }
  });

  it("falls back safely for unknown or malformed categories", () => {
    expect(topicStyle("Quantum Gossip").key).toBe("other");
    expect(topicStyle("Quantum Gossip").label).toBe("Quantum Gossip");
    expect(topicStyle("").label).toBe("General");
    expect(topicStyle(undefined).key).toBe("other");
    expect(topicStyle(null).glyph.length).toBeGreaterThan(0);
  });

  it("builds ring gradients", () => {
    expect(topicGradient([])).toBe("#2F4BFF");
    expect(topicGradient(["AI & LLMs"])).toBe("#4338CA");
    expect(topicGradient(["AI & LLMs", "Big Tech"])).toMatch(/^conic-gradient\(/);
  });
});

describe("story utils", () => {
  const story = { headline: "Chips get faster", summary: "word ".repeat(40), signal: "Why it matters" };

  it("clamps reading time to 7–20s", () => {
    expect(readingDurationMs(story)).toBeGreaterThanOrEqual(7000);
    expect(readingDurationMs({ ...story, summary: "word ".repeat(2000) })).toBe(20000);
    expect(readingDurationMs({ headline: "", summary: "", signal: "" })).toBe(7000);
  });

  it("derives stable story keys", () => {
    expect(storyKey({ headline: "A", url: "https://x.com/a" })).toBe(storyKey({ headline: "A", url: "https://x.com/a" }));
    expect(storyKey({ headline: "A" })).not.toBe(storyKey({ headline: "B" }));
  });
});
