import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { makeTest } from "./setup";

const NOW = Date.UTC(2026, 9, 9, 12);
const asUser = { subject: "user_a" };

const stories = [
  {
    headline: "Cached story one",
    category: "Big Tech",
    summary: "Summary.",
    importance: 3,
    signal: "Act.",
    source: "Reuters",
  },
];

describe("generate.generateDigest (no network)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    // Any real network call is a test failure.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network disabled in tests"))),
    );
    vi.stubEnv("FIRECRAWL_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("requires authentication", async () => {
    const t = makeTest();
    await expect(t.action(api.generate.generateDigest, { topics: ["Big Tech"] })).rejects.toMatchObject({
      data: { code: "UNAUTHENTICATED" },
    });
  });

  it.each([[[]], [["Sports"]], [["Big Tech", "Weather"]]])("rejects invalid topics %j", async (topics) => {
    const t = makeTest();
    await expect(
      t.withIdentity(asUser).action(api.generate.generateDigest, { topics }),
    ).rejects.toMatchObject({ data: { code: "INVALID_TOPICS" } });
  });

  it("serves a shared cache hit without consuming quota and gives the caller its own copy", async () => {
    const t = makeTest();
    const source = await t.mutation(internal.digests.saveDigestInternal, {
      accountId: "user_other",
      topics: ["Big Tech", "AI & LLMs"],
      topicsKey: "AI & LLMs|Big Tech",
      stories,
      model: "test/model",
    });

    const result = await t
      .withIdentity(asUser)
      .action(api.generate.generateDigest, { topics: ["AI & LLMs", "Big Tech"] });
    expect(result).toMatchObject({ cached: true, stories, remaining: 3, limit: 3, model: "test/model" });
    expect(result.shareId).not.toBe(source.shareId);

    const usage = await t.query(internal.rateLimits.getUsageInternal, { accountId: "user_a" });
    expect(usage.used).toBe(0);
    const history = await t.withIdentity(asUser).query(api.digests.listRecentByAccount, {});
    expect(history.map((d) => d.shareId)).toEqual([result.shareId]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refunds quota when generation fails", async () => {
    const t = makeTest();
    await expect(
      t.withIdentity(asUser).action(api.generate.generateDigest, { topics: ["Big Tech"] }),
    ).rejects.toMatchObject({ data: { code: "CONFIG", remaining: 3, limit: 3 } });

    const usage = await t.query(internal.rateLimits.getUsageInternal, { accountId: "user_a" });
    expect(usage.used).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refunds quota when every upstream call fails", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-test");
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test");
    const t = makeTest();
    await expect(
      t.withIdentity(asUser).action(api.generate.generateDigest, { topics: ["Big Tech"] }),
    ).rejects.toMatchObject({ data: { code: "UPSTREAM_FAILED" } });
    expect(fetch).toHaveBeenCalled();
    const usage = await t.query(internal.rateLimits.getUsageInternal, { accountId: "user_a" });
    expect(usage.used).toBe(0);
  });

  it("returns QUOTA_EXCEEDED once the daily limit is used", async () => {
    const t = makeTest();
    await t.run((ctx) =>
      ctx.db.insert("dailyUsage", { accountId: "user_a", dayKey: "2026-10-09", count: 3, lastUsedAt: NOW }),
    );
    await expect(
      t.withIdentity(asUser).action(api.generate.generateDigest, { topics: ["Big Tech"] }),
    ).rejects.toMatchObject({ data: { code: "QUOTA_EXCEEDED", remaining: 0, limit: 3 } });
    const usage = await t.query(internal.rateLimits.getUsageInternal, { accountId: "user_a" });
    expect(usage.used).toBe(3);
  });
});
