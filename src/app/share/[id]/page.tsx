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
    <main className="min-h-screen bg-paper-soft text-ink relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-7 sm:py-10 md:py-14">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 sm:mb-12 pb-7 sm:pb-8 border-b border-rule">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 rounded-lg bg-signal-soft text-signal flex items-center justify-center shrink-0 mt-1">
              <Mark />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
                Shared briefing · The Signal
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                {new Date(digest.generatedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-ink-mute">
                <span>{new Date(digest.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-ink-faint">·</span>
                <span className="text-signal">{digest.model}</span>
                <span className="text-ink-faint">·</span>
                <span>{digest.topics.join(" · ")}</span>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-signal text-white font-semibold text-sm hover:bg-signal-deep transition-colors"
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
                className={`elev-1 rounded-xl p-5 sm:p-6 flex flex-col group hover:shadow-md transition-shadow ${
                  isHero ? "md:col-span-2 lg:col-span-3" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      isHero ? "bg-signal-soft text-signal" : "bg-paper-soft border border-rule text-ink-mute"
                    }`}>
                      {story.category}
                    </span>
                    <span className="max-w-full truncate text-[11px] text-ink-mute">{story.source}</span>
                  </div>

                  <div className="flex shrink-0 gap-1 pt-1" title={`Importance: ${story.importance}/5`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1 h-1 rounded-full ${j < story.importance ? "bg-signal" : "bg-rule"}`}
                      />
                    ))}
                  </div>
                </div>

                <h2 className={`font-semibold mb-4 leading-snug tracking-tight ${
                  isHero ? "text-2xl sm:text-3xl md:text-4xl max-w-3xl" : "text-base"
                }`}>
                  {story.headline}
                </h2>

                <div className="rounded-lg bg-signal-soft p-4 mb-4 mt-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-signal mb-2">The Signal</p>
                  <p className={`font-medium leading-relaxed text-ink ${isHero ? "text-base md:text-lg" : "text-sm"}`}>
                    {story.signal}
                  </p>
                </div>

                <p className={`leading-relaxed text-ink-mute ${isHero ? "text-sm md:text-base max-w-3xl" : "text-xs"}`}>
                  {story.summary}
                </p>
              </article>
            );
          })}
        </div>

        <footer className="mt-12 sm:mt-16 pt-8 border-t border-rule flex flex-col items-start justify-between gap-3 text-xs text-ink-mute min-[380px]:flex-row min-[380px]:items-center">
          <span>
            Powered by{" "}
            <Link href="/" className="text-ink hover:text-signal transition-colors">
              The Signal
            </Link>
          </span>
          <span className="font-mono">/share/{id.slice(0, 8)}</span>
        </footer>
      </div>
    </main>
  );
}
