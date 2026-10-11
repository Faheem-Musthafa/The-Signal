"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { topicStyle } from "@/lib/topicStyle";
import { Button, IconCheck, TopicChip } from "@/components/ui";

type LoadingBriefingProps = {
  /** Topics being briefed (shown as chips, colour the equaliser). */
  topics?: ReadonlyArray<string>;
  /** Abort the request. */
  onCancel?: () => void;
};

/** Named steps with rough time windows. Generation is one server call, so these are honest estimates, not live status. */
const STEPS = [
  { label: "Searching live sources", until: 8 },
  { label: "Picking the top stories", until: 20 },
  { label: "Writing your briefing", until: Infinity },
] as const;

const REASSURE_AFTER = 30;
const EQ_BARS = 24;

function useElapsedSeconds() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);
  return seconds;
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse-soft overflow-hidden rounded-card bg-surface shadow-soft ring-1 ring-rule"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-12 bg-surface-3" />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="h-6 w-4/5 rounded-full bg-surface-2" />
        <div className="h-6 w-3/5 rounded-full bg-surface-2" />
        <div className="h-16 rounded-[14px] bg-surface-2" />
        <div className="h-3.5 w-full rounded-full bg-surface-2" />
        <div className="h-3.5 w-11/12 rounded-full bg-surface-2" />
      </div>
    </div>
  );
}

/** Waiting state for a fresh briefing: step tracker, honest estimate, Cancel, skeleton cards. */
export function LoadingBriefing({ topics = [], onCancel }: LoadingBriefingProps) {
  const reduce = useReducedMotion() ?? false;
  const elapsed = useElapsedSeconds();
  const unique = Array.from(new Set(topics)).slice(0, 8);
  const stepIndex = STEPS.findIndex((s) => elapsed < s.until);
  const current = stepIndex === -1 ? STEPS.length - 1 : stepIndex;
  const reassure = elapsed >= REASSURE_AFTER;
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");
  const eqColors = unique.length > 0 ? unique.map((t) => topicStyle(t).color) : ["#2F4BFF"];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <motion.section
        aria-labelledby="loading-title"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="grain relative overflow-hidden rounded-story bg-ink text-white shadow-story"
      >
        <div className="px-5 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="loading-title" className="display-sm text-white">
                Getting your briefing
              </h2>
              <p className="mt-1.5 text-[15px] text-white/75">Usually 20–45 seconds.</p>
            </div>
            <span aria-hidden="true" className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[13px] tabular-nums text-white/85">
              {mm}:{ss}
            </span>
          </div>

          {unique.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Topics">
              {unique.map((t) => (
                <li key={t}>
                  <TopicChip topic={t} variant="onColor" size="sm" />
                </li>
              ))}
            </ul>
          )}

          {/* step tracker */}
          <ol className="mt-6 grid gap-2 sm:grid-cols-3" aria-label="Progress">
            {STEPS.map((step, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li
                  key={step.label}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors duration-300 ${
                    active ? "bg-white text-ink" : done ? "bg-white/10 text-white" : "bg-white/[0.04] text-white/55"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold ${
                      active ? "bg-signal text-white" : done ? "bg-success text-white" : "bg-white/10 text-white/70"
                    }`}
                  >
                    {done ? <IconCheck size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="text-[14.5px] font-semibold leading-tight">
                    {step.label}
                    <span className="sr-only">{done ? " (done)" : active ? " (in progress)" : ""}</span>
                  </span>
                  {active && (
                    <span aria-hidden="true" className="ml-auto flex h-4 items-end gap-[2px]">
                      {[0, 1, 2].map((b) => (
                        <span key={b} className="animate-eq block h-full w-[3px] rounded-full bg-signal" style={{ animationDelay: `${b * 0.15}s` }} />
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* equaliser */}
          <div className="mt-6 flex h-10 items-end gap-[3px] sm:gap-1" aria-hidden="true">
            {Array.from({ length: EQ_BARS }).map((_, i) => (
              <span
                key={i}
                className="animate-eq block h-full flex-1 rounded-full opacity-90"
                style={{
                  background: eqColors[i % eqColors.length],
                  animationDelay: `${((i * 137) % 900) / 1000}s`,
                  animationDuration: `${0.7 + ((i * 53) % 50) / 100}s`,
                }}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`min-h-[1.5rem] text-[14px] leading-relaxed ${reassure ? "text-white" : "text-white/60"}`}>
              {reassure ? "Still working. Big news days take longer." : "Reading today's news so you don't have to."}
            </p>
            {onCancel && (
              <Button variant="glass" size="md" onClick={onCancel} className="shrink-0">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      {/* announce step changes only */}
      <p className="sr-only" role="status" aria-live="polite">
        {STEPS[current].label}.{reassure ? " Still working. Big news days take longer." : ""}
      </p>

      <div className="mt-5 space-y-4" aria-hidden="true">
        <SkeletonCard delay={0} />
        <SkeletonCard delay={180} />
      </div>
    </div>
  );
}
