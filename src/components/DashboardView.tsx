"use client";

import { motion } from "motion/react";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";
import { TOPIC_STYLES } from "@/lib/topicStyle";
import { formatResetCountdown, quotaLabel, type QuotaInfo } from "@/lib/quota";
import { Button, IconArrowRight, IconBriefings, IconCheck, IconMail, QuotaBattery, TopicGlyph } from "@/components/ui";
import { haptic, useIsClient } from "@/components/story";
import type { FriendlyDigestError } from "@/components/briefing/digestErrors";
import { useClock } from "@/components/briefing/useClock";
import { BriefingRing } from "./BriefingRing";

export type RecentBriefing = {
  shareId: string;
  generatedAt: string;
  topics: string[];
  cached?: boolean;
};

type DashboardViewProps = {
  selectedTopics: Topic[];
  toggleTopic: (topic: Topic) => void;
  /** Replace the whole selection (All / Clear). */
  setTopics?: (topics: Topic[]) => void;
  handleGenerate: () => void;
  quota: QuotaInfo | null;
  error: FriendlyDigestError | null;
  recent: RecentBriefing[];
  /** Whether a recent briefing was already opened (muted ring). */
  isSeen?: (shareId: string) => boolean;
  /** Called when a recent ring is opened (e.g. mark it seen). Navigation is a link to /briefing/[shareId]. */
  onOpenRecent?: (shareId: string) => void;
};

const MAX_TOPICS = ALLOWED_TOPICS.length;
const SPRING = { type: "spring", stiffness: 480, damping: 34 } as const;

function TopicTile({ topic, selected, onToggle }: { topic: (typeof TOPIC_STYLES)[number]; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={SPRING}
      className={`grain group relative flex min-h-[104px] w-full flex-col justify-between overflow-hidden rounded-card p-3.5 text-left outline-none transition-[background-color,color,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:min-h-[120px] sm:p-4 ${
        selected ? "text-white" : "bg-surface text-ink shadow-soft ring-1 ring-rule hover:shadow-lift"
      }`}
      style={
        selected
          ? { background: topic.color, boxShadow: `0 14px 28px -16px ${topic.color}, inset 0 0 0 1px rgba(255,255,255,0.12)` }
          : undefined
      }
    >
      <span className="flex items-start justify-between gap-2">
        <motion.span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full transition-colors duration-200"
          style={selected ? { background: "rgba(255,255,255,0.16)" } : { background: topic.soft, color: topic.color }}
          animate={selected ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <TopicGlyph topic={topic.topic} size={20} strokeWidth={1.9} />
        </motion.span>

        <span
          aria-hidden="true"
          className={`flex size-6 items-center justify-center rounded-full transition-colors duration-200 ${
            selected ? "bg-white" : "ring-[1.5px] ring-inset ring-rule-strong"
          }`}
          style={selected ? { color: topic.color } : undefined}
        >
          {selected && <IconCheck size={14} strokeWidth={3} />}
        </span>
      </span>

      <span className="mt-3 block text-[15px] font-semibold leading-tight tracking-[-0.01em] sm:text-[16px]">{topic.label}</span>
    </motion.button>
  );
}

function TopicBand({ selected }: { selected: ReadonlyArray<string> }) {
  return (
    <div className="flex h-2.5 flex-1 gap-1" aria-hidden="true">
      {TOPIC_STYLES.map((t) => {
        const on = selected.includes(t.topic);
        return (
          <motion.span
            key={t.key}
            className="block h-full flex-1 rounded-full"
            initial={false}
            animate={{ backgroundColor: on ? t.color : "rgba(14,18,32,0.09)", scaleY: on ? 1 : 0.6 }}
            transition={SPRING}
          />
        );
      })}
    </div>
  );
}

/** Calm "come back later" card at 0 briefings left — not an error. */
function QuotaWall({ quota, canTryCached, onTryCached }: { quota: QuotaInfo; canTryCached: boolean; onTryCached: () => void }) {
  const now = useClock();

  return (
    <section aria-labelledby="quota-wall-title" className="mt-4 rounded-card bg-surface p-5 shadow-soft ring-1 ring-rule sm:p-6">
      <div className="flex items-start gap-4">
        <span className="mt-1 shrink-0">
          <QuotaBattery quota={quota} variant="cells" />
        </span>
        <div className="min-w-0">
          <h3 id="quota-wall-title" className="text-[17px] font-semibold leading-snug text-ink">
            You&apos;ve used today&apos;s {quota.limit} briefings
          </h3>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-2" suppressHydrationWarning>
            {now ? `${formatResetCountdown(quota.resetsAt, now)}.` : "Resets at 00:00 UTC."} Meanwhile:
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button href="/briefings" variant="secondary" size="md" leadingIcon={<IconBriefings />} fullWidth>
          Open History
        </Button>
        <Button href="/newsletter" variant="secondary" size="md" leadingIcon={<IconMail />} fullWidth>
          Get it by daily email
        </Button>
      </div>
      <p className="mt-2 text-[13px] text-ink-mute">The daily email doesn&apos;t use your briefings.</p>

      <div className="mt-4 rounded-[12px] bg-signal-soft px-4 py-3.5">
        <p className="text-[14px] leading-relaxed text-ink-2">
          <span className="font-semibold text-ink">Tip:</span> if anyone got a briefing on exactly these topics in the last 3
          hours, you can open it for free.
        </p>
        <Button variant="ghost" size="md" onClick={onTryCached} disabled={!canTryCached} className="-ml-3 mt-1 text-signal">
          Look for a recent one
        </Button>
      </div>
    </section>
  );
}

export function DashboardView({
  selectedTopics,
  toggleTopic,
  setTopics,
  handleGenerate,
  quota,
  error,
  recent,
  isSeen,
  onOpenRecent,
}: DashboardViewProps) {
  const isClient = useIsClient();
  const count = selectedTopics.length;
  const quotaReached = quota !== null && quota.remaining <= 0;
  const canGenerate = count > 0;
  const today = new Date();
  const dateLabel = isClient ? today.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";

  const onToggle = (topic: Topic) => {
    haptic(8);
    toggleTopic(topic);
  };
  const preset = (topics: Topic[]) => {
    haptic(8);
    setTopics?.(topics);
  };

  const quotaText = quota ? quotaLabel(quota) : null;
  const hint = count === 0 ? "Pick at least one topic." : [quotaText, "usually 20–45 seconds"].filter(Boolean).join(" · ");

  return (
    <div className="space-y-10 pb-36 md:space-y-12 md:pb-4">
      {/* ── Topics ─────────────────────────────────────────── */}
      <section aria-labelledby="topics-title">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="dateline min-h-[1em]" suppressHydrationWarning>
              {dateLabel}
            </p>
            <h2 id="topics-title" className="display-md mt-2.5 max-w-xl">
              What do you want to catch up on?
            </h2>
            <p className="mt-2 max-w-lg text-[15.5px] leading-relaxed text-ink-2">
              Pick your topics. We read the live web and rank the stories that matter, most important first.
            </p>
          </div>

          {quota && (
            <div className="hidden shrink-0 rounded-card bg-surface px-4 py-3.5 shadow-soft ring-1 ring-rule md:block">
              <QuotaBattery quota={quota} variant="full" />
            </div>
          )}
        </div>

        <div role="group" aria-label={`Topics, ${count} of ${MAX_TOPICS} selected`} className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {TOPIC_STYLES.map((t) => (
            <TopicTile key={t.key} topic={t} selected={selectedTopics.includes(t.topic)} onToggle={() => onToggle(t.topic)} />
          ))}
        </div>

        {/* readout: band + count + All / Clear */}
        <div className="mt-3 flex items-center gap-3 rounded-card bg-surface py-1.5 pl-4 pr-1.5 shadow-soft ring-1 ring-rule">
          <p className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-ink" aria-live="polite">
            {count}
            <span className="text-ink-dim"> of {MAX_TOPICS}</span>
            <span className="sr-only"> topics selected</span>
          </p>
          <TopicBand selected={selectedTopics} />
          {setTopics && (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => preset([...ALLOWED_TOPICS])}
                disabled={count === MAX_TOPICS}
                className="h-11 rounded-full px-3 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal disabled:opacity-40"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => preset([])}
                disabled={count === 0}
                className="h-11 rounded-full px-3 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {quotaReached && quota && <QuotaWall quota={quota} canTryCached={canGenerate} onTryCached={handleGenerate} />}

        {error && (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-3 rounded-card bg-surface p-5 shadow-soft ring-1 ring-danger/25 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-[16px] font-semibold text-danger-deep">{error.title}</p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">{error.body}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {error.action && (
                <Button href={error.action.href} variant="secondary" size="md">
                  {error.action.label}
                </Button>
              )}
              {error.retry && canGenerate && (
                <Button variant="primary" size="md" onClick={handleGenerate}>
                  Try again
                </Button>
              )}
            </div>
          </div>
        )}

        {/* CTA — sticky above the tab bar on mobile, inline on desktop */}
        {!quotaReached && (
          <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] z-30 border-t border-rule bg-paper/90 px-4 pb-3 pt-2.5 backdrop-blur-md md:static md:z-auto md:mt-5 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className="mx-auto flex max-w-xl flex-col gap-2 md:max-w-none md:flex-row-reverse md:items-center md:justify-between md:gap-6">
              <Button
                size="lg"
                fullWidth
                disabled={!canGenerate}
                onClick={handleGenerate}
                aria-describedby="generate-hint"
                trailingIcon={canGenerate ? <IconArrowRight /> : undefined}
                className="md:w-auto md:min-w-[280px]"
              >
                Get my briefing
              </Button>
              <p id="generate-hint" className="text-center text-[13px] text-ink-mute md:text-left md:text-[14px]">
                {hint}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Recent ────────────────────────────────────────── */}
      <section aria-labelledby="recent-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="recent-title" className="display-sm">
            Recent briefings
          </h2>
          {recent.length > 0 && (
            <Button href="/briefings" variant="ghost" size="md" trailingIcon={<IconArrowRight />}>
              History
            </Button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-rule-strong bg-surface px-6 py-10 text-center sm:flex-row sm:text-left">
            <div className="flex -space-x-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-12 rounded-full border-[3px] border-surface bg-surface-3" style={{ opacity: 1 - i * 0.25 }} />
              ))}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">No briefings yet</p>
              <p className="mt-0.5 text-[14px] text-ink-mute">Your briefings from the last 30 days show up here.</p>
            </div>
          </div>
        ) : (
          <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 pt-1 scrollbar-none sm:gap-3 md:-mx-1 md:px-1" aria-label="Recent briefings">
            {recent.slice(0, 12).map((item) => (
              <li key={item.shareId} className="snap-start">
                <BriefingRing
                  topics={item.topics}
                  generatedAt={item.generatedAt}
                  href={`/briefing/${encodeURIComponent(item.shareId)}`}
                  onClick={() => onOpenRecent?.(item.shareId)}
                  seen={isSeen?.(item.shareId) ?? false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
