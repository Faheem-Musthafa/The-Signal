"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import { StoryPlayer, useIsClient, useSavedStories, type StoryLike, type StoryMeta } from "@/components/story";
import { Card, IconBookmark, IconBriefings, buttonClasses } from "@/components/ui";
import { HistoryPanel, type BriefingItem, type HistoryStatus } from "./HistoryPanel";
import { SavedPanel } from "./SavedPanel";
import { useSeenBriefings } from "./useSeenBriefings";

type Tab = "history" | "saved";

// The active tab lives in the URL hash (#saved) so other pages can deep-link to it.
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

function useHashTab(): [Tab, (tab: Tab) => void] {
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const tab: Tab = hash === "#saved" ? "saved" : "history";
  const setTab = (next: Tab) => {
    const url = next === "saved" ? "#saved" : `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  return [tab, setTab];
}

type PlayerState = {
  stories: StoryLike[];
  meta: StoryMeta;
  startIndex: number;
};

type HistoryState = { forUser: string | null; status: "loading" | "error" | "ready"; items: BriefingItem[] };

export default function BriefingsPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [tab, setTab] = useHashTab();
  const isClient = useIsClient();
  const { saved } = useSavedStories();
  const { isSeen, markSeen } = useSeenBriefings();

  const [history, setHistory] = useState<HistoryState>({ forUser: null, status: "loading", items: [] });
  const [reloadKey, setReloadKey] = useState(0);

  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/digest/history");
        if (!res.ok) {
          if (!cancelled) setHistory({ forUser: userId, status: "error", items: [] });
          return;
        }
        const data = (await res.json()) as { items?: BriefingItem[] };
        if (cancelled) return;
        setHistory({ forUser: userId, status: "ready", items: Array.isArray(data.items) ? data.items : [] });
      } catch {
        if (!cancelled) setHistory({ forUser: userId, status: "error", items: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, reloadKey]);

  // A different account (or a retry in flight) reads as loading until its own fetch lands.
  const historyStatus: HistoryStatus = history.forUser !== userId ? "loading" : history.status;
  const historyItems = historyStatus === "ready" ? history.items : [];

  const retry = () => {
    setHistory((h) => ({ ...h, status: "loading", forUser: null }));
    setReloadKey((k) => k + 1);
  };

  const playSaved = (stories: StoryLike[], startIndex: number) => {
    setPlayer({
      stories: [...stories],
      startIndex,
      meta: { topics: Array.from(new Set(stories.map((s) => s.category))) },
    });
    setPlayerOpen(true);
  };

  if (!isLoaded) {
    return (
      <AppShell pageTitle="Briefings">
        <div role="status" aria-label="Loading" className="space-y-4">
          <div className="h-12 w-full max-w-xs rounded-full bg-surface-2 animate-pulse-soft" />
          <div className="h-48 rounded-card bg-surface-2 animate-pulse-soft" />
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell pageTitle="Briefings">
        <Card padding="lg" className="max-w-lg">
          <h2 className="display-sm mb-2">Sign in to see your briefings.</h2>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-2">
            Your History keeps every briefing you get for 30 days. Saved keeps the stories you want to read again.
          </p>
          <div className="flex flex-wrap gap-2">
            <SignInButton mode="modal">
              <button type="button" className={buttonClasses()}>
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className={buttonClasses({ variant: "secondary" })}>
                Create a free account
              </button>
            </SignUpButton>
          </div>
        </Card>
      </AppShell>
    );
  }

  const historyCount = historyStatus === "ready" ? historyItems.length : null;
  const savedCount = isClient ? saved.length : null;

  return (
    <AppShell pageTitle="Briefings" pageDescription="Your recent briefings and saved stories">
      <div className="space-y-6">
        <BriefingTabs
          tab={tab}
          onChange={setTab}
          tabs={[
            { id: "history", label: "History", count: historyCount, icon: <IconBriefings size={18} /> },
            { id: "saved", label: "Saved", count: savedCount, icon: <IconBookmark size={18} /> },
          ]}
        />

        <div role="tabpanel" id="panel-history" aria-labelledby="tab-history" hidden={tab !== "history"} tabIndex={-1}>
          {tab === "history" && (
            <HistoryPanel status={historyStatus} items={historyItems} isSeen={isSeen} onOpen={markSeen} onRetry={retry} />
          )}
        </div>
        <div role="tabpanel" id="panel-saved" aria-labelledby="tab-saved" hidden={tab !== "saved"} tabIndex={-1}>
          {tab === "saved" && <SavedPanel onPlay={playSaved} />}
        </div>
      </div>

      <StoryPlayer
        open={playerOpen && !!player}
        onClose={() => setPlayerOpen(false)}
        stories={player?.stories ?? []}
        startIndex={player?.startIndex ?? 0}
        meta={player?.meta}
        label="Saved stories"
      />
    </AppShell>
  );
}

type TabDef = { id: Tab; label: string; count: number | null; icon: ReactNode };

function BriefingTabs({ tab, onChange, tabs }: { tab: Tab; onChange: (t: Tab) => void; tabs: TabDef[] }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === tab);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = tabs[next].id;
    onChange(id);
    refs.current[id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Briefings"
      onKeyDown={onKeyDown}
      className="inline-flex w-full rounded-full bg-surface-2 p-1 sm:w-auto"
    >
      {tabs.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[14.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:flex-none ${
              active ? "text-ink" : "text-ink-mute hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="briefings-tab-pill"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-surface shadow-soft"
                transition={{ type: "spring", stiffness: 480, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <span className={active ? "text-signal" : ""}>{t.icon}</span>
              {t.label}
              {t.count !== null && (
                <span
                  className={`min-w-[22px] rounded-full px-1.5 py-0.5 text-center font-mono text-[11px] tabular-nums ${
                    active ? "bg-signal-soft text-signal" : "bg-surface-3 text-ink-mute"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
