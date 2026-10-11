export type QuotaInfo = {
  remaining: number;
  limit: number;
  resetsAt: number | null;
};

/** Window event other components can dispatch (via `announceQuota`) so the AppShell meter updates live. */
export const QUOTA_CHANGED_EVENT = "signal:quota-changed";

export function formatResetTime(resetsAt: number | null): string {
  if (!resetsAt) return "Resets at 00:00 UTC";
  const local = new Date(resetsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `Resets at 00:00 UTC (${local} your time)`;
}

/** Next 00:00 UTC after `now` (epoch ms). */
export function nextUtcMidnight(now: number = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** "Resets in 6h 12m (00:00 UTC)". Time dependent — render from client components. */
export function formatResetCountdown(resetsAt: number | null, now: number = Date.now()): string {
  const target = resetsAt ?? nextUtcMidnight(now);
  const mins = Math.max(0, Math.ceil((target - now) / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const span = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return `Resets in ${span} (00:00 UTC)`;
}

/** Plain-language meter copy: "Briefings left today: 2 of 3". */
export function quotaLabel(quota: Pick<QuotaInfo, "remaining" | "limit">): string {
  return `Briefings left today: ${Math.max(0, quota.remaining)} of ${quota.limit}`;
}

/** Parse an `/api/usage` payload; null when it isn't a usage object. */
export function parseQuota(data: unknown): QuotaInfo | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  if (typeof r.remaining !== "number" || typeof r.limit !== "number") return null;
  return {
    remaining: Math.max(0, r.remaining),
    limit: r.limit,
    resetsAt: typeof r.resetsAt === "number" ? r.resetsAt : null,
  };
}

/** GET /api/usage for the signed-in user. Never throws; null on any failure (the server still enforces the quota). */
export async function fetchQuota(signal?: AbortSignal): Promise<QuotaInfo | null> {
  try {
    const res = await fetch("/api/usage", { cache: "no-store", signal });
    if (!res.ok) return null;
    return parseQuota(await res.json());
  } catch {
    return null;
  }
}

/** Tell the AppShell meter (and anyone listening) the quota changed. Client only. */
export function announceQuota(quota: QuotaInfo | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<QuotaInfo | null>(QUOTA_CHANGED_EVENT, { detail: quota }));
}
