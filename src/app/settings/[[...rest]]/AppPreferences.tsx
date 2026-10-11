"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Topic } from "@/lib/topics";
import { Button, Card } from "@/components/ui";
import { useIsClient, useSavedStories } from "@/components/story";
import { TopicTiles } from "@/components/landing/TopicTiles";
import { DEFAULT_TOPICS, useAutoplayPreference, useStoredTopics, writeStoredTopics } from "@/components/landing/preferences";
import { clearSeenBriefings, useSeenBriefings } from "@/app/briefings/useSeenBriefings";

/** App preferences that live on this device (shown above the Clerk account profile). */
export function AppPreferences() {
  return (
    <section aria-labelledby="prefs-heading" className="space-y-4">
      <div>
        <h2 id="prefs-heading" className="display-sm">
          Preferences
        </h2>
        <p className="mt-1 text-[14.5px] text-ink-mute">These are saved on this device.</p>
      </div>
      <DefaultTopics />
      <AutoplaySetting />
      <DeviceData />
    </section>
  );
}

function DefaultTopics() {
  const stored = useStoredTopics();
  const topics = stored ?? DEFAULT_TOPICS;

  const toggle = (topic: Topic) => {
    if (topics.includes(topic)) {
      if (topics.length === 1) {
        toast("Keep at least one topic", { description: "Pick another topic first, then remove this one." });
        return;
      }
      writeStoredTopics(topics.filter((t) => t !== topic));
    } else {
      writeStoredTopics([...topics, topic]);
    }
  };

  return (
    <Card as="section" padding="lg" aria-labelledby="prefs-topics">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 id="prefs-topics" className="text-[17px] font-semibold text-ink">
          Default topics
        </h3>
        <span className="font-mono text-[13px] font-semibold tabular-nums text-ink-mute">{topics.length} of 8</span>
      </div>
      <p className="mb-5 text-[15px] text-ink-mute">
        These are picked for you when you open Today. Changes save right away.
      </p>
      <TopicTiles label="Default topics" selected={topics} onToggle={toggle} />
    </Card>
  );
}

function AutoplaySetting() {
  const [on, setOn] = useAutoplayPreference();
  const isClient = useIsClient();

  return (
    <Card as="section" padding="lg" aria-labelledby="prefs-autoplay">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 id="prefs-autoplay" className="text-[17px] font-semibold text-ink">
            Play briefing starts automatically
          </h3>
          <p id="prefs-autoplay-desc" className="mt-1 text-[15px] leading-relaxed text-ink-mute">
            When this is on, stories move forward on their own when you press Play briefing. When it&apos;s off, you tap
            to go to the next story.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="prefs-autoplay"
          aria-describedby="prefs-autoplay-desc"
          disabled={!isClient}
          onClick={() => {
            setOn(!on);
            toast.success(on ? "Autoplay is off" : "Autoplay is on");
          }}
          className={`relative inline-flex h-11 w-[72px] shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-50 ${
            on ? "bg-signal" : "bg-surface-3"
          }`}
        >
          <span
            aria-hidden="true"
            className={`block size-9 rounded-full bg-white shadow-soft transition-transform duration-200 ease-out motion-reduce:transition-none ${
              on ? "translate-x-[28px]" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </Card>
  );
}

type ClearKind = "saved" | "history";

function DeviceData() {
  const isClient = useIsClient();
  const { saved, clear: clearSaved } = useSavedStories();
  const { seen } = useSeenBriefings();
  const [confirming, setConfirming] = useState<ClearKind | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const savedRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const close = (kind: ClearKind) => {
    setConfirming(null);
    requestAnimationFrame(() => (kind === "saved" ? savedRef : historyRef).current?.focus());
  };

  const confirm = () => {
    if (confirming === "saved") {
      clearSaved();
      toast.success("Saved stories removed");
    } else if (confirming === "history") {
      clearSeenBriefings();
      toast.success("Reading history cleared", { description: "All your briefings show as new again." });
    }
    setConfirming(null);
  };

  const savedCount = isClient ? saved.length : 0;
  const seenCount = isClient ? seen.length : 0;

  const rows: { kind: ClearKind; title: string; body: string; count: number; action: string; ref: typeof savedRef }[] = [
    {
      kind: "saved",
      title: "Saved stories",
      body: savedCount === 1 ? "1 saved story" : `${savedCount} saved stories`,
      count: savedCount,
      action: "Remove saved stories",
      ref: savedRef,
    },
    {
      kind: "history",
      title: "Reading history",
      body: "Which briefings you've already opened, so new ones are marked “New”.",
      count: seenCount,
      action: "Clear reading history",
      ref: historyRef,
    },
  ];

  return (
    <Card as="section" padding="lg" aria-labelledby="prefs-device">
      <h3 id="prefs-device" className="text-[17px] font-semibold text-ink">
        Data on this device
      </h3>
      <p className="mt-1 text-[15px] text-ink-mute">This doesn&apos;t change your account or your briefing History.</p>
      <ul className="mt-4 divide-y divide-rule border-y border-rule">
        {rows.map((row) => (
          <li key={row.kind} className="py-4">
            {confirming === row.kind ? (
              <div
                role="group"
                aria-labelledby={`confirm-${row.kind}`}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    close(row.kind);
                  }
                }}
                className="flex flex-col gap-3 rounded-card border border-danger/25 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p id={`confirm-${row.kind}`} className="text-[15px] font-semibold text-ink">
                  {row.kind === "saved" ? "Remove all saved stories?" : "Clear your reading history?"}{" "}
                  <span className="font-normal text-ink-2">You can&apos;t undo this.</span>
                </p>
                <div className="flex gap-2">
                  <Button ref={confirmRef} variant="secondary" onClick={() => close(row.kind)} className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={confirm} className="flex-1 sm:flex-none">
                    {row.kind === "saved" ? "Remove" : "Clear"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[15.5px] font-semibold text-ink">{row.title}</p>
                  <p className="mt-0.5 text-[14px] text-ink-mute">{row.body}</p>
                </div>
                <Button
                  ref={row.ref}
                  variant="secondary"
                  disabled={!isClient || row.count === 0}
                  onClick={() => setConfirming(row.kind)}
                  className="self-start sm:self-auto"
                >
                  {row.action}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
