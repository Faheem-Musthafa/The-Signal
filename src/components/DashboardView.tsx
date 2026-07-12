"use client";

import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";
import { ScrollReveal, StaggerChildren, StaggerItem } from "./motion/Reveal";
import { MagneticButton } from "./motion/Magnetic";
import { NumberTicker } from "./motion/NumberTicker";

type RecentBriefing = {
  shareId: string;
  generatedAt: string;
  topics: string[];
  cached?: boolean;
};

type DashboardViewProps = {
  selectedTopics: Topic[];
  toggleTopic: (topic: Topic) => void;
  handleGenerate: () => void;
  generationsToday: number;
  error: string | null;
  recent: RecentBriefing[];
  openPreviousDigest: (shareId: string) => void;
};

function StatBlock({ label, value, hint, accent }: { label: string; value: number; hint?: string; accent?: boolean; suffix?: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper-card p-5 shadow-sm">
      <p className="text-[12px] font-medium text-ink-mute mb-2">{label}</p>
      <p className={`text-3xl md:text-4xl font-semibold tabular-nums tracking-tight leading-none ${accent ? "text-signal" : "text-ink"}`}>
        <NumberTicker value={value} />
      </p>
      {hint && <p className="mt-2 text-[12px] text-ink-dim">{hint}</p>}
    </div>
  );
}

export function DashboardView({
  selectedTopics,
  toggleTopic,
  handleGenerate,
  generationsToday,
  error,
  recent,
  openPreviousDigest,
}: DashboardViewProps) {
  const remaining = Math.max(0, 3 - generationsToday);
  const canGenerate = selectedTopics.length > 0 && remaining > 0;

  return (
    <div className="space-y-12">
      {/* Stat row */}
      <ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBlock label="Today's quota" value={remaining} hint={remaining === 0 ? "Resets at 00:00 UTC" : "briefings remaining"} accent={remaining > 0} />
          <StatBlock label="Topics selected" value={selectedTopics.length} hint="Drop in or out below" />
          <StatBlock label="Briefings today" value={recent.length} hint="Across all topic combos" />
          <StatBlock label="Plan" value={0} hint="Free · 3 daily" accent={false} />
        </div>
      </ScrollReveal>

      {/* Generate panel */}
      <ScrollReveal>
        <section className="rounded-2xl border border-rule bg-paper-card shadow-sm">
          <div className="flex items-start justify-between gap-4 px-6 md:px-8 pt-6 md:pt-8 pb-5 border-b border-rule">
            <div>
              <div className="eyebrow mb-3">New briefing</div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                Pick what matters today.
              </h2>
              <p className="text-[14px] text-ink-mute max-w-md leading-relaxed">
                We&apos;ll synthesize a real-time briefing in 15–30 seconds.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rule bg-paper-soft text-[12px] font-medium text-ink-mute">
              <span className="live-dot" />
              Live
            </span>
          </div>

          <div className="px-6 md:px-8 py-6">
            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-[13px] text-red-700">
                {error}
              </div>
            )}

            <StaggerChildren className="flex flex-wrap gap-2 mb-7" stagger={0.02}>
              {ALLOWED_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <StaggerItem key={topic}>
                    <button
                      onClick={() => toggleTopic(topic)}
                      className={`px-4 py-2 text-[13px] rounded-full border transition-all duration-200 font-medium ${
                        isSelected
                          ? "bg-signal text-white border-signal shadow-sm"
                          : "bg-paper border-rule text-ink-mute hover:text-ink hover:border-ink-dim"
                      }`}
                    >
                      {topic}
                    </button>
                  </StaggerItem>
                );
              })}
            </StaggerChildren>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 border-t border-rule">
              <p className="text-[13px] text-ink-mute">
                {selectedTopics.length === 0
                  ? "Select at least one topic to begin."
                  : `${selectedTopics.length} topic${selectedTopics.length === 1 ? "" : "s"} · ~30s · 1 of 3 today`}
              </p>
              <MagneticButton
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-signal text-white font-semibold text-[13px] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-signal-deep transition-colors duration-200 min-w-[220px]"
              >
                {remaining === 0 ? "Quota reached" : "Generate briefing"}
                {remaining > 0 && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                )}
              </MagneticButton>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Recent briefings */}
      <ScrollReveal>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold tracking-tight">Recent briefings</h3>
            {recent.length > 0 && (
              <a href="/briefings" className="text-[13px] font-medium text-signal hover:text-signal-deep transition-colors">
                View all →
              </a>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule-strong bg-paper-card py-16 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-11 h-11 rounded-xl bg-signal-soft flex items-center justify-center mb-4 text-signal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
                  <path d="M14 3v5h5"></path>
                </svg>
              </div>
              <p className="text-[16px] font-semibold mb-1">No briefings yet today</p>
              <p className="text-[13px] text-ink-mute">Generate one above to get started</p>
            </div>
          ) : (
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" stagger={0.05}>
              {recent.map((item) => (
                <StaggerItem key={item.shareId}>
                  <button
                    onClick={() => openPreviousDigest(item.shareId)}
                    className="w-full text-left rounded-xl border border-rule bg-paper-card shadow-sm hover:shadow-md hover:border-ink-faint transition-all group flex flex-col gap-3 p-5 h-full"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-semibold tracking-tight text-ink leading-snug line-clamp-2">
                        {item.topics.join(" · ")}
                      </p>
                      {item.cached && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-moss/10 text-[10px] font-medium text-moss">
                          Cached
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[12px] text-ink-dim tabular-nums">
                        {new Date(item.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-signal">
                        Open
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </button>
                </StaggerItem>
              ))}
            </StaggerChildren>
          )}
        </section>
      </ScrollReveal>
    </div>
  );
}
