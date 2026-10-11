"use client";

import type { Ref } from "react";
import { toast } from "sonner";
import type { Story } from "@/types/digest";
import { topicStyle } from "@/lib/topicStyle";
import { SourceLink } from "@/components/SourceLink";
import { safeExternalUrl } from "@/components/siteUrl";
import { Button, IconBookmark, IconShare, SignalBars, TopicChip } from "@/components/ui";
import { briefingShareUrl, haptic, shareOrCopy, storyKey, useSavedStories } from "@/components/story";

type SavedApi = Pick<ReturnType<typeof useSavedStories>, "isSaved" | "toggle" | "signedIn">;

export type BriefingStoryCardProps = {
  story: Story;
  /** 0-based position in the (importance-sorted) briefing. */
  index: number;
  total: number;
  shareId?: string;
  saved: SavedApi;
  className?: string;
  ref?: Ref<HTMLElement>;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Share one story: the briefing link (anchored to the story) when there is one, else the source. */
export async function shareStory(story: Story, position: number, shareId?: string) {
  const url = shareId
    ? `${briefingShareUrl(shareId)}#story-${position}`
    : (safeExternalUrl(story.url) ?? window.location.href);
  await shareOrCopy({
    url,
    title: story.headline,
    text: story.signal || story.headline,
    copiedMessage: "Link copied",
  });
}

/** One story in the reading list: topic band, headline, "Why it matters", summary, source, Save + Share. */
export function BriefingStoryCard({ story, index, total, shareId, saved, className = "", ref }: BriefingStoryCardProps) {
  const t = topicStyle(story.category);
  const position = index + 1;
  const titleId = `story-${position}-title`;
  const isSaved = saved.isSaved(storyKey(story));

  const onSave = () => {
    haptic(8);
    const was = isSaved;
    const now = saved.toggle(story, { shareId });
    // Signed out: toggle() already prompted sign-up and stored nothing.
    if (!saved.signedIn) return;
    if (now) toast.success("Saved", { description: "Find it in History → Saved" });
    else if (was) toast("Removed from saved");
  };

  return (
    <article
      ref={ref}
      id={`story-${position}`}
      data-index={index}
      aria-labelledby={titleId}
      className={`scroll-mt-24 overflow-hidden rounded-card bg-surface shadow-soft ring-1 ring-rule ${className}`}
    >
      {/* topic band */}
      <div className="grain relative flex min-h-12 items-center gap-2.5 px-5 py-2.5 text-white sm:px-6" style={{ background: t.color }}>
        <TopicChip topic={story.category} variant="onColor" size="sm" />
        <span className="font-mono text-[12px] font-medium tabular-nums tracking-[0.06em] text-white/80">
          <span aria-hidden="true">
            {pad2(position)}/{pad2(total)}
          </span>
          <span className="sr-only">
            Story {position} of {total}
          </span>
        </span>
        {index === 0 && total > 1 && (
          <span className="hidden font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-white sm:inline">Top story</span>
        )}
        <span className="ml-auto">
          <SignalBars value={story.importance} size="sm" color="#ffffff" />
        </span>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <h3
          id={titleId}
          className="font-display stretch-wide text-[22px] font-extrabold leading-[1.08] tracking-[-0.015em] sm:text-[26px] lg:text-[30px]"
          style={{ textWrap: "balance" }}
        >
          {story.headline}
        </h3>

        {story.signal && (
          <aside
            aria-label="Why it matters"
            className="mt-4 max-w-[65ch] rounded-[14px] px-4 py-3.5 sm:px-5"
            style={{ background: t.soft, boxShadow: `inset 3px 0 0 ${t.color}` }}
          >
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.onSoft }}>
                Why it matters
              </span>
              <span className="font-mono text-[12px] tracking-[0.02em] text-ink-mute">AI analysis</span>
            </p>
            <p className="mt-1.5 text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink sm:text-[17px]">{story.signal}</p>
          </aside>
        )}

        <p className="mt-4 max-w-[65ch] text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">{story.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
          <SourceLink source={story.source} url={story.url} variant="pill" className="max-w-full" />
          <span className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              aria-pressed={isSaved}
              onClick={onSave}
              leadingIcon={<IconBookmark filled={isSaved} />}
              className={isSaved ? "text-signal" : ""}
            >
              {isSaved ? "Saved" : "Save"}
              <span className="sr-only">: {story.headline}</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => void shareStory(story, position, shareId)}
              leadingIcon={<IconShare />}
            >
              Share
              <span className="sr-only">: {story.headline}</span>
            </Button>
          </span>
        </div>
      </div>
    </article>
  );
}
