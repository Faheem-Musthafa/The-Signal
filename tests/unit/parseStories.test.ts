import { describe, expect, it } from "vitest";
import { DigestGenerationError, parseStories } from "../../convex/lib/llm";

const SUMMARY = "Acme raised $40M led by Example Ventures to expand its agent platform. It matters for buyers.";
const SCRAPED = "https://news.example.com/acme-raises-40m";

function story(overrides: Record<string, unknown> = {}) {
  return {
    headline: "Acme raises $40M Series B",
    category: "Startup Funding",
    summary: SUMMARY,
    importance: 4,
    signal: "Expect pricing pressure on rival agent platforms.",
    source: "TechCrunch",
    url: SCRAPED,
    ...overrides,
  };
}

function expectBadOutput(raw: string) {
  try {
    parseStories(raw, new Set());
  } catch (error) {
    expect(error).toBeInstanceOf(DigestGenerationError);
    expect((error as DigestGenerationError).code).toBe("BAD_MODEL_OUTPUT");
    return;
  }
  throw new Error("expected parseStories to throw");
}

describe("parseStories", () => {
  it("keeps url only when it is one of the scraped URLs", () => {
    const [kept] = parseStories(JSON.stringify([story()]), new Set([SCRAPED]));
    expect(kept.url).toBe(SCRAPED);
  });

  it("keeps the story but drops a url that was not scraped", () => {
    const stories = parseStories(
      JSON.stringify([story({ url: "https://invented.example.com/fake" })]),
      new Set([SCRAPED]),
    );
    expect(stories).toHaveLength(1);
    expect(stories[0]).not.toHaveProperty("url");
    expect(stories[0].headline).toBe("Acme raises $40M Series B");
  });

  it("drops non-string urls", () => {
    const [s] = parseStories(JSON.stringify([story({ url: 42 })]), new Set([SCRAPED]));
    expect(s).not.toHaveProperty("url");
  });

  it("drops items with an unknown category or a too-short summary", () => {
    const stories = parseStories(
      JSON.stringify([
        story({ headline: "Valid story headline" }),
        story({ category: "Sports" }),
        story({ summary: "Too short." }),
        story({ importance: "5" }),
        null,
        "not an object",
      ]),
      new Set(),
    );
    expect(stories.map((s) => s.headline)).toEqual(["Valid story headline"]);
  });

  it("extracts the array from fenced or chatty output", () => {
    const raw = "Here you go:\n```json\n" + JSON.stringify([story()]) + "\n```\nThanks!";
    expect(parseStories(raw, new Set())).toHaveLength(1);
  });

  it("throws BAD_MODEL_OUTPUT when there is no JSON array", () => {
    expectBadOutput("I could not find any stories today.");
    expectBadOutput('{"headline":"object, not array"}');
  });

  it("throws BAD_MODEL_OUTPUT on malformed JSON", () => {
    expectBadOutput("[{headline: oops}]");
  });

  it("clamps importance, sorts descending and caps at 7 stories", () => {
    const input = [1, 9, 3, 2, 5, 4, -2, 3, 5, 2].map((importance, i) =>
      story({ headline: `Story number ${i}`, importance }),
    );
    const stories = parseStories(JSON.stringify(input), new Set());
    expect(stories).toHaveLength(7);
    const importances = stories.map((s) => s.importance);
    expect(importances).toEqual([...importances].sort((a, b) => b - a));
    expect(Math.max(...importances)).toBe(5);
    expect(importances.every((n) => n >= 1 && n <= 5)).toBe(true);
    expect(stories[0].headline).toBe("Story number 1");
  });
});
