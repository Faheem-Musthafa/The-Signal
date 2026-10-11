import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { makeTest } from "./setup";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 9, 12);

const stories = [
  {
    headline: "Acme raises $40M",
    category: "Startup Funding",
    summary: "Acme raised money.",
    importance: 4,
    signal: "Watch Acme.",
    source: "TechCrunch",
    url: "https://news.example.com/acme",
  },
];

function save(
  t: ReturnType<typeof makeTest>,
  accountId: string,
  topics = ["Startup Funding"],
) {
  return t.mutation(internal.digests.saveDigestInternal, {
    accountId,
    topics,
    topicsKey: [...topics].sort().join("|"),
    stories,
    model: "test/model",
  });
}

describe("digests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves a digest retrievable by shareId with 30-day retention", async () => {
    const t = makeTest();
    const { shareId, generatedAt } = await save(t, "user_a");
    expect(generatedAt).toBe(NOW);

    const shared = await t.query(api.digests.getByShareId, { shareId });
    expect(shared).toMatchObject({ shareId, topics: ["Startup Funding"], stories, expiresAt: NOW + 30 * DAY });
    expect(shared).not.toHaveProperty("ownerAccountId");

    expect(await t.query(api.digests.getByShareId, { shareId: "missing" })).toBeNull();
  });

  it("returns null for an expired digest", async () => {
    const t = makeTest();
    const { shareId } = await save(t, "user_a");
    vi.setSystemTime(NOW + 30 * DAY + 1);
    expect(await t.query(api.digests.getByShareId, { shareId })).toBeNull();
  });

  it("landingStats only exposes the system showcase digest", async () => {
    const t = makeTest();
    await save(t, "system:showcase", ["AI & LLMs", "Big Tech"]);
    vi.setSystemTime(NOW + 60_000);
    await save(t, "user_private", ["Startup Funding"]);

    const stats = await t.query(api.digests.landingStats, {});
    expect(stats.briefingsLast24h).toBe(2);
    expect(stats.latest?.topics).toEqual(["AI & LLMs", "Big Tech"]);
  });

  it("landingStats has no latest digest when there is no showcase", async () => {
    const t = makeTest();
    await save(t, "user_private");
    const stats = await t.query(api.digests.landingStats, {});
    expect(stats.latest).toBeNull();
  });

  it("adoptCachedDigestInternal copies once per account and returns the source for its owner", async () => {
    const t = makeTest();
    const source = await save(t, "user_a");

    const own = await t.mutation(internal.digests.adoptCachedDigestInternal, {
      accountId: "user_a",
      digestId: source.id,
    });
    expect(own).toEqual({ id: source.id, shareId: source.shareId, generatedAt: source.generatedAt });

    vi.setSystemTime(NOW + 60_000);
    const copy = await t.mutation(internal.digests.adoptCachedDigestInternal, {
      accountId: "user_b",
      digestId: source.id,
    });
    expect(copy?.id).not.toBe(source.id);
    expect(copy?.shareId).not.toBe(source.shareId);
    expect(copy?.generatedAt).toBe(source.generatedAt);

    const again = await t.mutation(internal.digests.adoptCachedDigestInternal, {
      accountId: "user_b",
      digestId: source.id,
    });
    expect(again).toEqual(copy);

    const all = await t.run((ctx) => ctx.db.query("digests").collect());
    expect(all).toHaveLength(2);
    const adopted = all.find((d) => d.ownerAccountId === "user_b");
    expect(adopted).toMatchObject({ stories, topicsKey: "Startup Funding", expiresAt: NOW + 60_000 + 30 * DAY });
  });

  it("listRecentByAccount returns only the caller's digests, newest first", async () => {
    const t = makeTest();
    await save(t, "user_a", ["AI & LLMs"]);
    vi.setSystemTime(NOW + 1000);
    await save(t, "user_b", ["Big Tech"]);
    vi.setSystemTime(NOW + 2000);
    await save(t, "user_a", ["Developer Tools"]);

    const mine = await t.withIdentity({ subject: "user_a" }).query(api.digests.listRecentByAccount, {});
    expect(mine.map((d) => d.topics[0])).toEqual(["Developer Tools", "AI & LLMs"]);
    expect(mine.every((d) => d.ownerAccountId === "user_a")).toBe(true);

    await expect(t.query(api.digests.listRecentByAccount, {})).rejects.toMatchObject({
      data: { code: "UNAUTHENTICATED" },
    });
  });

  it("getRecentByTopicsKey honours the cache max age", async () => {
    const t = makeTest();
    await save(t, "user_a", ["Big Tech", "AI & LLMs"]);
    const hit = await t.query(internal.digests.getRecentByTopicsKey, { topicsKey: "AI & LLMs|Big Tech" });
    expect(hit?.ownerAccountId).toBe("user_a");

    vi.setSystemTime(NOW + 3 * 60 * 60 * 1000 + 1);
    expect(
      await t.query(internal.digests.getRecentByTopicsKey, { topicsKey: "AI & LLMs|Big Tech" }),
    ).toBeNull();
  });
});
