# The Signal

**The Signal** is an AI-powered executive briefing generator. It lets users select topics, then synthesizes real-time intelligence into concise, shareable digests using LLMs and live web crawling. Built with Next.js, Convex, Clerk, and Firecrawl, it features robust caching, per-user quotas, and a modern, minimal UI.

## Features

- 🔒 Clerk authentication and per-user daily quota (3 digests/day)
- ⚡️ Real-time topic-based digest generation (Firecrawl + OpenRouter LLM)
- 🗂️ Convex-powered persistence, caching, and history
- 🔁 3-hour cache reuse to save tokens/credits
- 📋 “Previously Crawled Today” history with deduplication
- 🚦 Rate limiting (per-account and IP)
- 🔗 Shareable digests with unique links
- 🛡️ Production-ready: typechecked, linted, and hardened for deployment

## Quickstart

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in Clerk, OpenRouter, and Firecrawl keys.
3. **Start Convex backend:**
   ```bash
   npx convex dev
   ```
4. **Run the app:**
   ```bash
   npm run dev
   ```

## Tech Stack
- Next.js 16 (App Router, TypeScript, TailwindCSS)
- Convex (database, rate limits, digests, history)
- Clerk (auth)
- Firecrawl (web crawling)
- OpenRouter (LLM API)

## Project Structure
- `src/app/` — Next.js routes and API handlers
- `src/components/` — UI components
- `src/lib/` — LLM, prompt, and utility logic
- `convex/` — Convex schema, queries, mutations, and crons

## License
MIT
