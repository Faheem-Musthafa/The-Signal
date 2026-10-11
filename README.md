# The Signal

The Signal is a daily tech-intelligence briefing. Signed-in users pick up to 8 topics. The app pulls live news with Firecrawl, has an LLM on OpenRouter pick the 5–7 most important stories, and saves the result as a shareable digest. Users can also get the briefing by email every day.

**Stack:** Next.js 16 (App Router, React 19), Convex, Clerk, Firecrawl, OpenRouter, Resend and Tailwind.

## How it works

- **Next.js API routes are thin proxies.** `src/app/api/**` authenticates with Clerk and calls Convex with a Clerk JWT from the `convex` template. Convex holds all business logic and every provider secret.
- **Generation runs in Convex.** `POST /api/digest` calls the action `generate.generateDigest`:
  1. It validates the topics against the allowlist.
  2. It checks the shared cache.
  3. On a cache miss, it consumes quota, runs Firecrawl search and then OpenRouter (`convex/lib/llm.ts`, with model fallbacks), and saves the digest.
  - Story links are kept only if the URL was in the scraped source material.
- **Shared 3-hour cache.** Requests with the same topic set within 3 hours reuse the existing digest. Each user gets their own copy, so it appears in their history and has its own share link. Cache hits don't use quota.
- **Quota.** Each account gets 3 generations per UTC day (`convex/rateLimits.ts`). A failed generation refunds its unit.
- **Retention.** Digests and share links (`/share/[id]`) expire after 30 days. Daily cron jobs in `convex/crons.ts` remove expired digests, old email-queue rows and old usage rows.
- **Newsletter.** An hourly cron (`internal.subscribers.sendDueDigests`) finds subscribers whose local delivery hour has arrived and sends their briefing with Resend.
  - A subscriber stays due for 3 hours after their delivery hour, with up to 3 attempts per day, so failed sends are retried.
  - The newsletter reuses cached digests where possible.
  - Emails include a signed one-click unsubscribe link, a link to the privacy page and the postal address.
- **Landing page.** A cron generates a `system:showcase` digest every 5 hours. It is the only digest the public landing stats show.
- **Account deletion.** Convex receives Clerk webhooks at `POST /clerk-webhook`, verified with svix.
  - `user.deleted` purges the account's subscriber, digest, usage and email-queue rows in batches.
  - `user.updated` keeps the newsletter email address in sync.
- **Error logging.** `src/instrumentation.ts` logs uncaught server errors as one JSON line each. Forward them from there to Sentry or another tracker.

### API routes

| Route | Purpose |
| --- | --- |
| `POST /api/digest` | Generate (or reuse a cached) briefing. Errors return `{ error, code }`. |
| `GET /api/digest/history` | The caller's digests from the last 30 days |
| `GET /api/usage` | `{ used, remaining, limit, resetsAt }` |
| `GET /api/share/[id]` | Public shared digest |
| `GET /api/stats` | Landing-page stats (showcase only) |
| `GET/POST/DELETE /api/subscribe` | Read, create/update or pause the newsletter subscription |
| `GET/POST /api/unsubscribe` | One-click unsubscribe (HMAC-signed link) |
| `GET /api/health/llm` | Signed-in check of provider env vars and model availability |

## Setup

1. Install dependencies (Node 20.9+; CI uses Node 22):

   ```bash
   npm install
   ```

2. Start Convex. This creates a dev deployment and writes `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` to `.env.local`:

   ```bash
   npm run convex:dev
   ```

3. Set up Clerk:
   - Copy the publishable and secret keys into `.env.local` (see `.env.example`).
   - Create a **JWT template named `convex`**. Its issuer URL becomes `CLERK_JWT_ISSUER_DOMAIN`.
   - Add a **webhook** that points at `<NEXT_PUBLIC_CONVEX_SITE_URL>/clerk-webhook` and subscribes to `user.deleted` and `user.updated`. Its signing secret becomes `CLERK_WEBHOOK_SECRET`.

4. Set `NEXT_PUBLIC_SITE_URL` in `.env.local`. It is the public origin of the app and is used for metadata, the sitemap and robots.txt.

5. Set the Convex environment variables. Provider keys live only in Convex and never in Next.js:

   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
   npx convex env set CLERK_WEBHOOK_SECRET whsec_...
   npx convex env set OPENROUTER_API_KEY sk-or-...
   npx convex env set FIRECRAWL_API_KEY fc-...
   # Newsletter
   npx convex env set RESEND_API_KEY re_...
   npx convex env set EMAIL_FROM "The Signal <digest@yourdomain.com>"
   npx convex env set UNSUB_SECRET "$(openssl rand -hex 32)"
   npx convex env set SITE_URL https://yourdomain.com
   npx convex env set EMAIL_POSTAL_ADDRESS "123 Example St, City, Country"
   ```

   Optional: `OPENROUTER_MODEL`, `OPENROUTER_MODEL_FALLBACKS` (comma-separated), `OPENROUTER_MAX_TOKENS` and `FIRECRAWL_COUNTRY` (default `US`). `.env.example` describes every variable.

   If `RESEND_API_KEY`, `EMAIL_FROM`, `UNSUB_SECRET` or `SITE_URL` is missing, the newsletter is skipped. If `EMAIL_POSTAL_ADDRESS` is unset, emails leave out the address line and a warning is logged; anti-spam laws such as CAN-SPAM require the address.

6. Run the app (with `convex:dev` still running in another terminal):

   ```bash
   npm run dev
   ```

For production, deploy Convex with `npm run convex:deploy`, set the same variables with `npx convex env set --prod ...`, and set the Next.js variables in Vercel.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run convex:dev` | Convex dev deployment, codegen and function push (watch mode) |
| `npm test` / `npm run test:watch` | Vitest: unit tests (`tests/unit`) and Convex function tests with `convex-test` (`tests/convex`) |
| `npm run lint` | ESLint (`eslint-config-next` core-web-vitals and TypeScript rules) |
| `npm run typecheck` | `next typegen` + `tsc` over `src/`, `convex/` and `tests/` |
| `npm run build` | Production build (needs Clerk and Convex env) |

`convex/_generated` is committed. After you add or rename Convex functions, run `npx convex codegen` or keep `convex:dev` running.

## CI

`.github/workflows/ci.yml` runs on pushes and PRs to `main`, using Node 22. It runs `npm ci`, lint, typecheck and tests. `next build` runs only when the repository has the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CONVEX_URL` secrets; otherwise it is skipped, for example on forks.

## License

See [LICENSE](LICENSE).
