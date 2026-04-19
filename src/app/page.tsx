"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";
import type { DigestResponse } from "@/types/digest";

import { Background } from "@/components/Background";
import { LandingHero } from "@/components/LandingHero";
import { RadarConfig } from "@/components/RadarConfig";
import { LoadingBriefing } from "@/components/LoadingBriefing";
import { BriefingResult } from "@/components/BriefingResult";

const TOPIC_STORAGE_KEY = "signal:selectedTopics";
const DEFAULT_TOPICS: Topic[] = ["AI & LLMs", "Startup Funding", "Big Tech"];
const LOADING_MESSAGES = [
  "Igniting neural engines...",
  "Scanning the live web...",
  "Distilling intelligence...",
  "Formatting your briefing...",
  "Almost ready...",
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
  const [previouslyCrawled, setPreviouslyCrawled] = useState<Array<{ shareId: string; generatedAt: string; topics: string[]; cached?: boolean }>>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TOPIC_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;

      const sanitized = parsed.filter(
        (item): item is Topic =>
          typeof item === "string" && (ALLOWED_TOPICS as readonly string[]).includes(item),
      );

      if (sanitized.length >= 1 && sanitized.length <= 8) {
        setSelectedTopics(sanitized);
      }
    } catch {
      // Ignore malformed localStorage values and keep defaults.
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
      setPreviouslyCrawled([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await fetch("/api/digest/history", { method: "GET" });
        const data = await parseApiResponse(res);
        if (!res.ok) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setPreviouslyCrawled(
          items.map((item) => ({
            shareId: String(item.shareId ?? ""),
            generatedAt: String(item.generatedAt ?? new Date().toISOString()),
            topics: Array.isArray(item.topics) ? item.topics.map((t: unknown) => String(t)) : [],
            cached: typeof item.cached === "boolean" ? item.cached : false,
          })).filter((i) => i.shareId),
        );
      } catch {
        // Ignore history errors; primary flow should stay usable.
      }
    };

    void loadHistory();
  }, [isLoaded, isSignedIn]);

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic);
      }
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
      toast.success("Briefing generated successfully!");

      const digestShareId = typeof data.shareId === "string" ? data.shareId : "";
      if (digestShareId) {
        setPreviouslyCrawled((prev) => [
          {
            shareId: digestShareId,
            generatedAt: normalized.generatedAt,
            topics: [...selectedTopics],
            cached: normalized.cached,
          },
          ...prev.filter((p) => p.shareId !== digestShareId),
        ].slice(0, 8));
      }

      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      window.localStorage.setItem("signal:usage", JSON.stringify({ date: new Date().toDateString(), count: newCount }));
    } catch (err: any) {
      const message = err.message || "An unknown error occurred";
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
      toast.success("Link copied to clipboard!");
      return;
    }
    
    try {
      const toastId = toast.loading("Generating secure share link...");
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
      toast.success("Link copied to clipboard!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link");
    }
  };

  const openPreviousDigest = async (shareId: string) => {
    try {
      const res = await fetch(`/api/share/${shareId}`);
      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error((data.error as string) || "Failed to load previous digest");
      setDigest(normalizeDigestResponse(data));
    } catch (err: any) {
      toast.error(err.message || "Failed to load previous digest");
    }
  };

  // Avoid auth-state flicker on refresh: wait until Clerk resolves session.
  if (!isLoaded) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-[#0A0A0A]">
        <Background />
        <div className="relative z-10 glass-card px-8 py-6 rounded-2xl text-sm text-white/80">
          Restoring your session...
        </div>
      </main>
    );
  }

  // 1) Topic Config View & Landing Page
  if (!digest && !loading) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden bg-[#0A0A0A]">
        <Background />
        {!isSignedIn ? (
          <LandingHero />
        ) : (
          <RadarConfig
            selectedTopics={selectedTopics}
            toggleTopic={toggleTopic}
            handleGenerate={handleGenerate}
            generationsToday={generationsToday}
            error={error}
            previouslyCrawled={previouslyCrawled}
            openPreviousDigest={openPreviousDigest}
          />
        )}
      </main>
    );
  }

  // 2) Loading View
  if (loading) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-[#0A0A0A]">
        <Background />
        <LoadingBriefing message={LOADING_MESSAGES[loadingMessageIndex]} />
      </main>
    );
  }

  // 3) Result View
  return (
    <main className="relative min-h-screen px-4 py-16 md:py-24 overflow-hidden bg-[#0A0A0A]">
      <Background />
      <BriefingResult
        digest={digest!}
        handleShare={handleShare}
        resetDigest={() => setDigest(null)}
      />
    </main>
  );
}
