import { UserButton } from "@clerk/nextjs";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";

type RadarConfigProps = {
  selectedTopics: Topic[];
  toggleTopic: (topic: Topic) => void;
  handleGenerate: () => void;
  generationsToday: number;
  error: string | null;
  previouslyCrawled: Array<{
    shareId: string;
    generatedAt: string;
    topics: string[];
    cached?: boolean;
  }>;
  openPreviousDigest: (shareId: string) => void;
};

export function RadarConfig({
  selectedTopics,
  toggleTopic,
  handleGenerate,
  generationsToday,
  error,
  previouslyCrawled,
  openPreviousDigest,
}: RadarConfigProps) {
  return (
    <div className="relative z-10 w-full max-w-4xl flex flex-col items-center animate-fade-in-up mt-8 md:mt-12">
      {/* Top Navbar */}
      <div className="w-full flex items-center justify-between mb-20 px-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest">
            {Math.max(0, 3 - generationsToday)}/3 Digests Remaining
          </span>
        </div>
        <UserButton />
      </div>

      <div className="w-full px-4 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-[3.5rem] font-semibold tracking-tight mb-6 text-white leading-tight">
          What should we track today?
        </h1>
        <p className="text-base md:text-lg text-white/50 max-w-xl mb-14 font-light leading-relaxed">
          Select your radar targets. Our engine will synthesize real-time intelligence into a concise executive briefing.
        </p>

        {error && (
          <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 px-4 py-4 rounded-2xl mb-8 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-red-400 mb-3">{error}</p>
            <button onClick={handleGenerate} className="text-xs font-medium text-white/70 hover:text-white underline underline-offset-4 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Topics Selection */}
        <div className="w-full max-w-3xl flex flex-wrap justify-center gap-3 mb-14">
          {ALLOWED_TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-5 py-3 text-sm rounded-xl border transition-all duration-200 font-medium ${
                  isSelected 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]" 
                    : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={selectedTopics.length === 0}
          className="w-full md:w-auto min-w-[260px] px-8 py-4 rounded-full bg-white text-black font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.15)] mb-24 flex items-center justify-center gap-3 group"
        >
          Generate Briefing
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>

        {/* Previous Digests */}
        <div className="w-full text-left border-t border-white/10 pt-12">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Today's Briefings
            </h3>
          </div>

          {previouslyCrawled.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mb-3">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <p className="text-sm text-white/40">No briefings generated today.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previouslyCrawled.map((item) => (
                <button
                  key={item.shareId}
                  onClick={() => openPreviousDigest(item.shareId)}
                  className="w-full text-left rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 p-6 group flex flex-col justify-between min-h-[140px] hover:border-white/10 hover:-translate-y-1"
                >
                  <p className="text-sm text-white/90 font-medium mb-4 line-clamp-2 leading-relaxed">
                    {item.topics.join(", ")}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/40 w-full mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{new Date(item.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {item.cached && (
                        <span className="px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
                          Cached
                        </span>
                      )}
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 font-medium flex items-center gap-1">
                      Read
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
