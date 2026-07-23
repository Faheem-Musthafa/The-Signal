"use client";

import type { DigestResponse } from "@/types/digest";
import { ScrollReveal, StaggerChildren, StaggerItem } from "./motion/Reveal";

type BriefingResultProps = {
  digest: DigestResponse;
  handleShare: () => void;
  resetDigest: () => void;
};

export function BriefingResult({ digest, handleShare, resetDigest }: BriefingResultProps) {
  return (
    <div>
      {/* Editorial header */}
      <ScrollReveal>
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 sm:gap-6 mb-8 sm:mb-10 pb-6 border-b border-rule">
          <div className="flex items-start sm:items-center gap-3 sm:gap-5">
            <button
              onClick={resetDigest}
              className="w-11 h-11 rounded-lg border border-rule bg-white text-ink hover:bg-paper-soft transition-colors flex items-center justify-center shrink-0"
              aria-label="Back to dashboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="m12 19-7-7 7-7"></path>
              </svg>
            </button>
            <div>
              <div className="eyebrow mb-2">Today&apos;s briefing</div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight sm:leading-none mb-2">
                The Signal · <span className="text-signal">Edition</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 dateline">
                <span>{new Date(digest.generatedAt).toLocaleString()}</span>
                <span className="text-rule-strong">/</span>
                <span className="text-signal">{digest.model}</span>
                {digest.cached && (
                  <>
                    <span className="text-rule-strong">/</span>
                    <span className="px-2 py-0.5 rounded-full bg-moss/10 text-[9px] uppercase tracking-wider font-semibold text-moss">
                      Cached
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-signal text-white text-[13px] font-semibold tracking-tight hover:bg-signal-deep transition-colors sm:w-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Share
          </button>
        </header>
      </ScrollReveal>

      {/* Stories — newspaper grid */}
      <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" stagger={0.08}>
        {digest.stories.map((story, i) => {
          const isHero = i === 0;
          return (
            <StaggerItem key={i} className={isHero ? "md:col-span-2 lg:col-span-3" : ""}>
              <article className="bg-white border border-rule rounded-xl shadow-sm hover:shadow-md p-5 sm:p-6 md:p-7 group flex flex-col h-full transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      isHero ? "bg-signal-soft text-signal" : "bg-paper-soft border border-rule text-ink-mute"
                    }`}>
                      {story.category}
                    </span>
                    <span className="dateline max-w-full truncate">{story.source}</span>
                  </div>

                  <div className="flex shrink-0 gap-1 pt-1" title={`Importance: ${story.importance}/5`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1 h-3.5 rounded-full ${j < story.importance ? "bg-signal" : "bg-rule"}`}
                      />
                    ))}
                  </div>
                </div>

                <h2 className={`font-display font-semibold mb-5 leading-tight tracking-tight ${
                  isHero ? "text-2xl sm:text-3xl md:text-4xl max-w-4xl" : "text-xl"
                }`}>
                  {story.headline}
                </h2>

                <div className="rounded-lg bg-signal-soft p-4 mb-5 mt-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-signal mb-1.5">The Signal</p>
                  <p className={`font-medium leading-relaxed text-ink ${isHero ? "text-base md:text-lg" : "text-[14px]"}`}>
                    {story.signal}
                  </p>
                </div>

                <p className={`leading-relaxed text-ink-2 ${isHero ? "text-[15px] md:text-base max-w-3xl" : "text-[13px]"}`}>
                  {story.summary}
                </p>
              </article>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </div>
  );
}
