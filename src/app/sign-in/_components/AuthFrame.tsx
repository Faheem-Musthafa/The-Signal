import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Logo, SignalBars, TopicChip } from "@/components/ui";
import { SIGNAL_WAVE_PATH, TOPIC_STYLES } from "@/lib/topicStyle";

type AuthFrameProps = {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
};

const COPY = {
  "sign-in": {
    eyebrow: "Sign in",
    title: "Welcome back.",
    body: "Sign in to get today’s briefing, your saved stories and your daily email.",
  },
  "sign-up": {
    eyebrow: "Free account",
    title: "Tech news that matters, in two minutes.",
    body: "Pick your topics and get the top stories, short and ranked, with a link to every source.",
  },
} as const;

const FACTS = [
  { title: "3 a day", body: "free briefings" },
  { title: "Sourced", body: "every story links to the original" },
  { title: "Daily email", body: "if you want it" },
] as const;

// Decorative fan of mini story cards (abstract — no fake headlines).
const FAN = [
  { topic: "Developer Tools", rotate: -9, x: -66, y: 18, bars: 3 },
  { topic: "Startup Funding", rotate: 6, x: 70, y: 12, bars: 4 },
  { topic: "AI & LLMs", rotate: -1, x: 0, y: 0, bars: 5 },
] as const;

function TopicStripe({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex h-1.5 w-full ${className}`}>
      {TOPIC_STYLES.map((t) => (
        <span key={t.key} className="flex-1" style={{ background: t.color }} />
      ))}
    </div>
  );
}

function StoryFan() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[260px] w-full max-w-[360px]">
      {FAN.map((card) => {
        const style = TOPIC_STYLES.find((t) => t.topic === card.topic)!;
        return (
          <div
            key={card.topic}
            className="grain absolute left-1/2 top-0 flex h-[236px] w-[150px] flex-col overflow-hidden rounded-[20px] p-3.5 shadow-story"
            style={{
              background: style.color,
              transform: `translateX(calc(-50% + ${card.x}px)) translateY(${card.y}px) rotate(${card.rotate}deg)`,
            }}
          >
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-[3px] flex-1 rounded-full ${i === 0 ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <TopicChip topic={card.topic} variant="onColor" short />
              <SignalBars value={card.bars} size="xs" color="#fff" trackColor="rgba(255,255,255,0.3)" decorative />
            </div>
            <div className="mt-4 space-y-1.5">
              <span className="block h-3 w-[92%] rounded-full bg-white/90" />
              <span className="block h-3 w-[70%] rounded-full bg-white/90" />
            </div>
            <div className="mt-auto rounded-xl bg-white p-2.5">
              <span className="block h-1.5 w-1/3 rounded-full" style={{ background: style.color }} />
              <span className="mt-2 block h-2 w-full rounded-full bg-ink/15" />
              <span className="mt-1.5 block h-2 w-4/5 rounded-full bg-ink/15" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Branded split layout around a Clerk <SignIn>/<SignUp>. */
export function AuthFrame({ mode, children }: AuthFrameProps) {
  const copy = COPY[mode];

  return (
    <div className="min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Mobile: compact brand band */}
      <header className="grain relative overflow-hidden bg-signal pt-safe text-white lg:hidden">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute -right-10 -top-6 h-48 w-48 text-white/10" fill="none">
          <path d={SIGNAL_WAVE_PATH} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <div className="relative px-5 pb-6 pt-5">
          <Logo size="sm" tone="inverse" href="/" />
          <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">{copy.eyebrow}</p>
          <h1 className="display-md mt-2 max-w-[18ch] text-white">{copy.title}</h1>
        </div>
        <TopicStripe />
      </header>

      {/* Desktop: full-height brand panel */}
      <aside className="grain relative hidden overflow-hidden bg-signal text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute -left-24 bottom-24 h-[560px] w-[560px] text-white/[0.07]" fill="none">
          <path d={SIGNAL_WAVE_PATH} stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
        <div className="relative flex flex-1 flex-col px-10 py-9 xl:px-14">
          <Logo size="md" tone="inverse" tagline href="/" />

          <div className="mt-auto max-w-[30rem] pt-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">{copy.eyebrow}</p>
            <h1 className="display-lg mt-3 text-white">{copy.title}</h1>
            <p className="mt-4 max-w-[38ch] text-[15.5px] leading-relaxed text-white/80">{copy.body}</p>
          </div>

          <div className="mt-10">
            <StoryFan />
          </div>

          <ul className="mt-8 grid grid-cols-3 gap-2 border-t border-white/15 pt-5" aria-label="What you get">
            {FACTS.map((f) => (
              <li key={f.title} className="min-w-0">
                <span className="block font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-white">{f.title}</span>
                <span className="mt-1 block text-[13.5px] text-white/75">{f.body}</span>
              </li>
            ))}
          </ul>
        </div>
        <TopicStripe />
      </aside>

      <main id="main" className="flex flex-col items-center px-4 pb-10 pt-8 sm:pt-12 lg:min-h-dvh lg:justify-center lg:py-12">
        <p className="mb-6 max-w-[34ch] text-center text-[15px] leading-relaxed text-ink-2 lg:hidden">
          {copy.body}
        </p>
        {children}
        <nav aria-label="Legal" className="mt-8 flex items-center gap-1 text-[13px] text-ink-mute">
          <Link
            href={"/privacy" as Route}
            className="inline-flex min-h-11 items-center rounded-full px-3 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
          >
            Privacy
          </Link>
          <span aria-hidden="true" className="text-ink-faint">
            ·
          </span>
          <Link
            href={"/terms" as Route}
            className="inline-flex min-h-11 items-center rounded-full px-3 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
          >
            Terms
          </Link>
        </nav>
      </main>
    </div>
  );
}
