"use client";

import { useEffect, useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { MotionConfig } from "motion/react";
import { ALLOWED_TOPICS } from "@/lib/topics";
import { ScrollReveal, StaggerChildren, StaggerItem } from "./motion/Reveal";
import { MagneticButton } from "./motion/Magnetic";
import { NumberTicker } from "./motion/NumberTicker";

type LandingStory = {
  headline: string;
  category: string;
  importance: number;
  signal: string;
  source: string;
};

type LandingStats = {
  briefingsLast24h: number;
  latest: {
    topics: string[];
    generatedAt: number;
    stories: LandingStory[];
  } | null;
};

/* ──────────────────────────────────────────────
   THE SIGNAL — Clean modern SaaS landing
   White surface × zinc hairlines × electric blue
   ────────────────────────────────────────────── */

function SignalGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M2 16c5 0 5-9 11-9s5 18 11 18 5-9 6-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/* Shared interactive styles — visible focus ring on every control */
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";
const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 rounded-lg bg-signal text-white font-semibold tracking-tight hover:bg-signal-deep transition-colors duration-200 ${FOCUS}`;
const BTN_GHOST = `inline-flex items-center justify-center gap-2 rounded-lg border border-rule bg-paper text-ink font-medium hover:bg-paper-soft hover:border-rule-strong transition-colors duration-200 ${FOCUS}`;

/* ──────────── Briefing preview ────────────
   Shows the latest real briefing when one exists;
   falls back to sample stories before first fetch. */

const SAMPLE: NonNullable<LandingStats["latest"]> = {
  topics: ["AI & LLMs", "Startup Funding", "Big Tech"],
  generatedAt: 0,
  stories: [
    { headline: "Anthropic ships Opus 4.7 with a native tool-use loop", category: "AI & LLMs", importance: 5, signal: "Tool calls now run in a single inference pass — cuts agent latency roughly 40%.", source: "techcrunch.com" },
    { headline: "Vector DB startup raises $80M Series B led by Index", category: "Funding", importance: 4, signal: "", source: "" },
    { headline: "Apple opens on-device foundation models to developers", category: "Big Tech", importance: 4, signal: "", source: "" },
    { headline: "Vercel introduces fluid compute pricing for agents", category: "DevTools", importance: 3, signal: "", source: "" },
  ],
};

function formatGeneratedAt(ms: number): string {
  if (!ms) return "Today";
  const d = new Date(ms);
  const sameDay = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `Today · ${time}` : d.toLocaleDateString([], { month: "short", day: "numeric" }) + ` · ${time}`;
}

function ScoreBars({ score, className = "" }: { score: number; className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[3px] ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${i <= score ? "bg-signal" : "bg-rule"}`}
          style={{ height: 4 + i * 2 }}
        />
      ))}
    </span>
  );
}

function BriefingMock({ latest }: { latest: LandingStats["latest"] }) {
  const data = latest && latest.stories.length > 0 ? latest : SAMPLE;
  const [lead, ...rest] = data.stories;
  const isReal = data.generatedAt > 0;

  return (
    /* Product preview — decorative for assistive tech; real content lives in the app */
    <div aria-hidden="true" className="relative mx-auto max-w-2xl">
      {/* Card */}
      <div className="relative bg-paper border border-rule rounded-2xl shadow-[0_24px_64px_-24px_rgba(9,9,11,0.18)] overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-rule bg-paper-soft">
          <span className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="dateline text-ink">{isReal ? "Latest briefing" : "Live briefing"}</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            {data.topics.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-paper-deep px-2.5 py-1 text-[10px] font-medium text-ink-2">
                {t}
              </span>
            ))}
          </span>
          <span className="dateline">{formatGeneratedAt(data.generatedAt)}</span>
        </div>

        {/* Waveform motif strip */}
        <svg viewBox="0 0 600 24" preserveAspectRatio="none" className="block w-full h-4 text-signal opacity-25">
          <path
            d="M0 12h60c20 0 20-8 40-8s20 16 40 16 20-8 40-8h60c20 0 20-6 40-6s20 12 40 12 20-6 40-6h60c20 0 20-9 40-9s20 18 40 18 20-9 40-9h60"
            fill="none" stroke="currentColor" strokeWidth="1.5"
          />
        </svg>

        {/* Lead story */}
        <div className="px-5 pt-2 pb-5 sm:px-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="eyebrow text-[10px]">Lead story · {lead.category}</span>
            <ScoreBars score={lead.importance} />
          </div>
          <p className="font-display text-[19px] sm:text-[22px] font-semibold leading-snug text-ink line-clamp-2">
            {lead.headline}
          </p>
          {lead.source && <p className="dateline mt-1.5">{lead.source}</p>}

          {lead.signal && (
            <div className="mt-4 rounded-lg bg-signal-soft px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-signal font-semibold mb-1">
                The Signal take
              </p>
              <p className="text-[13px] leading-snug text-ink-2 font-medium line-clamp-2">
                {lead.signal}
              </p>
            </div>
          )}

          {/* Secondary stories */}
          <ul className="mt-5 divide-y divide-rule border-t border-rule">
            {rest.slice(0, 3).map((s) => (
              <li key={s.headline} className="flex items-center gap-3 py-2.5 text-[12.5px]">
                <ScoreBars score={s.importance} className="shrink-0" />
                <span className="dateline w-[4.5rem] shrink-0 truncate">{s.category}</span>
                <span className="text-ink-2 leading-snug truncate">{s.headline}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-rule bg-paper-soft">
          <span className="dateline">{isReal ? `Generated ${formatGeneratedAt(data.generatedAt)}` : "Sample briefing"}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-signal text-white px-3 py-1 text-[11px] font-semibold">
            Share brief
            <ArrowRight size={11} />
          </span>
        </div>
      </div>

      {/* Floating digest chip */}
      <div className="hidden md:flex absolute -right-10 top-10 items-center gap-2.5 elev-1 px-4 py-2.5 shadow-md">
        <span className="text-signal"><SignalGlyph size={16} /></span>
        <span className="text-[12px] font-medium text-ink">Daily digest</span>
        <span className="dateline">straight to your inbox</span>
      </div>
    </div>
  );
}

/* ──────────── Feature icons ──────────── */

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-signal-soft text-signal" aria-hidden="true">
      {children}
    </span>
  );
}

/* Bespoke duotone icon set — every glyph carries the waveform motif */
const icon = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const FEATURES = [
  {
    title: "Generate on demand",
    body: "Pick your topics and hit generate. A synthesized briefing lands in 15–30 seconds — no feed, no scrolling.",
    svg: (
      <svg {...icon}>
        <path d="M13 2 4.5 13H11l-1.5 9L18 11h-6.5L13 2z" fill="currentColor" fillOpacity="0.18" />
        <path {...stroke} d="M13 2 4.5 13H11l-1.5 9L18 11h-6.5L13 2z" />
        <path {...stroke} strokeWidth="1.4" d="M17 19c1.4 0 1.4-2 2.8-2s1.4 2 2.8 2" opacity="0.8" />
      </svg>
    ),
  },
  {
    title: "Ranked, not random",
    body: "Every story is scored 1–5 on importance, so the lead story actually leads and the noise stays out.",
    svg: (
      <svg {...icon}>
        <rect x="3" y="15" width="3" height="6" rx="1.5" fill="currentColor" fillOpacity="0.25" />
        <rect x="8.5" y="11" width="3" height="10" rx="1.5" fill="currentColor" fillOpacity="0.45" />
        <rect x="14" y="7" width="3" height="14" rx="1.5" fill="currentColor" fillOpacity="0.7" />
        <rect x="19.5" y="3" width="3" height="18" rx="1.5" fill="currentColor" />
        <circle cx="21" cy="1.8" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Daily email digest",
    body: "Schedule delivery to your inbox at any hour, in your timezone. Skip days when you're busy.",
    svg: (
      <svg {...icon}>
        <rect x="2.5" y="4.5" width="19" height="15" rx="3" fill="currentColor" fillOpacity="0.14" />
        <rect {...stroke} x="2.5" y="4.5" width="19" height="15" rx="3" />
        <path {...stroke} d="M5.5 9c1.6 0 1.6 2.4 3.2 2.4S10.3 9 12 9s1.6 2.4 3.2 2.4S16.8 9 18.5 9" />
        <circle cx="18" cy="16" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Shareable permalinks",
    body: "Each briefing gets a permanent link. Paste it in Slack, Notion, or anywhere your team lives.",
    svg: (
      <svg {...icon}>
        <circle cx="5.5" cy="12" r="3.2" fill="currentColor" fillOpacity="0.18" />
        <circle {...stroke} cx="5.5" cy="12" r="3.2" />
        <circle cx="18.5" cy="12" r="3.2" fill="currentColor" fillOpacity="0.18" />
        <circle {...stroke} cx="18.5" cy="12" r="3.2" />
        <path {...stroke} d="M8.7 12c1.6 0 1.6-2.2 3.3-2.2s1.7 4.4 3.3 4.4" />
      </svg>
    ),
  },
  {
    title: "Eight curated topics",
    body: "AI, startup funding, big tech, developer tools, crypto, policy, hardware, and hiring — refined by what operators actually read.",
    svg: (
      <svg {...icon}>
        {/* 8 dots = 8 topics; solid ones read as "selected" */}
        {[
          { cx: 5, cy: 6, o: 1 }, { cx: 11, cy: 6, o: 0.35 }, { cx: 17, cy: 6, o: 1 },
          { cx: 5, cy: 12, o: 0.35 }, { cx: 11, cy: 12, o: 1 }, { cx: 17, cy: 12, o: 0.35 },
          { cx: 5, cy: 18, o: 0.35 }, { cx: 11, cy: 18, o: 1 },
        ].map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r="2.1" fill="currentColor" fillOpacity={d.o} />
        ))}
        <path {...stroke} strokeWidth="1.4" d="M15.5 15.5c1.8 0 1.8 2.5 3.6 2.5s1.8-2.5 3.4-2.5" opacity="0.8" />
      </svg>
    ),
  },
  {
    title: "Private by default",
    body: "We don't train on your topic preferences or reading history. Export anytime, leave in one click.",
    svg: (
      <svg {...icon}>
        <path d="M12 2.5 4.5 5.3v5.9c0 4.6 3.2 7.9 7.5 10.3 4.3-2.4 7.5-5.7 7.5-10.3V5.3L12 2.5z" fill="currentColor" fillOpacity="0.14" />
        <path {...stroke} d="M12 2.5 4.5 5.3v5.9c0 4.6 3.2 7.9 7.5 10.3 4.3-2.4 7.5-5.7 7.5-10.3V5.3L12 2.5z" />
        <path {...stroke} d="M8 12c1.3 0 1.3-2 2.7-2s1.3 4 2.7 4 1.3-2 2.6-2" />
      </svg>
    ),
  },
];

/* Step markers: waveform progress fills as the sequence advances */
const STEPS = [
  { n: "01", progress: 1 / 3, t: "Pick your topics", b: "Choose up to 8 from a curated set: AI, startup funding, big tech, developer tools, crypto, policy, hardware, hiring." },
  { n: "02", progress: 2 / 3, t: "Generate or schedule", b: "Hit generate for an instant brief, or set a daily delivery hour for your inbox digest." },
  { n: "03", progress: 1, t: "Read in two minutes", b: "Each story comes with a one-line take, importance score, and source. No filler. No ads." },
];

function StepWave({ progress }: { progress: number }) {
  const total = 72;
  const filled = Math.round(total * progress);
  return (
    <svg width={total} height="14" viewBox={`0 0 ${total} 14`} fill="none" aria-hidden="true" className="mt-3">
      <path d="M0 7c6 0 6-5 12-5s6 10 12 10 6-5 12-5 6-3 12-3 6 6 12 6 6-3 12-3" stroke="var(--rule-strong)" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M0 7c6 0 6-5 12-5s6 10 12 10 6-5 12-5 6-3 12-3 6 6 12 6 6-3 12-3"
        stroke="var(--signal)" strokeWidth="1.6" strokeLinecap="round"
        strokeDasharray={`${filled} ${total}`}
        pathLength={total}
      />
    </svg>
  );
}

/* ──────────── Page ──────────── */

export function LandingHero() {
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-paper text-ink relative overflow-x-hidden">
        {/* ── Sticky nav ── */}
        <header className="sticky top-0 z-40 bg-paper/80 backdrop-blur-md border-b border-rule">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-9">
              <a href="/" className={`flex items-center gap-2.5 rounded-md ${FOCUS}`}>
                <span className="text-signal"><SignalGlyph size={22} /></span>
                <span className="font-display text-[18px] sm:text-[19px] font-semibold tracking-tight leading-none">The Signal</span>
              </a>
              <nav aria-label="Main" className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-ink-2">
                <a href="#features" className={`ink-link rounded-sm py-2 ${FOCUS}`}>Features</a>
                <a href="#how-it-works" className={`ink-link rounded-sm py-2 ${FOCUS}`}>How it works</a>
              </nav>
            </div>
            <div className="flex items-center gap-1 sm:gap-2.5">
              <SignInButton mode="modal">
                <button className={`inline-flex min-h-11 items-center px-2.5 sm:px-3.5 py-2 rounded-lg text-[13px] sm:text-[13.5px] font-medium text-ink-2 hover:text-ink hover:bg-paper-soft transition-colors ${FOCUS}`}>
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className={`${BTN_PRIMARY} min-h-11 px-3 sm:px-4 py-2 text-[13px] sm:text-[13.5px]`}>
                  <span className="sm:hidden">Start</span>
                  <span className="hidden sm:inline">Get started</span>
                </button>
              </SignUpButton>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative border-b border-rule">
          <div className="absolute inset-0 bg-grid bg-grid-fade pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 md:pt-24 pb-14 sm:pb-16 md:pb-24 text-center">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-3.5 py-1.5 text-[12px] font-medium text-ink-2 shadow-sm">
                <span className="live-dot" />
                Live · AI-curated every day
              </span>

              <h1 className="mt-6 font-display font-semibold tracking-[-0.035em] text-[38px] min-[380px]:text-[42px] sm:text-[60px] md:text-[76px] leading-[1.02] max-w-4xl mx-auto text-balance">
                Tech news, distilled to <span className="text-signal">the signal</span>.
              </h1>

              <p className="mt-5 max-w-xl mx-auto text-[16px] md:text-[18px] text-ink-2 leading-[1.55]">
                The Signal scans the live web, scores every story on importance, and hands you a two-minute briefing on the topics you pick. No feed. No filler. No ads.
              </p>

              <div className="mt-8 mx-auto flex max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
                <SignUpButton mode="modal">
                  <MagneticButton className={`${BTN_PRIMARY} min-h-12 w-full px-6 py-3 text-[14.5px] shadow-sm sm:w-auto`}>
                    Get started free
                    <ArrowRight />
                  </MagneticButton>
                </SignUpButton>
                <a href="#how-it-works" className={`${BTN_GHOST} min-h-12 w-full px-5 py-3 text-[14.5px] sm:w-auto`}>
                  See how it works
                </a>
              </div>

              <p className="mt-5 dateline">Free forever · 3 briefings a day · No card required</p>
            </ScrollReveal>

            <ScrollReveal delay={0.15} className="mt-12 sm:mt-14 md:mt-16">
              <BriefingMock latest={stats?.latest ?? null} />
            </ScrollReveal>
          </div>
        </section>

        {/* ── Trust / meta strip ── */}
        <section className="border-b border-rule bg-paper-soft" aria-label="Product stats">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-12">
            <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8">
              {[
                { value: <NumberTicker value={stats?.briefingsLast24h ?? 0} />, label: "Briefings generated in the last 24 hours" },
                { value: <NumberTicker value={ALLOWED_TOPICS.length} />, label: "Curated topics to choose from" },
                { value: <NumberTicker value={3} />, label: "Free briefings every day" },
                { value: <><NumberTicker value={30} /><span className="text-ink-mute text-2xl">s</span></>, label: "Typical time to synthesize" },
              ].map((stat, i) => (
                <StaggerItem key={i}>
                  <div className="font-display text-4xl md:text-5xl font-semibold tracking-tight tabular-nums text-ink">
                    {stat.value}
                  </div>
                  <div className="mt-1.5 text-[13px] text-ink-mute">{stat.label}</div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="scroll-mt-20 border-b border-rule">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 md:py-24">
            <ScrollReveal className="max-w-2xl mb-9 sm:mb-12">
              <p className="eyebrow mb-3">The product</p>
              <h2 className="font-display text-3xl md:text-[42px] font-semibold tracking-tight leading-[1.05]">
                One briefing. Every signal that matters.
              </h2>
              <p className="mt-4 text-[15.5px] text-ink-2 leading-relaxed">
                Pick your topics, hit generate, and get a brief you can finish before your coffee cools.
              </p>
            </ScrollReveal>

            <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" stagger={0.06}>
              {FEATURES.map((f) => (
                <StaggerItem key={f.title}>
                  <div className="elev-1 h-full p-5 sm:p-6 transition-shadow duration-200 hover:shadow-md">
                    <IconChip>{f.svg}</IconChip>
                    <h3 className="mt-4 font-display text-[17px] font-semibold tracking-tight">{f.title}</h3>
                    <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed">{f.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="scroll-mt-20 border-b border-rule bg-paper-soft">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 md:py-24">
            <ScrollReveal className="max-w-2xl mb-9 sm:mb-12">
              <p className="eyebrow mb-3">How it works</p>
              <h2 className="font-display text-3xl md:text-[42px] font-semibold tracking-tight leading-[1.05]">
                Three steps. Sixty seconds.
              </h2>
            </ScrollReveal>

            <StaggerChildren className="grid md:grid-cols-3 gap-4" stagger={0.08}>
              {STEPS.map((step) => (
                <StaggerItem key={step.n}>
                  <div className="elev-1 h-full p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-signal-soft text-signal font-mono text-[13px] font-semibold">
                        {step.n}
                      </span>
                      <StepWave progress={step.progress} />
                    </div>
                    <h3 className="mt-4 font-display text-[17px] font-semibold tracking-tight">{step.t}</h3>
                    <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed">{step.b}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* ── Final CTA band ── */}
        <section className="border-b border-rule">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 md:py-24">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-2xl bg-ink text-paper px-5 py-12 sm:px-6 sm:py-14 md:px-16 md:py-20 text-center">
                {/* Waveform motif */}
                <svg viewBox="0 0 600 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full h-16 text-signal opacity-30" aria-hidden="true">
                  <path
                    d="M0 40h60c20 0 20-24 40-24s20 48 40 48 20-24 40-24h60c20 0 20-18 40-18s20 36 40 36 20-18 40-18h60c20 0 20-28 40-28s20 56 40 56 20-28 40-28h60"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                  />
                </svg>
                <div className="relative">
                  <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05] max-w-2xl mx-auto text-balance text-paper">
                    Stop scrolling. Start reading the signal.
                  </h2>
                  <p className="mt-4 text-[15px] md:text-[16px] text-ink-faint max-w-lg mx-auto leading-relaxed">
                    Sign up in 10 seconds, read your first briefing in 30. Free forever for 3 briefings a day.
                  </p>
                  <div className="mt-8 mx-auto flex max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
                    <SignUpButton mode="modal">
                      <MagneticButton className={`${BTN_PRIMARY} min-h-12 w-full px-6 py-3 text-[14.5px] sm:w-auto`}>
                        Get started free
                        <ArrowRight />
                      </MagneticButton>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <button className={`inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-white/25 px-5 py-3 text-[14.5px] font-medium text-paper hover:bg-white/10 transition-colors sm:w-auto ${FOCUS}`}>
                        Sign in
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-paper">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-signal"><SignalGlyph size={20} /></span>
              <span className="font-display text-[17px] font-semibold tracking-tight">The Signal</span>
              <span className="hidden sm:inline text-[13px] text-ink-mute">— tech intelligence, distilled.</span>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] text-ink-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
              <a href="#features" className={`ink-link rounded-sm py-1 ${FOCUS}`}>Features</a>
              <a href="#how-it-works" className={`ink-link rounded-sm py-1 ${FOCUS}`}>How it works</a>
              <SignInButton mode="modal">
                <button className={`ink-link rounded-sm py-1 ${FOCUS}`}>Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className={`ink-link rounded-sm py-1 ${FOCUS}`}>Sign up</button>
              </SignUpButton>
            </nav>
          </div>
          <div className="border-t border-rule">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-start justify-between gap-3 dateline min-[380px]:flex-row min-[380px]:items-center">
              <span>© {new Date().getFullYear()} The Signal</span>
              <span className="flex items-center gap-2"><span className="live-dot" /> All systems operational</span>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
