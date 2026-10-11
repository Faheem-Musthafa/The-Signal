"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import type { Story } from "@/types/digest";
import { topicStyle } from "@/lib/topicStyle";
import { Button, IconChevronLeft, IconChevronRight, IconPlay, IconReplay, IconShare, SignalBars, TopicChip } from "@/components/ui";
import { StoryPlayer, useIsClient, useRequireAccount, useSavedStories } from "@/components/story";
import { BriefingStoryCard } from "./BriefingStoryCard";
import { BriefingEndCard, shareBriefing } from "./BriefingEndCard";
import { briefingWhen } from "./time";
import { useAutoplayPreference } from "@/components/landing/preferences";

export type BriefingMode = "app" | "public" | "preview";

export type BriefingMeta = {
  /** ISO timestamp of when the briefing was generated. */
  generatedAt: string;
  topics: string[];
  shareId?: string;
  /** Served from the recent-briefing cache (didn't use quota). */
  cached?: boolean;
};

export type BriefingViewProps = {
  stories: Story[];
  meta: BriefingMeta;
  /**
   * app     — signed-in reader (Save/Share, daily email opt-in, New briefing)
   * public  — share page ("Get your own briefing")
   * preview — signed-out landing preview (saves and fresh briefings prompt sign-up)
   */
  mode: "app" | "public" | "preview";
  /** "New briefing" action (app mode). Defaults to a link to "/". */
  onNewBriefing?: () => void;
  /** Replaces the default "You're caught up" card. */
  endCard?: ReactNode;
  /** Replaces the default masthead (title, date, topics). The Play/Share actions stay. */
  header?: ReactNode;
};

const DESKTOP_QUERY = "(min-width: 1024px)";

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/** Highest importance first; original order breaks ties. */
function byImportance(stories: Story[]): Story[] {
  return stories
    .map((story, i) => ({ story, i }))
    .sort((a, b) => b.story.importance - a.story.importance || a.i - b.i)
    .map((x) => x.story);
}

function Masthead({ total, meta, mode }: { total: number; meta: BriefingMeta; mode: BriefingMode }) {
  const isClient = useIsClient();
  const when = isClient ? briefingWhen(meta.generatedAt) : "";
  const isToday = when.startsWith("Today");
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-mute">
        <span className="inline-flex items-center gap-2 font-semibold text-signal">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
          {mode === "preview" ? "Recent briefing" : isToday ? "Today's briefing" : "Briefing"}
        </span>
        {when && (
          <time dateTime={meta.generatedAt} suppressHydrationWarning>
            {when}
          </time>
        )}
        {meta.cached && mode === "app" && (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[12px] font-semibold normal-case tracking-normal text-success">
            Recent copy · didn&apos;t use a briefing
          </span>
        )}
      </p>
      <h2 className="display-md mt-2.5 max-w-2xl">
        {total} {total === 1 ? "story" : "stories"}, most important first.
      </h2>
      {meta.topics.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Topics">
          {meta.topics.map((t) => (
            <li key={t}>
              <TopicChip topic={t} variant="soft" size="md" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProgressSegments({ total, current, className = "" }: { total: number; current: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`flex gap-1 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= current ? "bg-signal" : "bg-ink/10"}`}
        />
      ))}
    </span>
  );
}

/**
 * THE reading view for a briefing. A finite list sorted by importance with
 * Save/Share on every story, "Story 3 of 6" progress and a clear ending.
 * Desktop (≥1024px): two panes (index left, open story right; j/k or ↑/↓).
 * "Play briefing" opens the Tap Tap story player at the current story.
 */
export function BriefingView({ stories, meta, mode, onNewBriefing, endCard, header }: BriefingViewProps) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const [autoplayPref] = useAutoplayPreference();
  const savedApi = useSavedStories();
  const requireAccount = useRequireAccount();
  const sorted = useMemo(() => byImportance(stories), [stories]);
  const total = sorted.length;

  // desktop pane selection (0…total, where total = the end card)
  const [selected, setSelected] = useState(0);
  // mobile scroll position (index of the story crossing the reading line)
  const [inView, setInView] = useState(0);
  const [listVisible, setListVisible] = useState(false);
  const [player, setPlayer] = useState({ open: false, start: 0 });
  const [announcement, setAnnouncement] = useState("");
  const [forStories, setForStories] = useState(stories);
  const playerIndex = useRef(0);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  // New briefing → back to the top.
  if (forStories !== stories) {
    setForStories(stories);
    setSelected(0);
    setInView(0);
    setPlayer({ open: false, start: 0 });
  }

  const scrollBehavior: ScrollBehavior = reduce ? "auto" : "smooth";

  const select = useCallback(
    (next: number) => {
      const i = Math.max(0, Math.min(total, next));
      setSelected(i);
      setAnnouncement(i === total ? "End of briefing. You're caught up." : `Story ${i + 1} of ${total}: ${sorted[i]?.headline ?? ""}`);
      const pane = paneRef.current;
      if (pane && pane.getBoundingClientRect().top < 0) pane.scrollIntoView({ block: "start", behavior: scrollBehavior });
    },
    [scrollBehavior, sorted, total],
  );

  const scrollToItem = useCallback(
    (i: number) => {
      const el = i >= total ? endRef.current : itemRefs.current[i];
      el?.scrollIntoView({ block: "start", behavior: scrollBehavior });
    },
    [scrollBehavior, total],
  );

  // Progress on small screens: which story crosses the reading line.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = [...itemRefs.current.slice(0, total), endRef.current].filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isFinite(i)) setInView(i);
        }
      },
      { rootMargin: "-35% 0px -60% 0px", threshold: 0 },
    );
    targets.forEach((el) => io.observe(el));

    const list = listRef.current;
    const listIo = new IntersectionObserver(([entry]) => setListVisible(entry?.isIntersecting ?? false), { threshold: 0 });
    if (list) listIo.observe(list);
    return () => {
      io.disconnect();
      listIo.disconnect();
    };
  }, [total]);

  // Deep link (#story-3) opens that story in the desktop pane.
  useEffect(() => {
    const m = /^#story-(\d+)$/.exec(window.location.hash);
    if (!m) return;
    const i = Number(m[1]) - 1;
    if (i < 0 || i >= total) return;
    const id = window.requestAnimationFrame(() => setSelected(i));
    return () => window.cancelAnimationFrame(id);
  }, [total]);

  // Keyboard: j/k everywhere, ↑/↓ on desktop (two-pane).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (player.open || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const desktop = isDesktop();
      const key = e.key;
      const next = key === "j" || (desktop && key === "ArrowDown");
      const prev = key === "k" || (desktop && key === "ArrowUp");
      if (!next && !prev) return;
      e.preventDefault();
      const delta = next ? 1 : -1;
      if (desktop) select(selected + delta);
      else scrollToItem(Math.max(0, Math.min(total, inView + delta)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, player.open, scrollToItem, select, selected, total]);

  const currentIndex = () => {
    const i = isDesktop() ? selected : inView;
    return i >= total ? 0 : i;
  };

  const openPlayer = (start?: number) => {
    const s = start ?? currentIndex();
    playerIndex.current = s;
    setPlayer({ open: true, start: s });
  };

  const closePlayer = () => {
    setPlayer((p) => ({ ...p, open: false }));
    if (isDesktop()) setSelected(Math.min(total, Math.max(0, playerIndex.current)));
  };

  const freshBriefing = () => {
    if (requireAccount("Create a free account to get a fresh briefing")) router.push("/");
  };

  if (total === 0) {
    return (
      <div className="rounded-story bg-surface p-8 text-center shadow-soft ring-1 ring-rule">
        <h2 className="display-sm">This briefing is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-2">There were no stories to show. Try a new briefing.</p>
        <Button href="/" variant="primary" size="lg" className="mt-6">
          {mode === "app" ? "New briefing" : "Get your own briefing"}
        </Button>
      </div>
    );
  }

  const shareId = meta.shareId;
  const progressShown = Math.min(inView, total - 1);
  const pillVisible = listVisible && inView < total && !player.open;
  const pillBottom =
    mode === "app"
      ? "bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6"
      : "bottom-[calc(env(safe-area-inset-bottom,0px)+16px)]";

  const playerEndActions =
    mode === "app" ? (
      <div className="flex flex-col gap-2">
        {onNewBriefing ? (
          <Button
            variant="inverse"
            fullWidth
            onClick={() => {
              closePlayer();
              onNewBriefing();
            }}
          >
            New briefing
          </Button>
        ) : (
          <Button href="/" variant="inverse" fullWidth>
            New briefing
          </Button>
        )}
        <Button variant="glass" fullWidth onClick={closePlayer}>
          Back to the list
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {mode === "public" ? (
          <Button href="/" variant="inverse" fullWidth>
            Get your own briefing
          </Button>
        ) : (
          <Button
            variant="inverse"
            fullWidth
            onClick={() => {
              closePlayer();
              freshBriefing();
            }}
          >
            Get a fresh briefing
          </Button>
        )}
        <Button variant="glass" fullWidth onClick={closePlayer}>
          Back to the list
        </Button>
      </div>
    );

  return (
    <div className="pb-6">
      {/* masthead + actions */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">{header ?? <Masthead total={total} meta={meta} mode={mode} />}</div>
        <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
          <Button variant="primary" size="lg" leadingIcon={<IconPlay />} onClick={() => openPlayer()} className="flex-1 sm:flex-none">
            Play briefing
          </Button>
          {shareId && (
            <Button
              variant="secondary"
              size="lg"
              leadingIcon={<IconShare />}
              onClick={() => void shareBriefing(shareId)}
              className="flex-1 sm:flex-none"
            >
              Share briefing
            </Button>
          )}
          {mode === "app" && (
            <span className="hidden sm:contents">
              {onNewBriefing ? (
                <Button variant="ghost" size="lg" leadingIcon={<IconReplay />} onClick={onNewBriefing}>
                  New briefing
                </Button>
              ) : (
                <Button href="/" variant="ghost" size="lg" leadingIcon={<IconReplay />}>
                  New briefing
                </Button>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="mt-7 lg:grid lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* desktop index */}
        <nav aria-label="Stories in this briefing" className="hidden lg:sticky lg:top-24 lg:block">
          <div className="rounded-card bg-surface p-3 shadow-soft ring-1 ring-rule">
            <div className="px-2 pb-3 pt-1">
              <p className="font-mono text-[12px] font-semibold tabular-nums tracking-[0.04em] text-ink">
                {selected < total ? `Story ${selected + 1} of ${total}` : "All caught up"}
              </p>
              <ProgressSegments total={total} current={selected < total ? selected : total} className="mt-2" />
            </div>
            <ol className="space-y-0.5">
              {sorted.map((story, i) => {
                const t = topicStyle(story.category);
                const active = selected === i;
                return (
                  <li key={`idx-${i}`}>
                    <button
                      type="button"
                      onClick={() => select(i)}
                      aria-current={active ? "true" : undefined}
                      aria-controls="briefing-pane"
                      className={`flex min-h-11 w-full items-start gap-3 rounded-[12px] px-2.5 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal ${
                        active ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2/70 hover:text-ink"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 w-6 shrink-0 font-mono text-[12px] font-semibold tabular-nums"
                        style={{ color: active ? t.color : undefined }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`line-clamp-2 text-[14px] leading-snug ${active ? "font-semibold" : "font-medium"}`}>
                          {story.headline}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: t.color }} />
                          <span className="text-[12px] text-ink-mute">{t.label}</span>
                        </span>
                      </span>
                      <SignalBars value={story.importance} size="xs" color={t.color} className="mt-1 shrink-0" />
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  onClick={() => select(total)}
                  aria-current={selected === total ? "true" : undefined}
                  aria-controls="briefing-pane"
                  className={`flex min-h-11 w-full items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-left text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal ${
                    selected === total ? "bg-surface-2 text-ink" : "text-ink-mute hover:bg-surface-2/70 hover:text-ink"
                  }`}
                >
                  <span aria-hidden="true" className="w-6 shrink-0 text-center">
                    ✓
                  </span>
                  You&apos;re caught up
                </button>
              </li>
            </ol>
          </div>
          <p className="mt-3 px-2 text-[12px] text-ink-mute">
            Tip: press <kbd className="rounded bg-surface-2 px-1 font-mono">j</kbd> /{" "}
            <kbd className="rounded bg-surface-2 px-1 font-mono">k</kbd> or the arrow keys to move between stories.
          </p>
        </nav>

        {/* stories (all of them on small screens, the selected one on desktop) */}
        <div ref={paneRef} id="briefing-pane" className="scroll-mt-24">
          <div ref={listRef}>
            <ol className="space-y-4 lg:space-y-0" aria-label="Stories">
              {sorted.map((story, i) => (
                <li
                  key={`story-${i}`}
                  className={
                    selected === i
                      ? "lg:[animation:fade-in-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:lg:[animation:none]"
                      : "lg:hidden"
                  }
                >
                  <BriefingStoryCard
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    story={story}
                    index={i}
                    total={total}
                    shareId={meta.shareId}
                    saved={savedApi}
                  />
                </li>
              ))}
            </ol>

            {/* desktop pager */}
            {selected < total && (
              <div className="mt-4 hidden items-center justify-between gap-3 lg:flex">
                <Button
                  variant="ghost"
                  size="md"
                  leadingIcon={<IconChevronLeft />}
                  onClick={() => select(selected - 1)}
                  disabled={selected === 0}
                >
                  Previous
                </Button>
                <span className="font-mono text-[12px] tabular-nums text-ink-mute">
                  Story {selected + 1} of {total}
                </span>
                <Button variant="secondary" size="md" trailingIcon={<IconChevronRight />} onClick={() => select(selected + 1)}>
                  {selected === total - 1 ? "Finish" : "Next story"}
                </Button>
              </div>
            )}

            <div
              ref={endRef}
              data-index={total}
              id="briefing-end"
              className={`mt-6 scroll-mt-24 lg:mt-0 ${
                selected === total ? "lg:[animation:fade-in-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:lg:[animation:none]" : "lg:hidden"
              }`}
            >
              {endCard ?? (
                <BriefingEndCard
                  mode={mode}
                  total={total}
                  generatedAt={meta.generatedAt}
                  topics={meta.topics.length > 0 ? meta.topics : Array.from(new Set(sorted.map((s) => s.category)))}
                  shareId={meta.shareId}
                  onNewBriefing={onNewBriefing}
                  onReplay={() => openPlayer(0)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* small screens: floating progress + play, in the thumb zone */}
      <div
        aria-hidden={!pillVisible}
        className={`fixed inset-x-0 z-30 flex justify-center px-4 transition-[opacity,transform] duration-300 ease-out-expo lg:hidden ${pillBottom} ${
          pillVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <div className="flex w-full max-w-sm items-center gap-3 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-white shadow-lift">
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[12px] font-semibold tabular-nums tracking-[0.04em]">
              Story {progressShown + 1} of {total}
            </span>
            <span aria-hidden="true" className="mt-1 flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i <= progressShown ? "bg-white" : "bg-white/20"}`} />
              ))}
            </span>
          </span>
          <Button
            variant="inverse"
            size="md"
            leadingIcon={<IconPlay />}
            onClick={() => openPlayer()}
            tabIndex={pillVisible ? undefined : -1}
            className="shrink-0"
          >
            Play
          </Button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <StoryPlayer
        open={player.open}
        onClose={closePlayer}
        stories={sorted}
        startIndex={player.start}
        autoplay={autoplayPref}
        label="Briefing"
        onIndexChange={(i) => {
          playerIndex.current = i;
        }}
        meta={{ generatedAt: meta.generatedAt, topics: meta.topics, shareId: meta.shareId, cached: meta.cached }}
        endActions={playerEndActions}
      />

    </div>
  );
}
