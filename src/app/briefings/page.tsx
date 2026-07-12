"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";

type BriefingItem = {
  shareId: string;
  topics: string[];
  stories: Array<{
    headline: string;
    category: string;
    summary: string;
    importance: number;
    signal: string;
    source: string;
  }>;
  generatedAt: string;
  cached?: boolean;
};

export default function BriefingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/digest/history");
        if (!res.ok) return;
        const data = (await res.json()) as { items: BriefingItem[] };
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <AppShell pageTitle="Briefings">
        <div className="text-sm text-ink-mute">Loading session…</div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell pageTitle="Briefings">
        <div className="elev-1 rounded-xl p-8 max-w-md">
          <p className="text-sm text-ink-mute mb-5">Sign in to view your briefings history.</p>
          <SignInButton mode="modal">
            <button className="px-4 py-2.5 rounded-lg bg-signal text-white font-semibold text-sm hover:bg-signal-deep transition-colors">
              Sign in
            </button>
          </SignInButton>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      pageTitle="Briefings"
      pageDescription="Your generated briefings from the last 24 hours"
      quotaUsed={items.length}
    >
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-1">Today&apos;s briefings</h2>
            <p className="text-sm text-ink-mute">
              {loading ? "Loading…" : `${items.length} ${items.length === 1 ? "briefing" : "briefings"} generated in the last 24 hours.`}
            </p>
          </div>
          <Link
            href="/"
            className="hidden sm:inline-flex px-3.5 py-2 rounded-lg bg-signal text-white text-xs font-semibold hover:bg-signal-deep transition-colors"
          >
            New briefing →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="elev-1 rounded-xl h-40 animate-pulse-soft" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="elev-1 rounded-xl py-16 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-lg bg-paper-deep flex items-center justify-center mb-4 text-ink-dim">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 3v5h5"></path>
              </svg>
            </div>
            <h3 className="text-base font-semibold mb-1">No briefings yet</h3>
            <p className="text-sm text-ink-mute mb-5 max-w-sm">
              Briefings expire after 24 hours. Generate a new one from the dashboard.
            </p>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-signal text-white text-sm font-semibold hover:bg-signal-deep transition-colors"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <Link
                key={item.shareId}
                href={`/share/${item.shareId}`}
                className="elev-1 rounded-xl p-5 hover:shadow-md transition-shadow group flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {item.topics.join(" · ")}
                  </p>
                  {item.cached && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-moss/10 text-[9px] uppercase tracking-wider font-semibold text-moss">
                      Cached
                    </span>
                  )}
                </div>
                {item.stories.length > 0 && (
                  <p className="text-xs text-ink-mute line-clamp-2 leading-relaxed">
                    {item.stories[0].headline}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-rule">
                  <span className="text-[11px] font-mono text-ink-dim">
                    {new Date(item.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[11px] text-ink-mute">
                    {item.stories.length} stories
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
