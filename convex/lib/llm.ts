// Convex-side port of src/lib/llm.ts. Pure fetch logic so it can run
// inside Convex actions, which cannot import from src/.

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/search";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MAX_CONTEXT_CHARS = 30000;
const MAX_SNIPPET_CHARS = 1200;
const FIRECRAWL_TIME_FILTER = "sbd:1,qdr:d";
const DEFAULT_OPENROUTER_MODEL_CANDIDATES = [
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
  "google/gemini-2.5-flash-lite",
];

const TOPIC_QUERY_MAP: Record<string, string[]> = {
  "AI & LLMs": [
    "AI model release today",
    "LLM announcement",
    "OpenAI Google AI news",
  ],
  "Startup Funding": [
    "startup funding round today",
    "Series A B C announcement tech",
    "VC investment tech",
  ],
  "Big Tech": [
    "Apple Google Microsoft Meta Amazon news today",
    "big tech earnings layoffs",
  ],
  "Developer Tools": [
    "developer tool launch",
    "open source release",
    "API update developer news",
  ],
  "Crypto & Web3": [
    "crypto news today",
    "blockchain web3 funding",
    "DeFi protocol launch",
  ],
  "Policy & Regulation": [
    "tech regulation news",
    "AI policy government",
    "antitrust tech",
  ],
  "Hardware & Chips": [
    "semiconductor chip news",
    "NVIDIA AMD Apple Silicon",
    "hardware launch",
  ],
  "Layoffs & Hiring": [
    "tech layoffs today",
    "hiring freeze tech",
    "tech jobs news",
  ],
};

export const SUPPORTED_TOPICS = Object.keys(TOPIC_QUERY_MAP);

export type GeneratedStory = {
  headline: string;
  category: string;
  summary: string;
  importance: number;
  signal: string;
  source: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function parseCsvEnv(value: string | undefined) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getModelCandidates(): string[] {
  const primary = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
  const configured = parseCsvEnv(process.env.OPENROUTER_MODEL_FALLBACKS);
  return [...new Set([primary, ...configured, ...DEFAULT_OPENROUTER_MODEL_CANDIDATES])];
}

function resolveMaxTokens(): number {
  const raw = process.env.OPENROUTER_MAX_TOKENS;
  const parsed = raw ? Number(raw) : 2000;
  if (!Number.isFinite(parsed) || parsed <= 0) return 2000;
  return Math.min(Math.floor(parsed), 4000);
}

function truncateText(value: unknown, maxChars: number): string {
  if (typeof value !== "string") return "";
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...`;
}

function buildCompactContext(searchResults: unknown[]): string {
  const compact = searchResults.flatMap((result) => {
    const data = result as {
      data?: {
        web?: Array<{ url?: string; title?: string; description?: string; markdown?: string }>;
        news?: Array<{ url?: string; title?: string; snippet?: string; date?: string; markdown?: string }>;
      };
    };

    const news = Array.isArray(data?.data?.news) ? data.data.news : [];
    const web = Array.isArray(data?.data?.web) ? data.data.web : [];
    const prioritized = [
      ...news.map((i) => ({ url: i.url ?? "", title: i.title ?? "", description: i.snippet ?? "", markdown: i.markdown ?? "", date: i.date ?? "" })),
      ...web.map((i) => ({ url: i.url ?? "", title: i.title ?? "", description: i.description ?? "", markdown: i.markdown ?? "", date: "" })),
    ];

    return prioritized.slice(0, 4).map((item) => ({
      url: item.url,
      title: truncateText(item.title, 160),
      description: truncateText(item.description, 240),
      publishedAt: item.date,
      snippet: truncateText(item.markdown, MAX_SNIPPET_CHARS),
    }));
  });

  return truncateText(JSON.stringify(compact), MAX_CONTEXT_CHARS);
}

async function runFirecrawlSearch(query: string, apiKey: string) {
  const response = await fetch(FIRECRAWL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      query,
      limit: 3,
      sources: ["news", "web"],
      tbs: FIRECRAWL_TIME_FILTER,
      country: process.env.FIRECRAWL_COUNTRY ?? "US",
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true, maxAge: 0, storeInCache: false },
    }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl request failed (status ${response.status})`);
  }

  return response.json();
}

type OpenRouterResult = { ok: boolean; status: number; body?: string; content?: string };

async function runOpenRouterCompletion(model: string, prompt: string, maxTokens: number, apiKey: string): Promise<OpenRouterResult> {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, body: await response.text() };
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return { ok: true, status: response.status, content: data.choices?.[0]?.message?.content ?? "" };
}

function shouldTryNextModel(status: number, body: string | undefined): boolean {
  // Retryable per-model failures: missing model, provider down, rate limited.
  if ([404, 429, 500, 502, 503].includes(status)) return true;
  return /No endpoints found|provider unavailable|model.*not found/i.test(body ?? "");
}

// Keep in sync with src/lib/prompt.ts (Convex actions cannot import from src/).
function buildDigestPrompt(date: string, topics: string[], context: string): string {
  const topicList = topics.join(", ");
  return `You are the senior editor of "The Signal", a daily tech intelligence briefing read by founders, engineers, and investors. The current UTC timestamp is ${date}.

You are given SOURCE MATERIAL at the end of this message: a JSON array of scraped news search results (title, description, url, publishedAt, snippet). Work strictly from that material.

TASK: select the 5-7 most important stories covering these topics: ${topicList}.

Selection rules:
- Use only stories supported by the source material. NEVER invent stories, numbers, or names. If the material supports fewer than 5 solid stories, return fewer — quality over count.
- Skip stories older than ~48 hours relative to the timestamp above (use publishedAt when present).
- Deduplicate aggressively: multiple items covering the same event become ONE story; credit the most authoritative source.
- Prefer primary events (launches, funding rounds, layoffs, regulation, breaches, earnings) over commentary, listicles, or roundups.

For each story return a JSON object with EXACTLY these fields:
- headline: punchy newsroom headline, max 12 words, no clickbait
- category: exactly one of: ${topicList}
- summary: 2-3 sentences — first what happened with concrete numbers and names from the material, then why it matters
- importance: integer 1-5 — 5 = industry-changing or affects millions; 4 = major move by a major player; 3 = notable but niche; 2 = incremental update; 1 = minor
- signal: the ONE non-obvious takeaway an operator should act on, starting with a verb, max 20 words. Good: "Expect agent-tooling prices to drop as Google undercuts OpenAI." Bad: "This is big news for AI."
- source: publication name (e.g. "TechCrunch"), never a URL

Output ONLY a valid JSON array sorted by importance descending. No markdown fences, no preamble, no trailing text.
Example shape: [{"headline":"...","category":"...","summary":"...","importance":4,"signal":"...","source":"..."}]

SOURCE MATERIAL:
${context}`;
}

function extractJsonArray(text: string): string | null {
  const match = text.match(/\[[\s\S]*\]/);
  return match ? match[0] : null;
}

function parseStories(rawText: string): GeneratedStory[] {
  const jsonArray = extractJsonArray(rawText);
  if (!jsonArray) throw new Error("Model response did not contain a JSON array");

  const parsed = JSON.parse(jsonArray);
  if (!Array.isArray(parsed)) throw new Error("Model response array is invalid");

  return parsed
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .filter(
      (item) =>
        typeof item.headline === "string" &&
        typeof item.category === "string" &&
        typeof item.summary === "string" &&
        typeof item.importance === "number" &&
        typeof item.signal === "string" &&
        typeof item.source === "string",
    )
    .map((item) => ({
      headline: String(item.headline).slice(0, 120),
      category: String(item.category),
      summary: String(item.summary).slice(0, 500),
      importance: Math.max(1, Math.min(5, Math.round(Number(item.importance)))),
      signal: String(item.signal).slice(0, 200),
      source: String(item.source).slice(0, 100),
    }));
}

async function runFirecrawlSearches(queries: string[], apiKey: string): Promise<unknown[]> {
  // One failed query must not kill the whole briefing — use what succeeded.
  const settled = await Promise.allSettled(queries.map((q) => runFirecrawlSearch(q, apiKey)));

  const succeeded = settled
    .filter((r): r is PromiseFulfilledResult<unknown> => r.status === "fulfilled")
    .map((r) => r.value);

  const failed = settled.length - succeeded.length;
  if (failed > 0) {
    console.warn(`[newsletter.llm] firecrawlPartialFailure failed=${failed}/${settled.length}`);
  }

  if (succeeded.length === 0) {
    const first = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
    throw first?.reason instanceof Error ? first.reason : new Error("All Firecrawl searches failed");
  }

  return succeeded;
}

export async function generateDigestStories(topics: string[]): Promise<{ stories: GeneratedStory[]; model: string }> {
  const firecrawlKey = requireEnv("FIRECRAWL_API_KEY");
  const openRouterKey = requireEnv("OPENROUTER_API_KEY");

  const queries = topics.flatMap((topic) => TOPIC_QUERY_MAP[topic] ?? []);
  if (queries.length === 0) throw new Error("No queries derived from topics");

  const searchResults = await runFirecrawlSearches(queries, firecrawlKey);
  const context = buildCompactContext(searchResults);
  const date = new Date().toISOString();
  const prompt = buildDigestPrompt(date, topics, context);

  const candidates = getModelCandidates();
  const maxTokens = resolveMaxTokens();
  let lastError: Error | null = null;

  for (const model of candidates) {
    const result = await runOpenRouterCompletion(model, prompt, maxTokens, openRouterKey);

    if (result.ok) {
      if (!result.content?.trim()) {
        console.warn(`[newsletter.llm] emptyCompletion model=${model}, trying next candidate`);
        lastError = new Error(`Model ${model} returned an empty completion`);
        continue;
      }
      const stories = parseStories(result.content);
      if (stories.length < 2) {
        throw new Error(`Model ${model} returned only ${stories.length} valid stories`);
      }
      return { stories, model };
    }

    if (shouldTryNextModel(result.status, result.body)) {
      console.warn(`[newsletter.llm] modelFallback model=${model} status=${result.status}`);
      lastError = new Error(`OpenRouter unavailable (status ${result.status})`);
      continue;
    }

    console.error(`[newsletter.llm] openRouterError model=${model} status=${result.status}`);
    throw new Error(`OpenRouter request failed (status ${result.status})`);
  }

  throw lastError ?? new Error("OpenRouter failed for all model candidates");
}
