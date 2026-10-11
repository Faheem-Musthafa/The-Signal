import { describe, expect, it } from "vitest";
import { friendlyDigestError } from "@/components/briefing/digestErrors";

describe("friendlyDigestError", () => {
  it("maps every API code to friendly copy without leaking server text", () => {
    const codes = ["QUOTA_EXCEEDED", "UPSTREAM_TIMEOUT", "UPSTREAM_FAILED", "BAD_MODEL_OUTPUT", "INVALID_TOPICS", "UNAUTHENTICATED", "CONFIG", "NETWORK"];
    for (const code of codes) {
      const e = friendlyDigestError(code);
      expect(e.code).toBe(code);
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.body.length).toBeGreaterThan(0);
    }
    expect(friendlyDigestError("UPSTREAM_TIMEOUT").title).toBe("Sources took too long");
  });

  it("falls back to a generic message for unknown or missing codes", () => {
    for (const code of [undefined, null, 42, "SOMETHING_NEW", "<html>"]) {
      const e = friendlyDigestError(code);
      expect(e.code).toBe("UNKNOWN");
      expect(e.title).toBe("Something went wrong on our side");
      expect(e.retry).toBe(true);
    }
  });
});
