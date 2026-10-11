/**
 * Friendly copy for briefing errors. The API returns `{ error, code }`; we only
 * ever show copy keyed by `code` (never the raw server text). Pure module, no
 * React, so it is safe anywhere and easy to test.
 */

export type DigestErrorCode =
  | "QUOTA_EXCEEDED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_FAILED"
  | "BAD_MODEL_OUTPUT"
  | "INVALID_TOPICS"
  | "UNAUTHENTICATED"
  | "CONFIG"
  | "NETWORK"
  | "UNKNOWN";

export type FriendlyDigestError = {
  code: DigestErrorCode;
  title: string;
  body: string;
  /** Show a "Try again" button. */
  retry: boolean;
  /** Optional next step besides retrying. */
  action?: { label: string; href: string };
};

const KNOWN = new Set<DigestErrorCode>([
  "QUOTA_EXCEEDED",
  "UPSTREAM_TIMEOUT",
  "UPSTREAM_FAILED",
  "BAD_MODEL_OUTPUT",
  "INVALID_TOPICS",
  "UNAUTHENTICATED",
  "CONFIG",
  "NETWORK",
]);

const NOT_COUNTED = "It didn't use one of today's briefings.";

export function friendlyDigestError(code: unknown): FriendlyDigestError {
  const known: DigestErrorCode =
    typeof code === "string" && KNOWN.has(code as DigestErrorCode) ? (code as DigestErrorCode) : "UNKNOWN";

  switch (known) {
    case "QUOTA_EXCEEDED":
      return {
        code: known,
        title: "You've used today's briefings",
        body: "Your allowance resets at 00:00 UTC. Past briefings in History are free to reopen.",
        retry: false,
        action: { label: "Open History", href: "/briefings" },
      };
    case "UPSTREAM_TIMEOUT":
      return {
        code: known,
        title: "Sources took too long",
        body: `Big news days can slow our sources down. Try again in a minute. ${NOT_COUNTED}`,
        retry: true,
      };
    case "UPSTREAM_FAILED":
      return {
        code: known,
        title: "We couldn't reach our news sources",
        body: `This is usually brief. Try again in a minute. ${NOT_COUNTED}`,
        retry: true,
      };
    case "BAD_MODEL_OUTPUT":
      return {
        code: known,
        title: "Your briefing didn't come out right",
        body: `We caught a problem before showing it to you. Trying again usually works. ${NOT_COUNTED}`,
        retry: true,
      };
    case "INVALID_TOPICS":
      return {
        code: known,
        title: "Those topics didn't work",
        body: "Pick one or more topics from the list and try again.",
        retry: false,
      };
    case "UNAUTHENTICATED":
      return {
        code: known,
        title: "You've been signed out",
        body: "Sign in again to get your briefing. Your topics are kept on this device.",
        retry: false,
        action: { label: "Sign in", href: "/sign-in" },
      };
    case "CONFIG":
      return {
        code: known,
        title: "Something's not set up right on our side",
        body: "It's not something you can fix. Please try again later.",
        retry: false,
      };
    case "NETWORK":
      return {
        code: known,
        title: "You seem to be offline",
        body: "Check your connection and try again.",
        retry: true,
      };
    default:
      return {
        code: "UNKNOWN",
        title: "Something went wrong on our side",
        body: "Please try again in a minute.",
        retry: true,
      };
  }
}
