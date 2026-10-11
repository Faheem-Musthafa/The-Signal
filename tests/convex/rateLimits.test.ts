import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { makeTest } from "./setup";

const NOW = Date.UTC(2026, 9, 9, 15, 30);

describe("daily quota", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows 3 generations per day, then denies", async () => {
    const t = makeTest();
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(
        await t.mutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, { accountId: "user_a" }),
      );
    }
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[0]).toMatchObject({ limit: 3, dayKey: "2026-10-09" });

    // Other accounts are unaffected.
    const other = await t.mutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, {
      accountId: "user_b",
    });
    expect(other.allowed).toBe(true);
  });

  it("refund restores one unit and never goes below zero", async () => {
    const t = makeTest();
    for (let i = 0; i < 3; i++) {
      await t.mutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, { accountId: "user_a" });
    }
    await t.mutation(internal.rateLimits.refundDailyQuotaInternal, { accountId: "user_a", dayKey: "2026-10-09" });
    const again = await t.mutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, {
      accountId: "user_a",
    });
    expect(again).toMatchObject({ allowed: true, remaining: 0 });

    // Refund for an unknown row / day is a no-op.
    await t.mutation(internal.rateLimits.refundDailyQuotaInternal, { accountId: "user_x", dayKey: "2026-10-09" });
    const usage = await t.query(internal.rateLimits.getUsageInternal, { accountId: "user_x" });
    expect(usage.used).toBe(0);
  });

  it("resets on the next UTC day", async () => {
    const t = makeTest();
    for (let i = 0; i < 3; i++) {
      await t.mutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, { accountId: "user_a" });
    }
    vi.setSystemTime(Date.UTC(2026, 9, 10, 0, 0, 1));
    const next = await t.mutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, {
      accountId: "user_a",
    });
    expect(next).toMatchObject({ allowed: true, remaining: 2, dayKey: "2026-10-10" });
  });

  it("getMyUsage reports the caller's usage and requires auth", async () => {
    const t = makeTest();
    await t.mutation(internal.rateLimits.checkAndIncrementDailyByAccountInternal, { accountId: "user_a" });

    const usage = await t.withIdentity({ subject: "user_a" }).query(api.rateLimits.getMyUsage, {});
    expect(usage).toEqual({ used: 1, remaining: 2, limit: 3, resetsAt: Date.UTC(2026, 9, 10) });

    const fresh = await t.withIdentity({ subject: "user_b" }).query(api.rateLimits.getMyUsage, {});
    expect(fresh).toMatchObject({ used: 0, remaining: 3 });

    await expect(t.query(api.rateLimits.getMyUsage, {})).rejects.toMatchObject({
      data: { code: "UNAUTHENTICATED" },
    });
  });
});
