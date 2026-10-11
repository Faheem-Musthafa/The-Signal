"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useIsClient, useSavedStories, type SavedStory } from "@/components/story";
import { SourceLink } from "@/components/SourceLink";
import { Button, Card, IconBookmark, IconClose, IconPlay, SignalBars, TopicChip } from "@/components/ui";
import { topicStyle } from "@/lib/topicStyle";
import { briefingHref } from "./HistoryPanel";

type SavedPanelProps = {
  /** Play `stories` as a story deck, starting at `startIndex`. */
  onPlay: (stories: SavedStory[], startIndex: number) => void;
};

function savedDate(ms: number): string {
  if (!ms) return "Saved";
  return `Saved ${new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export function SavedPanel({ onPlay }: SavedPanelProps) {
  const isClient = useIsClient();
  const { saved, save, remove, clear } = useSavedStories();
  const [confirming, setConfirming] = useState(false);
  const clearRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (confirming) {
      cancelRef.current?.focus();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      clearRef.current?.focus();
    }
  }, [confirming]);

  const cancelConfirm = () => {
    returnFocus.current = true;
    setConfirming(false);
  };

  const handleRemove = (story: SavedStory) => {
    remove(story.id);
    toast("Removed from Saved", {
      description: story.headline,
      action: { label: "Undo", onClick: () => save(story, { shareId: story.shareId }) },
    });
  };

  const handleClear = () => {
    const count = saved.length;
    clear();
    setConfirming(false);
    toast.success(`Removed ${count} saved ${count === 1 ? "story" : "stories"}`);
  };

  if (!isClient) {
    return (
      <div role="status" aria-label="Loading saved stories" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[230px] rounded-[18px] bg-surface-2 animate-pulse-soft" />
        ))}
      </div>
    );
  }

  if (saved.length === 0) return <SavedEmpty />;

  const count = saved.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="dateline">
          {count} saved {count === 1 ? "story" : "stories"} · on this device
        </p>
        {!confirming && (
          <div className="flex flex-wrap items-center gap-2">
            <Button leadingIcon={<IconPlay />} onClick={() => onPlay(saved, 0)} className="flex-1 sm:flex-none">
              Play saved stories
            </Button>
            <Button ref={clearRef} variant="ghost" onClick={() => setConfirming(true)}>
              Remove all
            </Button>
          </div>
        )}
      </div>

      {confirming && (
        <div
          role="group"
          aria-labelledby="clear-saved-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              cancelConfirm();
            }
          }}
          className="flex flex-col gap-4 rounded-card border border-danger/25 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p id="clear-saved-title" className="text-[15px] font-semibold text-ink">
              Remove all {count} saved {count === 1 ? "story" : "stories"}?
            </p>
            <p className="mt-0.5 text-[14px] text-ink-2">You can&apos;t undo this.</p>
          </div>
          <div className="flex gap-2">
            <Button ref={cancelRef} variant="secondary" onClick={cancelConfirm} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClear} className="flex-1 sm:flex-none">
              Remove all
            </Button>
          </div>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {saved.map((story, i) => (
          <SavedCard key={story.id} story={story} onPlay={() => onPlay(saved, i)} onRemove={() => handleRemove(story)} />
        ))}
      </ul>
    </div>
  );
}

function SavedCard({ story, onPlay, onRemove }: { story: SavedStory; onPlay: () => void; onRemove: () => void }) {
  const s = topicStyle(story.category);
  return (
    <li
      className="grain group relative flex min-h-[240px] flex-col overflow-hidden rounded-[18px] p-4 text-white shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0 sm:p-5"
      style={{ background: s.color }}
    >
      {/* Stretched play target: the whole card plays the story; links/buttons below sit above it. */}
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play saved story: ${story.headline}`}
        className="absolute inset-0 rounded-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
      />
      <div className="pointer-events-none relative flex items-center justify-between gap-2">
        <TopicChip topic={story.category} variant="onColor" short />
        <SignalBars value={story.importance} size="sm" color="#fff" trackColor="rgba(255,255,255,0.28)" />
      </div>
      <h3 className="pointer-events-none relative mt-4 line-clamp-3 font-display stretch-wide text-[19px] font-extrabold leading-[1.12] tracking-[-0.015em] text-white">
        {story.headline}
      </h3>
      {story.signal && (
        <p className="pointer-events-none relative mt-2 line-clamp-2 text-[14.5px] leading-snug text-white/85">{story.signal}</p>
      )}
      <p className="pointer-events-none relative mt-3 text-[12.5px] tabular-nums text-white/70">{savedDate(story.savedAt)}</p>
      <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-4">
        <SourceLink source={story.source} url={story.url} variant="onColor" className="min-w-0 max-w-full" />
        {story.shareId && (
          <Link
            href={briefingHref(story.shareId)}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-[13.5px] font-semibold text-white underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Open briefing
          </Link>
        )}
        <Button variant="glass" size="md" onClick={onRemove} leadingIcon={<IconClose />} className="ml-auto" aria-label={`Remove from saved: ${story.headline}`}>
          Remove
        </Button>
      </div>
    </li>
  );
}

function SavedEmpty() {
  return (
    <Card padding="lg" className="flex max-w-lg flex-col items-start">
      <span
        aria-hidden="true"
        className="mb-5 flex size-16 items-center justify-center rounded-full border-2 border-dashed border-rule-strong text-ink-dim"
      >
        <IconBookmark size={22} />
      </span>
      <h2 className="display-sm mb-2">Nothing saved yet.</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-ink-2">
        Tap <span className="font-semibold text-ink">Save</span> on any story in a briefing and it shows up here, ready to
        read again.
      </p>
      <Button href="/">Get my briefing</Button>
    </Card>
  );
}
