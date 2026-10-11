"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";
import { Button, IconCheck, IconMail } from "@/components/ui";
import { browserTimeZone, hourLabel } from "./time";

type Subscription = {
  topics: string[];
  timezone: string;
  deliveryHour: number;
  active: boolean;
};

type State =
  | { kind: "loading" }
  | { kind: "off" }
  | { kind: "on"; subscription: Subscription };

const DEFAULT_HOUR = 7;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function isTopic(value: string): value is Topic {
  return (ALLOWED_TOPICS as readonly string[]).includes(value);
}

function parseSubscription(data: unknown): Subscription | null {
  if (!data || typeof data !== "object") return null;
  const sub = (data as { subscription?: unknown }).subscription;
  if (!sub || typeof sub !== "object") return null;
  const s = sub as Record<string, unknown>;
  if (typeof s.deliveryHour !== "number" || typeof s.timezone !== "string") return null;
  return {
    topics: Array.isArray(s.topics) ? s.topics.filter((t): t is string => typeof t === "string") : [],
    timezone: s.timezone,
    deliveryHour: s.deliveryHour,
    active: s.active === true,
  };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Inline "get this every morning" opt-in for the end of a briefing.
 * Signed-in only. Shows the current status when already subscribed.
 */
export function DailyEmailOptIn({ topics }: { topics: ReadonlyArray<string> }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [hour, setHour] = useState(DEFAULT_HOUR);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const selectId = useId();
  const validTopics = Array.from(new Set(topics.filter(isTopic)));

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscribe", { cache: "no-store" });
        if (!res.ok) throw new Error("status");
        const sub = parseSubscription(await readJson(res));
        if (cancelled) return;
        setState(sub && sub.active ? { kind: "on", subscription: sub } : { kind: "off" });
      } catch {
        // Status unknown: still offer the opt-in; the Daily email page has full controls.
        if (!cancelled) setState({ kind: "off" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  if (!isSignedIn) return null;

  const subscribe = async () => {
    if (validTopics.length === 0 || saving) return;
    setSaving(true);
    setFailed(false);
    const timezone = browserTimeZone();
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: validTopics, timezone, deliveryHour: hour }),
      });
      if (!res.ok) throw new Error("status");
      const sub = parseSubscription(await readJson(res)) ?? { topics: validTopics, timezone, deliveryHour: hour, active: true };
      setState({ kind: "on", subscription: sub });
      toast.success("Daily email is on", { description: `Every day at ${hourLabel(sub.deliveryHour)} (${sub.timezone})` });
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const shell = "rounded-card bg-signal-soft p-5 sm:p-6";

  if (state.kind === "loading") {
    return <div className={`${shell} min-h-[168px] animate-pulse-soft`} aria-hidden="true" />;
  }

  if (state.kind === "on") {
    const s = state.subscription;
    return (
      <div className={shell}>
        <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <span className="flex size-6 items-center justify-center rounded-full bg-success text-white" aria-hidden="true">
            <IconCheck size={14} strokeWidth={3} />
          </span>
          Daily email is on
        </p>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
          Every day at {hourLabel(s.deliveryHour)} ({s.timezone}){s.topics.length > 0 ? ` on ${s.topics.length} ${s.topics.length === 1 ? "topic" : "topics"}` : ""}.
        </p>
        <Button href="/newsletter" variant="ghost" size="md" className="-ml-3 mt-2">
          Change time or topics
        </Button>
      </div>
    );
  }

  if (validTopics.length === 0) {
    return (
      <div className={shell}>
        <p className="text-[15px] font-semibold text-ink">Get a briefing every morning</p>
        <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">Pick your topics and a time. It doesn&apos;t use your daily briefings.</p>
        <Button href="/newsletter" variant="primary" size="md" className="mt-4" leadingIcon={<IconMail />}>
          Set up daily email
        </Button>
      </div>
    );
  }

  return (
    <form
      className={shell}
      onSubmit={(e) => {
        e.preventDefault();
        void subscribe();
      }}
    >
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <IconMail size={18} aria-hidden="true" />
        Get this every morning
      </p>
      <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">
        A fresh briefing on these {validTopics.length === 1 ? "topic" : `${validTopics.length} topics`}, by email. Free, and it
        doesn&apos;t use your daily briefings.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label htmlFor={selectId} className="flex flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-2">Delivery time</span>
          <select
            id={selectId}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="h-11 w-full rounded-full border-0 bg-surface px-4 text-[15px] font-medium text-ink shadow-[inset_0_0_0_1px_rgb(var(--rule-strong-rgb))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="primary" size="md" loading={saving} className="sm:min-w-[170px]">
          Email me daily
        </Button>
      </div>
      <p className="mt-2 text-[12.5px] text-ink-mute" suppressHydrationWarning>
        Your time zone: {browserTimeZone()}
      </p>
      {failed && (
        <p role="alert" className="mt-3 text-[13.5px] leading-relaxed text-danger-deep">
          Couldn&apos;t turn on the daily email. Try again, or set it up on the{" "}
          <Link href="/newsletter" className="ink-link font-semibold">
            Daily email page
          </Link>
          .
        </p>
      )}
    </form>
  );
}
