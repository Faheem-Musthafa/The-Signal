import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Webhook } from "svix";
import { internal } from "../../convex/_generated/api";
import { makeTest } from "./setup";

const NOW = Date.UTC(2026, 9, 9, 12);

async function seedAccount(t: ReturnType<typeof makeTest>, accountId: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert("subscribers", {
      accountId,
      email: `${accountId}@example.com`,
      topics: ["AI & LLMs"],
      timezone: "UTC",
      deliveryHour: 8,
      active: true,
    });
    const digestId = await ctx.db.insert("digests", {
      shareId: `share_${accountId}`,
      ownerAccountId: accountId,
      topics: ["AI & LLMs"],
      topicsKey: "AI & LLMs",
      stories: [],
      model: "m",
      generatedAt: NOW,
      expiresAt: NOW + 1000,
    });
    await ctx.db.insert("dailyUsage", { accountId, dayKey: "2026-10-09", count: 2, lastUsedAt: NOW });
    await ctx.db.insert("emailQueue", {
      accountId,
      email: `${accountId}@example.com`,
      digestId,
      status: "sent",
      createdAt: NOW,
    });
  });
}

async function countRows(t: ReturnType<typeof makeTest>) {
  return t.run(async (ctx) => {
    const tables = ["subscribers", "digests", "dailyUsage", "emailQueue"] as const;
    const out: Record<string, string[]> = {};
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      out[table] = rows.map((r) => ("accountId" in r ? r.accountId : r.ownerAccountId) ?? "");
    }
    return out;
  });
}

describe("account purge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("purgeAccount deletes every row for that account only", async () => {
    const t = makeTest();
    await seedAccount(t, "user_gone");
    await seedAccount(t, "user_stays");

    await t.mutation(internal.internal.accounts.purgeAccount, { accountId: "user_gone" });

    const rows = await countRows(t);
    for (const owners of Object.values(rows)) expect(owners).toEqual(["user_stays"]);
  });

  it("purgeAccount reschedules itself when a table has more than one batch", async () => {
    const t = makeTest();
    await t.run(async (ctx) => {
      for (let i = 0; i < 101; i++) {
        await ctx.db.insert("dailyUsage", { accountId: "user_big", dayKey: `d${i}`, count: 1, lastUsedAt: NOW });
      }
    });
    await t.mutation(internal.internal.accounts.purgeAccount, { accountId: "user_big" });
    expect(await t.run((ctx) => ctx.db.query("dailyUsage").collect())).toHaveLength(1);

    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query("dailyUsage").collect())).toHaveLength(0);
  });

  it("Clerk user.deleted webhook purges the account; bad signatures are rejected", async () => {
    vi.useRealTimers(); // svix checks the timestamp against the real clock
    const secret = `whsec_${btoa("clerk-webhook-test-secret-32bytes!")}`;
    vi.stubEnv("CLERK_WEBHOOK_SECRET", secret);
    const t = makeTest();
    await seedAccount(t, "user_gone");
    await seedAccount(t, "user_stays");

    const payload = JSON.stringify({ type: "user.deleted", data: { id: "user_gone", deleted: true } });
    const msgId = "msg_test_1";
    const timestamp = new Date();
    const signature = new Webhook(secret).sign(msgId, timestamp, payload);
    const headers = {
      "svix-id": msgId,
      "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "svix-signature": signature,
    };

    const forged = await t.fetch("/clerk-webhook", {
      method: "POST",
      headers: { ...headers, "svix-signature": "v1,AAAA" },
      body: payload,
    });
    expect(forged.status).toBe(400);
    expect((await countRows(t)).subscribers).toHaveLength(2);

    const unsigned = await t.fetch("/clerk-webhook", { method: "POST", body: payload });
    expect(unsigned.status).toBe(400);

    const ok = await t.fetch("/clerk-webhook", { method: "POST", headers, body: payload });
    expect(ok.status).toBe(200);
    const rows = await countRows(t);
    for (const owners of Object.values(rows)) expect(owners).toEqual(["user_stays"]);
  });

  it("Clerk user.updated webhook syncs the newsletter email", async () => {
    vi.useRealTimers();
    const secret = `whsec_${btoa("clerk-webhook-test-secret-32bytes!")}`;
    vi.stubEnv("CLERK_WEBHOOK_SECRET", secret);
    const t = makeTest();
    await seedAccount(t, "user_a");

    const payload = JSON.stringify({
      type: "user.updated",
      data: {
        id: "user_a",
        primary_email_address_id: "idn_2",
        email_addresses: [
          { id: "idn_1", email_address: "old@example.com" },
          { id: "idn_2", email_address: "new@example.com" },
        ],
      },
    });
    const timestamp = new Date();
    const res = await t.fetch("/clerk-webhook", {
      method: "POST",
      headers: {
        "svix-id": "msg_test_2",
        "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
        "svix-signature": new Webhook(secret).sign("msg_test_2", timestamp, payload),
      },
      body: payload,
    });
    expect(res.status).toBe(200);
    const sub = await t.run((ctx) => ctx.db.query("subscribers").first());
    expect(sub?.email).toBe("new@example.com");
  });
});
