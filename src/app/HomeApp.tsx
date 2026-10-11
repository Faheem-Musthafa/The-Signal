"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";
import { announceQuota, fetchQuota, type QuotaInfo } from "@/lib/quota";
import type { Story } from "@/types/digest";
import { AppShell } from "@/components/AppShell";
import { DashboardView, type RecentBriefing } from "@/components/DashboardView";
import { LoadingBriefing } from "@/components/LoadingBriefing";
import { BriefingView } from "@/components/briefing/BriefingView";
import { friendlyDigestError, type FriendlyDigestError } from "@/components/briefing/digestErrors";
import { useSeenBriefings } from "@/app/briefings/useSeenBriefings";

const TOPIC_STORAGE_KEY = "signal:selectedTopics";
const DEFAULT_TOPICS: Topic[] = ["AI & LLMs", "Startup Funding", "Big Tech"];

type Json = Record<string, unknown>;

type InlineBriefing = {
  stories: Story[];
  generatedAt: string;
  topics: string[];
  cached: boolean;
};

/** Parse a response body; non-JSON (e.g. a proxy error page) becomes {}. */
async function readJson(res: Response): Promise<Json> {
  try {
    const text = await res.text();
    if (!text) return {};
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Json) : {};
  } catch {
    return {};
  }
}

function toIso(value: unknown): string {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date().toISOString();
}

function isTopic(value: unknown): value is Topic {
  return typeof value === "string" && (ALLOWED_TOPICS as readonly string[]).includes(value);
}

/** Signed-in home: pick topics → get a briefing → read it at /briefing/[shareId]. */
export function HomeApp() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { isSeen, markSeen } = useSeenBriefings();
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FriendlyDigestError | null>(null);
  const [inline, setInline] = useState<InlineBriefing | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [recent, setRecent] = useState<RecentBriefing[]>([]);
  const [sessionUserId, setSessionUserId] = useState(userId);
  const abortRef = useRef<AbortController | null>(null);

  // Reset per-account state when the signed-in user changes (sign-out / account switch).
  if (sessionUserId !== userId) {
    setSessionUserId(userId);
    setQuota(null);
    setRecent([]);
    setInline(null);
    setError(null);
    setLoading(false);
  }

  // Signed out in this tab: let the server render the landing page.
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      abortRef.current?.abort();
      router.refresh();
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TOPIC_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sanitized = Array.from(new Set(parsed.filter(isTopic)));
          if (sanitized.length >= 1 && sanitized.length <= ALLOWED_TOPICS.length) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount to avoid SSR mismatch
            setSelectedTopics(sanitized);
          }
        }
      }
    } catch {
      // ignore malformed values, keep defaults
    }
    try {
      // usage comes from the server; drop the legacy client-side counter
      window.localStorage.removeItem("signal:usage");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(TOPIC_STORAGE_KEY, JSON.stringify(selectedTopics));
    } catch {
      // storage unavailable (private mode); selection still works in memory
    }
  }, [selectedTopics]);

  // Keep the AppShell meter (and any other listener) in sync after generates / 429s.
  useEffect(() => {
    if (quota) announceQuota(quota);
  }, [quota]);

  const refreshUsage = useCallback(async () => {
    const next = await fetchQuota();
    if (next) setQuota(next);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    void (async () => {
      const next = await fetchQuota();
      if (!cancelled && next) setQuota(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/digest/history", { cache: "no-store" });
        if (!res.ok) return;
        const data = await readJson(res);
        const items = Array.isArray(data.items) ? (data.items as Json[]) : [];
        const next = items
          .map((item) => ({
            shareId: typeof item.shareId === "string" ? item.shareId : "",
            generatedAt: toIso(item.generatedAt),
            topics: Array.isArray(item.topics) ? item.topics.map((t: unknown) => String(t)) : [],
            cached: item.cached === true,
          }))
          .filter((i) => i.shareId);
        if (!cancelled) setRecent(next);
      } catch {
        // soft fail; the primary flow stays usable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  // Abort an in-flight request when leaving the page or switching accounts.
  useEffect(() => () => abortRef.current?.abort(), [userId]);

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const handleGenerate = async () => {
    if (!isLoaded || !isSignedIn) {
      setError(friendlyDigestError("UNAUTHENTICATED"));
      return;
    }
    if (selectedTopics.length === 0 || loading) return;

    const topics = [...selectedTopics];
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    let navigating = false;
    try {
      let res: Response;
      try {
        res = await fetch("/api/digest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topics }),
          signal: controller.signal,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        throw err;
      }
      const data = await readJson(res);
      if (controller.signal.aborted) return;

      if (typeof data.remaining === "number") {
        const remaining = Math.max(0, data.remaining);
        setQuota((prev) => ({
          remaining,
          limit: typeof data.limit === "number" ? data.limit : (prev?.limit ?? remaining),
          resetsAt: prev?.resetsAt ?? null,
        }));
        if (!quota?.resetsAt) void refreshUsage();
      } else {
        void refreshUsage();
      }

      if (!res.ok) {
        if (data.code === "QUOTA_EXCEEDED") {
          // Not an error: the dashboard shows the calm "come back later" card.
          setQuota((prev) => (prev ? { ...prev, remaining: 0 } : prev));
          if (!quota) void refreshUsage();
          return;
        }
        setError(friendlyDigestError(data.code));
        return;
      }

      const stories = Array.isArray(data.stories) ? (data.stories as Story[]) : [];
      const generatedAt = toIso(data.generatedAt);
      const cached = data.cached === true;
      const shareId = typeof data.shareId === "string" && data.shareId ? data.shareId : null;

      if (cached) toast.success("Loaded a recent briefing", { description: "It didn't use one of today's briefings." });

      if (shareId) {
        setRecent((prev) => [{ shareId, generatedAt, topics, cached }, ...prev.filter((p) => p.shareId !== shareId)].slice(0, 30));
        markSeen(shareId);
        navigating = true;
        router.push(`/briefing/${encodeURIComponent(shareId)}` as Route);
        return;
      }

      setInline({ stories, generatedAt, topics, cached });
    } catch {
      setError(friendlyDigestError(typeof navigator !== "undefined" && navigator.onLine === false ? "NETWORK" : "UNKNOWN"));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      // Keep the loading screen up while the briefing page loads.
      if (!navigating) setLoading(false);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    toast("Cancelled", { description: "If it was nearly done, the briefing may still show up in History." });
    window.setTimeout(() => void refreshUsage(), 4000);
  };

  let body: React.ReactNode;
  let pageTitle = "Today";
  let pageDescription: string | undefined = "Pick your topics and get today's stories, ranked";

  if (loading) {
    body = <LoadingBriefing topics={selectedTopics} onCancel={cancel} />;
    pageTitle = "Getting your briefing";
    pageDescription = undefined;
  } else if (inline) {
    body = (
      <BriefingView
        stories={inline.stories}
        meta={{ generatedAt: inline.generatedAt, topics: inline.topics, cached: inline.cached }}
        mode="app"
        onNewBriefing={() => setInline(null)}
      />
    );
    pageTitle = "Your briefing";
    pageDescription = undefined;
  } else {
    body = (
      <DashboardView
        selectedTopics={selectedTopics}
        toggleTopic={toggleTopic}
        setTopics={setSelectedTopics}
        handleGenerate={() => void handleGenerate()}
        quota={quota}
        error={error}
        recent={recent}
        isSeen={isSeen}
        onOpenRecent={markSeen}
      />
    );
  }

  return (
    <AppShell pageTitle={pageTitle} pageDescription={pageDescription} quota={quota}>
      {body}
    </AppShell>
  );
}
