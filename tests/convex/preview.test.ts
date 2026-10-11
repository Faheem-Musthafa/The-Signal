import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { showcaseTopicsForTime } from "../../convex/internal/showcase";
import { makeTest } from "./setup";

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 9, 12);
const SHOWCASE = "system:showcase";

type TestStory = {
  headline: string;
  category: string;
  summary: string;
  importance: number;
  signal: string;
  source: string;
  url?: string;
};

function story(headline: string, category: string, importance: number, url?: string): TestStory {
  return {
    headline,
    category,
    summary: `${headline} — a summary long enough to look like a real story summary.`,
    importance,
    signal: "Worth watching.",
    source: "Example News",
    ...(url ? { url } : {}),
  };
}

async function saveAt(
  t: ReturnType<typeof makeTest>,
  at: number,
  accountId: string,
  stories: TestStory[],
) {
  vi.setSystemTime(at);
  const topics = [...new Set(stories.map((s) => s.category))];
  await t.mutation(internal.digests.saveDigestInternal, {
    accountId,
    topics,
    topicsKey: [...topics].sort().join("|"),
    stories,
    model: "test/model",
  });
  vi.setSystemTime(NOW);
}

describe("previewForTopics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("only uses showcase digests, never a newer real-user digest", async () => {
    const t = makeTest();
    await saveAt(t, NOW - 2 * HOUR, SHOWCASE, [
      story("Showcase AI one", "AI & LLMs", 3, "https://example.com/ai-1"),
      story("Showcase AI two", "AI & LLMs", 2),
      story("Showcase AI three", "AI & LLMs", 1),
    ]);
    await saveAt(t, NOW - HOUR, "user_private", [story("Private user story", "AI & LLMs", 5)]);

    const preview = await t.query(api.digests.previewForTopics, { topics: ["AI & LLMs"] });
    expect(preview.stories.map((s) => s.headline)).toEqual([
      "Showcase AI one",
      "Showcase AI two",
      "Showcase AI three",
    ]);
    expect(preview.stories[0]).toEqual(story("Showcase AI one", "AI & LLMs", 3, "https://example.com/ai-1"));
    expect(preview.generatedAt).toBe(NOW - 2 * HOUR);
    expect(preview.coveredTopics).toEqual(["AI & LLMs"]);
    expect(preview.exact).toBe(true);
  });

  it("filters by category, dedupes headlines, sorts by importance and caps at 7", async () => {
    const t = makeTest();
    await saveAt(t, NOW - 8 * HOUR, SHOWCASE, [
      story("Funding A", "Startup Funding", 2),
      story("Funding B", "Startup Funding", 5),
      story("Funding C", "Startup Funding", 1),
      story("Chips A", "Hardware & Chips", 5),
    ]);
    await saveAt(t, NOW - 2 * HOUR, SHOWCASE, [
      story("funding  b!", "Startup Funding", 4), // duplicate of "Funding B"
      story("Funding D", "Startup Funding", 3),
      story("Funding E", "Startup Funding", 4),
      story("Funding F", "Startup Funding", 2),
      story("Funding G", "Startup Funding", 3),
      story("Funding H", "Startup Funding", 1),
      story("Crypto A", "Crypto & Web3", 5),
    ]);

    const preview = await t.query(api.digests.previewForTopics, { topics: ["Startup Funding"] });
    expect(preview.stories).toHaveLength(7);
    expect(preview.stories.every((s) => s.category === "Startup Funding")).toBe(true);
    const headlines = preview.stories.map((s) => s.headline);
    // The newest copy of a duplicate wins, and only once.
    expect(headlines).toContain("funding  b!");
    expect(headlines).not.toContain("Funding B");
    const importances = preview.stories.map((s) => s.importance);
    expect(importances).toEqual([...importances].sort((a, b) => b - a));
    expect(importances[0]).toBe(4);
    expect(preview.exact).toBe(true);
    expect(preview.generatedAt).toBe(NOW - 2 * HOUR);
  });

  it("tops up with other showcase stories and reports exact=false when fewer than 3 match", async () => {
    const t = makeTest();
    await saveAt(t, NOW - 3 * HOUR, SHOWCASE, [
      story("Policy A", "Policy & Regulation", 2),
      story("AI A", "AI & LLMs", 5),
      story("AI B", "AI & LLMs", 4),
      story("AI C", "AI & LLMs", 3),
      story("AI D", "AI & LLMs", 2),
      story("AI E", "AI & LLMs", 1),
    ]);

    const preview = await t.query(api.digests.previewForTopics, { topics: ["Policy & Regulation"] });
    expect(preview.exact).toBe(false);
    expect(preview.stories[0].headline).toBe("Policy A");
    expect(preview.stories.length).toBeGreaterThanOrEqual(3);
    expect(preview.stories.length).toBeLessThanOrEqual(7);
    expect(preview.stories.slice(1).every((s) => s.category === "AI & LLMs")).toBe(true);
    expect(preview.coveredTopics).toEqual(["Policy & Regulation"]);
  });

  it("ignores unknown topics, and treats no valid topics as all topics", async () => {
    const t = makeTest();
    await saveAt(t, NOW - HOUR, SHOWCASE, [
      story("Big Tech A", "Big Tech", 4),
      story("Big Tech B", "Big Tech", 3),
      story("Big Tech C", "Big Tech", 2),
      story("Dev A", "Developer Tools", 5),
    ]);

    const filtered = await t.query(api.digests.previewForTopics, { topics: ["Big Tech", "Not A Topic"] });
    expect(filtered.stories.map((s) => s.category)).toEqual(["Big Tech", "Big Tech", "Big Tech"]);
    expect(filtered.coveredTopics).toEqual(["Big Tech"]);
    expect(filtered.exact).toBe(true);

    const all = await t.query(api.digests.previewForTopics, { topics: ["Not A Topic"] });
    expect(all.stories).toHaveLength(4);
    expect(all.coveredTopics).toEqual(["Big Tech", "Developer Tools"]);

    const empty = await t.query(api.digests.previewForTopics, { topics: [] });
    expect(empty.stories).toHaveLength(4);
  });

  it("ignores showcase digests older than 48 hours", async () => {
    const t = makeTest();
    await saveAt(t, NOW - 49 * HOUR, SHOWCASE, [
      story("Old A", "Layoffs & Hiring", 5),
      story("Old B", "Layoffs & Hiring", 4),
      story("Old C", "Layoffs & Hiring", 3),
    ]);

    const none = await t.query(api.digests.previewForTopics, { topics: ["Layoffs & Hiring"] });
    expect(none).toEqual({ stories: [], generatedAt: null, coveredTopics: [], exact: false });

    await saveAt(t, NOW - 47 * HOUR, SHOWCASE, [story("Recent A", "Layoffs & Hiring", 1)]);
    const recent = await t.query(api.digests.previewForTopics, { topics: ["Layoffs & Hiring"] });
    expect(recent.stories.map((s) => s.headline)).toEqual(["Recent A"]);
    expect(recent.exact).toBe(false);
  });
});

describe("showcase rotation", () => {
  it("covers all 8 topics in four disjoint pairs each UTC day", () => {
    const day = Date.UTC(2026, 9, 9);
    const pairs = [0, 6, 12, 18].map((h) => showcaseTopicsForTime(day + h * HOUR + 30_000));
    const all = pairs.flat();
    expect(new Set(all).size).toBe(8);
    expect(all).toHaveLength(8);
    // A run that fires a few minutes early still lands in its own slot.
    expect(showcaseTopicsForTime(day + 6 * HOUR - 2 * 60_000)).toEqual(pairs[1]);
  });
});
