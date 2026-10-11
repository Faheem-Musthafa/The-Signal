import { describe, expect, it } from "vitest";
import {
  MAX_ACCOUNT_ID_LENGTH,
  MAX_UNSUB_TOKEN_LENGTH,
  signUnsubToken,
  verifyUnsubToken,
} from "../../convex/lib/unsubToken";

const SECRET = "test-secret-0123456789abcdef";
const ACCOUNT = "user_2abcDEF123";

describe("unsubscribe tokens", () => {
  it("round-trips sign and verify", async () => {
    const token = await signUnsubToken(SECRET, ACCOUNT);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, token)).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const token = await signUnsubToken(SECRET, ACCOUNT);
    const flipped = (token[0] === "A" ? "B" : "A") + token.slice(1);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, flipped)).toBe(false);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, token.slice(0, -2))).toBe(false);
  });

  it("rejects a token for a different account or secret", async () => {
    const token = await signUnsubToken(SECRET, ACCOUNT);
    expect(await verifyUnsubToken(SECRET, "user_someoneElse", token)).toBe(false);
    expect(await verifyUnsubToken("other-secret", ACCOUNT, token)).toBe(false);
  });

  it("rejects empty, over-length and non-base64url input", async () => {
    const token = await signUnsubToken(SECRET, ACCOUNT);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, "")).toBe(false);
    expect(await verifyUnsubToken(SECRET, "", token)).toBe(false);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, "A".repeat(MAX_UNSUB_TOKEN_LENGTH + 1))).toBe(false);
    expect(await verifyUnsubToken(SECRET, "u".repeat(MAX_ACCOUNT_ID_LENGTH + 1), token)).toBe(false);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, token.replace(/.$/, "+"))).toBe(false);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, `${token}=`)).toBe(false);
    expect(await verifyUnsubToken(SECRET, ACCOUNT, "not a token!")).toBe(false);
  });
});
