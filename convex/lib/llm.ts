// The only digest generation pipeline (Firecrawl search -> OpenRouter). Pure
// fetch logic so it runs inside Convex actions in the default runtime.

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/search";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_ENDPOINT = "https://openrouter.ai/api/v1/models";
const MAX_CONTEXT_CHARS = 30000;
const MAX_SNIPPET_CHARS = 1200;
const FIRECRAWL_TIME_FILTER = "sbd:1,qdr:d";
const FIRECRAWL_TIMEOUT_MS = 12_000;
const OPENROUTER_TIMEOUT_MS = 28_000;
const MAX_SEARCH_QUERIES = 8;
const DEFAULT_OPENROUTER_MAX_TOKENS = 2000;
const MAX_OPENROUTER_MAX_TOKENS = 2400;
const MIN_VALID_STORIES = 2;
const MAX_STORIES = 7;
const DEFAULT_OPENROUTER_MODEL_CANDIDATES = [
  "openrouter/free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
];

// Duplicated in src/lib/topics.ts (the UI allowlist) because Convex functions
// cannot import from src/. Keep the two lists in sync.
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
  url?: string;
};

export type DigestErrorCode = "UPSTREAM_TIMEOUT" | "UPSTREAM_FAILED" | "BAD_MODEL_OUTPUT" | "CONFIG";

export class DigestGenerationError extends Error {
  readonly code: DigestErrorCode;
  constructor(code: DigestErrorCode, message: string) {
    super(message);
    this.name = "DigestGenerationError";
    this.code = code;
  }
}

type GenerateOptions = { signal?: AbortSignal };

type ContextItem = {
  url: string;
  title: string;
  description: string;
  publishedAt: string;
  snippet?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new DigestGenerationError("CONFIG", `Missing required env var: ${name}`);
  return value;
}

function parseCsvEnv(value: string | undefined) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function getModelCandidates(): string[] {
  const primary = process.env.OPENROUTER_MODEL ?? "openrouter/free";
  const configured = parseCsvEnv(process.env.OPENROUTER_MODEL_FALLBACKS);
  return [...new Set([primary, ...configured, ...DEFAULT_OPENROUTER_MODEL_CANDIDATES])];
}

export function resolveMaxTokens(): number {
  const raw = process.env.OPENROUTER_MAX_TOKENS;
  const parsed = raw ? Number(raw) : DEFAULT_OPENROUTER_MAX_TOKENS;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_OPENROUTER_MAX_TOKENS;
  return Math.min(Math.floor(parsed), MAX_OPENROUTER_MAX_TOKENS);
}

export function getProviderKeyWarnings(): string[] {
  const warnings: string[] = [];
  if (process.env.FIRECRAWL_API_KEY?.startsWith("sk-or-")) {
    warnings.push("FIRECRAWL_API_KEY looks like an OpenRouter key (sk-or-*). Keys may be swapped.");
  }
  if (process.env.OPENROUTER_API_KEY?.startsWith("fc-")) {
    warnings.push("OPENROUTER_API_KEY looks like a Firecrawl key (fc-*). Keys may be swapped.");
  }
  return warnings;
}

export async function getAvailableOpenRouterModels(): Promise<Set<string>> {
  const response = await fetchWithTimeout(
    OPENROUTER_MODELS_ENDPOINT,
    { method: "GET", headers: { "Content-Type": "application/json" } },
    10_000,
    "OpenRouter model index",
  );
  if (!response.ok) {
    throw new Error(`OpenRouter model index failed (status ${response.status})`);
  }
  const data = (await response.json()) as { data?: Array<{ id?: string }> };
  return new Set((data.data ?? []).map((item) => item.id).filter((id): id is string => !!id));
}

function truncateText(value: unknown, maxChars: number): string {
  if (typeof value !== "string") return "";
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...`;
}

function isTimeout(error: unknown): boolean {
  return error instanceof DigestGenerationError && error.code === "UPSTREAM_TIMEOUT";
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  provider: string,
): Promise<Response> {
  const controller = new AbortController();
  const parentSignal = init.signal ?? undefined;
  let timedOut = false;

  const abortFromParent = () => controller.abort();
  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new DigestGenerationError(
        "UPSTREAM_TIMEOUT",
        `${provider} timed out after ${Math.round(timeoutMs / 1000)}s`,
      );
    }
    if (parentSignal?.aborted) {
      throw new DigestGenerationError("UPSTREAM_TIMEOUT", "Digest generation timed out");
    }
    throw new DigestGenerationError(
      "UPSTREAM_FAILED",
      `${provider} request failed: ${error instanceof Error ? error.message : "network error"}`,
    );
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

// Returns the serialized SOURCE MATERIAL plus the exact set of URLs it contains.
// Items are dropped whole (never cut mid-JSON) so every URL the model sees is complete.
function buildCompactContext(searchResults: unknown[]): { context: string; urls: Set<string> } {
  const items: ContextItem[] = searchResults.flatMap((result) => {
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

    return prioritized
      .filter((item) => /^https?:\/\//i.test(item.url.trim()))
      .slice(0, 4)
      .map((item) => {
        const snippet = truncateText(item.markdown, MAX_SNIPPET_CHARS);
        return {
          url: item.url.trim(),
          title: truncateText(item.title, 160),
          description: truncateText(item.description, 240),
          publishedAt: item.date,
          ...(snippet ? { snippet } : {}),
        };
      });
  });

  const included: ContextItem[] = [];
  const seen = new Set<string>();
  let size = 2;
  for (const item of items) {
    if (seen.has(item.url)) continue;
    const itemSize = JSON.stringify(item).length + 1;
    if (size + itemSize > MAX_CONTEXT_CHARS) continue;
    included.push(item);
    seen.add(item.url);
    size += itemSize;
  }

  return { context: JSON.stringify(included), urls: seen };
}

async function runFirecrawlSearch(query: string, apiKey: string, signal?: AbortSignal) {
  const response = await fetchWithTimeout(
    FIRECRAWL_ENDPOINT,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal,
      body: JSON.stringify({
        query,
        limit: 5,
        sources: ["news", "web"],
        tbs: FIRECRAWL_TIME_FILTER,
        country: process.env.FIRECRAWL_COUNTRY ?? "US",
      }),
    },
    FIRECRAWL_TIMEOUT_MS,
    "Firecrawl",
  );

  if (!response.ok) {
    const code = response.status === 401 || response.status === 403 ? "CONFIG" : "UPSTREAM_FAILED";
    throw new DigestGenerationError(code, `Firecrawl request failed (status ${response.status})`);
  }

  return response.json();
}

async function runFirecrawlSearches(queries: string[], apiKey: string, signal?: AbortSignal): Promise<unknown[]> {
  const startedAt = Date.now();
  // One failed query must not kill the whole briefing — use what succeeded.
  const settled = await Promise.allSettled(queries.map((q) => runFirecrawlSearch(q, apiKey, signal)));

  const succeeded = settled
    .filter((r): r is PromiseFulfilledResult<unknown> => r.status === "fulfilled")
    .map((r) => r.value);

  const failed = settled.length - succeeded.length;
  if (failed > 0) {
    console.warn(`[digest.llm] firecrawlPartialFailure failed=${failed}/${settled.length}`);
  }
  console.info(
    `[digest.llm] firecrawlComplete succeeded=${succeeded.length}/${settled.length} durationMs=${Date.now() - startedAt}`,
  );

  if (succeeded.length === 0) {
    const reasons = settled
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason);
    const config = reasons.find((e) => e instanceof DigestGenerationError && e.code === "CONFIG");
    if (config) throw config;
    if (reasons.length > 0 && reasons.every(isTimeout)) {
      throw new DigestGenerationError("UPSTREAM_TIMEOUT", "Live sources timed out");
    }
    throw new DigestGenerationError("UPSTREAM_FAILED", "All Firecrawl searches failed");
  }

  return succeeded;
}

type OpenRouterResult = { ok: boolean; status: number; body?: string; content?: string };

async function runOpenRouterCompletion(
  model: string,
  prompt: string,
  maxTokens: number,
  apiKey: string,
  signal?: AbortSignal,
): Promise<OpenRouterResult> {
  const response = await fetchWithTimeout(
    OPENROUTER_ENDPOINT,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: maxTokens,
        // Free models are mostly reasoning models; left on, they spend the whole
        // max_tokens budget thinking and return null content (finish_reason=length).
        reasoning: { enabled: false },
      }),
    },
    OPENROUTER_TIMEOUT_MS,
    "OpenRouter",
  );

  if (!response.ok) {
    return { ok: false, status: response.status, body: await response.text() };
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  return { ok: true, status: response.status, content: data.choices?.[0]?.message?.content ?? "" };
}

function shouldTryNextModel(status: number, body: string | undefined): boolean {
  // Retryable per-model failures: missing model, provider down, rate limited.
  if ([402, 404, 408, 429, 500, 502, 503, 504].includes(status)) return true;
  return /No endpoints found|provider unavailable|model.*not found/i.test(body ?? "");
}

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
- url: the "url" of the SOURCE MATERIAL item this story is based on, copied character-for-character. Never construct, shorten, or guess a URL.

Output ONLY a valid JSON array sorted by importance descending. No markdown fences, no preamble, no trailing text.
Example shape: [{"headline":"...","category":"...","summary":"...","importance":4,"signal":"...","source":"...","url":"https://..."}]

SOURCE MATERIAL:
${context}`;
}

function extractJsonArray(raw: string): string | null {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    const cleaned = fenceMatch[1].trim();
    if (cleaned.startsWith("[") && cleaned.endsWith("]")) return cleaned;
  }

  const first = raw.indexOf("[");
  const last = raw.lastIndexOf("]");
  if (first >= 0 && last > first) return raw.slice(first, last + 1);
  return null;
}

// Throws BAD_MODEL_OUTPUT when the response is not a JSON array. Individual
// malformed items are dropped. `url` survives only if it is one of the scraped URLs.
export function parseStories(rawText: string, allowedUrls: Set<string>): GeneratedStory[] {
  const jsonArray = extractJsonArray(rawText);
  if (!jsonArray) throw new DigestGenerationError("BAD_MODEL_OUTPUT", "Model response did not contain a JSON array");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonArray);
  } catch {
    throw new DigestGenerationError("BAD_MODEL_OUTPUT", "Model response was not valid JSON");
  }
  if (!Array.isArray(parsed)) throw new DigestGenerationError("BAD_MODEL_OUTPUT", "Model response array is invalid");

  const topicSet = new Set(SUPPORTED_TOPICS);

  return parsed
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .filter(
      (item) =>
        typeof item.headline === "string" &&
        item.headline.trim().length >= 5 &&
        typeof item.category === "string" &&
        topicSet.has(item.category.trim()) &&
        typeof item.summary === "string" &&
        item.summary.trim().length >= 50 &&
        typeof item.importance === "number" &&
        Number.isFinite(item.importance) &&
        typeof item.signal === "string" &&
        typeof item.source === "string",
    )
    .map((item) => {
      const story: GeneratedStory = {
        headline: String(item.headline).trim().slice(0, 120),
        category: String(item.category).trim(),
        summary: String(item.summary).trim().slice(0, 500),
        importance: Math.max(1, Math.min(5, Math.round(Number(item.importance)))),
        signal: String(item.signal).trim().slice(0, 200),
        source: String(item.source).trim().slice(0, 100),
      };
      const url = typeof item.url === "string" ? item.url.trim() : "";
      if (url && url.length <= 2048 && allowedUrls.has(url)) story.url = url;
      return story;
    })
    .sort((a, b) => b.importance - a.importance)
    .slice(0, MAX_STORIES);
}

export async function generateDigestStories(
  topics: string[],
  opts: GenerateOptions = {},
): Promise<{ stories: GeneratedStory[]; model: string }> {
  const { signal } = opts;
  const firecrawlKey = requireEnv("FIRECRAWL_API_KEY");
  const openRouterKey = requireEnv("OPENROUTER_API_KEY");
  if (firecrawlKey.startsWith("sk-or-")) {
    throw new DigestGenerationError("CONFIG", "FIRECRAWL_API_KEY appears to be an OpenRouter key (sk-or-*)");
  }
  if (openRouterKey.startsWith("fc-")) {
    throw new DigestGenerationError("CONFIG", "OPENROUTER_API_KEY appears to be a Firecrawl key (fc-*)");
  }

  const queriesPerTopic = topics.length <= 2 ? 3 : topics.length <= 4 ? 2 : 1;
  const queries = topics
    .flatMap((topic) => (TOPIC_QUERY_MAP[topic] ?? []).slice(0, queriesPerTopic))
    .slice(0, MAX_SEARCH_QUERIES);
  if (queries.length === 0) throw new DigestGenerationError("CONFIG", "No queries derived from topics");

  const searchResults = await runFirecrawlSearches(queries, firecrawlKey, signal);
  const { context, urls } = buildCompactContext(searchResults);
  const prompt = buildDigestPrompt(new Date().toISOString(), topics, context);

  const candidates = getModelCandidates();
  const maxTokens = resolveMaxTokens();
  console.info(
    `[digest.llm] queries=${queries.length} sourceItems=${urls.size} promptChars=${prompt.length} maxTokens=${maxTokens} modelCandidates=${candidates.join(",")}`,
  );

  let lastError: DigestGenerationError | null = null;

  for (const model of candidates) {
    if (signal?.aborted) throw new DigestGenerationError("UPSTREAM_TIMEOUT", "Digest generation timed out");
    const startedAt = Date.now();

    let result: OpenRouterResult;
    try {
      result = await runOpenRouterCompletion(model, prompt, maxTokens, openRouterKey, signal);
    } catch (error) {
      if (signal?.aborted) throw new DigestGenerationError("UPSTREAM_TIMEOUT", "Digest generation timed out");
      lastError =
        error instanceof DigestGenerationError
          ? error
          : new DigestGenerationError("UPSTREAM_FAILED", "OpenRouter request failed");
      console.warn(
        `[digest.llm] modelRequestFailed model=${model} durationMs=${Date.now() - startedAt} reason=${truncateText(lastError.message, 240)}`,
      );
      continue;
    }

    if (result.ok) {
      if (!result.content?.trim()) {
        console.warn(`[digest.llm] emptyCompletion model=${model}, trying next candidate`);
        lastError = new DigestGenerationError("BAD_MODEL_OUTPUT", `Model ${model} returned an empty completion`);
        continue;
      }

      let stories: GeneratedStory[];
      try {
        stories = parseStories(result.content, urls);
      } catch (error) {
        lastError =
          error instanceof DigestGenerationError
            ? error
            : new DigestGenerationError("BAD_MODEL_OUTPUT", "Invalid model output");
        console.warn(`[digest.llm] unparseableOutput model=${model} rawLen=${result.content.length}`);
        continue;
      }

      if (stories.length < MIN_VALID_STORIES) {
        console.warn(`[digest.llm] tooFewStories model=${model} count=${stories.length}`);
        lastError = new DigestGenerationError(
          "BAD_MODEL_OUTPUT",
          `Model ${model} returned only ${stories.length} valid stories`,
        );
        continue;
      }

      const linked = stories.filter((s) => s.url).length;
      console.info(
        `[digest.llm] selectedModel=${model} stories=${stories.length} linked=${linked} durationMs=${Date.now() - startedAt}`,
      );
      return { stories, model };
    }

    if (shouldTryNextModel(result.status, result.body)) {
      console.warn(
        `[digest.llm] modelFallback model=${model} status=${result.status} reason=${truncateText(result.body ?? "", 240)}`,
      );
      lastError = new DigestGenerationError("UPSTREAM_FAILED", `OpenRouter unavailable (status ${result.status})`);
      continue;
    }

    console.error(
      `[digest.llm] openRouterError model=${model} status=${result.status} body=${truncateText(result.body ?? "", 500)}`,
    );
    const code = result.status === 401 || result.status === 403 ? "CONFIG" : "UPSTREAM_FAILED";
    throw new DigestGenerationError(code, `OpenRouter request failed (status ${result.status})`);
  }

  throw lastError ?? new DigestGenerationError("UPSTREAM_FAILED", "OpenRouter failed for all model candidates");
}
