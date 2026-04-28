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
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 pb-6 border-b-2 border-ink">
          <div className="flex items-center gap-5">
            <button
              onClick={resetDigest}
              className="w-10 h-10 border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-colors flex items-center justify-center shrink-0"
              aria-label="Back to dashboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <path d="m12 19-7-7 7-7"></path>
              </svg>
            </button>
            <div>
              <div className="eyebrow mb-2">Today&apos;s briefing</div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-none mb-2">
                The Signal · <em className="font-display-italic text-signal">Edition</em>
              </h1>
              <div className="flex flex-wrap items-center gap-2 dateline">
                <span>{new Date(digest.generatedAt).toLocaleString()}</span>
                <span className="text-rule-strong">/</span>
                <span className="text-signal">{digest.model}</span>
                {digest.cached && (
                  <>
                    <span className="text-rule-strong">/</span>
                    <span className="px-1.5 py-0.5 border border-moss/40 bg-moss/10 text-[9px] uppercase tracking-wider font-semibold text-moss">
                      Cached
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-ink text-[13px] font-semibold tracking-tight hover:bg-ink hover:text-paper transition-colors"
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
      <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule-bold border border-rule-bold" stagger={0.08}>
        {digest.stories.map((story, i) => {
          const isHero = i === 0;
          return (
            <StaggerItem key={i} className={isHero ? "md:col-span-2 lg:col-span-3" : ""}>
              <article className={`bg-paper-card p-7 md:p-8 group flex flex-col h-full transition-colors hover:bg-paper`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] ${
                      isHero ? "bg-signal text-paper" : "bg-paper border border-rule-strong text-ink-mute"
                    }`}>
                      {story.category}
                    </span>
                    <span className="dateline">{story.source}</span>
                  </div>

                  <div className="flex gap-1" title={`Importance: ${story.importance}/5`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1 h-3.5 ${j < story.importance ? "bg-signal" : "bg-rule"}`}
                      />
                    ))}
                  </div>
                </div>

                <h2 className={`font-display font-semibold mb-5 leading-[1.05] tracking-tight ${
                  isHero ? "text-4xl md:text-5xl lg:text-6xl max-w-4xl" : "text-xl"
                }`}>
                  {story.headline}
                </h2>

                <div className="border-l-2 border-signal pl-4 py-1 mb-5 mt-auto">
                  <p className="dateline mb-1.5 text-signal">The Signal</p>
                  <p className={`font-medium leading-relaxed text-ink ${isHero ? "text-base md:text-lg" : "text-[14px]"}`}>
                    {story.signal}
                  </p>
                </div>

                <p className={`leading-relaxed text-ink-2 ${isHero ? "text-[15px] md:text-base max-w-3xl drop-cap" : "text-[13px]"}`}>
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
