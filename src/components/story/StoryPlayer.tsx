"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { AnimatePresence, motion, useTransform } from "motion/react";
import { IconButton } from "@/components/ui/IconButton";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";
import { topicStyle } from "@/lib/topicStyle";
import { StoryStage } from "./StoryStage";
import { useIsClient, useStoryEngine } from "./useStoryEngine";
import type { StoryLike, StoryMeta } from "./storyUtils";

export type StoryPlayerProps = {
  /** Controls visibility. Each open starts fresh at `startIndex`. */
  open: boolean;
  stories: ReadonlyArray<StoryLike>;
  startIndex?: number;
  onClose: () => void;
  meta?: StoryMeta;
  /** Extra actions on the end card (e.g. "Get this daily by email" CTA). Use dark-surface variants: Button variant="inverse" | "glass". */
  endActions?: ReactNode;
  /**
   * Autoplay by reading time. Default false: the player opens paused and the reader
   * presses play (or taps through). Always off under prefers-reduced-motion until play is pressed.
   */
  autoplay?: boolean;
  onIndexChange?: (index: number) => void;
  /** Accessible dialog name (default "Briefing stories") */
  label?: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen (mobile) / centred 9:16 card (desktop) story player for a briefing.
 * Portal + focus-trapped modal dialog + body scroll lock. Renders nothing until mounted.
 * Opening pushes a history entry, so the browser Back button / gesture closes it;
 * closing from the UI pops that entry again.
 */
export function StoryPlayer(props: StoryPlayerProps) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>{props.open && props.stories.length > 0 && <StoryOverlay key="story-overlay" {...props} />}</AnimatePresence>,
    document.body,
  );
}

/** Monotonic id for the history entries the player pushes. */
let historySeq = 0;
const HISTORY_KEY = "__signalStory";

function isOurEntry(id: number) {
  const state: unknown = window.history.state;
  return !!state && typeof state === "object" && (state as Record<string, unknown>)[HISTORY_KEY] === id;
}

/** Is this key/focus event happening inside another modal layered on top (e.g. Clerk's sign-up)? */
function inOtherLayer(target: EventTarget | null, dialog: HTMLElement) {
  if (!(target instanceof Element) || dialog.contains(target)) return false;
  return !!target.closest('[aria-modal="true"], [role="dialog"], [role="alertdialog"], .cl-modalBackdrop, .cl-rootBox, [data-sonner-toaster]');
}

function StoryOverlay({ stories, startIndex = 0, onClose, meta, endActions, autoplay = false, onIndexChange, label = "Briefing stories" }: StoryPlayerProps) {
  const engine = useStoryEngine({ stories, startIndex, autoplay, onIndexChange });
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // History entry: opening pushes one so the Back button/gesture closes the player.
  // Closing from the UI pops it again (history.back) so Back history stays clean.
  const history = useRef({ id: 0, pushed: false, popped: false, closing: false });
  useEffect(() => {
    const h = history.current;
    // Deferred so React StrictMode's mount→unmount→mount doesn't push/pop twice.
    const timer = window.setTimeout(() => {
      h.id = ++historySeq;
      h.pushed = true;
      h.popped = false;
      h.closing = false;
      try {
        window.history.pushState({ [HISTORY_KEY]: h.id }, "");
      } catch {
        h.pushed = false;
      }
    }, 0);
    const onPop = () => {
      if (!h.pushed || h.popped) return;
      if (isOurEntry(h.id)) return; // moved forward onto our entry again
      h.popped = true;
      if (!h.closing) onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", onPop);
      if (h.pushed && !h.popped && !h.closing && isOurEntry(h.id)) {
        h.closing = true;
        window.history.back();
      }
    };
  }, []);

  /** Close from the UI (button, Esc, swipe, backdrop): drop our history entry, then close. */
  const requestClose = useCallback(() => {
    const h = history.current;
    if (h.pushed && !h.popped && !h.closing && isOurEntry(h.id)) {
      h.closing = true;
      window.history.back();
    }
    onCloseRef.current();
  }, []);

  // Internal links inside the player (e.g. end-card CTAs): pop our entry first, then
  // navigate, so Back from the new page returns to the page (not a stale player entry).
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
    let url: URL;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    const h = history.current;
    if (!h.pushed || h.popped || h.closing || !isOurEntry(h.id)) return;
    e.preventDefault();
    e.stopPropagation();
    const href = `${url.pathname}${url.search}${url.hash}`;
    h.closing = true;
    window.addEventListener("popstate", () => router.push(href as Route), { once: true });
    window.history.back();
    onCloseRef.current();
  };

  const { index, count, atEnd, reduced, dragY } = engine;
  const color = atEnd ? "#2F4BFF" : topicStyle(stories[index]?.category).color;
  const backdropOpacity = useTransform(dragY, [0, 360], [1, 0.25]);

  // Scroll lock (with scrollbar compensation) + focus in / restore.
  useEffect(() => {
    const { body, documentElement: html } = document;
    const prev = { body: body.style.overflow, html: html.style.overflow, pad: body.style.paddingRight };
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus({ preventScroll: true });

    return () => {
      html.style.overflow = prev.html;
      body.style.overflow = prev.body;
      body.style.paddingRight = prev.pad;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  // Keyboard: ←/→, Space, Esc, and the Tab focus trap.
  const { next, prev, togglePause } = engine;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || e.defaultPrevented) return;
      // A modal on top of the player (Clerk sign-up, …) owns the keyboard.
      if (inOtherLayer(e.target, dialog)) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      const nativeControl = !!target?.closest("button, a, input, textarea, select");

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          requestClose();
          return;
        case "ArrowRight":
          e.preventDefault();
          next();
          return;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          return;
        case " ":
        case "Spacebar":
          if (nativeControl) return; // let the focused button activate
          e.preventDefault();
          togglePause();
          return;
        case "Tab": {
          const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => el.getClientRects().length > 0 && !el.closest("[aria-hidden='true']"),
          );
          if (items.length === 0) {
            e.preventDefault();
            dialog.focus();
            return;
          }
          const first = items[0];
          const last = items[items.length - 1];
          const active = document.activeElement;
          if (!dialog.contains(active) || active === dialog) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
          } else if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
          }
          return;
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev, togglePause, requestClose]);

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      onClickCapture={onClickCapture}
      className="fixed inset-0 z-[100] flex items-center justify-center outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.1 : 0.22 }}
    >
      {/* backdrop: dim + blur + current topic glow; click to close (desktop) */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/85 backdrop-blur-md"
        style={{ opacity: backdropOpacity }}
        onClick={requestClose}
      >
        <div
          className="absolute inset-0 transition-[background] duration-500"
          style={{ background: `radial-gradient(60% 55% at 50% 50%, ${color}59, transparent 70%)` }}
        />
      </motion.div>

      <div className="relative flex h-full w-full items-center justify-center gap-5 sm:h-auto sm:w-auto">
        <IconButton
          label="Previous story"
          variant="glass"
          size="lg"
          className="hidden sm:inline-flex"
          disabled={index === 0}
          onClick={prev}
        >
          <IconChevronLeft />
        </IconButton>

        <motion.div
          className="h-dvh w-full sm:aspect-[9/16] sm:h-[min(88dvh,820px)] sm:w-auto sm:max-w-[440px] sm:overflow-hidden sm:rounded-story sm:shadow-story"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
          transition={reduced ? { duration: 0.1 } : { type: "spring", stiffness: 380, damping: 34 }}
          style={
            {
              "--story-safe-top": "env(safe-area-inset-top, 0px)",
              "--story-safe-bottom": "env(safe-area-inset-bottom, 0px)",
            } as CSSProperties
          }
        >
          <StoryStage engine={engine} stories={stories} meta={meta} mode="overlay" onClose={requestClose} endActions={endActions} className="sm:rounded-story" />
        </motion.div>

        <IconButton
          label={index === count - 1 ? "Finish briefing" : "Next story"}
          variant="glass"
          size="lg"
          className="hidden sm:inline-flex"
          disabled={atEnd}
          onClick={next}
        >
          <IconChevronRight />
        </IconButton>
      </div>
    </motion.div>
  );
}
