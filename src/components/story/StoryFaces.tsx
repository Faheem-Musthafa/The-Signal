"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, type MotionValue } from "motion/react";
import { topicStyle } from "@/lib/topicStyle";
import { SourceLink } from "@/components/SourceLink";
import { SignalBars } from "@/components/ui/SignalBars";
import { TopicChip, TopicGlyph } from "@/components/ui/TopicChip";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { SignalGlyph } from "@/components/ui/Logo";
import { IconBookmark, IconClose, IconReplay, IconShare } from "@/components/ui/icons";
import { formatDateline, type StoryLike, type StoryMeta } from "./storyUtils";

/* ───────────────────────── progress ───────────────────────── */

function Segment({ state, progress }: { state: "done" | "current" | "todo"; progress: MotionValue<number> }) {
  return (
    <span className={`relative block h-[3px] flex-1 overflow-hidden rounded-full ${state === "current" ? "bg-white/40" : "bg-white/25"}`}>
      {state === "done" && <span className="absolute inset-0 rounded-full bg-white" />}
      {state === "current" && (
        <motion.span className="absolute inset-0 origin-left rounded-full bg-white" style={{ scaleX: progress }} />
      )}
    </span>
  );
}

/** One segment per story + one for the end card. */
export function StoryProgress({ index, count, progress }: { index: number; count: number; progress: MotionValue<number> }) {
  return (
    <div aria-hidden="true" className="flex gap-1">
      {Array.from({ length: count + 1 }).map((_, i) => (
        <Segment key={i} state={i < index || (i === count && index === count) ? "done" : i === index ? "current" : "todo"} progress={progress} />
      ))}
    </div>
  );
}

/* ───────────────────────── decoration ───────────────────────── */

/** Faint frequency-wave line motif + broadcast rings. Decorative. */
export function WaveMotif() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 700" fill="none">
      <g stroke="white" strokeLinecap="round">
        <circle cx="400" cy="0" r="120" strokeOpacity="0.07" strokeWidth="1.5" />
        <circle cx="400" cy="0" r="190" strokeOpacity="0.055" strokeWidth="1.5" />
        <circle cx="400" cy="0" r="260" strokeOpacity="0.04" strokeWidth="1.5" />
        <path
          d="M-20 560 C 30 560, 40 500, 80 500 S 130 620, 170 620 S 220 470, 260 470 S 310 600, 350 600 S 400 540, 430 540"
          strokeOpacity="0.14"
          strokeWidth="2"
        />
        <path
          d="M-20 600 C 40 600, 50 560, 100 560 S 160 640, 210 640 S 270 540, 320 540 S 380 610, 430 610"
          strokeOpacity="0.07"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

/** "Tap Tap" save burst at a point inside the stage. */
export function SaveBurst({ x, y, reduced, onDone }: { x: number; y: number; reduced: boolean; onDone: () => void }) {
  const rays = [0, 60, 120, 180, 240, 300];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-40" style={{ left: x, top: y }}>
      {!reduced &&
        [0, 1].map((r) => (
          <motion.span
            key={r}
            className="absolute -left-9 -top-9 block size-[72px] rounded-full border-2 border-white"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 2.2 + r * 0.6, opacity: 0 }}
            transition={{ duration: 0.7, delay: r * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      {!reduced &&
        rays.map((deg) => (
          <motion.span
            key={deg}
            className="absolute -left-1 -top-1 block size-2 rounded-full bg-white"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((deg * Math.PI) / 180) * 70,
              y: Math.sin((deg * Math.PI) / 180) * 70,
              opacity: 0,
              scale: 0.4,
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      <motion.span
        className="absolute -left-9 -top-9 flex size-[72px] items-center justify-center rounded-full bg-white text-signal shadow-story"
        initial={reduced ? { opacity: 0 } : { scale: 0.2, opacity: 0, rotate: -20 }}
        animate={reduced ? { opacity: [0, 1, 1, 0] } : { scale: [0.2, 1.2, 1, 0.9], opacity: [0, 1, 1, 0], rotate: [-20, 6, 0, 0] }}
        transition={{ duration: reduced ? 0.9 : 0.85, times: [0, 0.3, 0.7, 1], ease: "easeOut" }}
        onAnimationComplete={onDone}
      >
        <SignalGlyph size={38} strokeWidth={2.8} />
      </motion.span>
    </div>
  );
}

/* ───────────────────────── story card ───────────────────────── */

function headlineSize(text: string) {
  const n = text.length;
  if (n <= 48) return "clamp(22px, 8.6cqw, 38px)";
  if (n <= 80) return "clamp(20px, 7.2cqw, 31px)";
  return "clamp(18px, 6.1cqw, 26px)";
}

/** Makes the summary scrollable only when it actually overflows (so swipes still work otherwise). */
function useOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => setOverflow(el.scrollHeight > el.clientHeight + 2);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();
    return () => ro.disconnect();
  }, []);
  return [ref, overflow] as const;
}

export type StoryCardFaceProps = {
  story: StoryLike;
  index: number;
  count: number;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  /** Visible label of the share button: "Share briefing" when it shares the briefing link (shareId), else "Share story". */
  shareLabel?: string;
};

export function StoryCardFace({ story, index, count, saved, onToggleSave, onShare, shareLabel = "Share story" }: StoryCardFaceProps) {
  const t = topicStyle(story.category);
  const [summaryRef, overflow] = useOverflow<HTMLParagraphElement>();
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <article
      aria-roledescription="story"
      aria-label={`Story ${index + 1} of ${count}`}
      className="grain relative flex h-full w-full flex-col text-white"
      style={{ background: `radial-gradient(120% 70% at 100% 0%, rgba(255,255,255,0.14), transparent 60%), ${t.color}` }}
    >
      <WaveMotif />

      <div className="flex min-h-0 flex-1 flex-col px-5 pt-[var(--story-top)] sm:px-6">
        <div className="flex items-center gap-2.5">
          <TopicChip topic={story.category} variant="onColor" size="sm" />
          <span className="font-mono text-[12px] font-medium tabular-nums tracking-[0.06em] text-white/80">
            {pad(index + 1)}/{pad(count)}
          </span>
          <span className="ml-auto text-white">
            <SignalBars value={story.importance} size="sm" color="#ffffff" />
          </span>
        </div>

        <h2
          className="font-display stretch-wide mt-4 font-extrabold leading-[1.02] tracking-[-0.02em] text-white"
          style={{ fontSize: headlineSize(story.headline), textWrap: "balance" }}
        >
          {story.headline}
        </h2>

        {story.signal && (
          <div className="mt-4 rounded-[14px] bg-white px-4 py-3 text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]">
            <p className="flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.color }}>
              <TopicGlyph topic={story.category} size={13} strokeWidth={2.2} />
              The Signal
            </p>
            <p className="mt-1 font-semibold leading-snug tracking-[-0.01em]" style={{ fontSize: "clamp(15px, 4.4cqw, 17px)" }}>
              {story.signal}
            </p>
          </div>
        )}

        <p
          ref={summaryRef}
          data-scrollable={overflow || undefined}
          className={`mt-4 min-h-0 flex-1 leading-relaxed text-white/[0.88] ${
            overflow ? "overflow-y-auto overscroll-contain pr-1 [mask-image:linear-gradient(to_bottom,black_85%,transparent)] [touch-action:pan-y]" : "overflow-hidden"
          }`}
          style={{ fontSize: "clamp(15px, 4.3cqw, 17px)" }}
        >
          {story.summary}
        </p>
      </div>

      <div className="flex flex-col gap-2 px-5 pb-[var(--story-bottom)] pt-3 sm:px-6">
        <SourceLink
          source={story.source}
          url={story.url}
          variant="onColor"
          className="max-w-full self-start"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
        {/* Visible, labelled actions (double-tap to save stays as a shortcut) */}
        <div className="flex gap-2">
          <Button
            variant={saved ? "inverse" : "glass"}
            size="md"
            className="flex-none px-4"
            aria-pressed={saved}
            leadingIcon={<IconBookmark filled={saved} />}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
          >
            {saved ? "Saved" : "Save"}
          </Button>
          <Button
            variant="glass"
            size="md"
            className="min-w-0 flex-1 px-4"
            leadingIcon={<IconShare />}
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            <span className="truncate">{shareLabel}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── end card ───────────────────────── */

export type EndCardFaceProps = {
  stories: ReadonlyArray<StoryLike>;
  meta?: StoryMeta;
  onJump: (index: number) => void;
  onShare: () => void;
  onReplay: () => void;
  onClose?: () => void;
  endActions?: ReactNode;
  /** whether the share button makes sense (overlay: always; inline: when shareId) */
  canShare: boolean;
};

export function EndCardFace({ stories, meta, onJump, onShare, onReplay, onClose, endActions, canShare }: EndCardFaceProps) {
  const topics = Array.from(new Set(meta?.topics?.length ? meta.topics : stories.map((s) => s.category)));
  const when = formatDateline(meta?.generatedAt);

  return (
    <section
      aria-label="End of briefing"
      className="grain relative flex h-full w-full flex-col bg-ink text-white"
      style={{
        background:
          "radial-gradient(90% 55% at 15% 0%, rgba(47,75,255,0.55), transparent 65%), radial-gradient(70% 45% at 100% 100%, rgba(47,75,255,0.25), transparent 70%), #0E1220",
      }}
    >
      <WaveMotif />
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-[var(--story-top)] sm:px-6">
        <p className="flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-white/75">
          <span className="size-1.5 rounded-full bg-white/80" aria-hidden="true" />
          End of briefing
        </p>
        <h2
          className="font-display stretch-wider mt-3 font-extrabold leading-[0.98] tracking-[-0.025em] text-white"
          style={{ fontSize: "clamp(28px, 10cqw, 44px)" }}
        >
          You&rsquo;re caught up
        </h2>
        <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.08em] text-white/70">
          {stories.length} {stories.length === 1 ? "story" : "stories"} · {topics.length} {topics.length === 1 ? "topic" : "topics"}
          {when ? ` · ${when}` : ""}
        </p>

        <ol className="scrollbar-none mt-4 min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain [touch-action:pan-y]">
          {stories.map((s, i) => {
            const t = topicStyle(s.category);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="group flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: t.color }}>
                    <TopicGlyph topic={s.category} size={17} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-medium leading-snug text-white/90 line-clamp-2 group-hover:text-white">
                    {s.headline}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-white/55">{String(i + 1).padStart(2, "0")}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-2 px-5 pb-[var(--story-bottom)] pt-3 sm:px-6">
        {endActions}
        <div className="flex gap-2">
          {canShare && (
            <Button variant="inverse" size="md" className="flex-1" leadingIcon={<IconShare />} onClick={onShare}>
              Share briefing
            </Button>
          )}
          <Button variant="glass" size="md" className={canShare ? "" : "flex-1"} leadingIcon={<IconReplay />} onClick={onReplay}>
            Replay
          </Button>
          {onClose && (
            <IconButton label="Close stories" variant="glass" onClick={onClose}>
              <IconClose />
            </IconButton>
          )}
        </div>
      </div>
    </section>
  );
}
