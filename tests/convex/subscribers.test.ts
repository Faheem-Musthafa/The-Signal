import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { signUnsubToken } from "../../convex/lib/unsubToken";
import { makeTest } from "./setup";

const user = { subject: "user_a", email: "a@example.com" };

function scheduled(t: ReturnType<typeof makeTest>) {
  return t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
}

describe("upsertSubscriber", () => {
  beforeEach(() => {
    // Fake timers keep scheduled functions (welcome email) from actually running.
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 9, 9, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a subscriber and schedules a welcome email", async () => {
    const t = makeTest();
    const id = await t.withIdentity(user).mutation(api.subscribers.upsertSubscriber, {
      topics: ["AI & LLMs", "AI & LLMs", "Big Tech"],
      timezone: "Asia/Kolkata",
      deliveryHour: 7,
    });

    const sub = await t.run((ctx) => ctx.db.get(id));
    expect(sub).toMatchObject({
      accountId: "user_a",
      email: "a@example.com",
      topics: ["AI & LLMs", "Big Tech"],
      timezone: "Asia/Kolkata",
      deliveryHour: 7,
      active: true,
    });

    const jobs = await scheduled(t);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toContain("sendWelcomeEmail");
    expect(jobs[0].args).toEqual([{ id }]);
  });

  it("updates an active subscription without re-sending the welcome email", async () => {
    const t = makeTest();
    const asUser = t.withIdentity(user);
    const id = await asUser.mutation(api.subscribers.upsertSubscriber, {
      topics: ["AI & LLMs"],
      timezone: "UTC",
      deliveryHour: 7,
    });
    const again = await asUser.mutation(api.subscribers.upsertSubscriber, {
      topics: ["Big Tech"],
      timezone: "UTC",
      deliveryHour: 9,
    });
    expect(again).toBe(id);
    expect(await scheduled(t)).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("subscribers").collect())).toHaveLength(1);

    await asUser.mutation(api.subscribers.deactivateMySubscription, {});
    await asUser.mutation(api.subscribers.upsertSubscriber, { topics: ["Big Tech"], timezone: "UTC", deliveryHour: 9 });
    expect(await scheduled(t)).toHaveLength(2);
  });

  it.each([
    [{ topics: [], timezone: "UTC", deliveryHour: 7 }],
    [{ topics: ["Sports"], timezone: "UTC", deliveryHour: 7 }],
    [{ topics: ["AI & LLMs"], timezone: "Mars/Olympus", deliveryHour: 7 }],
    [{ topics: ["AI & LLMs"], timezone: "", deliveryHour: 7 }],
    [{ topics: ["AI & LLMs"], timezone: "UTC", deliveryHour: 24 }],
    [{ topics: ["AI & LLMs"], timezone: "UTC", deliveryHour: -1 }],
    [{ topics: ["AI & LLMs"], timezone: "UTC", deliveryHour: 7.5 }],
  ])("rejects invalid input %j", async (args) => {
    const t = makeTest();
    await expect(t.withIdentity(user).mutation(api.subscribers.upsertSubscriber, args)).rejects.toThrow();
    expect(await t.run((ctx) => ctx.db.query("subscribers").collect())).toHaveLength(0);
    expect(await scheduled(t)).toHaveLength(0);
  });

  it("requires auth and an email address", async () => {
    const t = makeTest();
    const args = { topics: ["AI & LLMs"], timezone: "UTC", deliveryHour: 7 };
    await expect(t.mutation(api.subscribers.upsertSubscriber, args)).rejects.toThrow(/Not authenticated/);
    await expect(
      t.withIdentity({ subject: "user_noemail" }).mutation(api.subscribers.upsertSubscriber, args),
    ).rejects.toThrow(/no email/);
  });
});

describe("newsletter due window", () => {
  async function seed(
    t: ReturnType<typeof makeTest>,
    fields: { timezone: string; deliveryHour: number; lastDeliveredDayKey?: string; attemptDayKey?: string; attemptCount?: number },
  ): Promise<Id<"subscribers">> {
    return t.run((ctx) =>
      ctx.db.insert("subscribers", {
        accountId: `acct_${fields.timezone}_${fields.deliveryHour}`,
        email: "x@example.com",
        topics: ["AI & LLMs"],
        active: true,
        ...fields,
      }),
    );
  }

  async function due(t: ReturnType<typeof makeTest>, nowMs: number) {
    return t.query(internal.internal.subscribers.listDueSubscribers, { nowMs, limit: 10, exclude: [] });
  }

  it("is due from the delivery hour through the 3-hour retry window", async () => {
    const t = makeTest();
    await seed(t, { timezone: "UTC", deliveryHour: 7 });
    expect(await due(t, Date.UTC(2026, 9, 9, 6, 59))).toEqual([]);
    expect((await due(t, Date.UTC(2026, 9, 9, 7, 0)))[0]?.dayKey).toBe("2026-10-09");
    expect((await due(t, Date.UTC(2026, 9, 9, 10, 59)))[0]?.dayKey).toBe("2026-10-09");
    expect(await due(t, Date.UTC(2026, 9, 9, 11, 0))).toEqual([]);
  });

  it("attributes a window that wraps midnight to the day it started", async () => {
    const t = makeTest();
    await seed(t, { timezone: "UTC", deliveryHour: 23 });
    const result = await due(t, Date.UTC(2026, 9, 10, 1, 30));
    expect(result).toHaveLength(1);
    expect(result[0].dayKey).toBe("2026-10-09");
  });

  it("uses the subscriber's local timezone", async () => {
    const t = makeTest();
    // 08:00 in Kolkata (UTC+5:30) is 02:30 UTC.
    await seed(t, { timezone: "Asia/Kolkata", deliveryHour: 8 });
    expect(await due(t, Date.UTC(2026, 9, 9, 2, 15))).toEqual([]);
    expect((await due(t, Date.UTC(2026, 9, 9, 2, 45)))[0]?.dayKey).toBe("2026-10-09");
  });

  it("skips delivered, exhausted and malformed-timezone subscribers", async () => {
    const t = makeTest();
    await seed(t, { timezone: "UTC", deliveryHour: 7, lastDeliveredDayKey: "2026-10-09" });
    await seed(t, { timezone: "UTC", deliveryHour: 8, attemptDayKey: "2026-10-09", attemptCount: 3 });
    await seed(t, { timezone: "Not/AZone", deliveryHour: 7 });
    const fresh = await seed(t, { timezone: "Europe/London", deliveryHour: 8, attemptDayKey: "2026-10-08", attemptCount: 3 });
    const result = await due(t, Date.UTC(2026, 9, 9, 8, 30));
    expect(result.map((r) => r._id)).toEqual([fresh]);
  });

  it("claimDeliveryAttempt allows at most 3 attempts per day", async () => {
    const t = makeTest();
    const id = await seed(t, { timezone: "UTC", deliveryHour: 7 });
    const attempts = [];
    for (let i = 0; i < 4; i++) {
      attempts.push(await t.mutation(internal.internal.subscribers.claimDeliveryAttempt, { id, dayKey: "2026-10-09" }));
    }
    expect(attempts.map((a) => a?.attempt ?? null)).toEqual([1, 2, 3, null]);
    const nextDay = await t.mutation(internal.internal.subscribers.claimDeliveryAttempt, { id, dayKey: "2026-10-10" });
    expect(nextDay?.attempt).toBe(1);
  });
});

describe("unsubscribeByToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("deactivates only with a valid HMAC token", async () => {
    vi.stubEnv("UNSUB_SECRET", "unsub-test-secret");
    const t = makeTest();
    await t.run((ctx) =>
      ctx.db.insert("subscribers", {
        accountId: "user_a",
        email: "a@example.com",
        topics: ["AI & LLMs"],
        timezone: "UTC",
        deliveryHour: 7,
        active: true,
      }),
    );
    const token = await signUnsubToken("unsub-test-secret", "user_a");

    expect(await t.action(api.internal.subscribers.unsubscribeByToken, { accountId: "user_a", token: "bad" })).toEqual({
      ok: false,
    });
    const forOther = await signUnsubToken("unsub-test-secret", "user_b");
    expect(
      await t.action(api.internal.subscribers.unsubscribeByToken, { accountId: "user_a", token: forOther }),
    ).toEqual({ ok: false });
    expect((await t.run((ctx) => ctx.db.query("subscribers").first()))?.active).toBe(true);

    expect(await t.action(api.internal.subscribers.unsubscribeByToken, { accountId: "user_a", token })).toEqual({
      ok: true,
    });
    expect((await t.run((ctx) => ctx.db.query("subscribers").first()))?.active).toBe(false);
  });

  it("fails closed when UNSUB_SECRET is missing", async () => {
    vi.stubEnv("UNSUB_SECRET", "");
    const t = makeTest();
    const token = await signUnsubToken("", "user_a").catch(() => "x");
    expect(await t.action(api.internal.subscribers.unsubscribeByToken, { accountId: "user_a", token })).toEqual({
      ok: false,
    });
  });
});
