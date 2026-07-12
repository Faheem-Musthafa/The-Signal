"use client";

import { motion, useReducedMotion } from "motion/react";

type LoadingBriefingProps = {
  message: string;
};

const WAVE =
  "M0 20c10 0 10-14 22-14s10 28 22 28 10-14 22-14 10-8 22-8 10 16 22 16 10-8 22-8 10-12 22-12 10 24 22 24 10-12 22-12 10-6 22-6 10 12 22 12 10-6 22-6";

/* Skeleton rows standing in for the stories being written */
const SKELETON_WIDTHS = ["w-3/4", "w-full", "w-5/6", "w-2/3"];

export function LoadingBriefing({ message }: LoadingBriefingProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-paper-card border border-rule rounded-2xl shadow-sm max-w-2xl overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-rule bg-paper-soft">
        <span className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-[12px] font-medium text-ink">Scanning the wire</span>
        </span>
        <span className="dateline">15–30s</span>
      </div>

      {/* Signal trace — the briefing being pulled out of the noise */}
      <div className="px-6 pt-6">
        <svg viewBox="0 0 264 40" className="w-full h-10 text-signal" fill="none" aria-hidden="true">
          <path d={WAVE} stroke="var(--rule)" strokeWidth="1.5" strokeLinecap="round" />
          {reduceMotion ? (
            <path d={WAVE} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.7} />
          ) : (
            <motion.path
              d={WAVE}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="60 400"
              pathLength={460}
              animate={{ strokeDashoffset: [460, -460] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
            />
          )}
        </svg>
      </div>

      {/* Stage message */}
      <div className="px-6 pt-4">
        <motion.h2
          key={message}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xl md:text-2xl font-semibold tracking-tight leading-tight"
        >
          {message}
        </motion.h2>
      </div>

      {/* Briefing skeleton forming underneath */}
      <div className="px-6 py-6 space-y-3" aria-hidden="true">
        {SKELETON_WIDTHS.map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="h-4 w-14 shrink-0 rounded-full bg-paper-deep animate-pulse-soft" style={{ animationDelay: `${i * 150}ms` }} />
            <span className={`h-3 ${w} rounded-full bg-paper-deep animate-pulse-soft`} style={{ animationDelay: `${i * 150}ms` }} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
