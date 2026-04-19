# Product Requirements Document
## The Signal — Daily Tech Intelligence Digest

**Version:** 2.0  
**Date:** April 19, 2026  
**Author:** Faheem  
**Status:** Draft  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [Product Overview](#5-product-overview)
6. [Feature Requirements](#6-feature-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [API & Integration Specifications](#8-api--integration-specifications)
9. [Frontend Specifications](#9-frontend-specifications)
10. [Backend & Proxy Specifications](#10-backend--proxy-specifications)
11. [Convex Data Layer](#11-convex-data-layer)
12. [Data Flow](#12-data-flow)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Cost Model](#15-cost-model)
16. [Phased Roadmap](#16-phased-roadmap)
17. [Open Questions & Risks](#17-open-questions--risks)

---

## 1. Executive Summary

**The Signal** is a publicly accessible, browser-based daily tech news digest. Any user can visit the URL, select topics of interest, and receive a real-time AI-curated briefing of the most important tech stories happening today — summarized, ranked by signal strength, and delivered in a clean editorial interface.

It combines **Firecrawl** (live web search and scraping) with an **LLM via OpenRouter** (summarization, deduplication, and ranking) to turn raw web data into decision-ready intelligence. No login required for MVP. No manual curation. Just signal, no noise.

**v2.0 change:** Convex replaces the generic "KV store / DB" references across all phases. Convex serves as the real-time database, caching layer, and background job runner — replacing Upstash Redis for rate limiting in Phase 2+ and providing the persistence layer for shared digests, user preferences, and scheduled delivery.

---

## 2. Problem Statement

Tech professionals, founders, developers, and investors need to stay current with fast-moving news — AI releases, funding rounds, product launches, policy changes, layoffs. But:

- **RSS/news feeds are noisy** — raw volume with no ranking or synthesis
- **Newsletters are delayed** — most are published once daily at a fixed time, often missing breaking news
- **Search is manual** — requires knowing what to look for, then reading multiple articles
- **AI summaries lack freshness** — most LLM tools have a knowledge cutoff and cannot search live web

There is no zero-friction, publicly accessible tool that fetches *today's* real tech news, synthesizes it intelligently, and presents it in under 30 seconds.

---

## 3. Goals & Success Metrics

### Primary Goals

| Goal | Description |
|------|-------------|
| Zero-friction access | Anyone with the URL can get a digest — no login, no signup |
| Live freshness | Stories must be from the last 24–48 hours |
| High signal-to-noise | LLM should eliminate duplicates and rank by actual importance |
| Fast delivery | Digest loads within 15–30 seconds of clicking |
| Topic personalization | Users can filter by topic before fetching |

### Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Time to first digest | < 30 seconds |
| Digest freshness | ≥ 80% of stories from last 24 hours |
| Story deduplication accuracy | < 10% duplicate stories per digest |
| Page load time (initial) | < 2 seconds |
| Daily active digests generated | 50+ within first month |
| User return rate (week 1) | > 30% |

---

## 4. User Personas

### Persona 1 — The Indie Founder
- **Name:** Arjun, 28, Bengaluru
- **Context:** Building a SaaS product; needs to track AI tool releases, competitor funding, and developer ecosystem shifts
- **Pain:** Spends 30 min/day across Twitter, HN, and newsletters before getting to actual work
- **Need:** A 2-minute daily briefing that covers the stuff that could affect his product roadmap
- **Usage pattern:** Opens the app every morning, selects "AI & LLMs" + "Developer Tools" + "Startup Funding"

### Persona 2 — The Tech Investor
- **Name:** Priya, 35, Mumbai
- **Context:** Early-stage VC, watches deal flow, emerging tech, and macro tech trends
- **Pain:** Misses signals buried in noise; relies on analysts to surface news — slow and expensive
- **Need:** Fast, ranked news with a clear "why this matters" signal per story
- **Usage pattern:** Checks before meetings and calls; shares digest links with portfolio founders

### Persona 3 — The Developer
- **Name:** Marcus, 24, Berlin
- **Context:** Full-stack dev; cares about new tools, open source releases, hiring market, API changes
- **Pain:** HN frontpage is great but ephemeral; misses things that don't trend until day 2
- **Need:** Topic-filtered view that includes developer-relevant categories not covered by general tech news
- **Usage pattern:** Lunchtime check; skims 5 stories in 2 minutes

---

## 5. Product Overview

### What It Is

A single-page web application that:

1. Accepts topic selection from the user (checkboxes/pills)
2. Sends a prompt to an LLM with web search enabled
3. LLM searches the live web via Firecrawl for each selected topic
4. Results are synthesized: deduplicated, ranked, summarized
5. Rendered as a editorial-style digest with importance scores and key signals
6. Digest snapshots stored in Convex for sharing and history

### What It Is NOT

- Not a news aggregator with stored articles
- Not a subscription newsletter
- Not a social feed or discussion platform
- Not a tool that requires an account or personal data (MVP)

### Core User Journey

```
User visits URL
  → Selects topics (AI, Funding, Big Tech, etc.)
    → Clicks "Get Today's Digest"
      → Loading state (15–30s)
        → Stories render in ranked order
          → User reads, shares, or clicks refresh
```

---

## 6. Feature Requirements

### 6.1 Topic Selection (MVP)

**Available topics:**

| Topic | Search queries used |
|-------|---------------------|
| AI & LLMs | "AI model release today", "LLM announcement", "OpenAI Google AI news" |
| Startup Funding | "startup funding round today", "Series A B C announcement tech", "VC investment tech" |
| Big Tech | "Apple Google Microsoft Meta Amazon news today", "big tech earnings layoffs" |
| Developer Tools | "developer tool launch", "open source release", "API update developer news" |
| Crypto & Web3 | "crypto news today", "blockchain web3 funding", "DeFi protocol launch" |
| Policy & Regulation | "tech regulation news", "AI policy government", "antitrust tech" |
| Hardware & Chips | "semiconductor chip news", "NVIDIA AMD Apple Silicon", "hardware launch" |
| Layoffs & Hiring | "tech layoffs today", "hiring freeze tech", "tech jobs news" |

**Rules:**
- Minimum 1 topic must be selected to trigger fetch
- Maximum 8 topics selectable simultaneously
- Default state: "AI & LLMs", "Startup Funding", "Big Tech" pre-selected
- Topic state persists in `localStorage` between sessions (MVP); synced to Convex user record in Phase 3

### 6.2 Digest Fetch (MVP)

- Single "Get Today's Digest" / "Refresh Digest" button
- Button shows loading state with animated progress indicator
- Rotating status messages during loading: "Searching live web…", "Scraping articles…", "Ranking by signal…"
- On success: renders stories with staggered fade-in animation
- On error: shows error message with retry option

### 6.3 Story Card (MVP)

Each story displays:

| Field | Description |
|-------|-------------|
| Index number | 01–07, styled as large editorial numeral |
| Category tag | Color-coded pill (AI = amber, Funding = green, Policy = indigo, etc.) |
| Headline | Journalistic, max 12 words, Playfair Display serif font |
| Summary | 2–3 sentences: what happened + why it matters |
| Importance score | Visual bar, 1–5 dots (5 = world-changing) |
| Signal line | One sharp insight, "Why this matters:" style, ≤ 20 words |
| Source | Publication name |

### 6.4 Refresh & Caching (MVP)

- Results are not cached between visits (always fresh on page reload)
- Within a session, last fetch result persists until user clicks Refresh
- "Refresh Digest" regenerates a new fetch from scratch

### 6.5 Sharing (Phase 2)

- "Share Digest" button generates a static snapshot URL
- Snapshot stored in Convex `digests` table with a TTL field (24 hours)
- A Convex scheduled function (`internal/cleanup`) purges expired snapshots nightly
- Shared URL renders a read-only version of the digest at time of generation via `/share/[id]`

### 6.6 Email Delivery (Phase 2)

- Optional email input field: "Send to my inbox"
- User enters email → receives digest as HTML email within 5 minutes
- No account creation required (one-time delivery)
- Powered by Resend
- Email record stored temporarily in Convex `emailQueue` table and purged after send

### 6.7 Rate Limiting with Convex (Phase 2)

- IP-based rate limiting tracked in Convex `rateLimits` table
- Convex mutation increments request count per IP per rolling 1-hour window
- Convex scheduled function resets counters every hour
- Replaces Upstash Redis from MVP (simpler, single data layer)

### 6.8 Scheduled Auto-Digest (Phase 3)

- User can subscribe to a daily digest at a chosen time (e.g., 7:00 AM IST)
- Minimal signup: email + timezone + topic preferences stored in Convex `subscribers` table
- Delivery triggered by a Convex cron job (`crons.ts`) running at configured intervals
- Cron queries all subscribers due for delivery, calls OpenRouter, emails via Resend

---

## 7. Technical Architecture

### Stack Overview

```
┌────────────────────────────────────────────┐
│              Browser (Client)              │
│  Next.js 14 App Router + Tailwind CSS      │
│  Topic selection, fetch trigger, rendering │
│  Convex React client (real-time subscript) │
└──────────────┬─────────────────────────────┘
               │ POST /api/digest  (Next.js API route)
               │ Convex client queries (real-time)
               ▼
┌────────────────────────────────────────────┐
│         Next.js API Routes (Proxy)         │
│  Holds OpenRouter/Firecrawl API keys       │
│  Input validation, error handling          │
└──────┬─────────────────┬───────────────────┘
       │                 │
       ▼                 ▼
┌─────────────┐  ┌──────────────────────────┐
│  Firecrawl  │  │  OpenRouter API          │
│  /search    │  │  (model routing)         │
└─────────────┘  └──────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────┐
│              Convex Backend                │
│  convex/schema.ts  — table definitions     │
│  convex/digests.ts — mutations/queries     │
│  convex/rateLimits.ts — IP throttling      │
│  convex/subscribers.ts — email prefs       │
│  convex/crons.ts   — scheduled delivery   │
│  convex/internal/cleanup.ts — TTL purge   │
└────────────────────────────────────────────┘
```

### Tech Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 14 (App Router) | Easy API routes, Vercel deploy, SSR if needed |
| Styling | Tailwind CSS + custom CSS vars | Fast iteration, dark theme system |
| Backend | Next.js API routes | Colocated with frontend, one deployment |
| Database / BaaS | **Convex** | Real-time, serverless, TypeScript-native, replaces Redis + separate DB |
| LLM routing | OpenRouter | Multi-model support, cost optimization, one API key |
| Web search | Firecrawl `/search` | Live freshness |
| Email | Resend | Simple transactional API, works with Convex actions |
| Hosting | Vercel | Zero-config, global CDN |
| Analytics | PostHog | Product analytics, event tracking |

### Why Convex (not Redis + Postgres/Supabase)

| Concern | Convex advantage |
|---------|-----------------|
| Real-time shared digests | Built-in live queries — no websocket plumbing |
| Scheduled jobs (cron) | First-class `crons.ts` — no Vercel Cron + DB combo needed |
| Rate limiting | Simple mutation + query pattern in `rateLimits` table |
| Type safety | Schema defined in TypeScript, auto-generated validators |
| Single vendor | One dashboard, one SDK, replaces Redis + Supabase |
| Learning curve | Excellent docs; good fit for a build-to-learn project |

---

## 8. API & Integration Specifications

### 8.1 Firecrawl

**Endpoint used:** `POST https://api.firecrawl.dev/v2/search`

**Request:**
```json
{
  "query": "AI model release today",
  "limit": 5,
  "scrapeOptions": {
    "formats": ["markdown"],
    "onlyMainContent": true
  }
}
```

**Usage pattern:** One Firecrawl search call per active topic. Results are batched and passed to the LLM in a single prompt. With 3 topics × 5 results = 15 articles max per digest.

**Credit cost:** ~15 credits per digest. At Firecrawl Starter (3,000 credits/month), supports ~200 digests/month.

### 8.2 OpenRouter

**Model routing strategy:**

| Pass | Model | Purpose | Est. cost per digest |
|------|-------|---------|----------------------|
| Final digest generation | `google/gemini-2.5-flash` | Summarize, dedup, rank, write signal lines | ~$0.004-0.01 |
| Fallbacks | `google/gemini-2.0-flash-001`, `google/gemini-2.5-flash-lite` | Endpoint resiliency | usage-dependent |
| **Total** | | | **~$0.01-0.015 per digest** |

### 8.3 OpenRouter API (Current Path)

The app uses Firecrawl for live search, then sends compacted context to OpenRouter:

```json
{
  "model": "google/gemini-2.5-flash",
  "messages": [{ "role": "user", "content": "..." }],
  "temperature": 0.2,
  "max_tokens": 2000
}
```

See Appendix C for the full prompt template.

### 8.4 Convex Client Setup

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  digests: defineTable({
    shareId: v.string(),           // nanoid, used in /share/[id]
    topics: v.array(v.string()),
    stories: v.array(v.object({
      headline: v.string(),
      category: v.string(),
      summary: v.string(),
      importance: v.number(),
      signal: v.string(),
      source: v.string(),
    })),
    model: v.string(),
    generatedAt: v.number(),       // Unix ms timestamp
    expiresAt: v.number(),         // generatedAt + 86400000 (24h TTL)
  }).index("by_shareId", ["shareId"]),

  rateLimits: defineTable({
    ip: v.string(),
    count: v.number(),
    windowStart: v.number(),       // Unix ms, rolling 1-hour window
  }).index("by_ip", ["ip"]),

  subscribers: defineTable({
    email: v.string(),
    timezone: v.string(),
    topics: v.array(v.string()),
    deliveryHour: v.number(),      // 0–23 in subscriber's local time
    active: v.boolean(),
    lastDeliveredAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  emailQueue: defineTable({
    email: v.string(),
    digestId: v.id("digests"),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    createdAt: v.number(),
  }),
});
```

---

## 9. Frontend Specifications

### 9.1 Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Main digest page — topic selection + fetch + render |
| `/share/[id]` | Read-only shared digest snapshot (Phase 2) — queries Convex by `shareId` |
| `/api/digest` | Backend endpoint (POST) — proxies to LLM, writes result to Convex |
| `/api/share` | Triggers Convex mutation to store snapshot (Phase 2) |

### 9.2 Component Structure

```
<App>
  <Header>
    Masthead "THE SIGNAL" + dateline
  </Header>
  <Hero>
    Tagline + description
  </Hero>
  <Controls>
    <TopicPills> (toggle-able)
    <FetchButton>
  </Controls>
  <StatusBar>
    Dot indicator + status text
  </StatusBar>
  <DigestFeed>
    <LoadingState> (while fetching)
    <StoryCard> × N (on success)
    <ErrorState> (on failure)
    <EmptyState> (initial)
  </DigestFeed>
  <Footer>
</App>
```

### 9.3 Convex React Integration

```typescript
// app/providers.tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

// app/share/[id]/page.tsx — real-time shared digest
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SharedDigest({ params }: { params: { id: string } }) {
  const digest = useQuery(api.digests.getByShareId, { shareId: params.id });
  if (!digest) return <div>Digest not found or expired.</div>;
  return <DigestFeed stories={digest.stories} readOnly />;
}
```

### 9.4 Design Tokens

```css
--bg: #0a0a0a;
--surface: #111111;
--surface-2: #181818;
--border: #2a2a2a;
--text: #f0ede8;
--text-muted: #888888;
--accent: #ff6b35;        /* Primary CTA, AI tag */
--accent-warm: #ffd166;   /* Highlights */
--green: #4ade80;         /* Funding tag, live status */
--red: #f87171;           /* Error state */
--indigo: #a5b4fc;        /* Policy tag */
--pink: #fda4af;          /* Product tag */

--font-display: 'Playfair Display', serif;
--font-body: 'DM Sans', sans-serif;
--font-mono: 'DM Mono', monospace;
```

### 9.5 Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| < 640px (mobile) | Single column, topic pills wrap, hero title smaller |
| 640–1024px (tablet) | Same layout, slightly larger type |
| > 1024px (desktop) | Full layout as designed |

### 9.6 Loading States

- **Initial:** Empty state ("Your daily briefing is one click away")
- **Fetching:** Animated progress bar + rotating status messages (5 messages, 1.8s intervals)
- **Success:** Stories animate in with `fadeUp` at staggered 80ms delays
- **Error:** Red-bordered error box + retry button

---

## 10. Backend & Proxy Specifications

### 10.1 API Route: POST /api/digest

**Purpose:** Proxy client requests to LLM API, keeping API keys server-side. After success, writes digest to Convex.

**Request body:**
```json
{
  "topics": ["AI & LLMs", "Startup Funding", "Big Tech"]
}
```

**Validation:**
- Topics array must have 1–8 items
- Each topic must be from the allowed list
- Rate limit: checked against Convex `rateLimits` table (10 req/IP/hour) — Phase 2
- MVP fallback: simple in-memory counter or Upstash Redis if Convex rate limiting not yet wired

**Success response:**
```json
{
  "stories": [...],
  "generatedAt": "2026-04-19T07:00:00Z",
  "model": "google/gemini-2.5-flash",
  "shareId": "abc123"
}
```

**HTTP status codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid request (bad topics) |
| 429 | Rate limit exceeded |
| 500 | LLM or upstream error |
| 503 | Service temporarily unavailable |

### 10.2 Environment Variables

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_MODEL_FALLBACKS=google/gemini-2.0-flash-001,google/gemini-2.5-flash-lite
OPENROUTER_MAX_TOKENS=2000
FIRECRAWL_API_KEY=fc-...
FIRECRAWL_COUNTRY=US
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=prod:...
RESEND_API_KEY=re_...
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=3600
```

---

## 11. Convex Data Layer

### 11.1 Mutations

```typescript
// convex/digests.ts

// Store a new digest snapshot after LLM generation
export const saveDigest = mutation({
  args: {
    topics: v.array(v.string()),
    stories: v.array(storyValidator),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const shareId = nanoid(10);
    const now = Date.now();
    await ctx.db.insert("digests", {
      shareId,
      ...args,
      generatedAt: now,
      expiresAt: now + 86_400_000, // 24 hours
    });
    return shareId;
  },
});

// Fetch a shared digest by shareId
export const getByShareId = query({
  args: { shareId: v.string() },
  handler: async (ctx, { shareId }) => {
    const digest = await ctx.db
      .query("digests")
      .withIndex("by_shareId", (q) => q.eq("shareId", shareId))
      .unique();
    if (!digest || digest.expiresAt < Date.now()) return null;
    return digest;
  },
});
```

### 11.2 Rate Limiting

```typescript
// convex/rateLimits.ts

export const checkAndIncrement = mutation({
  args: { ip: v.string() },
  handler: async (ctx, { ip }) => {
    const WINDOW = 60 * 60 * 1000; // 1 hour in ms
    const MAX = 10;
    const now = Date.now();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_ip", (q) => q.eq("ip", ip))
      .unique();

    if (!existing || now - existing.windowStart > WINDOW) {
      if (existing) await ctx.db.delete(existing._id);
      await ctx.db.insert("rateLimits", { ip, count: 1, windowStart: now });
      return { allowed: true, remaining: MAX - 1 };
    }

    if (existing.count >= MAX) {
      return { allowed: false, remaining: 0, retryAfter: WINDOW - (now - existing.windowStart) };
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, remaining: MAX - existing.count - 1 };
  },
});
```

### 11.3 Scheduled Jobs (Crons)

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Purge expired digest snapshots daily at midnight UTC
crons.daily(
  "cleanup expired digests",
  { hourUTC: 0, minuteUTC: 0 },
  internal.cleanup.purgeExpiredDigests
);

// Send scheduled digest emails every hour, on the hour
crons.hourly(
  "send scheduled digests",
  { minuteUTC: 0 },
  internal.subscribers.sendDueDigests
);

export default crons;
```

### 11.4 Convex Actions (for LLM calls from Convex — Phase 3)

In Phase 3, the scheduled digest delivery calls OpenRouter from a Convex action (server-side, credentials from Convex environment variables):

```typescript
// convex/internal/subscribers.ts
export const sendDueDigests = internalAction({
  handler: async (ctx) => {
    const due = await ctx.runQuery(internal.subscribers.getDue);
    for (const subscriber of due) {
      const stories = await callOpenRouterDigest(subscriber.topics);
      const shareId = await ctx.runMutation(internal.digests.saveDigest, { ... });
      await sendEmail(subscriber.email, stories); // via Resend
      await ctx.runMutation(internal.subscribers.markDelivered, { id: subscriber._id });
    }
  },
});
```

---

## 12. Data Flow

### Step-by-step for a single digest fetch:

```
1. User selects topics → clicks "Get Today's Digest"

2. Browser → POST /api/digest
   { topics: ["AI & LLMs", "Startup Funding"] }

3. API route calls Convex checkAndIncrement(ip) mutation
   → If rate limited: return 429

4. API route builds prompt with today's date + topic list

5. API route → Firecrawl /search (per topic, parallel)
  + compacted markdown context → OpenRouter LLM

6. LLM searches web, reads articles, synthesizes response

7. LLM returns raw text containing JSON array of stories

8. API route parses JSON, validates against StorySchema (Zod)

9. API route → Convex saveDigest mutation
   → Returns shareId

10. API route → Browser
    { stories: [...], generatedAt: "...", model: "...", shareId: "abc123" }

11. Browser renders story cards with staggered animation
    → Share button uses shareId for /share/[shareId] link
```

### Error Handling at Each Step:

| Step | Failure | Handling |
|------|---------|----------|
| 3 | Rate limit hit | Return 429, show retry timer to user |
| 5 | API timeout | Retry once with 5s delay; else return 503 |
| 7 | LLM returns non-JSON | Regex extract JSON; if still fails, return 500 |
| 8 | Fewer than 3 stories parsed | Return what was parsed; don't error |
| 9 | Convex write fails | Log error; return digest without shareId (sharing unavailable) |
| 10 | Network failure | Client shows error state with retry button |

---

## 13. Non-Functional Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| API response time (p50) | < 20 seconds |
| API response time (p95) | < 35 seconds |
| Frontend initial load | < 2 seconds |
| Time to interactive | < 1 second |
| Convex query latency | < 100ms (p99) |

### Reliability

- API endpoint uptime target: 99%
- Retry logic for upstream API failures (1 retry, 5s delay)
- Graceful degradation: if an OpenRouter model endpoint is unavailable, rotate to configured fallback models
- Graceful degradation: if Convex write fails, return digest without share functionality

### Security

- API keys never exposed to browser
- All LLM calls made server-side
- Input sanitization on `topics` field (allowlist validation)
- No PII collected in MVP
- HTTPS enforced (Vercel default)
- CORS restricted to own origin
- Convex deploy key stored as Vercel environment secret (never in client bundle)

### Accessibility

- Semantic HTML throughout
- ARIA labels on interactive elements
- Keyboard navigable
- Minimum contrast ratio 4.5:1 (WCAG AA)
- Respects `prefers-reduced-motion` for animations

---

## 14. Deployment & Infrastructure

### MVP Deployment

```
GitHub repo
  └── main branch
        ├── Vercel (Next.js frontend + API routes)
        │     └── NEXT_PUBLIC_CONVEX_URL → Convex cloud
        └── Convex (database + crons + background actions)
              └── convex deploy --prod (on merge to main)
```

**Vercel configuration (`vercel.json`):**
```json
{
  "functions": {
    "app/api/digest/route.ts": {
      "maxDuration": 60
    }
  }
}
```

Note: Vercel Pro plan required for 60s function timeout.

### Convex Deployment

```bash
# Install
npm install convex

# Dev
npx convex dev   # starts local Convex dev server + watches schema

# Production
npx convex deploy --prod
```

Convex handles its own hosting — no separate database server to manage.

### Domain

- Development: `the-signal.vercel.app` + Convex dev cloud
- Production: `thesignal.dev` + Convex prod cloud

### Monitoring

- Vercel Analytics — page views, Core Web Vitals
- Convex Dashboard — function logs, DB usage, scheduled job history
- PostHog — product analytics, event tracking (digest generated, topic selected)
- Optional: Sentry for frontend error tracking (Phase 2)

---

## 15. Cost Model

### Per-Digest Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| OpenRouter LLM (Gemini class models) | ~1,500 input + 500 output tokens | ~$0.005-0.01 |
| Firecrawl (Phase 2+) | ~15 credits per digest | ~$0.005 |
| Convex | Free tier: 1M function calls/month, 1GB storage | $0 (MVP scale) |
| Vercel serverless | < 1M invocations/month free | $0 |
| Resend | Free tier: 100 emails/day | $0 (early) |
| PostHog | Free tier: 1M events/month | $0 |
| **Total per digest** | | **~$0.01–0.015** |

### Monthly Projections

| Daily digests | Monthly cost | Notes |
|---------------|-------------|-------|
| 50 | ~$22 | Early traction; Convex free tier |
| 200 | ~$90 | Growing; still within Convex free |
| 1,000 | ~$450 | Convex Pro ($25/mo) kicks in |
| 5,000 | ~$2,250 | Monetize at this scale |

### Monetization Path (Phase 3+)

- **Free tier:** 3 digests/day per user (IP-based, tracked in Convex)
- **Pro tier:** $9/month — unlimited digests, email delivery, topic memory, Slack integration
- **API tier:** $49/month — REST API access for embedding digest in external tools
- **Team tier:** $29/user/month — shared workspace, custom topic sets, digest history

---

## 16. Phased Roadmap

### Phase 1 — MVP (Weeks 1–3)

- [ ] Static frontend with topic selection UI (Next.js 14 + Tailwind)
- [ ] `/api/digest` backend proxy route
- [ ] Firecrawl + OpenRouter integration
- [ ] Story card rendering with importance scores
- [ ] Error and loading states
- [ ] Convex schema setup (`digests`, `rateLimits` tables)
- [ ] `saveDigest` mutation wired to API route
- [ ] Deploy Next.js to Vercel + Convex to production cloud
- [ ] Basic analytics (PostHog)

**Definition of Done:** Any user can visit the URL, select topics, and receive a real digest of today's tech news within 30 seconds. Digest is persisted in Convex on generation.

---

### Phase 2 — Distribution (Weeks 4–6)

- [ ] Firecrawl `/search` integration for higher-quality scraping
- [ ] OpenRouter multi-model routing
- [ ] Shareable digest links (`/share/[id]`) backed by Convex `digests` table
- [ ] Convex cron for nightly TTL cleanup (`internal/cleanup.ts`)
- [ ] Convex-based rate limiting (replaces in-memory or Upstash)
- [ ] Email delivery via Resend (one-time, no account); job tracked in Convex `emailQueue`
- [ ] Mobile-responsive polish pass
- [ ] OG meta tags for social sharing

---

### Phase 3 — Retention & Monetization (Weeks 7–12)

- [ ] User accounts (magic link auth via Clerk or Convex Auth)
- [ ] Topic preference persistence in Convex `subscribers` table
- [ ] Scheduled daily email digest via Convex cron + Resend
- [ ] Digest history (last 30 days per user, queried from Convex)
- [ ] Slack / Telegram integration (via Convex action calling webhook)
- [ ] Pro tier billing (Stripe)
- [ ] Custom topic input (user defines their own search queries)

---

### Phase 4 — Platform (Month 4+)

- [ ] REST API for developers
- [ ] Team workspaces with shared topic sets
- [ ] Digest embedding widget (iframe / JS snippet)
- [ ] Notion and Obsidian export integration
- [ ] Analytics dashboard (story category trends over time — Convex aggregations)
- [ ] White-label option for newsletters

---

## 17. Open Questions & Risks

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM response time > 30s | Medium | High | Show engaging loading states; 45s timeout with graceful error |
| Firecrawl credits exhausted | Low | Medium | Monitor usage; reduce per-digest result count and prioritize top categories |
| OpenRouter model endpoint unavailable | Medium | High | Use model fallback rotation and health endpoint checks |
| LLM returns fabricated stories | Medium | High | Prompt engineering + source attribution |
| Vercel 60s function timeout | Medium | Medium | Optimize prompt; use streaming response |
| Convex free tier limits hit | Low | Low | Generous free tier; Pro plan is $25/mo |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low return usage | Medium | High | Email scheduling via Convex cron creates habit loop |
| Cost exceeds revenue at scale | Medium | Medium | Rate limiting + monetization gates |
| News sources block Firecrawl | Low | Medium | Multiple fallback sources |
| Competing products ship faster | Medium | Low | Speed to market on MVP; community differentiation |

### Open Questions

1. **Auth approach:** Convex Auth (built-in) vs Clerk for Phase 3? Convex Auth is simpler for a Convex-native stack.
2. **Streaming vs batch response:** Should the API stream stories as they're found? Adds frontend complexity but better perceived performance.
3. **Content moderation:** Should politically sensitive stories be filtered or flagged?
4. **International coverage:** MVP is English-only. Convex schema is i18n-ready but LLM prompts need updating.
5. **OpenRouter model policy:** Which default and fallback model set should be used for production cost/performance targets?

---

## Appendix A — Allowed Topic List

```javascript
const ALLOWED_TOPICS = [
  "AI & LLMs",
  "Startup Funding",
  "Big Tech",
  "Developer Tools",
  "Crypto & Web3",
  "Policy & Regulation",
  "Hardware & Chips",
  "Layoffs & Hiring"
];
```

## Appendix B — Story Schema (Zod / TypeScript)

```typescript
import { z } from 'zod';

export const StorySchema = z.object({
  headline: z.string().min(5).max(120),
  category: z.enum([
    "AI & LLMs", "Startup Funding", "Big Tech",
    "Developer Tools", "Crypto & Web3",
    "Policy & Regulation", "Hardware & Chips", "Layoffs & Hiring"
  ]),
  summary: z.string().min(50).max(500),
  importance: z.number().int().min(1).max(5),
  signal: z.string().max(200),
  source: z.string().max(100),
});

export const DigestResponseSchema = z.object({
  stories: z.array(StorySchema).min(1).max(10),
  generatedAt: z.string().datetime(),
  model: z.string(),
  shareId: z.string().optional(),
});

export type Story = z.infer<typeof StorySchema>;
export type DigestResponse = z.infer<typeof DigestResponseSchema>;
```

## Appendix C — Prompt Template

```
You are a sharp tech news analyst. Today is {{DATE}}.

Search the web and find the 5–7 most important tech news stories published in the last 24 hours 
on the following topics: {{TOPICS}}.

For each story, return a JSON object with these exact fields:
- headline: string — journalistic, punchy, max 12 words
- category: string — must be one of: {{TOPICS}}
- summary: string — 2–3 sentences: what happened AND why it matters
- importance: integer 1–5 — (5 = affects millions/changes industry, 1 = minor)
- signal: string — ONE key insight starting with a verb, max 20 words
- source: string — publication or website name

Rules:
- Only include stories from the last 24–48 hours. No older news.
- Deduplicate: if two sources cover the same story, pick the most authoritative.
- Rank by importance (highest first).
- Do NOT fabricate. Only include real, verifiable stories found via web search.

Return ONLY a valid JSON array. No markdown fences, no preamble, no explanation.
Example: [{"headline":"...","category":"...","summary":"...","importance":4,"signal":"...","source":"..."}]
```

## Appendix D — Convex File Structure

```
convex/
├── schema.ts                  # All table definitions
├── digests.ts                 # saveDigest mutation, getByShareId query
├── rateLimits.ts              # checkAndIncrement mutation
├── subscribers.ts             # CRUD for email subscribers
├── emailQueue.ts              # Queue management
├── crons.ts                   # Scheduled job definitions
└── internal/
    ├── cleanup.ts             # Purge expired digests
    └── subscribers.ts        # sendDueDigests action (calls OpenRouter + Resend)
```

---

*Document version 2.0 — The Signal PRD — April 2026*  
*Key change from v1.0: Convex replaces Upstash Redis + generic DB across all phases.*