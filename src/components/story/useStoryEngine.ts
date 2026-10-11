"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useMotionValue, useReducedMotion, type MotionValue } from "motion/react";
import { haptic, readingDurationMs, type StoryLike } from "./storyUtils";

const noopSubscribe = () => () => {};
/** false during SSR + hydration, true afterwards. */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export type StoryEngine = {
  /** current position; `count` means the end card */
  index: number;
  count: number;
  atEnd: boolean;
  /** +1 forward, -1 backward (for slide direction) */
  direction: 1 | -1;
  paused: boolean;
  running: boolean;
  held: boolean;
  reduced: boolean;
  /** 0–1 fill of the current segment */
  progress: MotionValue<number>;
  /** live drag offsets (gesture feedback) */
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
  replay: () => void;
  togglePause: () => void;
  setHeld: (held: boolean) => void;
  /** pause while a share sheet etc. is open */
  setBusy: (busy: boolean) => void;
  /** read the live index from callbacks/timers */
  getIndex: () => number;
};

export function useStoryEngine({
  stories,
  startIndex = 0,
  autoplay = false,
  active = true,
  onIndexChange,
}: {
  stories: ReadonlyArray<StoryLike>;
  startIndex?: number;
  autoplay?: boolean;
  /** external gate (e.g. inline deck scrolled out of view) */
  active?: boolean;
  onIndexChange?: (index: number) => void;
}): StoryEngine {
  const isClient = useIsClient();
  const reducedPref = useReducedMotion();
  const reduced = isClient && reducedPref === true;

  const count = stories.length;
  const clamp = useCallback((i: number) => Math.max(0, Math.min(count, i)), [count]);

  const [index, setIndex] = useState(() => Math.max(0, Math.min(count, startIndex)));
  const indexRef = useRef(index);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [held, setHeld] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  const progress = useMotionValue(0);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const elapsed = useRef(0);

  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  });

  const durations = useMemo(() => stories.map((s) => readingDurationMs(s)), [stories]);

  // Reduced motion → autoplay off by default (the user can still press play).
  const paused = userPaused ?? (!autoplay || reduced);
  const atEnd = index >= count;
  const running = !paused && !held && !busy && !hidden && active && !atEnd && count > 0;
  const duration = atEnd ? 0 : durations[index] ?? 8000;

  const goTo = useCallback(
    (i: number) => {
      const target = clamp(i);
      const from = indexRef.current;
      if (target === from) return;
      indexRef.current = target;
      elapsed.current = 0;
      progress.set(0);
      setDirection(target > from ? 1 : -1);
      setIndex(target);
      haptic(8);
      onIndexChangeRef.current?.(target);
    },
    [clamp, progress],
  );

  const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);

  const prev = useCallback(() => {
    if (indexRef.current === 0) {
      // first story: restart it instead
      elapsed.current = 0;
      progress.set(0);
      return;
    }
    goTo(indexRef.current - 1);
  }, [goTo, progress]);

  const replay = useCallback(() => {
    goTo(0);
    elapsed.current = 0;
    progress.set(0);
    // keep playing if the reader had pressed play (or autoplay is on); otherwise stay paused
    if (!reduced && autoplay) setUserPaused(false);
  }, [autoplay, goTo, progress, reduced]);

  const togglePause = useCallback(() => {
    setUserPaused((p) => !(p ?? (!autoplay || reduced)));
  }, [autoplay, reduced]);

  const getIndex = useCallback(() => indexRef.current, []);

  // Pause when the tab is hidden.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Auto-advance clock (rAF; progress is a motion value so no per-frame re-render).
  useEffect(() => {
    if (!running || duration <= 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += Math.max(0, now - last);
      last = now;
      const p = Math.min(1, elapsed.current / duration);
      progress.set(p);
      if (p >= 1) {
        goTo(indexRef.current + 1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, duration, index, goTo, progress]);

  return {
    index,
    count,
    atEnd,
    direction,
    paused,
    running,
    held,
    reduced,
    progress,
    dragX,
    dragY,
    goTo,
    next,
    prev,
    replay,
    togglePause,
    setHeld,
    setBusy,
    getIndex,
  };
}
