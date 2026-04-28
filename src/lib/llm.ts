import { TOPIC_QUERY_MAP, type Topic } from "@/lib/topics";

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/search";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_ENDPOINT = "https://openrouter.ai/api/v1/models";
const MAX_CONTEXT_CHARS = 30000;
const MAX_SNIPPET_CHARS = 1200;
const FIRECRAWL_TIME_FILTER = "sbd:1,qdr:d";
const DEFAULT_OPENROUTER_MODEL_CANDIDATES = [
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
  "google/gemini-2.5-flash-lite",
];

type OpenRouterResult = {
  ok: boolean;
  status: number;
  body?: string;
  content?: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function parseCsvEnv(value: string | undefined) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getOpenRouterModelCandidates() {
  const primary = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
  const configuredFallbacks = parseCsvEnv(process.env.OPENROUTER_MODEL_FALLBACKS);

  const deduped = new Set<string>([
    primary,
    ...configuredFallbacks,
    ...DEFAULT_OPENROUTER_MODEL_CANDIDATES,
  ]);

  return [...deduped];
}

export async function getAvailableOpenRouterModels() {
  const response = await fetch(OPENROUTER_MODELS_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter model index failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ id?: string }>;
  };

  return new Set((data.data ?? []).map((item) => item.id).filter((id): id is string => !!id));
}

function resolveOpenRouterMaxTokens() {
  const raw = process.env.OPENROUTER_MAX_TOKENS;
  const parsed = raw ? Number(raw) : 2000;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 2000;
  }

  // Keep completion budget bounded for predictable cost.
  return Math.min(Math.floor(parsed), 4000);
}

function truncateText(value: unknown, maxChars: number) {
  if (typeof value !== "string") return "";
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...`;
}

function buildCompactContext(searchResults: unknown[]) {
  const compact = searchResults.flatMap((result) => {
    const data = result as {
      data?: {
        web?: Array<{
          url?: string;
          title?: string;
          description?: string;
          markdown?: string;
        }>;
        news?: Array<{
          url?: string;
          title?: string;
          snippet?: string;
          date?: string;
          markdown?: string;
        }>;
      };
    };

    const newsItems = Array.isArray(data?.data?.news) ? data.data.news : [];
    const webItems = Array.isArray(data?.data?.web) ? data.data.web : [];

    const prioritized = [
      ...newsItems.map((item) => ({
        url: item.url ?? "",
        title: item.title ?? "",
        description: item.snippet ?? "",
        markdown: item.markdown ?? "",
        date: item.date ?? "",
      })),
      ...webItems.map((item) => ({
        url: item.url ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
        markdown: item.markdown ?? "",
        date: "",
      })),
    ];

    return prioritized.slice(0, 4).map((item) => ({
      url: item.url ?? "",
      title: truncateText(item.title ?? "", 160),
      description: truncateText(item.description ?? "", 240),
      publishedAt: item.date,
      snippet: truncateText(item.markdown ?? "", MAX_SNIPPET_CHARS),
    }));
  });

  const serialized = JSON.stringify(compact);
  return truncateText(serialized, MAX_CONTEXT_CHARS);
}

function assertProviderKeyShape(firecrawlApiKey: string, openRouterApiKey: string) {
  // Common misconfiguration: copying OpenRouter key into FIRECRAWL_API_KEY.
  if (firecrawlApiKey.startsWith("sk-or-")) {
    throw new Error(
      "FIRECRAWL_API_KEY appears to be an OpenRouter key (sk-or-*). Use a real Firecrawl key.",
    );
  }

  if (openRouterApiKey.startsWith("fc-")) {
    throw new Error(
      "OPENROUTER_API_KEY appears to be a Firecrawl key (fc-*). Use a real OpenRouter key.",
    );
  }
}

export function getProviderKeyWarnings() {
  const warnings: string[] = [];
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (firecrawlApiKey?.startsWith("sk-or-")) {
    warnings.push("FIRECRAWL_API_KEY looks like an OpenRouter key (sk-or-*). Keys may be swapped.");
  }

  if (openRouterApiKey?.startsWith("fc-")) {
    warnings.push("OPENROUTER_API_KEY looks like a Firecrawl key (fc-*). Keys may be swapped.");
  }

  return warnings;
}

async function runFirecrawlSearch(query: string, apiKey: string) {
  const response = await fetch(FIRECRAWL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      limit: 3,
      sources: ["news", "web"],
      tbs: FIRECRAWL_TIME_FILTER,
      country: process.env.FIRECRAWL_COUNTRY ?? "US",
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        maxAge: 0,
        storeInCache: false,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firecrawl failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function runOpenRouterCompletion(
  model: string,
  prompt: string,
  maxTokens: number,
  apiKey: string,
): Promise<OpenRouterResult> {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: await response.text(),
    };
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return {
    ok: true,
    status: response.status,
    content: data.choices?.[0]?.message?.content ?? "",
  };
}

function shouldTryNextModel(status: number, body: string | undefined) {
  if (status === 404 || status === 503) {
    return true;
  }

  return /No endpoints found|provider unavailable|model.*not found/i.test(body ?? "");
}

export async function runFirecrawlAndOpenRouter(topics: Topic[], prompt: string) {
  const firecrawlApiKey = requireEnv("FIRECRAWL_API_KEY");
  const openRouterApiKey = requireEnv("OPENROUTER_API_KEY");
  assertProviderKeyShape(firecrawlApiKey, openRouterApiKey);
  const modelCandidates = getOpenRouterModelCandidates();
  const maxTokens = resolveOpenRouterMaxTokens();

  const queries = topics.flatMap((topic) => TOPIC_QUERY_MAP[topic]);
  const searchResults = await Promise.all(
    queries.map((query) => runFirecrawlSearch(query, firecrawlApiKey)),
  );

  const context = buildCompactContext(searchResults);
  const finalPrompt = `${prompt}\n\nUse this scraped context first:\n${context}`;

  console.info(
    `[digest.llm] queries=${queries.length} contextChars=${context.length} promptChars=${finalPrompt.length} maxTokens=${maxTokens} modelCandidates=${modelCandidates.join(",")}`,
  );

  let lastError: Error | null = null;

  for (const model of modelCandidates) {
    const result = await runOpenRouterCompletion(model, finalPrompt, maxTokens, openRouterApiKey);

    if (result.ok) {
      console.info(`[digest.llm] selectedModel=${model}`);
      return result.content ?? "";
    }

    if (shouldTryNextModel(result.status, result.body)) {
      console.warn(
        `[digest.llm] modelFallback model=${model} status=${result.status} reason=${truncateText(result.body ?? "", 240)}`,
      );
      lastError = new Error(`OpenRouter unavailable (status ${result.status})`);
      continue;
    }

    console.error(`[digest.llm] openRouterError model=${model} status=${result.status} body=${truncateText(result.body ?? "", 500)}`);
    throw new Error(`OpenRouter request failed (status ${result.status})`);
  }

  throw lastError ?? new Error("OpenRouter failed for all model candidates");
}
