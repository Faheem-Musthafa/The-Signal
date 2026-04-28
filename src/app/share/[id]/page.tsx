import Link from "next/link";
import { notFound } from "next/navigation";
import { getConvexClient } from "@/lib/convexServer";
import { api } from "../../../../convex/_generated/api";

function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c4 0 4-6 8-6s4 12 8 12 4-6 4-6" />
    </svg>
  );
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const convex = getConvexClient();
  const digest = await convex.query(api.digests.getByShareId, { shareId: id });

  if (!digest) notFound();

  return (
    <main className="min-h-screen bg-bg text-text relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-accent/8 blur-[120px] rounded-full opacity-40" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12 pb-8 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0 mt-1">
              <Mark />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-dim mb-1.5">
                Shared briefing · The Signal
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                {new Date(digest.generatedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-text-dim">
                <span>{new Date(digest.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-text-dim/40">·</span>
                <span className="text-accent">{digest.model}</span>
                <span className="text-text-dim/40">·</span>
                <span>{digest.topics.join(" · ")}</span>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors"
          >
            Get your own briefing
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {digest.stories.map((story, i) => {
            const isHero = i === 0;
            return (
              <article
                key={i}
                className={`elev-1 rounded-xl p-6 flex flex-col group hover:border-border-strong transition-all ${
                  isHero ? "md:col-span-2 lg:col-span-3" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      isHero ? "bg-accent-soft text-accent border border-accent/20" : "bg-surface border border-border text-text-muted"
                    }`}>
                      {story.category}
                    </span>
                    <span className="text-[11px] text-text-dim">{story.source}</span>
                  </div>

                  <div className="flex gap-1" title={`Importance: ${story.importance}/5`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1 h-1 rounded-full ${j < story.importance ? "bg-accent-warm" : "bg-surface-3"}`}
                      />
                    ))}
                  </div>
                </div>

                <h2 className={`font-semibold mb-4 leading-snug tracking-tight ${
                  isHero ? "text-2xl md:text-4xl max-w-3xl" : "text-base"
                }`}>
                  {story.headline}
                </h2>

                <div className="rounded-lg border border-border bg-bg p-4 mb-4 mt-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-2">The Signal</p>
                  <p className={`font-medium leading-relaxed text-text ${isHero ? "text-base md:text-lg" : "text-sm"}`}>
                    {story.signal}
                  </p>
                </div>

                <p className={`leading-relaxed text-text-muted ${isHero ? "text-sm md:text-base max-w-3xl" : "text-xs"}`}>
                  {story.summary}
                </p>
              </article>
            );
          })}
        </div>

        <footer className="mt-16 pt-8 border-t border-border flex items-center justify-between text-xs text-text-dim">
          <span>
            Powered by{" "}
            <Link href="/" className="text-text hover:text-accent transition-colors">
              The Signal
            </Link>
          </span>
          <span className="font-mono">/share/{id.slice(0, 8)}</span>
        </footer>
      </div>
    </main>
  );
}
