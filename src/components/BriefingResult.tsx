import { UserButton } from "@clerk/nextjs";
import type { DigestResponse } from "@/types/digest";

type BriefingResultProps = {
  digest: DigestResponse;
  handleShare: () => void;
  resetDigest: () => void;
};

export function BriefingResult({ digest, handleShare, resetDigest }: BriefingResultProps) {
  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto animate-fade-in-up mt-8">
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-text-muted text-[10px] font-medium uppercase tracking-widest mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            Intelligence Briefing
          </div>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tighter mb-4 text-white">
            Your Signal<span className="text-accent font-playfair italic pr-2">.</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/50">
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {new Date(digest.generatedAt).toLocaleString()}
            </span>
            {digest.cached && (
              <span className="px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-[10px] uppercase tracking-wider font-semibold">
                Cached
              </span>
            )}
            <span className="text-white/10 px-1">|</span>
            <span className="text-accent/80 px-2 py-0.5 rounded bg-accent/5 border border-accent/10">
              {digest.model}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 md:gap-4 items-center">
          <UserButton />
          <button 
            onClick={handleShare}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors text-white backdrop-blur-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Share View
          </button>
          <button 
            onClick={resetDigest}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18"></path>
              <path d="M9 6l-6 6 6 6"></path>
            </svg>
            Radar Setup
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {digest.stories.map((story, i) => {
          const isHero = i === 0;

          return (
            <article 
              key={i} 
              className={`bg-[#111111] p-6 md:p-10 rounded-[2rem] border border-white/5 relative overflow-hidden group flex flex-col transition-all duration-300 hover:border-white/10 hover:bg-[#151515] ${
                isHero ? "md:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#111111] to-[#0A0A0A]" : ""
              }`}
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              {/* Decorative Number */}
              <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 text-[80px] md:text-[120px] font-black text-white/[0.02] font-playfair pointer-events-none select-none transition-all duration-500 group-hover:text-white/[0.04]">
                {(i + 1).toString().padStart(2, '0')}
              </div>
              
              {isHero && <div className="absolute top-0 right-0 w-full h-full bg-accent/5 rounded-full blur-[150px] pointer-events-none" />}
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                    isHero ? "bg-accent/10 text-accent border-accent/20" : "bg-white/5 text-white/70 border-white/10"
                  }`}>
                    {story.category}
                  </span>
                  <span className="inline-flex px-3 py-1 bg-transparent border border-white/5 rounded text-[10px] font-semibold text-text-muted">
                    {story.source}
                  </span>
                </div>
                
                <div className="flex gap-1" title={`Importance: ${story.importance}/5`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div 
                      key={j}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        j < story.importance 
                          ? "bg-accent-warm shadow-[0_0_8px_var(--accent-warm)]" 
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <h2 className={`font-medium mb-6 md:mb-8 leading-[1.1] tracking-tight relative z-10 ${
                isHero ? "text-3xl md:text-5xl max-w-full md:max-w-[90%] font-playfair" : "text-xl md:text-2xl"
              }`}>
                {story.headline}
              </h2>
              
              <div className={`rounded-xl border relative z-10 ${
                isHero ? "bg-[#0A0A0A] border-white/5 p-6 md:p-8 mb-6 md:mb-8" : "bg-[#0A0A0A] border-white/5 p-5 md:p-6 mb-5 md:mb-6 mt-auto"
              }`}>
                <p className="text-[10px] font-semibold uppercase text-white/40 mb-3 tracking-widest flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isHero ? "bg-accent animate-pulse" : "bg-white/30"}`} />
                  The Signal
                </p>
                <p className={`font-medium leading-relaxed text-white/90 ${
                  isHero ? "text-xl md:text-2xl" : "text-base"
                }`}>
                  {story.signal}
                </p>
              </div>
              
              <p className={`leading-relaxed text-text-muted relative z-10 ${
                isHero ? "text-lg max-w-4xl" : "text-sm"
              }`}>
                {story.summary}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
