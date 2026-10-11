import { formatResetCountdown, formatResetTime, type QuotaInfo } from "@/lib/quota";

export type QuotaBatteryProps = {
  quota: QuotaInfo;
  /**
   * cells — just the battery (with sr-only text)
   * compact — battery + "3/5" (mobile top bar, rail)
   * full — battery + "Briefings left today: 3 of 5" + "Resets in 6h 12m (00:00 UTC)" (dashboard cards)
   */
  variant?: "cells" | "compact" | "full";
  /** Use on dark / coloured surfaces */
  inverse?: boolean;
  className?: string;
};

/**
 * Daily quota meter ("Briefings left today") — one cell per daily briefing, filled = remaining.
 * Server-safe (no hooks). Note: the reset copy depends on the clock/locale; render
 * the `full` variant from client components to avoid hydration drift.
 */
export function QuotaBattery({ quota, variant = "compact", inverse = false, className = "" }: QuotaBatteryProps) {
  const limit = Math.max(0, quota.limit);
  const remaining = Math.max(0, Math.min(limit, quota.remaining));
  const cells = Math.min(limit, 10);
  const filledCells = limit > 10 ? Math.round((remaining / limit) * cells) : remaining;
  const empty = remaining === 0;
  const label = `${remaining} of ${limit} ${limit === 1 ? "briefing" : "briefings"} left today`;

  const fill = inverse ? "bg-white" : empty ? "bg-ink-faint" : "bg-signal";
  const track = inverse ? "bg-white/25" : "bg-ink/[0.08]";
  const frame = inverse ? "border-white/60" : empty ? "border-ink-faint" : "border-ink-2/70";

  const battery = (
    <span aria-hidden="true" className="inline-flex items-center">
      <span className={`inline-flex h-[14px] items-stretch gap-[2px] rounded-[4px] border-[1.5px] p-[1.5px] ${frame}`}>
        {Array.from({ length: Math.max(cells, 1) }).map((_, i) => (
          <span
            key={i}
            className={`block w-[5px] rounded-[1.5px] transition-colors duration-300 ${i < filledCells ? fill : track}`}
          />
        ))}
      </span>
      <span className={`ml-[1.5px] h-[6px] w-[2px] rounded-r-[1px] ${inverse ? "bg-white/60" : empty ? "bg-ink-faint" : "bg-ink-2/70"}`} />
    </span>
  );

  if (variant === "cells") {
    return (
      <span role="img" aria-label={label} title={`${label}. ${formatResetTime(quota.resetsAt)}`} className={`inline-flex ${className}`}>
        {battery}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span
        title={`${label}. ${formatResetTime(quota.resetsAt)}`}
        className={`inline-flex items-center gap-1.5 font-mono text-[12px] font-medium tabular-nums ${inverse ? "text-white" : "text-ink-2"} ${className}`}
      >
        {battery}
        <span aria-hidden="true">
          {remaining}/{limit}
        </span>
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        {battery}
        <span className={`text-[14px] font-semibold tabular-nums ${inverse ? "text-white" : "text-ink"}`}>
          Briefings left today: {remaining} of {limit}
        </span>
      </div>
      <span suppressHydrationWarning className={`text-[12px] tabular-nums ${inverse ? "text-white/75" : "text-ink-mute"}`}>
        {formatResetCountdown(quota.resetsAt)}
      </span>
    </div>
  );
}
