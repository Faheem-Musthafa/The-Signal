import { notFound } from "next/navigation";
import { getConvexClient } from "@/lib/convexServer";
import type { DigestResponse } from "@/types/digest";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const convex = getConvexClient();

  const digest = await convex.query("digests:getByShareId" as never, {
    shareId: id,
  } as never) as DigestResponse | null;

  if (!digest) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg text-white px-4 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg glass-panel text-text-muted text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Shared Intelligence Briefing
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">The Signal</h1>
            <p className="text-text-muted text-sm font-medium flex flex-wrap items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {new Date(digest.generatedAt).toLocaleString()}
              <span className="text-border px-2 hidden md:inline">|</span>
              <span className="text-accent/80 border border-accent/20 bg-accent/10 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">{digest.model}</span>
            </p>
          </div>
          
          <a 
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:bg-accent-hover hover:-translate-y-0.5 transition-all w-full md:w-auto"
          >
            Create Your Own Radar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {digest.stories.map((story, i) => {
            const isHero = i === 0;

            return (
              <article 
                key={i} 
                className={`glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden group flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/5 hover:border-accent/30 ${
                  isHero ? "md:col-span-2 lg:col-span-3 bg-gradient-to-br from-surface to-surface/40 border-accent/20" : ""
                }`}
              >
                {isHero && <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />}
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                      isHero ? "bg-accent/20 text-accent border-accent/30" : "bg-surface-2 text-text-muted border-white/5"
                    }`}>
                      {story.category}
                    </span>
                    <span className="inline-flex px-2 py-1 bg-surface-2 border border-white/5 rounded-md text-[10px] font-semibold text-text-muted">
                      {story.source}
                    </span>
                  </div>
                  
                  <div className="flex gap-1" title={`Importance: ${story.importance}/5`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg 
                        key={j} 
                        width="12" height="12" viewBox="0 0 24 24" 
                        fill={j < story.importance ? "var(--accent-warm)" : "none"} 
                        stroke={j < story.importance ? "var(--accent-warm)" : "currentColor"} 
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={j < story.importance ? "opacity-100 drop-shadow-[0_0_5px_var(--accent-warm)]" : "opacity-20 text-text-muted"}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>
                </div>
                
                <h2 className={`font-bold mb-5 leading-tight tracking-tight relative z-10 ${
                  isHero ? "text-3xl md:text-5xl" : "text-xl md:text-2xl"
                }`}>
                  {story.headline}
                </h2>
                
                <div className={`rounded-2xl border relative z-10 ${
                  isHero ? "bg-accent/10 border-accent/30 p-6 md:p-8 mb-6" : "bg-surface-2/50 border-white/5 p-5 mb-5 mt-auto"
                }`}>
                  <p className="text-[10px] font-black uppercase text-accent mb-3 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    The Signal
                  </p>
                  <p className={`font-semibold leading-relaxed text-white ${
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
        
        <footer className="mt-16 text-center text-text-muted text-sm font-medium">
          <p>
            Powered by{" "}
            <a href="/" className="text-white hover:text-accent transition-colors underline decoration-white/20 underline-offset-4">
              The Signal
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
