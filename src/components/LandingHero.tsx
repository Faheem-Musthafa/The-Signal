"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import { RevealWords, ScrollReveal, StaggerChildren, StaggerItem } from "./motion/Reveal";
import { MagneticButton } from "./motion/Magnetic";
import { NumberTicker } from "./motion/NumberTicker";
import { Marquee } from "./motion/Marquee";
import { RotatingWord } from "./motion/RotatingWord";

/* ──────────────────────────────────────────────
   THE SIGNAL — Editorial Wire Service
   Newspaper broadsheet × terminal × magazine
   ────────────────────────────────────────────── */

const TODAY = new Date();
const ISO_DATE = TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const VOLUME = `Vol. I · No. ${String(Math.floor((TODAY.getTime() / 86400000) % 999)).padStart(3, "0")}`;

function SignalGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M2 16c5 0 5-9 11-9s5 18 11 18 5-9 6-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

const TICKER_ITEMS = [
  { tag: "AI", text: "Anthropic ships Opus 4.7 with native tool use" },
  { tag: "FUNDING", text: "Vector DB startup raises $80M Series B" },
  { tag: "BIG TECH", text: "Apple opens foundation models to developers" },
  { tag: "DEVTOOLS", text: "Vercel introduces fluid compute pricing" },
  { tag: "POLICY", text: "EU AI Act enforcement details published" },
  { tag: "SCIENCE", text: "DeepMind cracks new class of protein folds" },
];

export function LandingHero() {
  return (
    <div className="min-h-screen w-full bg-paper text-ink relative overflow-x-hidden">
      {/* ════════════ TOP WIRE TICKER ════════════ */}
      <div className="bg-ink text-paper border-b border-rule-bold">
        <Marquee className="py-2.5 text-[12px] font-mono" speed="normal">
          {TICKER_ITEMS.concat(TICKER_ITEMS).map((item, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="text-signal font-semibold tracking-wider">[{item.tag}]</span>
              <span className="text-paper">{item.text}</span>
              <span className="text-ink-faint">·</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ════════════ MASTHEAD NAV ════════════ */}
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-rule">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <a href="/" className="flex items-center gap-2.5 group">
                <span className="text-signal transition-transform group-hover:rotate-12 group-hover:scale-110 duration-300">
                  <SignalGlyph size={22} />
                </span>
                <span className="font-display text-[22px] font-semibold tracking-tight leading-none">
                  The Signal
                </span>
              </a>
              <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-ink-2">
                <a href="#product" className="ink-link">Product</a>
                <a href="#coverage" className="ink-link">Coverage</a>
                <a href="#workflow" className="ink-link">How it works</a>
                <a href="#pricing" className="ink-link">Pricing</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="hidden sm:inline-block px-3 py-1.5 text-[13px] font-medium text-ink-mute hover:text-ink transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 bg-ink text-paper text-[13px] font-semibold tracking-tight hover:bg-signal transition-colors duration-300">
                  Subscribe →
                </button>
              </SignUpButton>
            </div>
          </div>
          {/* Dateline strip */}
          <div className="hidden md:flex items-center justify-between border-t border-rule py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-mute">
            <span>{VOLUME}</span>
            <span className="flex items-center gap-2">
              <span className="live-dot" /> Live · {ISO_DATE}
            </span>
            <span>Curated by AI · Refined for humans</span>
          </div>
        </div>
      </header>

      {/* ════════════ HERO ════════════ */}
      <section className="relative border-b border-rule-bold">
        <div className="absolute inset-0 bg-grid bg-grid-fade pointer-events-none opacity-50" />
        <div className="relative max-w-[1280px] mx-auto px-6 pt-16 md:pt-24 pb-20 md:pb-28">
          {/* Editorial section header */}
          <div className="grid grid-cols-12 gap-x-6 mb-10">
            <div className="col-span-12 flex items-center justify-between rule-fold">
              <span className="dateline">Edition · Real-time tech intelligence</span>
              <span className="dateline">No. 001 / Featured</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-6 gap-y-8 items-end">
            {/* Hero copy — 7 columns */}
            <div className="col-span-12 lg:col-span-8">
              <RevealWords
                as="h1"
                text="Tech news, distilled to the signal."
                className="font-display text-[58px] md:text-[88px] lg:text-[108px] leading-[0.94] font-semibold tracking-[-0.035em]"
                stagger={0.07}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mt-3 font-display-italic text-[28px] md:text-[40px] lg:text-[52px] leading-[1.05] text-signal"
              >
                Read in two minutes.
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.7 }}
                className="mt-8 max-w-xl font-sans text-[16px] md:text-[18px] text-ink-2 leading-[1.55]"
              >
                The Signal scans <strong className="font-semibold">1,247 sources</strong> every minute and synthesizes a real-time briefing on the topics that move your world. No firehose. No filler. No ads.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.7 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <SignUpButton mode="modal">
                  <MagneticButton className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-paper text-[14px] font-semibold tracking-tight hover:bg-signal transition-colors duration-300">
                    Start reading the signal
                    <ArrowRight />
                  </MagneticButton>
                </SignUpButton>
                <a href="#product" className="inline-flex items-center gap-2 px-5 py-3.5 border border-rule-bold text-[14px] font-medium hover:bg-paper-card transition-colors">
                  See a sample briefing
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="mt-6 dateline"
              >
                Free forever · 3 briefings/day · No card required
              </motion.p>
            </div>

            {/* Hero side — front-page mock */}
            <div className="col-span-12 lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 24, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: -1 }}
                transition={{ delay: 1.0, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="bg-paper-card border border-rule-bold p-6 shadow-[12px_12px_0_-2px_rgba(214,50,27,0.18)]"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-ink">
                  <div className="flex items-center gap-2">
                    <span className="live-dot" />
                    <span className="dateline">Live wire</span>
                  </div>
                  <span className="dateline">{TODAY.toUTCString().slice(17, 22)} UTC</span>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-signal mb-2">Lead story</div>
                <h3 className="font-display text-[26px] leading-[1.05] font-semibold mb-3">
                  Anthropic ships Opus 4.7 with native tool-use loop
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="dateline">techcrunch.com</span>
                  <div className="flex gap-0.5">
                    {[1, 1, 1, 1, 1].map((_, i) => (
                      <div key={i} className="w-1 h-3 bg-signal" />
                    ))}
                  </div>
                </div>

                <div className="border-l-2 border-signal pl-3 py-1 mb-5">
                  <p className="dateline mb-1 text-signal">The Signal</p>
                  <p className="text-[13px] text-ink-2 leading-snug font-medium">
                    Tool calls now run in a single inference pass — cuts agent latency 40%.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-rule">
                  {TICKER_ITEMS.slice(1, 4).map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px]">
                      <span className="dateline w-16 shrink-0 pt-0.5">{item.tag}</span>
                      <span className="text-ink-2 leading-snug">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ STATS STRIP ════════════ */}
      <section className="border-b border-rule-bold bg-paper-soft">
        <div className="max-w-[1280px] mx-auto px-6 py-12 md:py-16">
          <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StaggerItem className="border-l-2 border-ink pl-4">
              <div className="font-display text-5xl md:text-6xl font-semibold tracking-tight tabular-nums">
                <NumberTicker value={1247} />
              </div>
              <div className="dateline mt-2">Sources scanned · per minute</div>
            </StaggerItem>
            <StaggerItem className="border-l-2 border-ink pl-4">
              <div className="font-display text-5xl md:text-6xl font-semibold tracking-tight tabular-nums">
                <NumberTicker value={30} />
                <span className="text-ink-mute text-3xl">s</span>
              </div>
              <div className="dateline mt-2">Average synthesis time</div>
            </StaggerItem>
            <StaggerItem className="border-l-2 border-ink pl-4">
              <div className="font-display text-5xl md:text-6xl font-semibold tracking-tight tabular-nums">
                <NumberTicker value={8} />
              </div>
              <div className="dateline mt-2">Curated topics · more soon</div>
            </StaggerItem>
            <StaggerItem className="border-l-2 border-signal pl-4">
              <div className="font-display text-5xl md:text-6xl font-semibold tracking-tight tabular-nums text-signal">
                <NumberTicker value={0} format={(n) => `$${Math.round(n)}`} />
              </div>
              <div className="dateline mt-2">Free forever · 3 daily briefings</div>
            </StaggerItem>
          </StaggerChildren>
        </div>
      </section>

      {/* ════════════ PRODUCT — ASYMMETRIC FEATURE GRID ════════════ */}
      <section id="product" className="border-b border-rule-bold">
        <div className="max-w-[1280px] mx-auto px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="grid grid-cols-12 gap-x-6 mb-12">
              <div className="col-span-12 md:col-span-4">
                <div className="eyebrow mb-4">The product</div>
                <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[0.98]">
                  One briefing.<br />
                  <em className="font-display-italic text-signal">Every signal that matters.</em>
                </h2>
              </div>
              <div className="col-span-12 md:col-span-7 md:col-start-6 md:pt-3">
                <p className="font-display-italic text-2xl md:text-3xl text-ink-2 leading-[1.25] max-w-2xl drop-cap">
                  Pick your topics. Hit generate. We crawl thousands of sources, score every story 1–5 on importance, and hand you a brief you can finish before your coffee cools.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Asymmetric bento — newspaper page layout */}
          <div className="grid grid-cols-12 gap-px bg-rule-bold border border-rule-bold">
            {/* Big lead card */}
            <ScrollReveal className="col-span-12 lg:col-span-7 bg-paper-card p-8 md:p-10 min-h-[420px] flex flex-col" delay={0.1}>
              <div className="flex items-center justify-between mb-6">
                <span className="eyebrow">Real-time briefing</span>
                <span className="dateline">~30s</span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                Generate on demand.
              </h3>
              <p className="text-[15px] text-ink-2 leading-relaxed mb-8 max-w-md">
                Tell us which topics matter. We synthesize a curated briefing in 15–30 seconds. No scrolling, no doomscrolling.
              </p>
              <div className="mt-auto bg-paper border-2 border-ink p-5 space-y-3">
                {[
                  { t: "AI & LLMs", on: true },
                  { t: "Startup Funding", on: true },
                  { t: "Big Tech", on: true },
                  { t: "DevTools", on: false },
                ].map(({ t, on }) => (
                  <div key={t} className="flex items-center justify-between text-[13px]">
                    <span className={`flex items-center gap-3 ${on ? "text-ink" : "text-ink-dim"}`}>
                      <span className={`w-4 h-4 border-2 ${on ? "bg-ink border-ink" : "border-rule-strong"}`}>
                        {on && (
                          <svg viewBox="0 0 12 12" className="w-full h-full text-signal" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m2.5 6 2.5 2.5 4.5-5" />
                          </svg>
                        )}
                      </span>
                      {t}
                    </span>
                    <span className="dateline">{on ? "selected" : ""}</span>
                  </div>
                ))}
                <div className="pt-3 mt-2 border-t border-rule flex items-center justify-between">
                  <span className="dateline">3 of 8 topics</span>
                  <span className="text-[11px] font-mono font-semibold bg-signal text-paper px-2.5 py-1">
                    GENERATE →
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Right column stack */}
            <ScrollReveal className="col-span-12 lg:col-span-5 bg-paper-card p-8 md:p-10 min-h-[210px] flex flex-col" delay={0.2}>
              <span className="eyebrow mb-4">Newsletter</span>
              <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                Daily digest.
              </h3>
              <p className="text-[14px] text-ink-2 leading-relaxed mb-4">
                Schedule delivery to your inbox at any hour, in your timezone. Skip days when you&apos;re busy.
              </p>
              <div className="mt-auto bg-paper border border-rule p-3 flex items-center gap-3 text-[12px]">
                <span className="font-mono text-signal">07:00</span>
                <span className="text-ink-mute">·</span>
                <span className="font-mono text-ink-mute">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                <span className="ml-auto dateline">Active</span>
              </div>
            </ScrollReveal>

            <ScrollReveal className="col-span-12 lg:col-span-5 bg-paper-card p-8 md:p-10 min-h-[210px] flex flex-col" delay={0.3}>
              <span className="eyebrow mb-4">Signal score</span>
              <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                Ranked, not random.
              </h3>
              <p className="text-[14px] text-ink-2 leading-relaxed mb-4">Every story scored 1–5 on importance. The lead story leads.</p>
              <div className="mt-auto flex items-end gap-1">
                {[5, 4, 5, 3, 2, 4, 5, 4, 3, 5, 4, 2, 5, 3, 4, 5].map((v, i) => (
                  <div key={i} className="flex flex-col-reverse gap-0.5" style={{ height: 36 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className={`w-2.5 h-1.5 ${j < v ? "bg-ink" : "bg-rule"}`} />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Bottom wide */}
            <ScrollReveal className="col-span-12 lg:col-span-6 bg-paper-card p-8 md:p-10 min-h-[200px] flex flex-col" delay={0.4}>
              <span className="eyebrow mb-4">Share</span>
              <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                Send anyone the brief.
              </h3>
              <p className="text-[14px] text-ink-2 leading-relaxed mb-4">
                Each briefing gets a permanent link. Paste in Slack, Notion, or anywhere your team lives.
              </p>
              <div className="mt-auto bg-ink text-paper px-4 py-3 flex items-center gap-2 text-[12px] font-mono">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7L11 5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                thesignal.app/share/k7m2xq
                <span className="ml-auto text-signal animate-blink">●</span>
              </div>
            </ScrollReveal>

            <ScrollReveal className="col-span-12 lg:col-span-6 bg-paper-card p-8 md:p-10 min-h-[200px] flex flex-col" delay={0.5}>
              <span className="eyebrow mb-4">Privacy</span>
              <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                Your interests stay yours.
              </h3>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                We don&apos;t train models on your topic preferences or reading history. Unsubscribe in one click. Export anytime.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════ EDITORIAL PULL QUOTE ════════════ */}
      <section className="border-b border-rule-bold bg-ink text-paper">
        <div className="max-w-[1280px] mx-auto px-6 py-24 md:py-32 grid grid-cols-12 gap-x-6">
          <div className="col-span-12 md:col-span-2 mb-6 md:mb-0">
            <div className="text-signal text-[100px] md:text-[180px] font-display leading-[0.7] -mt-4">&ldquo;</div>
          </div>
          <div className="col-span-12 md:col-span-10">
            <ScrollReveal>
              <p className="font-display text-3xl md:text-5xl lg:text-6xl leading-[1.08] tracking-tight font-medium">
                The internet writes <em className="font-display-italic text-signal">a million words an hour</em>. You have time for two minutes. The Signal does the math.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px w-16 bg-signal" />
                <span className="dateline text-paper">Editor&apos;s note · Vol. I</span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section id="workflow" className="border-b border-rule-bold">
        <div className="max-w-[1280px] mx-auto px-6 py-20 md:py-28">
          <ScrollReveal className="mb-14">
            <div className="eyebrow mb-4">Workflow</div>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[0.98] max-w-3xl">
              Three steps. Sixty seconds.<br />
              <em className="font-display-italic text-signal">From sign-up to your first brief.</em>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rule-bold border border-rule-bold">
            {[
              { n: "01", t: "Pick your topics", b: "Choose up to 8 from a curated set: AI, funding, big tech, devtools, policy, science, crypto, security." },
              { n: "02", t: "Generate or schedule", b: "Hit generate for an instant brief, or set a daily delivery hour for your inbox digest." },
              { n: "03", t: "Read in two minutes", b: "Each story comes with a one-line take, importance score, and source. No filler. No ads." },
            ].map((step, i) => (
              <ScrollReveal key={step.n} className="bg-paper-card p-8 md:p-10 min-h-[280px] flex flex-col" delay={i * 0.1}>
                <div className="flex items-baseline justify-between mb-6">
                  <div className="font-display text-7xl md:text-8xl text-signal font-semibold leading-none tracking-tighter">
                    {step.n}
                  </div>
                  <div className="dateline">Step</div>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-3">{step.t}</h3>
                <p className="text-[14px] text-ink-2 leading-relaxed">{step.b}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ COVERAGE — TOPIC GRID ════════════ */}
      <section id="coverage" className="border-b border-rule-bold bg-paper-soft">
        <div className="max-w-[1280px] mx-auto px-6 py-20 md:py-28">
          <ScrollReveal className="mb-14">
            <div className="grid grid-cols-12 gap-x-6">
              <div className="col-span-12 md:col-span-5">
                <div className="eyebrow mb-4">Coverage</div>
                <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[0.98]">
                  Topics worth your <em className="font-display-italic text-signal">attention</em>.
                </h2>
              </div>
              <div className="col-span-12 md:col-span-6 md:col-start-7 md:pt-3">
                <p className="font-sans text-[16px] md:text-[18px] text-ink-2 leading-[1.55] max-w-xl">
                  A focused set of categories — refined by what tech operators, founders, and investors actually want to read. More coming on the wire.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule-bold border border-rule-bold" stagger={0.05}>
            {[
              { t: "AI & LLMs", n: 312 },
              { t: "Startup Funding", n: 187 },
              { t: "Big Tech", n: 234 },
              { t: "DevTools", n: 156 },
              { t: "Cybersecurity", n: 142 },
              { t: "Crypto & Web3", n: 98 },
              { t: "Science", n: 121 },
              { t: "Policy", n: 76 },
            ].map((topic) => (
              <StaggerItem key={topic.t} className="bg-paper-card p-7 hover:bg-paper transition-colors duration-300 group cursor-default">
                <div className="font-display text-[22px] font-semibold tracking-tight mb-2 group-hover:text-signal transition-colors">
                  {topic.t}
                </div>
                <div className="dateline flex items-center justify-between">
                  <span>{topic.n} stories / week</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-signal">→</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════════ PRICING ════════════ */}
      <section id="pricing" className="border-b border-rule-bold">
        <div className="max-w-[1280px] mx-auto px-6 py-20 md:py-28">
          <ScrollReveal className="mb-14 text-center">
            <div className="eyebrow justify-center mb-4">Subscription</div>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[0.98]">
              Free to read. <em className="font-display-italic text-signal">Forever.</em>
            </h2>
            <p className="font-sans text-[16px] text-ink-2 mt-4 max-w-lg mx-auto">
              The reading is on us. Pay only when you want unlimited briefings or pro features.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-px bg-rule-bold border border-rule-bold max-w-4xl mx-auto">
            <ScrollReveal className="bg-paper-card p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-3xl font-semibold tracking-tight">Free</h3>
                <span className="dateline">Forever</span>
              </div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="font-display text-7xl font-semibold tracking-tight">$0</span>
                <span className="text-ink-mute text-lg">/month</span>
              </div>
              <ul className="space-y-3 text-[14px] text-ink-2 mb-10">
                {["3 briefings per day", "Daily email digest", "Up to 8 topics", "Shareable permalink"].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 14 14" className="text-signal" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 7 3 3 5-6" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <MagneticButton className="w-full px-5 py-3.5 bg-ink text-paper text-[14px] font-semibold tracking-tight hover:bg-signal transition-colors duration-300 flex items-center justify-center gap-2">
                  Start for free
                  <ArrowRight />
                </MagneticButton>
              </SignUpButton>
            </ScrollReveal>

            <ScrollReveal className="bg-paper p-10 relative" delay={0.1}>
              <div className="absolute top-4 right-4 px-2 py-0.5 bg-signal text-paper text-[10px] font-mono uppercase tracking-widest">
                Soon
              </div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-3xl font-semibold tracking-tight">Pro</h3>
                <span className="dateline text-signal">Coming Q2</span>
              </div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="font-display text-7xl font-semibold tracking-tight text-ink-mute">$12</span>
                <span className="text-ink-dim text-lg">/month</span>
              </div>
              <ul className="space-y-3 text-[14px] text-ink-mute mb-10">
                {["Unlimited briefings", "Custom topic creation", "Multiple daily digests", "Priority synthesis queue"].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 14 14" className="text-ink-dim" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 7 3 3 5-6" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled className="w-full px-5 py-3.5 border border-rule-strong text-[14px] font-semibold text-ink-dim cursor-not-allowed">
                Notify me
              </button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="border-b border-rule-bold relative overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-40" />
        <div className="relative max-w-[1280px] mx-auto px-6 py-28 md:py-36 text-center">
          <ScrollReveal>
            <div className="eyebrow justify-center mb-6">The wire</div>
            <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.03em] leading-[0.95] max-w-4xl mx-auto">
              Stop scrolling.<br />
              <span className="font-display-italic text-signal">Start reading the </span>
              <RotatingWord
                words={["signal.", "wire.", "pulse.", "brief."]}
                className="font-display-italic text-signal"
              />
            </h2>
            <p className="font-sans text-[16px] md:text-[18px] text-ink-2 max-w-xl mx-auto mt-8 mb-10 leading-relaxed">
              Free forever for 3 briefings a day. No credit card. Sign up in 10 seconds, read your first wire in 30.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <SignUpButton mode="modal">
                <MagneticButton className="inline-flex items-center gap-2 px-7 py-4 bg-ink text-paper text-[15px] font-semibold tracking-tight hover:bg-signal transition-colors duration-300">
                  Subscribe to The Signal
                  <ArrowRight />
                </MagneticButton>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 px-6 py-4 border border-rule-bold text-[15px] font-medium hover:bg-paper-card transition-colors">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════ FOOTER MASTHEAD ════════════ */}
      <footer className="bg-paper">
        <div className="max-w-[1280px] mx-auto px-6 py-14 grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-signal"><SignalGlyph size={26} /></span>
              <span className="font-display text-2xl font-semibold tracking-tight">The Signal</span>
            </div>
            <p className="font-display-italic text-[19px] text-ink-2 max-w-sm leading-snug">
              Real-time tech intelligence. Curated by AI, refined for humans who don&apos;t have time to read everything.
            </p>
          </div>
          <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-6 text-[13px]">
            <div>
              <p className="dateline mb-4">Product</p>
              <ul className="space-y-2.5 text-ink-2">
                <li><a href="#product" className="ink-link">How it works</a></li>
                <li><a href="#coverage" className="ink-link">Coverage</a></li>
                <li><a href="#pricing" className="ink-link">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="dateline mb-4">Account</p>
              <ul className="space-y-2.5 text-ink-2">
                <li><SignInButton mode="modal"><button className="ink-link">Sign in</button></SignInButton></li>
                <li><SignUpButton mode="modal"><button className="ink-link">Sign up</button></SignUpButton></li>
              </ul>
            </div>
            <div>
              <p className="dateline mb-4">Legal</p>
              <ul className="space-y-2.5 text-ink-2">
                <li><a href="#" className="ink-link">Privacy</a></li>
                <li><a href="#" className="ink-link">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-rule-bold">
          <div className="max-w-[1280px] mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-ink-mute uppercase tracking-[0.16em]">
            <span>© {TODAY.getFullYear()} The Signal · Editorial Wire Service</span>
            <span className="flex items-center gap-2"><span className="live-dot" /> All systems operational</span>
            <span>v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
