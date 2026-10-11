"use client";

import { useEffect, useRef, useState } from "react";
import { SignUpButton } from "@clerk/nextjs";
import type { Topic } from "@/lib/topics";
import type { Story } from "@/types/digest";
import { topicStyle } from "@/lib/topicStyle";
import { BriefingView } from "@/components/briefing/BriefingView";
import { Button, Card, IconArrowRight, IconReplay, buttonClasses } from "@/components/ui";
import { TopicTiles } from "./TopicTiles";
import { useStoredTopics, writeStoredTopics } from "./preferences";

type PreviewData = {
  stories: Story[];
  generatedAt: string | null;
  coveredTopics: string[];
  exact: boolean;
  /** Human "updated 3 hours ago", computed when the response arrived. */
  updatedAgo: string | null;
};

type Result = { key: string; status: "ok"; data: PreviewData } | { key: string; status: "error" };

function topicsKey(topics: readonly Topic[]): string {
  return [...topics].sort().join(",");
}

function ago(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const minutes = Math.floor(Math.max(0, Date.now() - t) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function parsePreview(value: unknown): PreviewData | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.stories)) return null;
  const generatedAt = typeof v.generatedAt === "string" ? v.generatedAt : null;
  return {
    stories: v.stories as Story[],
    generatedAt,
    coveredTopics: Array.isArray(v.coveredTopics) ? v.coveredTopics.filter((t): t is string => typeof t === "string") : [],
    exact: v.exact !== false,
    updatedAgo: ago(generatedAt),
  };
}

function listTopics(topics: readonly string[]): string {
  const names = topics.map((t) => topicStyle(t).short);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * "Make it yours": signed-out visitors pick topics and instantly read a recent
 * ready-made briefing for them (GET /api/preview — no AI cost). Picks are kept
 * in localStorage so the dashboard starts with them after sign-up.
 */
export function TryIt() {
  const stored = useStoredTopics();
  const [picked, setPicked] = useState<Topic[] | null>(null);
  const selected: readonly Topic[] = picked ?? stored ?? [];
  const key = topicsKey(selected);

  const [result, setResult] = useState<Result | null>(null);
  const [retry, setRetry] = useState(0);
  const cacheRef = useRef(new Map<string, PreviewData>());

  useEffect(() => {
    if (!key) return;
    const cached = cacheRef.current.get(key);
    const ctrl = new AbortController();
    const timer = window.setTimeout(
      async () => {
        if (cached) {
          setResult({ key, status: "ok", data: cached });
          return;
        }
        try {
          const res = await fetch(`/api/preview?topics=${encodeURIComponent(key)}`, { signal: ctrl.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = parsePreview(await res.json());
          if (!data) throw new Error("Bad preview payload");
          cacheRef.current.set(key, data);
          setResult({ key, status: "ok", data });
        } catch {
          if (!ctrl.signal.aborted) setResult({ key, status: "error" });
        }
      },
      cached ? 0 : 250,
    );
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [key, retry]);

  const toggle = (topic: Topic) => {
    const next = selected.includes(topic) ? selected.filter((t) => t !== topic) : [...selected, topic];
    setPicked(next);
    writeStoredTopics(next);
  };

  const current = result && result.key === key ? result : null;
  const loading = !!key && !current;
  const announcement = loading
    ? "Loading a recent briefing"
    : current?.status === "error"
      ? "Couldn't load a preview"
      : current?.status === "ok"
        ? `Showing ${current.data.stories.length} stories for ${listTopics(selected)}`
        : "";

  return (
    <section id="try" aria-labelledby="try-title" className="scroll-mt-20 border-t border-rule">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Try it now · no account needed</p>
          <h2 id="try-title" className="display-lg mt-3">
            Make it yours.
          </h2>
          <p className="mt-4 text-[16.5px] leading-relaxed text-ink-2">
            Tap the topics you care about. You&rsquo;ll see a recent briefing for them right away.
          </p>
        </div>

        <TopicTiles className="mt-8" label="Pick your topics" selected={selected} onToggle={toggle} />

        <p className="sr-only" role="status">
          {announcement}
        </p>
        <div className="mt-10">
          {!key && (
            <Card variant="sunken" padding="lg" className="text-center">
              <p className="text-[15.5px] font-semibold text-ink">Pick at least one topic above.</p>
              <p className="mt-1 text-[14px] text-ink-mute">Your briefing shows up here.</p>
            </Card>
          )}

          {loading && <PreviewSkeleton />}

          {current?.status === "error" && (
            <Card padding="lg" className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15.5px] font-semibold text-ink">We couldn&rsquo;t load a preview right now.</p>
                <p className="mt-1 text-[14px] text-ink-mute">Try again in a moment, or sign up to get a fresh briefing.</p>
              </div>
              <Button variant="secondary" leadingIcon={<IconReplay />} onClick={() => setRetry((r) => r + 1)}>
                Try again
              </Button>
            </Card>
          )}

          {current?.status === "ok" && current.data.stories.length === 0 && (
            <Card padding="lg" className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15.5px] font-semibold text-ink">No recent briefing for these topics yet.</p>
                <p className="mt-1 text-[14px] text-ink-mute">Sign up free and we&rsquo;ll make a fresh one for you.</p>
              </div>
              <SignUpButton mode="modal">
                <button type="button" className={buttonClasses()}>
                  Get my briefing — free
                  <IconArrowRight />
                </button>
              </SignUpButton>
            </Card>
          )}

          {current?.status === "ok" && current.data.stories.length > 0 && (
            <div className="space-y-5">
              <PreviewNote data={current.data} selected={selected} />
              <BriefingView
                key={key}
                mode="preview"
                stories={current.data.stories}
                meta={{ generatedAt: current.data.generatedAt ?? new Date(0).toISOString(), topics: [...selected] }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewNote({ data, selected }: { data: PreviewData; selected: readonly Topic[] }) {
  return (
    <div className="rounded-card bg-signal-soft px-4 py-3 text-[14px] leading-relaxed text-ink-2">
      <p>
        <span className="font-semibold text-ink">Recent briefing for {listTopics(selected)}</span>
        {data.updatedAgo && <> · updated {data.updatedAgo}</>}
        {" — "}
        <SignUpButton mode="modal">
          <button type="button" className="ink-link font-semibold text-signal">
            sign up for a fresh one
          </button>
        </SignUpButton>
      </p>
      {!data.exact && (
        <p className="mt-1 text-[13px] text-ink-mute">
          There weren&rsquo;t many recent stories for these topics, so we added other top stories.
        </p>
      )}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4 rounded-card border border-rule bg-surface p-4">
          <span className="h-16 w-1.5 shrink-0 rounded-full bg-surface-3 animate-pulse-soft" />
          <span className="flex-1 space-y-2.5">
            <span className="block h-3 w-24 rounded-full bg-surface-3 animate-pulse-soft" />
            <span className="block h-4 w-full rounded-full bg-surface-3 animate-pulse-soft" />
            <span className="block h-4 w-2/3 rounded-full bg-surface-3 animate-pulse-soft" />
          </span>
        </div>
      ))}
    </div>
  );
}
