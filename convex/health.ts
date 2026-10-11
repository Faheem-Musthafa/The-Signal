import { ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { getAvailableOpenRouterModels, getModelCandidates, getProviderKeyWarnings, resolveMaxTokens } from "./lib/llm";

const REQUIRED_ENV = ["OPENROUTER_API_KEY", "FIRECRAWL_API_KEY"];

export const llmHealth = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }

    const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
    const modelCandidates = getModelCandidates();

    let availableModelCandidates: string[] = [];
    let modelIndexError: string | null = null;
    try {
      const available = await getAvailableOpenRouterModels();
      availableModelCandidates = modelCandidates.filter((id) => available.has(id));
    } catch (error) {
      modelIndexError = error instanceof Error ? error.message : "Unknown model index error";
    }

    return {
      ok: missingEnv.length === 0 && availableModelCandidates.length > 0,
      missingEnv,
      warnings: getProviderKeyWarnings(),
      modelCandidates,
      availableModelCandidates,
      modelIndexError,
      maxTokens: resolveMaxTokens(),
      firecrawlCountry: process.env.FIRECRAWL_COUNTRY ?? "US",
    };
  },
});

