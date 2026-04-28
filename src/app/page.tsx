"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";
import type { DigestResponse } from "@/types/digest";

import { AppShell } from "@/components/AppShell";
import { LandingHero } from "@/components/LandingHero";
import { DashboardView } from "@/components/DashboardView";
import { LoadingBriefing } from "@/components/LoadingBriefing";
import { BriefingResult } from "@/components/BriefingResult";

const TOPIC_STORAGE_KEY = "signal:selectedTopics";
const DEFAULT_TOPICS: Topic[] = ["AI & LLMs", "Startup Funding", "Big Tech"];
const LOADING_MESSAGES = [
  "Igniting neural engines…",
  "Scanning the live web…",
  "Distilling intelligence…",
  "Formatting your briefing…",
  "Almost ready…",
];

async function parseApiResponse(res: Response) {
  const text = await res.text();
  if (!text) return {} as Record<string, unknown>;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text || "Unexpected response from server" };
  }
}

function normalizeDigestResponse(data: Record<string, unknown>): DigestResponse {
  const generatedAtValue = data.generatedAt;
  const generatedAt =
    typeof generatedAtValue === "string"
      ? generatedAtValue
      : new Date(typeof generatedAtValue === "number" ? generatedAtValue : Date.now()).toISOString();

  return {
    stories: Array.isArray(data.stories) ? (data.stories as DigestResponse["stories"]) : [],
    generatedAt,
    model: typeof data.model === "string" ? data.model : "unknown",
    shareId: typeof data.shareId === "string" ? data.shareId : undefined,
    cached: typeof data.cached === "boolean" ? data.cached : false,
  };
}

export default function HomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [generationsToday, setGenerationsToday] = useState(0);
  const [recent, setRecent] = useState<Array<{ shareId: string; generatedAt: string; topics: string[]; cached?: boolean }>>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TOPIC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter(
            (item): item is Topic =>
              typeof item === "string" && (ALLOWED_TOPICS as readonly string[]).includes(item),
          );
          if (sanitized.length >= 1 && sanitized.length <= 8) {
            setSelectedTopics(sanitized);
          }
        }
      }
    } catch {
      // ignore malformed values, keep defaults
    }

    try {
      const today = new Date().toDateString();
      const rawUsage = window.localStorage.getItem("signal:usage");
      if (rawUsage) {
        const parsedUsage = JSON.parse(rawUsage);
        if (parsedUsage.date === today) {
          setGenerationsToday(parsedUsage.count || 0);
        } else {
          window.localStorage.setItem("signal:usage", JSON.stringify({ date: today, count: 0 }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TOPIC_STORAGE_KEY, JSON.stringify(selectedTopics));
  }, [selectedTopics]);

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setRecent([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await fetch("/api/digest/history");
        const data = await parseApiResponse(res);
        if (!res.ok) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setRecent(
          items.map((item) => ({
            shareId: String(item.shareId ?? ""),
            generatedAt: String(item.generatedAt ?? new Date().toISOString()),
            topics: Array.isArray(item.topics) ? item.topics.map((t: unknown) => String(t)) : [],
            cached: typeof item.cached === "boolean" ? item.cached : false,
          })).filter((i) => i.shareId),
        );
      } catch {
        // soft fail; primary flow stays usable
      }
    };

    void loadHistory();
  }, [isLoaded, isSignedIn]);

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((t) => t !== topic);
      if (prev.length >= 8) return prev;
      return [...prev, topic];
    });
  };

  const handleGenerate = async () => {
    if (!isLoaded || !isSignedIn) {
      toast.error("Please sign in to generate a digest.");
      return;
    }

    if (selectedTopics.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: selectedTopics }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error((data.error as string) || "Failed to generate digest");
      const normalized = normalizeDigestResponse(data);
      setDigest(normalized);
      toast.success("Briefing generated");

      const digestShareId = typeof data.shareId === "string" ? data.shareId : "";
      if (digestShareId) {
        setRecent((prev) =>
          [
            {
              shareId: digestShareId,
              generatedAt: normalized.generatedAt,
              topics: [...selectedTopics],
              cached: normalized.cached,
            },
            ...prev.filter((p) => p.shareId !== digestShareId),
          ].slice(0, 8),
        );
      }

      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      window.localStorage.setItem("signal:usage", JSON.stringify({ date: new Date().toDateString(), count: newCount }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!digest) return;
    if (digest.shareId) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${digest.shareId}`);
      toast.success("Link copied");
      return;
    }

    try {
      const toastId = toast.loading("Generating share link…");
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: selectedTopics,
          stories: digest.stories,
          model: digest.model,
        }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error((data.error as string) || "Failed to generate share link");

      const nextShareId = String(data.shareId ?? "");
      if (!nextShareId) throw new Error("Failed to generate share link");

      setDigest({ ...digest, shareId: nextShareId });
      navigator.clipboard.writeText(`${window.location.origin}/share/${nextShareId}`);
      toast.success("Link copied", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate share link");
    }
  };

  const openPreviousDigest = async (shareId: string) => {
    try {
      const res = await fetch(`/api/share/${shareId}`);
      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error((data.error as string) || "Failed to load briefing");
      setDigest(normalizeDigestResponse(data));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load briefing");
    }
  };

  // Wait for Clerk before deciding
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="border-2 border-ink bg-paper-card px-6 py-4 dateline">Restoring your session…</div>
      </div>
    );
  }

  // Unauth: marketing landing, no shell
  if (!isSignedIn) {
    return <LandingHero />;
  }

  // Authed: render dashboard / loading / result inside the shell
  let body: React.ReactNode;
  let pageTitle = "Dashboard";
  let pageDescription: string | undefined = "Generate a real-time briefing or schedule a daily digest";

  if (loading) {
    body = <LoadingBriefing message={LOADING_MESSAGES[loadingMessageIndex]} />;
    pageTitle = "Generating…";
    pageDescription = "Synthesizing your briefing in real time";
  } else if (digest) {
    body = <BriefingResult digest={digest} handleShare={handleShare} resetDigest={() => setDigest(null)} />;
    pageTitle = "Briefing";
    pageDescription = undefined;
  } else {
    body = (
      <DashboardView
        selectedTopics={selectedTopics}
        toggleTopic={toggleTopic}
        handleGenerate={handleGenerate}
        generationsToday={generationsToday}
        error={error}
        recent={recent}
        openPreviousDigest={openPreviousDigest}
      />
    );
  }

  return (
    <AppShell pageTitle={pageTitle} pageDescription={pageDescription} quotaUsed={generationsToday}>
      {body}
    </AppShell>
  );
}
