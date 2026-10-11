"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useTransform } from "motion/react";
import { toast } from "sonner";
import { IconButton } from "@/components/ui/IconButton";
import { SignalGlyph } from "@/components/ui/Logo";
import { IconClose, IconPause, IconPlay } from "@/components/ui/icons";
import { EndCardFace, SaveBurst, StoryCardFace, StoryProgress } from "./StoryFaces";
import { useIsClient, type StoryEngine } from "./useStoryEngine";
import { useSavedStories } from "./useSavedStories";
import {
  briefingShareUrl,
  formatDateline,
  haptic,
  shareOrCopy,
  storyKey,
  type StoryLike,
  type StoryMeta,
} from "./storyUtils";
import { safeExternalUrl } from "@/components/siteUrl";

const HOLD_MS = 180;
const DOUBLE_TAP_MS = 260;
const TAP_DELAY_MS = 250;
const SWIPE_X = 50;
const SWIPE_DOWN = 90;
const PREV_ZONE = 0.3;
const SAVED_HINT = "Find it in History → Saved";

/**
 * Layout vars consumed by the faces. A parent may set --story-safe-top / --story-safe-bottom
 * (e.g. env(safe-area-inset-*) for the full-screen mobile overlay).
 */
const STAGE_VARS = {
  "--story-top": "calc(var(--story-safe-top, 0px) + 72px)",
  "--story-bottom": "calc(var(--story-safe-bottom, 0px) + 16px)",
} as CSSProperties;

type Gesture = {
  id: number;
  x: number;
  y: number;
  axis: "x" | "y" | null;
  held: boolean;
  holdTimer: number;
};

export type StoryStageProps = {
  engine: StoryEngine;
  stories: ReadonlyArray<StoryLike>;
  meta?: StoryMeta;
  mode: "overlay" | "inline";
  onClose?: () => void;
  endActions?: ReactNode;
  /** extra control rendered in the chrome row (e.g. an "expand" button for the inline deck) */
  chromeExtra?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Is the event target a real control (not a tap zone)? Those never navigate. */
function isControl(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const el = target.closest("a, button, input, textarea, select, [data-no-tap]");
  return !!el && !el.hasAttribute("data-tap-zone");
}

/**
 * The story frame: progress, chrome, animated card faces, tap zones, gestures,
 * double-tap save and burst. Sized by its parent (fills 100% × 100%).
 */
export function StoryStage({ engine, stories, meta, mode, onClose, endActions, chromeExtra, className = "", style }: StoryStageProps) {
  const { index, count, atEnd, direction, paused, held, reduced, progress, dragX, dragY } = engine;
  const { isSaved, save, toggle, signedIn } = useSavedStories();
  const isClient = useIsClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const tapTimer = useRef(0);
  const suppressClickUntil = useRef(0);
  const [burst, setBurst] = useState<{ key: number; x: number; y: number } | null>(null);

  const dragScale = useTransform(dragY, [0, 400], [1, 0.9]);

  useEffect(
    () => () => {
      window.clearTimeout(tapTimer.current);
      if (gesture.current) window.clearTimeout(gesture.current.holdTimer);
    },
    [],
  );

  const current = atEnd ? null : stories[index];
  const currentSaved = current ? isSaved(storyKey(current)) : false;

  /* ── actions ── */

  const shareId = meta?.shareId;

  const shareStory = async (story: StoryLike) => {
    const url = shareId ? briefingShareUrl(shareId) : safeExternalUrl(story.url) ?? window.location.href;
    engine.setBusy(true);
    await shareOrCopy({ url, title: story.headline, text: story.signal || story.summary });
    engine.setBusy(false);
  };

  const shareBriefing = async () => {
    const url = shareId ? briefingShareUrl(shareId) : window.location.href;
    engine.setBusy(true);
    await shareOrCopy({
      url,
      title: "The Signal — today's briefing",
      text: stories[0] ? `${stories[0].headline} + ${Math.max(0, stories.length - 1)} more` : undefined,
      copiedMessage: shareId ? "Link copied — it stays live for 30 days" : "Link copied",
    });
    engine.setBusy(false);
  };

  const saveAt = (x: number, y: number) => {
    const story = stories[engine.getIndex()];
    if (!story) return;
    const isNew = save(story, { shareId });
    if (!signedIn) return; // save() asked the visitor to create an account instead
    setBurst({ key: performance.now(), x, y });
    haptic([10, 40, 14]);
    if (isNew) toast.success("Saved", { description: SAVED_HINT });
    else toast("Already saved");
  };

  const toggleSaveCurrent = () => {
    const story = stories[engine.getIndex()];
    if (!story) return;
    const nowSaved = toggle(story, { shareId });
    if (!signedIn) return; // toggle() asked the visitor to create an account instead
    haptic(nowSaved ? [10, 40, 14] : 8);
    if (nowSaved) toast.success("Saved", { description: SAVED_HINT });
    else toast("Removed from saved");
  };

  /* ── gestures ── */

  const springBack = () => {
    const spring = { type: "spring", stiffness: 520, damping: 42 } as const;
    animate(dragX, 0, spring);
    animate(dragY, 0, spring);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isControl(e.target)) return;
    if (gesture.current) window.clearTimeout(gesture.current.holdTimer);
    const g: Gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, held: false, holdTimer: 0 };
    g.holdTimer = window.setTimeout(() => {
      g.held = true;
      engine.setHeld(true);
    }, HOLD_MS);
    gesture.current = g;
    if (e.pointerType === "mouse") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis && Math.hypot(dx, dy) > 10) {
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      window.clearTimeout(g.holdTimer);
      if (!g.held) engine.setHeld(true); // pause while dragging
    }
    if (reduced) return;
    if (g.axis === "x") dragX.set(dx * 0.35);
    if (g.axis === "y" && mode === "overlay") dragY.set(Math.max(0, dy));
  };

  const endGesture = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    window.clearTimeout(g.holdTimer);
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const wasPaused = g.held || g.axis !== null;
    if (wasPaused) engine.setHeld(false);

    if (g.axis || g.held) suppressClickUntil.current = performance.now() + 400;

    if (!cancelled && g.axis === "x" && Math.abs(dx) > SWIPE_X) {
      window.clearTimeout(tapTimer.current);
      lastTap.current = null;
      if (dx < 0) engine.next();
      else engine.prev();
    } else if (!cancelled && g.axis === "y" && mode === "overlay" && dy > SWIPE_DOWN && onClose) {
      onClose();
      return;
    }
    springBack();
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target instanceof Element ? e.target : null;
    const zoneEl = target?.closest<HTMLElement>("[data-tap-zone]");

    // Zone buttons are pointer-events:none, so a click that *targets* one came from
    // keyboard / assistive tech → navigate immediately, no double-tap wait.
    if (zoneEl) {
      if (zoneEl.dataset.tapZone === "prev") engine.prev();
      else engine.next();
      return;
    }
    if (isControl(target)) return;
    if (performance.now() < suppressClickUntil.current) return;

    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zone: "prev" | "next" = x < rect.width * PREV_ZONE ? "prev" : "next";
    const onStory = engine.getIndex() < count;

    if (!onStory) {
      // end card: only "back" is meaningful; no double-tap save
      if (zone === "prev") engine.prev();
      return;
    }

    const now = performance.now();
    const last = lastTap.current;
    if (last && now - last.t < DOUBLE_TAP_MS && Math.hypot(x - last.x, y - last.y) < 60) {
      window.clearTimeout(tapTimer.current);
      lastTap.current = null;
      saveAt(x, y);
      return;
    }
    lastTap.current = { t: now, x, y };
    window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => {
      lastTap.current = null;
      if (zone === "prev") engine.prev();
      else engine.next();
    }, TAP_DELAY_MS);
  };

  /* ── render ── */

  const variants = {
    enter: (dir: number) => (reduced ? { opacity: 0 } : { x: `${dir * 18}%`, opacity: 0, scale: 0.96 }),
    center: { x: "0%", opacity: 1, scale: 1 },
    exit: (dir: number) => (reduced ? { opacity: 0 } : { x: `${dir * -18}%`, opacity: 0, scale: 0.96 }),
  };
  const transition = reduced
    ? { duration: 0.15 }
    : { x: { type: "spring", stiffness: 420, damping: 40, mass: 0.8 }, opacity: { duration: 0.18 }, scale: { duration: 0.25 } };

  // locale/timezone dependent → client only (the inline deck is server-rendered)
  const when = isClient ? formatDateline(meta?.generatedAt) : "";

  return (
    <motion.div
      ref={rootRef}
      className={`relative isolate h-full w-full select-none overflow-hidden bg-ink [-webkit-touch-callout:none] ${className}`}
      style={{
        ...STAGE_VARS,
        containerType: "inline-size",
        touchAction: mode === "overlay" ? "none" : "pan-y",
        x: dragX,
        y: dragY,
        scale: dragScale,
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endGesture(e, false)}
      onPointerCancel={(e) => endGesture(e, true)}
      onClick={onClick}
      onContextMenu={(e) => {
        // long-press on touch would open the context menu / image callout
        if (!isControl(e.target)) e.preventDefault();
      }}
    >
      {/* chrome: progress + controls */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-[calc(var(--story-safe-top,0px)+10px)] transition-opacity duration-200 ${
          held ? "opacity-0" : "opacity-100"
        }`}
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.22), transparent)" }}
      >
        <StoryProgress index={index} count={count} progress={progress} />
        <div className="mt-1.5 flex items-center gap-1">
          <span className="flex min-w-0 flex-1 items-center gap-2 pl-1 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-white/90">
            <SignalGlyph size={16} strokeWidth={3} />
            <span className="truncate">The Signal{when ? ` · ${when}` : ""}</span>
          </span>
          <span className="pointer-events-auto flex items-center gap-0.5">
            {chromeExtra}
            {!atEnd && (
              <span className="relative">
                <IconButton
                  label={paused ? "Play stories" : "Pause stories"}
                  variant="glass"
                  className="!bg-transparent hover:!bg-white/15"
                  onClick={engine.togglePause}
                >
                  {paused ? <IconPlay size={18} /> : <IconPause size={18} />}
                </IconButton>
                <span
                  aria-hidden="true"
                  className={`absolute right-2 top-2 size-1.5 rounded-full bg-flare ${paused ? "opacity-100" : "animate-pulse-soft"}`}
                />
              </span>
            )}
            {onClose && mode === "overlay" && !atEnd && (
              <IconButton label="Close stories" variant="glass" className="!bg-transparent hover:!bg-white/15" onClick={onClose}>
                <IconClose size={22} />
              </IconButton>
            )}
          </span>
        </div>
      </div>

      {/* tap zones — real buttons for keyboard / AT; pointer taps are handled on the root */}
      <button
        type="button"
        data-tap-zone="prev"
        aria-label={index === 0 ? "Restart story" : "Previous story"}
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[30%] rounded-l-[inherit] outline-none focus-visible:bg-gradient-to-r focus-visible:from-white/20 focus-visible:to-transparent"
      />
      <button
        type="button"
        data-tap-zone="next"
        aria-label={atEnd ? "End of briefing" : index === count - 1 ? "Finish briefing" : "Next story"}
        disabled={atEnd}
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[70%] rounded-r-[inherit] outline-none focus-visible:bg-gradient-to-l focus-visible:from-white/20 focus-visible:to-transparent"
      />

      {/* card faces */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="absolute inset-0"
        >
          {current ? (
            <StoryCardFace
              story={current}
              index={index}
              count={count}
              saved={currentSaved}
              onToggleSave={toggleSaveCurrent}
              onShare={() => void shareStory(current)}
              shareLabel={shareId ? "Share briefing" : "Share story"}
            />
          ) : (
            <EndCardFace
              stories={stories}
              meta={meta}
              onJump={engine.goTo}
              onShare={() => void shareBriefing()}
              onReplay={engine.replay}
              onClose={mode === "overlay" ? onClose : undefined}
              endActions={endActions}
              canShare={mode === "overlay" || !!meta?.shareId}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {burst && (
        <SaveBurst
          key={burst.key}
          x={burst.x}
          y={burst.y}
          reduced={reduced}
          onDone={() => setBurst((b) => (b && b.key === burst.key ? null : b))}
        />
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {atEnd ? `End of briefing. ${count} stories.` : `Story ${index + 1} of ${count}${paused ? ", paused" : ""}`}
      </p>
    </motion.div>
  );
}
