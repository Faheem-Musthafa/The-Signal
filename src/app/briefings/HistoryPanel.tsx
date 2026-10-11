"use client";

import Link from "next/link";
import type { Route } from "next";
import { BriefingRing } from "@/components/BriefingRing";
import { Button, Card, IconButton, IconPlay, IconReplay, IconShare, TopicChip } from "@/components/ui";
import { briefingShareUrl, shareOrCopy, type StoryLike } from "@/components/story";
import { topicStyle } from "@/lib/topicStyle";

export type BriefingItem = {
  shareId: string;
  topics: string[];
  stories: StoryLike[];
  model?: string;
  generatedAt: string;
  cached?: boolean;
};

export type HistoryStatus = "loading" | "error" | "ready";

type DayGroup = { key: string; label: string; items: BriefingItem[] };

function dayLabel(date: Date, now: Date): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });
}

export function groupByDay(items: BriefingItem[]): DayGroup[] {
  const now = new Date();
  const groups: DayGroup[] = [];
  const sorted = [...items].sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
  for (const item of sorted) {
    const date = new Date(item.generatedAt);
    const key = date.toDateString();
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: dayLabel(date, now), items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type HistoryPanelProps = {
  status: HistoryStatus;
  items: BriefingItem[];
  isSeen: (shareId: string) => boolean;
  onOpen: (shareId: string) => void;
  onRetry: () => void;
};

export function briefingHref(shareId: string): Route {
  return `/briefing/${encodeURIComponent(shareId)}` as Route;
}

export function HistoryPanel({ status, items, isSeen, onOpen, onRetry }: HistoryPanelProps) {
  if (status === "loading") {
    return (
      <div role="status" aria-label="Loading your briefings">
        <div className="mb-4 h-3 w-24 rounded-full bg-surface-3 animate-pulse-soft" />
        <ul aria-hidden="true" className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 rounded-card border border-rule bg-surface p-3.5">
              <span className="size-16 shrink-0 rounded-full bg-surface-2 animate-pulse-soft" />
              <span className="flex-1 space-y-2">
                <span className="block h-2.5 w-20 rounded-full bg-surface-2 animate-pulse-soft" />
                <span className="block h-3.5 w-full rounded-full bg-surface-2 animate-pulse-soft" />
                <span className="block h-3.5 w-3/5 rounded-full bg-surface-2 animate-pulse-soft" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (status === "error") {
    return (
      <Card role="alert" padding="lg" className="max-w-lg">
        <h2 className="display-sm mb-2">We couldn&apos;t load your history.</h2>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-2">
          This is usually a short problem on our side. Your briefings are safe. Try again in a moment.
        </p>
        <Button variant="secondary" leadingIcon={<IconReplay />} onClick={onRetry}>
          Try again
        </Button>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card padding="lg" className="flex max-w-lg flex-col items-start">
        <span
          aria-hidden="true"
          className="mb-5 flex size-16 items-center justify-center rounded-full border-2 border-dashed border-rule-strong text-ink-dim"
        >
          <IconPlay size={22} />
        </span>
        <h2 className="display-sm mb-2">No briefings yet.</h2>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-2">
          Pick a few topics and get your first briefing. Every briefing you get shows up here for 30 days.
        </p>
        <Button href="/">Get my briefing</Button>
      </Card>
    );
  }

  const groups = groupByDay(items);

  return (
    <div className="space-y-8">
      <p className="text-[14px] text-ink-mute">
        {items.length} {items.length === 1 ? "briefing" : "briefings"} from the last 30 days
      </p>
      {groups.map((group, gi) => (
        <section key={group.key} aria-labelledby={`day-${gi}`}>
          <div className="mb-3 flex items-center gap-3">
            <h2 id={`day-${gi}`} className="text-[14px] font-semibold text-ink-2">
              {group.label}
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-rule" />
          </div>
          <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <li key={item.shareId}>
                <HistoryRow item={item} seen={isSeen(item.shareId)} onOpen={() => onOpen(item.shareId)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function topicNames(topics: string[]): string {
  return topics.map((t) => topicStyle(t).short).join(", ");
}

function HistoryRow({ item, seen, onOpen }: { item: BriefingItem; seen: boolean; onOpen: () => void }) {
  const top = item.stories[0]?.headline;
  const shown = item.topics.slice(0, 3);
  const extra = item.topics.length - shown.length;
  const count = item.stories.length;
  const href = briefingHref(item.shareId);

  const share = () =>
    void shareOrCopy({
      url: briefingShareUrl(item.shareId),
      title: top ?? "A briefing from The Signal",
      copiedMessage: "Link copied. It works for 30 days.",
    });

  return (
    <div className="group relative flex h-full items-center gap-3 rounded-card border border-rule bg-surface py-2.5 pl-2 pr-2 shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
      {/* Decorative ring; the headline link below covers the whole card. */}
      <span inert className="shrink-0">
        <BriefingRing topics={item.topics} generatedAt={item.generatedAt} label={timeOf(item.generatedAt)} size="md" seen={seen} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[13px] tabular-nums text-ink-mute">
          <span>
            {timeOf(item.generatedAt)} · {count} {count === 1 ? "story" : "stories"}
          </span>
          {!seen && (
            <span className="inline-flex h-5 items-center rounded-full bg-signal-soft px-2 text-[12px] font-semibold text-signal">
              New
            </span>
          )}
        </p>
        <Link
          href={href}
          onClick={onOpen}
          className="mt-1 block rounded-sm text-[15.5px] font-semibold leading-snug text-ink outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-signal"
        >
          <span className="line-clamp-2">{top ?? `Briefing: ${topicNames(item.topics)}`}</span>
          <span className="sr-only">
            {" "}
            ({topicNames(item.topics)}
            {seen ? "" : ", not opened yet"})
          </span>
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {shown.map((t) => (
            <TopicChip key={t} topic={t} variant="soft" short />
          ))}
          {extra > 0 && <span className="text-[12px] text-ink-mute">+{extra}</span>}
        </div>
      </div>
      <IconButton label="Share briefing" variant="ghost" onClick={share} className="relative z-10 shrink-0 self-start">
        <IconShare />
      </IconButton>
    </div>
  );
}
