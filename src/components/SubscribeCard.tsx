"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";

type Subscription = {
  topics: Topic[];
  timezone: string;
  deliveryHour: number;
  active: boolean;
  email: string;
  lastDeliveredAt: number | null;
};

type SubscribeCardProps = {
  initialTopics: Topic[];
};

function formatHour(h: number): string {
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:00 ${ampm}`;
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function SubscribeCard({ initialTopics }: SubscribeCardProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [deliveryHour, setDeliveryHour] = useState<number>(7);
  const timezone = useMemo(detectTimezone, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscribe", { method: "GET" });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = (await res.json()) as { subscription: Subscription | null };
        if (cancelled) return;
        if (data.subscription) {
          setSubscription(data.subscription);
          setTopics(data.subscription.topics as Topic[]);
          setDeliveryHour(data.subscription.deliveryHour);
        }
      } catch {
        // fall back to default unsubscribed state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSubscribed = subscription?.active === true;

  const toggleTopic = (topic: Topic) => {
    setTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((t) => t !== topic);
      if (prev.length >= 8) return prev;
      return [...prev, topic];
    });
  };

  const handleSubscribe = async () => {
    if (topics.length === 0) {
      toast.error("Pick at least one topic.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, timezone, deliveryHour }),
      });
      const data = (await res.json()) as { subscription?: Subscription; error?: string };
      if (!res.ok) throw new Error(data.error || "Subscribe failed");
      if (data.subscription) setSubscription(data.subscription);
      toast.success(isSubscribed ? "Subscription updated" : "You're subscribed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscribe failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Unsubscribe failed");
      }
      setSubscription((prev) => (prev ? { ...prev, active: false } : prev));
      toast.success("Daily digest disabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unsubscribe failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-rule rounded-xl shadow-sm p-8 max-w-2xl">
        <div className="h-4 w-48 bg-rule rounded mb-3 animate-pulse-soft" />
        <div className="h-3 w-72 bg-rule rounded animate-pulse-soft" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-rule">
        <div>
          <div className="eyebrow mb-3">Newsletter</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Daily digest.
          </h2>
          <p className="text-[14px] text-ink-2 max-w-lg leading-relaxed">
            We&apos;ll email a curated briefing to <span className="text-ink font-semibold">{subscription?.email ?? "your account email"}</span> at your chosen hour.
          </p>
        </div>
        {isSubscribed && (
          <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-moss/10 text-[11px] font-semibold text-moss">
            <span className="w-1.5 h-1.5 rounded-full bg-moss" />
            Active
          </span>
        )}
      </div>

      {/* Topics card */}
      <div className="bg-white border border-rule rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="eyebrow">Topics</div>
          <span className="dateline">{topics.length}/8</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALLOWED_TOPICS.map((topic) => {
            const isSelected = topics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                disabled={submitting}
                className={`px-3.5 py-1.5 text-[12px] rounded-full border transition-colors duration-200 font-medium tracking-tight ${
                  isSelected
                    ? "bg-signal-soft text-signal border-signal/30"
                    : "bg-white border-rule text-ink-mute hover:text-ink hover:border-rule-strong"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule card */}
      <div className="bg-white border border-rule rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="eyebrow">Schedule</div>
          <span className="dateline">{timezone}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="dateline">Delivery time</span>
            <select
              value={deliveryHour}
              onChange={(e) => setDeliveryHour(Number(e.target.value))}
              disabled={submitting}
              className="bg-white border border-rule rounded-lg px-3 py-2 text-[14px] text-ink focus:outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 transition-colors"
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2">
            <span className="dateline">Cadence</span>
            <div className="bg-paper-soft border border-rule rounded-lg px-3 py-2 text-[14px] text-ink-mute">
              Every day
            </div>
          </div>
        </div>
        <p className="mt-4 text-[12px] text-ink-mute leading-relaxed">
          Each scheduled delivery counts toward your 3 digests/day quota. If you&apos;ve already used today&apos;s quota interactively before delivery time, that day&apos;s email is skipped.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
        {isSubscribed && (
          <button
            onClick={handleUnsubscribe}
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg border border-rule bg-white text-ink-mute text-[13px] font-semibold tracking-tight hover:text-ink hover:bg-paper-soft disabled:opacity-40 transition-colors"
          >
            Unsubscribe
          </button>
        )}
        <button
          onClick={handleSubscribe}
          disabled={submitting || topics.length === 0}
          className="px-6 py-2.5 rounded-lg bg-signal text-white font-semibold text-[13px] tracking-tight disabled:opacity-30 disabled:cursor-not-allowed hover:bg-signal-deep transition-colors"
        >
          {submitting ? "Saving…" : isSubscribed ? "Update preferences" : "Subscribe"}
        </button>
      </div>
    </div>
  );
}
