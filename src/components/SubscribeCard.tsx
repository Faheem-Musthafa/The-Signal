"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { toast } from "sonner";
import type { Topic } from "@/lib/topics";
import { SIGNAL_WAVE_PATH } from "@/lib/topicStyle";
import { haptic } from "@/components/story";
import { Button, Card, IconButton, IconChevronLeft, IconChevronRight, IconReplay, TopicChip } from "@/components/ui";
import { TopicTiles } from "@/components/landing/TopicTiles";
import { DEFAULT_TOPICS, sanitizeTopics, useStoredTopics } from "@/components/landing/preferences";

type Subscription = {
  topics: Topic[];
  timezone: string;
  deliveryHour: number;
  active: boolean;
  email: string;
  lastDeliveredAt: number | null;
};

type SubscribeCardProps = {
  /** Fallback topics when there's no subscription and no dashboard picks on this device. */
  initialTopics?: readonly Topic[];
};

function formatHour(h: number): string {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:00 ${ampm}`;
}

function shortHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function partOfDay(h: number): string {
  if (h < 5) return "Late night";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";
  return "Night";
}

const PRESETS = [6, 7, 8, 12, 18, 21] as const;

/** Common IANA zones for the picker; the detected and saved zones are always added. */
const COMMON_TIMEZONES = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "UTC",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Perth",
  "Australia/Brisbane",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

function zoneLabel(zone: string): string {
  return zone === "UTC" ? "UTC" : zone.split("_").join(" ").split("/").join(" / ");
}

/** Friendly copy for failed requests. Never shows raw server text. */
function friendlyError(status: number | null, action: "load" | "save" | "stop"): string {
  if (status === null) return "Couldn't connect. Check your internet and try again.";
  if (status === 401) return "You've been signed out. Sign in again to continue.";
  if (status === 429) return "Too many changes in a row. Wait a minute and try again.";
  if (status === 400 && action === "save") return "Those settings didn't save. Check your topics, time and time zone, then try again.";
  if (action === "load") return "We couldn't load your daily email settings. Try again in a minute.";
  return "Something went wrong on our side. Try again in a minute.";
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function sameTopics(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((t) => b.includes(t));
}

export function SubscribeCard({ initialTopics = DEFAULT_TOPICS }: SubscribeCardProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmingStop, setConfirmingStop] = useState(false);

  // Edits stay null until the person changes something; the effective value
  // falls back to the saved subscription, then this device's dashboard picks.
  const [draftTopics, setDraftTopics] = useState<Topic[] | null>(null);
  const [draftHour, setDraftHour] = useState<number | null>(null);
  const [draftZone, setDraftZone] = useState<string | null>(null);
  // This component only renders client-side content after the GET resolves, so reading Intl here is safe.
  const [detectedZone] = useState(detectTimezone);
  const storedTopics = useStoredTopics();

  const stopRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const zoneId = useId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscribe", { method: "GET" });
        if (!res.ok) {
          if (!cancelled) setLoadError(friendlyError(res.status, "load"));
          return;
        }
        const data = (await res.json()) as { subscription: Subscription | null };
        if (cancelled) return;
        setLoadError(null);
        setSubscription(data.subscription ?? null);
      } catch {
        if (!cancelled) setLoadError(friendlyError(null, "load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (confirmingStop) keepRef.current?.focus();
  }, [confirmingStop]);

  const isSubscribed = subscription?.active === true;
  const savedTopics = subscription ? sanitizeTopics(subscription.topics) : null;
  const topics: Topic[] =
    draftTopics ?? (savedTopics && savedTopics.length > 0 ? savedTopics : [...(storedTopics ?? initialTopics)]);
  const deliveryHour = draftHour ?? subscription?.deliveryHour ?? 7;
  const timezone = draftZone ?? subscription?.timezone ?? detectedZone;

  const zones = Array.from(new Set<string>([...COMMON_TIMEZONES, detectedZone, timezone])).sort((a, b) =>
    a === "UTC" ? -1 : b === "UTC" ? 1 : a.localeCompare(b),
  );

  const toggleTopic = (topic: Topic) => {
    haptic(8);
    setDraftTopics(topics.includes(topic) ? topics.filter((t) => t !== topic) : [...topics, topic]);
  };

  const changeHour = (h: number) => {
    const next = ((h % 24) + 24) % 24;
    if (next === deliveryHour) return;
    haptic(6);
    setDraftHour(next);
  };

  const changed =
    !subscription ||
    deliveryHour !== subscription.deliveryHour ||
    timezone !== subscription.timezone ||
    !sameTopics(topics, subscription.topics);
  // A paused email can always be turned back on; an active one only saves real changes.
  const canSave = topics.length > 0 && !submitting && (!isSubscribed || changed);
  const dirty = isSubscribed && changed;

  const handleSave = async () => {
    if (topics.length === 0) {
      toast.error("Pick at least one topic.");
      return;
    }
    const wasSubscribed = isSubscribed;
    setSubmitting(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, timezone, deliveryHour }),
      });
      if (!res.ok) {
        const message = friendlyError(res.status, "save");
        setSaveError(message);
        toast.error(message);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { subscription?: Subscription };
      setSubscription(
        data.subscription ?? {
          topics,
          timezone,
          deliveryHour,
          active: true,
          email: subscription?.email ?? "",
          lastDeliveredAt: subscription?.lastDeliveredAt ?? null,
        },
      );
      setDraftTopics(null);
      setDraftHour(null);
      setDraftZone(null);
      toast.success(wasSubscribed ? "Changes saved" : "Daily email is on", {
        description: `It arrives around ${formatHour(deliveryHour)}, ${zoneLabel(timezone)} time.`,
      });
    } catch {
      const message = friendlyError(null, "save");
      setSaveError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelStop = () => {
    setConfirmingStop(false);
    // Return focus to the button that opened the confirm once it is back.
    requestAnimationFrame(() => stopRef.current?.focus());
  };

  const handleStop = async () => {
    setSubmitting(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/subscribe", { method: "DELETE" });
      if (!res.ok) {
        const message = friendlyError(res.status, "stop");
        setSaveError(message);
        toast.error(message);
        return;
      }
      setSubscription((prev) => (prev ? { ...prev, active: false } : prev));
      setConfirmingStop(false);
      toast.success("Daily email is off", { description: "You can turn it back on any time." });
    } catch {
      const message = friendlyError(null, "stop");
      setSaveError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading your daily email settings" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 lg:order-2">
          <div className="h-[260px] rounded-[18px] bg-ink/90 animate-pulse-soft" />
        </div>
        <div className="space-y-4 lg:order-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[88px] rounded-card bg-surface-2 animate-pulse-soft" />
            ))}
          </div>
          <div className="h-56 rounded-card bg-surface-2 animate-pulse-soft" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card role="alert" padding="lg" className="max-w-lg">
        <h2 className="display-sm mb-2">We couldn&apos;t load your daily email.</h2>
        <p className="mb-5 text-[15px] leading-relaxed text-ink-2">{loadError}</p>
        <Button
          variant="secondary"
          leadingIcon={<IconReplay />}
          onClick={() => {
            setLoading(true);
            setLoadError(null);
            setReloadKey((k) => k + 1);
          }}
        >
          Try again
        </Button>
      </Card>
    );
  }

  const lastDelivered = subscription?.lastDeliveredAt
    ? new Date(subscription.lastDeliveredAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const primaryLabel = isSubscribed ? "Save changes" : subscription ? "Turn daily email back on" : "Start my daily email";

  const primaryButton = (fullWidth: boolean) => (
    <Button size="lg" fullWidth={fullWidth} loading={submitting} onClick={handleSave} disabled={!canSave}>
      {submitting ? "Saving…" : primaryLabel}
    </Button>
  );

  const hint = topics.length === 0 ? "Pick at least one topic." : isSubscribed && !changed ? "No changes to save." : null;

  return (
    <div className="grid gap-6 pb-28 md:pb-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      {/* Status card — first on mobile, sticky sidebar on desktop */}
      <aside aria-label="Daily email status" className="lg:sticky lg:top-6 lg:order-2">
        <StatusTicket
          subscription={subscription}
          isSubscribed={isSubscribed}
          deliveryHour={deliveryHour}
          timezone={timezone}
          topics={topics}
          lastDelivered={lastDelivered}
          dirty={dirty}
        />
      </aside>

      <div className="min-w-0 space-y-6 lg:order-1">
        <Card as="section" padding="lg" aria-labelledby="nl-topics">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 id="nl-topics" className="display-sm">
              Topics
            </h2>
            <span className="font-mono text-[13px] font-semibold tabular-nums text-ink-mute">{topics.length} of 8</span>
          </div>
          <p className="mb-5 text-[15px] text-ink-mute">Tap a topic to add it to your email or take it out.</p>
          <TopicTiles label="Topics for your daily email" selected={topics} onToggle={toggleTopic} disabled={submitting} />
        </Card>

        <Card as="section" padding="lg" aria-labelledby="nl-schedule">
          <h2 id="nl-schedule" className="display-sm mb-1">
            When to send it
          </h2>
          <p className="mb-5 text-[15px] text-ink-mute">One email a day, at the time you pick.</p>

          <HourPicker hour={deliveryHour} onChange={changeHour} disabled={submitting} />

          <div className="mt-6">
            <label htmlFor={zoneId} className="block text-[14px] font-semibold text-ink">
              Time zone
            </label>
            <select
              id={zoneId}
              value={timezone}
              disabled={submitting}
              onChange={(e) => setDraftZone(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-rule-strong bg-surface px-3.5 text-[16px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60 sm:max-w-sm"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {zoneLabel(z)}
                  {z === detectedZone ? " (this device)" : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
            Arrives soon after <span className="font-semibold text-ink">{formatHour(deliveryHour)}</span>,{" "}
            <span className="font-semibold text-ink">{zoneLabel(timezone)}</span> time. If sending fails, we keep trying for
            up to 3 hours.
          </p>
          {timezone !== detectedZone && (
            <p className="mt-3 rounded-xl border-l-[3px] border-signal bg-signal-soft px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-2">
              This device is set to <span className="font-semibold text-ink">{zoneLabel(detectedZone)}</span>.{" "}
              <button
                type="button"
                onClick={() => setDraftZone(detectedZone)}
                disabled={submitting}
                className="ink-link inline-flex min-h-11 items-center font-semibold text-signal"
              >
                Use that instead
              </button>
            </p>
          )}
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-mute">
            The daily email doesn&apos;t use your 3 free briefings a day.
          </p>
        </Card>

        {saveError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[14px] font-medium text-danger-deep">
            {saveError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isSubscribed && !confirmingStop ? (
            <Button
              ref={stopRef}
              variant="ghost"
              onClick={() => setConfirmingStop(true)}
              disabled={submitting}
              className="self-start text-danger hover:bg-danger-soft hover:text-danger-deep"
            >
              Turn off daily email
            </Button>
          ) : (
            <span />
          )}
          <div className="hidden items-center gap-3 md:flex">
            {hint && <span className="text-[14px] text-ink-mute">{hint}</span>}
            {primaryButton(false)}
          </div>
        </div>

        {confirmingStop && (
          <div
            role="group"
            aria-labelledby="stop-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                cancelStop();
              }
            }}
            className="flex flex-col gap-4 rounded-card border border-danger/25 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p id="stop-title" className="text-[15.5px] font-semibold text-ink">
                Turn off the daily email?
              </p>
              <p className="mt-0.5 text-[14px] text-ink-2">We&apos;ll keep your settings so you can turn it back on any time.</p>
            </div>
            <div className="flex gap-2">
              <Button ref={keepRef} variant="secondary" onClick={cancelStop} className="flex-1 sm:flex-none">
                Keep it on
              </Button>
              <Button variant="danger" loading={submitting} onClick={handleStop} className="flex-1 sm:flex-none">
                Turn off
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: primary action pinned above the tab bar (toasts show at the top on mobile) */}
      <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] z-30 border-t border-rule bg-paper/90 px-4 py-3 backdrop-blur-md md:hidden">
        {hint && <p className="mb-2 text-center text-[13px] text-ink-mute">{hint}</p>}
        {primaryButton(true)}
      </div>
    </div>
  );
}

function StatusTicket({
  subscription,
  isSubscribed,
  deliveryHour,
  timezone,
  topics,
  lastDelivered,
  dirty,
}: {
  subscription: Subscription | null;
  isSubscribed: boolean;
  deliveryHour: number;
  timezone: string;
  topics: Topic[];
  lastDelivered: string | null;
  dirty: boolean;
}) {
  const status = isSubscribed ? "On" : subscription ? "Off" : "Not set up";

  return (
    <div className="grain relative overflow-hidden rounded-[18px] bg-ink p-5 text-white shadow-lift sm:p-6">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 text-white/[0.07]"
      >
        <path d={SIGNAL_WAVE_PATH} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      <div className="relative flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Daily email</span>
        <span
          className={`inline-flex h-7 items-center gap-2 rounded-full px-3 text-[12px] font-semibold ${
            isSubscribed ? "bg-white/10 text-white" : "bg-white/[0.06] text-white/70"
          }`}
        >
          {isSubscribed ? (
            <span className="live-dot" aria-hidden="true" />
          ) : (
            <span aria-hidden="true" className="flex gap-[2px]">
              <span className="h-2.5 w-[3px] rounded-full bg-white/60" />
              <span className="h-2.5 w-[3px] rounded-full bg-white/60" />
            </span>
          )}
          {status}
        </span>
      </div>

      <p className="relative mt-6 font-display stretch-wider text-[44px] font-extrabold leading-none tracking-[-0.03em] text-white tabular-nums">
        {formatHour(deliveryHour)}
      </p>
      <p className="relative mt-2 break-all font-mono text-[12px] uppercase tracking-[0.08em] text-white/60">
        {partOfDay(deliveryHour)} · {zoneLabel(timezone)}
      </p>

      <div className="relative mt-5 border-t border-white/10 pt-4">
        <p className="text-[13px] text-white/60">
          To{" "}
          <span className="break-all font-semibold text-white">{subscription?.email ?? "your account email"}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.length > 0 ? (
            topics.map((t) => <TopicChip key={t} topic={t} variant="solid" short className="ring-1 ring-white/15" />)
          ) : (
            <span className="text-[13px] text-white/60">No topics picked yet</span>
          )}
        </div>
      </div>

      {(lastDelivered || dirty) && (
        <div className="relative mt-4 space-y-1 font-mono text-[11.5px] leading-relaxed text-white/60">
          {dirty && <p className="text-white">Unsaved changes</p>}
          {lastDelivered && <p>Last delivered {lastDelivered}</p>}
        </div>
      )}
    </div>
  );
}

function HourPicker({ hour, onChange, disabled }: { hour: number; onChange: (h: number) => void; disabled: boolean }) {
  const bandRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const map: Record<string, number | undefined> = {
      ArrowUp: hour + 1,
      ArrowRight: hour + 1,
      ArrowDown: hour - 1,
      ArrowLeft: hour - 1,
      PageUp: hour + 3,
      PageDown: hour - 3,
      Home: 0,
      End: 23,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(next);
  };

  const hourFromPointer = (clientX: number) => {
    const rect = bandRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return hour;
    const ratio = Math.min(0.9999, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.floor(ratio * 24);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    scrubbing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onChange(hourFromPointer(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (scrubbing.current) onChange(hourFromPointer(e.clientX));
  };
  const endScrub = () => {
    scrubbing.current = false;
  };

  return (
    <div>
      <span id="nl-hour-label" className="dateline">
        Send time
      </span>

      <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-surface-2 p-2">
        <IconButton label="One hour earlier" variant="surface" size="lg" onClick={() => onChange(hour - 1)} disabled={disabled}>
          <IconChevronLeft />
        </IconButton>
        <div
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby="nl-hour-label"
          aria-valuemin={0}
          aria-valuemax={23}
          aria-valuenow={hour}
          aria-valuetext={formatHour(hour)}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 rounded-xl py-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          <span className="block font-display stretch-wide text-[30px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums sm:text-[34px]">
            {formatHour(hour)}
          </span>
          <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">{partOfDay(hour)}</span>
        </div>
        <IconButton label="One hour later" variant="surface" size="lg" onClick={() => onChange(hour + 1)} disabled={disabled}>
          <IconChevronRight />
        </IconButton>
      </div>

      {/* 24-hour band: drag/tap to scrub (pointer shortcut; keyboard uses the spinbutton above) */}
      <div
        ref={bandRef}
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        className={`mt-4 flex h-10 touch-none select-none items-end gap-[2px] ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      >
        {Array.from({ length: 24 }).map((_, h) => {
          const day = h >= 6 && h < 19;
          const active = h === hour;
          return (
            <span
              key={h}
              className={`flex-1 rounded-[3px] transition-[height,background-color] duration-200 ${
                active ? "bg-signal" : day ? "bg-ink-faint" : "bg-rule-strong"
              }`}
              style={{ height: active ? "100%" : day ? "55%" : "32%" }}
            />
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-dim">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>11p</span>
      </div>

      <div role="group" aria-label="Quick picks" className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((h) => {
          const on = h === hour;
          return (
            <button
              key={h}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange(h)}
              className={`inline-flex h-11 items-center rounded-full px-4 font-mono text-[13px] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-50 ${
                on ? "bg-signal text-white" : "bg-surface text-ink-2 shadow-[inset_0_0_0_1px_rgb(var(--rule-strong-rgb))] hover:bg-surface-2"
              }`}
            >
              {shortHour(h)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
