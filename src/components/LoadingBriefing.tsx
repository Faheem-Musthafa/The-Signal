"use client";

import { motion } from "motion/react";

type LoadingBriefingProps = {
  message: string;
};

export function LoadingBriefing({ message }: LoadingBriefingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="border-2 border-ink bg-paper-card p-12 md:p-16 max-w-2xl"
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-rule">
        <span className="eyebrow">In production</span>
        <span className="dateline flex items-center gap-2">
          <span className="live-dot" /> Live wire
        </span>
      </div>

      <div className="flex items-center gap-5 mb-8">
        {/* Spinner: rotating segmented ring */}
        <div className="relative w-12 h-12 shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-rule" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-signal border-r-signal"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div>
          <motion.h2
            key={message}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-tight"
          >
            {message}
          </motion.h2>
          <p className="dateline mt-2">Synthesizing — typically 15–30s</p>
        </div>
      </div>

      <div className="h-[3px] bg-rule overflow-hidden">
        <div className="h-full w-1/3 bg-signal animate-shimmer" />
      </div>
    </motion.div>
  );
}
