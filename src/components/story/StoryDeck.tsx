"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { StoryStage } from "./StoryStage";
import { useStoryEngine } from "./useStoryEngine";
import type { StoryLike, StoryMeta } from "./storyUtils";

export type StoryDeckProps = {
  stories: ReadonlyArray<StoryLike>;
  meta?: StoryMeta;
  startIndex?: number;
  /** Extra actions on the end card (dark surface — use Button variant="inverse" | "glass") */
  endActions?: ReactNode;
  /** Autoplay while ≥50% visible (default false — the reader presses play; always off under prefers-reduced-motion) */
  autoplay?: boolean;
  onIndexChange?: (index: number) => void;
  /** If given, shows an expand button in the chrome (e.g. open the full StoryPlayer at the current index). */
  onExpand?: (index: number) => void;
  /** Accessible name for the region */
  label?: string;
  /** Sizing / radius / shadow for the frame. The deck fills it. Default: rounded-story. */
  className?: string;
};

/**
 * Inline (embedded) story deck — same cards, taps, swipes, double-tap save and
 * end card as StoryPlayer, but no overlay / scroll lock / Esc. Give the parent a
 * size (e.g. a phone frame `aspect-[9/16] w-[320px]`). Vertical page scroll keeps working.
 */
export function StoryDeck({
  stories,
  meta,
  startIndex = 0,
  endActions,
  autoplay = false,
  onIndexChange,
  onExpand,
  label = "Briefing preview",
  className = "rounded-story",
}: StoryDeckProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const engine = useStoryEngine({ stories, startIndex, autoplay, active: inView, onIndexChange });

  if (stories.length === 0) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-ink font-mono text-[12px] uppercase tracking-[0.12em] text-white/70 ${className}`}>
        No stories yet
      </div>
    );
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      engine.next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      engine.prev();
    } else if ((e.key === " " || e.key === "Spacebar") && !target?.closest("button, a, input, textarea, select")) {
      e.preventDefault();
      engine.togglePause();
    }
  };

  return (
    <div
      ref={wrapRef}
      role="region"
      aria-roledescription="story deck"
      aria-label={label}
      className={`relative h-full w-full overflow-hidden ${className}`}
      onKeyDown={onKeyDown}
    >
      <StoryStage
        engine={engine}
        stories={stories}
        meta={meta}
        mode="inline"
        endActions={endActions}
        className="rounded-[inherit]"
        chromeExtra={
          onExpand ? (
            <IconButton
              label="Open full screen"
              variant="glass"
              className="!bg-transparent hover:!bg-white/15"
              onClick={() => onExpand(engine.getIndex())}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 4h6v6" />
                <path d="M10 20H4v-6" />
                <path d="M20 4l-7 7" />
                <path d="M4 20l7-7" />
              </svg>
            </IconButton>
          ) : undefined
        }
      />
    </div>
  );
}
