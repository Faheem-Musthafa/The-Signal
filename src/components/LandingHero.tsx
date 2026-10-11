import Link from "next/link";
import type { Route } from "next";
import { SourceLink } from "@/components/SourceLink";
import {
  Logo,
  SignalBars,
  SignalGlyph,
  TopicChip,
  TopicGlyph,
  buttonClasses,
  IconArrowRight,
  IconMail,
} from "@/components/ui";
import { TOPIC_STYLES, topicStyle } from "@/lib/topicStyle";
import type { Story } from "@/types/digest";
import { getLandingData, timeAgo, type LandingPreview } from "./landing/landingData";
import { PlayPreviewButton } from "./landing/PlayPreviewButton";
import { StickyCta } from "./landing/StickyCta";
import { TryIt } from "./landing/TryIt";
import { AuthModalButton } from "./landing/AuthModalButton";

/* ──────────────────────────────────────────────────────────────
   THE SIGNAL — signed-out home (server component).
   Short and fast: value prop + today's real briefing, try-before-
   sign-up, how it works, honest proof, daily email, FAQ, final CTA.
   ────────────────────────────────────────────────────────────── */

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";
const PRIMARY_CTA = "Get my briefing — free";

function SignUpCta({
  id,
  variant = "primary",
  className = "",
  children = PRIMARY_CTA,
}: {
  id?: string;
  variant?: "primary" | "inverse";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <AuthModalButton kind="sign-up" id={id} className={buttonClasses({ variant, size: "lg", className })}>
      {children}
      <IconArrowRight />
    </AuthModalButton>
  );
}

/* ───────────── hero: today's briefing (server-rendered) ───────────── */

function LeadCard({ story, index, count }: { story: Story; index: number; count: number }) {
  const t = topicStyle(story.category);
  return (
    <article
      aria-labelledby={`today-${index}`}
      className="grain relative overflow-hidden rounded-[18px] p-5 text-white sm:p-6"
      style={{ background: `radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.16), transparent 60%), ${t.color}` }}
    >
      <div className="relative flex items-center gap-2.5">
        <TopicChip topic={story.category} variant="onColor" />
        <span className="font-mono text-[12px] tabular-nums text-white/75">
          Story {index + 1} of {count}
        </span>
        <span className="ml-auto">
          <SignalBars value={story.importance} size="sm" color="#ffffff" trackColor="rgba(255,255,255,0.3)" />
        </span>
      </div>
      <h3
        id={`today-${index}`}
        className="font-display stretch-wide relative mt-4 text-[23px] font-extrabold leading-[1.06] tracking-[-0.015em] text-white sm:text-[27px]"
        style={{ textWrap: "balance" }}
      >
        {story.headline}
      </h3>
      {story.signal && <p className="relative mt-3 text-[16px] font-medium leading-snug text-white/90">{story.signal}</p>}
      <div className="relative mt-4">
        <SourceLink source={story.source} url={story.url} variant="onColor" className="max-w-full" />
      </div>
    </article>
  );
}

function StoryRow({ story, index, count }: { story: Story; index: number; count: number }) {
  const t = topicStyle(story.category);
  return (
    <article aria-labelledby={`today-${index}`} className="flex gap-3.5 rounded-[14px] bg-paper p-4 ring-1 ring-rule">
      <span aria-hidden="true" className="w-1.5 shrink-0 rounded-full" style={{ background: t.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TopicChip topic={story.category} variant="soft" short />
          <span className="font-mono text-[12px] tabular-nums text-ink-mute">
            Story {index + 1} of {count}
          </span>
          <span className="ml-auto">
            <SignalBars value={story.importance} size="xs" color={t.color} />
          </span>
        </div>
        <h3 id={`today-${index}`} className="mt-2 text-[16.5px] font-semibold leading-snug text-ink" style={{ textWrap: "balance" }}>
          {story.headline}
        </h3>
        {story.signal && <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-ink-2">{story.signal}</p>}
        <div className="mt-2.5">
          <SourceLink source={story.source} url={story.url} className="max-w-full" />
        </div>
      </div>
    </article>
  );
}

function TodayPanel({ preview, now }: { preview: LandingPreview | null; now: number }) {
  const stories = preview?.stories ?? [];
  const shown = stories.slice(0, 3);

  return (
    <section
      aria-labelledby="today-title"
      className="relative w-full rounded-story bg-surface p-3 shadow-lift ring-1 ring-rule sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-2 pb-3 pt-1">
        <h2 id="today-title" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          {shown.length > 0 && <span className="live-dot" aria-hidden="true" />}
          Today&rsquo;s top stories
        </h2>
        {preview?.generatedAt && (
          <p className="dateline">
            Updated <time dateTime={new Date(preview.generatedAt).toISOString()}>{timeAgo(preview.generatedAt, now)}</time>
          </p>
        )}
      </div>

      {shown.length > 0 ? (
        <ol className="space-y-2.5">
          {shown.map((story, i) => (
            <li key={`${story.headline}-${i}`}>
              {i === 0 ? (
                <LeadCard story={story} index={i} count={stories.length} />
              ) : (
                <StoryRow story={story} index={i} count={stories.length} />
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[18px] bg-surface-2 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-signal text-white" aria-hidden="true">
            <SignalGlyph size={22} />
          </span>
          <p className="max-w-[28ch] text-[16px] font-semibold text-ink">Today&rsquo;s briefing is on its way.</p>
          <p className="max-w-[34ch] text-[14.5px] leading-relaxed text-ink-2">
            Pick your topics below to see a recent one, or sign up to get a fresh briefing now.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 px-1 pb-1 pt-3 sm:flex-row sm:items-center">
        <PlayPreviewButton stories={stories} generatedAt={preview?.generatedAt ?? null} className="w-full sm:w-auto" />
        <a href="#try" className={buttonClasses({ variant: "ghost", className: "w-full sm:w-auto" })}>
          Pick my topics
          <IconArrowRight className="rotate-90" />
        </a>
      </div>
      <p className="px-2 pb-1 pt-2 text-[12.5px] leading-snug text-ink-mute">
        AI-written summaries. Each story links to its source.
      </p>
    </section>
  );
}

/* ───────────── how it works ───────────── */

const STEPS = [
  {
    title: "Pick your topics",
    body: "Choose from eight topics, like AI, startup funding or chips. Pick one or all of them.",
  },
  {
    title: "Get your briefing",
    body: "We search live news sources, pick the top stories and write a short summary of each. It usually takes 20–45 seconds.",
  },
  {
    title: "Read it in two minutes",
    body: "Scroll the list or press Play briefing. Save the stories you like and share the briefing with a link.",
  },
] as const;

function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 border-y border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <p className="eyebrow">How it works</p>
        <h2 id="how-title" className="display-lg mt-3 max-w-2xl">
          Three steps. No noise.
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col rounded-card bg-paper p-5 ring-1 ring-rule sm:p-6">
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-signal font-mono text-[15px] font-semibold tabular-nums text-white">
                  {i + 1}
                </span>
                <span aria-hidden="true" className="flex flex-1 gap-1">
                  {STEPS.map((_, j) => (
                    <span key={j} className={`h-[4px] flex-1 rounded-full ${j <= i ? "bg-signal" : "bg-surface-3"}`} />
                  ))}
                </span>
              </span>
              <h3 className="display-sm mt-5">{step.title}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── honest proof ───────────── */

function Proof({ briefingsLast24h }: { briefingsLast24h: number | null }) {
  const facts = [
    { k: "1–5", label: "Ranked", body: "Every story gets an importance score, so the biggest news comes first." },
    { k: "100%", label: "Sourced", body: "Every story links to the original article, so you can check it yourself." },
    { k: "30", label: "Days", body: "Share links keep working for 30 days after a briefing is made." },
  ];
  return (
    <section aria-labelledby="proof-title">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-20">
        <div>
          <p className="eyebrow">Live right now</p>
          <h2 id="proof-title" className="sr-only">
            The Signal in numbers
          </h2>
          {briefingsLast24h && briefingsLast24h > 0 ? (
            <>
              <p className="font-display stretch-wider mt-3 text-[64px] font-extrabold leading-none tracking-[-0.04em] text-ink tabular-nums sm:text-[88px]">
                {briefingsLast24h.toLocaleString("en-US")}
              </p>
              <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-ink-2">
                {briefingsLast24h === 1 ? "briefing" : "briefings"} made in the last 24 hours.
              </p>
            </>
          ) : (
            <p className="display-md mt-3 max-w-sm">Fresh briefings, made when you ask.</p>
          )}
          <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-ink-mute">
            Summaries are written by AI from public news sources. AI can make mistakes, so check the source before you
            rely on a story.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
          {facts.map((f) => (
            <li key={f.label} className="rounded-card bg-surface p-5 shadow-soft ring-1 ring-rule">
              <p className="flex items-baseline gap-2">
                <span className="font-display stretch-wide text-[34px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {f.k}
                </span>
                <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-signal">{f.label}</span>
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────── daily email ───────────── */

function EmailMock() {
  const rows = [TOPIC_STYLES[0], TOPIC_STYLES[3], TOPIC_STYLES[6]];
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-sm rotate-[1.5deg] rounded-card bg-surface p-5 shadow-lift ring-1 ring-rule motion-reduce:rotate-0">
      <div className="flex items-center gap-3 border-b border-rule pb-4">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-signal text-white">
          <SignalGlyph size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-ink">The Signal</span>
          <span className="block truncate text-[12.5px] text-ink-mute">Your daily briefing</span>
        </span>
        <span className="dateline">7:00</span>
      </div>
      <ul className="mt-3 space-y-3">
        {rows.map((t, i) => (
          <li key={t.key} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] text-white" style={{ background: t.color }}>
              <TopicGlyph topic={t.topic} size={14} strokeWidth={2.1} />
            </span>
            <span className="min-w-0 flex-1 space-y-1.5 pt-1">
              <span className="block h-2 rounded-full bg-ink/80" style={{ width: `${88 - i * 14}%` }} />
              <span className="block h-2 w-full rounded-full bg-surface-3" />
              <span className="block h-2 w-2/3 rounded-full bg-surface-3" />
            </span>
            <SignalBars value={5 - i} size="xs" color={t.color} decorative />
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-rule pt-3 text-[12px] text-ink-dim">Change topics · Unsubscribe</div>
    </div>
  );
}

function DailyEmail() {
  return (
    <section id="daily-email" aria-labelledby="email-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid items-center gap-10 overflow-hidden rounded-[22px] bg-signal-soft p-6 sm:p-10 md:grid-cols-[1.1fr_0.9fr] md:p-14">
          <div>
            <p className="eyebrow">Daily email</p>
            <h2 id="email-title" className="display-lg mt-3">
              Or get it in your inbox every morning.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-2">
              Pick your topics and a time. We send your briefing once a day, in your time zone. It doesn&rsquo;t use
              your 3 free briefings, and you can unsubscribe with one click.
            </p>
            <div className="mt-7">
              <AuthModalButton kind="sign-up" className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}>
                <IconMail />
                Get the daily email
              </AuthModalButton>
            </div>
          </div>
          <EmailMock />
        </div>
      </div>
    </section>
  );
}

/* ───────────── FAQ ───────────── */

const FAQ: ReadonlyArray<{ q: string; a: React.ReactNode }> = [
  {
    q: "Is it free?",
    a: "Yes. You get 3 fresh briefings a day for free, and the count resets at midnight UTC. If someone already made a briefing for the same topics in the last few hours, you get it instantly and it doesn't count. The daily email is free too.",
  },
  {
    q: "Who writes the summaries?",
    a: "AI does. We search live news sources for your topics, and an AI model picks the top stories and writes a short summary of each. AI can get things wrong, so every story links to its original source.",
  },
  {
    q: "Do I need an account?",
    a: "Not to look around. You can read a recent briefing for any topics above. To get a fresh briefing, save stories or get the daily email, you need a free account.",
  },
  {
    q: "Can I share a briefing?",
    a: "Yes. Every briefing has its own link. Anyone with the link can read it for 30 days after it was made. It never shows your name or email.",
  },
  {
    q: "How do I delete my account?",
    a: (
      <>
        Go to Settings, open your account profile and choose <strong>Delete account</strong>. This removes your
        briefings, usage and daily email. See our{" "}
        <Link href={"/privacy" as Route} className="ink-link font-semibold">
          Privacy Policy
        </Link>{" "}
        for details.
      </>
    ),
  },
];

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t border-rule bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:py-20">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 id="faq-title" className="display-lg mt-3">
            Good to know.
          </h2>
        </div>
        <div className="divide-y divide-rule border-y border-rule">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary
                className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden ${FOCUS}`}
              >
                {item.q}
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="pb-5 pr-10 text-[15.5px] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── page ───────────── */

export async function LandingHero() {
  const { preview, briefingsLast24h } = await getLandingData();
  // Rendered per request on the server, so "updated 2 hours ago" is computed once, here.
  // eslint-disable-next-line react-hooks/purity -- server component: one render per request
  const now = Date.now();
  const year = new Date(now).getFullYear();

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-paper pb-24 text-ink md:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="pt-safe sticky top-0 z-40 border-b border-rule/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo size="sm" href="/" />
          <nav aria-label="Main" className="hidden items-center gap-7 text-[14.5px] font-medium text-ink-2 md:flex">
            <a href="#try" className={`ink-link rounded-sm py-2 ${FOCUS}`}>
              Try it
            </a>
            <a href="#how-it-works" className={`ink-link rounded-sm py-2 ${FOCUS}`}>
              How it works
            </a>
            <a href="#daily-email" className={`ink-link rounded-sm py-2 ${FOCUS}`}>
              Daily email
            </a>
            <a href="#faq" className={`ink-link rounded-sm py-2 ${FOCUS}`}>
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AuthModalButton kind="sign-in" className={buttonClasses({ variant: "ghost", className: "px-4" })}>
              Sign in
            </AuthModalButton>
            <AuthModalButton kind="sign-up" className={buttonClasses({ className: "hidden px-4 md:inline-flex" })}>
              {PRIMARY_CTA}
            </AuthModalButton>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Hero: value prop left, today's real briefing right ── */}
        <section aria-labelledby="hero-title" className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] bg-[radial-gradient(60%_60%_at_80%_10%,rgb(var(--signal-rgb)/0.10),transparent_70%)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-12 lg:pb-20 lg:pt-16">
            <div className="animate-fade-in-up lg:sticky lg:top-28">
              <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 shadow-soft ring-1 ring-rule">
                <SignalGlyph size={16} className="text-signal" />
                Free tech news briefings
              </p>

              <h1 id="hero-title" className="display-xl mt-6 max-w-[14ch]">
                Tech news that matters, in <span className="signal-mark">two minutes.</span>
              </h1>

              <p className="mt-6 max-w-xl text-[17px] leading-[1.6] text-ink-2 md:text-[18.5px]">
                Pick the topics you care about. We check the latest news and give you the top stories, short and
                ranked, with a link to every source.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <SignUpCta id="hero-cta" className="w-full sm:w-auto" />
                <AuthModalButton kind="sign-in" className={buttonClasses({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
                  Sign in
                </AuthModalButton>
              </div>
              <p className="mt-4 text-[14px] text-ink-mute">3 free briefings a day · No card needed</p>

              <ul aria-label="Topics you can pick" className="mt-8 hidden flex-wrap gap-1.5 sm:flex">
                {TOPIC_STYLES.map((t) => (
                  <li key={t.key}>
                    <TopicChip topic={t.topic} variant="soft" />
                  </li>
                ))}
              </ul>
            </div>

            <TodayPanel preview={preview} now={now} />
          </div>
        </section>

        <TryIt />
        <HowItWorks />
        <Proof briefingsLast24h={briefingsLast24h} />
        <DailyEmail />
        <Faq />

        {/* ── Final CTA ── */}
        <section aria-labelledby="cta-title" className="px-4 py-14 sm:px-6 md:py-20">
          <div className="grain relative mx-auto max-w-6xl overflow-hidden rounded-[22px] bg-signal px-6 py-14 text-center text-white sm:px-10 md:py-20">
            <svg
              aria-hidden="true"
              viewBox="0 0 600 80"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-30"
              fill="none"
            >
              <path
                d="M0 40h60c20 0 20-24 40-24s20 48 40 48 20-24 40-24h60c20 0 20-18 40-18s20 36 40 36 20-18 40-18h60c20 0 20-28 40-28s20 56 40 56 20-28 40-28h60"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </svg>
            <div className="relative">
              <h2 id="cta-title" className="display-lg mx-auto max-w-2xl text-white">
                Your first briefing is one tap away.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-white/85">
                Sign up in seconds. Pick your topics. Get today&rsquo;s top stories.
              </p>
              <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                <SignUpCta id="final-cta" variant="inverse" className="w-full sm:w-auto" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Logo size="sm" />
            <p className="text-[14px] text-ink-mute">Short tech news briefings. Summaries are written by AI.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[14.5px] text-ink-2">
            <Link href={"/privacy" as Route} className={`ink-link inline-flex min-h-11 items-center rounded-sm ${FOCUS}`}>
              Privacy
            </Link>
            <Link href={"/terms" as Route} className={`ink-link inline-flex min-h-11 items-center rounded-sm ${FOCUS}`}>
              Terms
            </Link>
            <AuthModalButton kind="sign-in" className={`ink-link inline-flex min-h-11 items-center rounded-sm ${FOCUS}`}>
              Sign in
            </AuthModalButton>
          </nav>
        </div>
        <div className="border-t border-rule">
          <div className="dateline mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <span>© {year} The Signal</span>
          </div>
        </div>
      </footer>

      <StickyCta />
    </div>
  );
}
