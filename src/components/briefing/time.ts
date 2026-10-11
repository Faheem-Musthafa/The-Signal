/** Small, pure time helpers for briefing UI (client-side formatting only). */

/** "Today · 09:14", "Yesterday · 18:02", "Mon 6 Oct · 07:00". Empty string for invalid input. */
export function briefingWhen(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();
  const t = d.getTime();
  if (t >= start) return `Today · ${time}`;
  if (t >= start - 86_400_000) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · ${time}`;
}

/** Browser IANA timezone, or "UTC" when unavailable. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Label for a delivery hour in the viewer's clock style ("07:00" / "7:00 AM"). */
export function hourLabel(hour: number): string {
  const d = new Date(2000, 0, 1, hour, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
