import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getAvailableOpenRouterModels,
  getOpenRouterModelCandidates,
  getProviderKeyWarnings,
} from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const requiredEnv = ["OPENROUTER_API_KEY", "FIRECRAWL_API_KEY"];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);
  const modelCandidates = getOpenRouterModelCandidates();
  const warnings = getProviderKeyWarnings();

  let availableCandidates: string[] = [];
  let modelIndexError: string | null = null;

  try {
    const availableModelIds = await getAvailableOpenRouterModels();
    availableCandidates = modelCandidates.filter((id) => availableModelIds.has(id));
  } catch (error) {
    modelIndexError = error instanceof Error ? error.message : "Unknown model index error";
  }

  const ok = missingEnv.length === 0 && availableCandidates.length > 0;

  return NextResponse.json(
    {
      ok,
      missingEnv,
      warnings,
      modelCandidates,
      availableModelCandidates: availableCandidates,
      modelIndexError,
      maxTokens: process.env.OPENROUTER_MAX_TOKENS ?? "2000",
      firecrawlCountry: process.env.FIRECRAWL_COUNTRY ?? "US",
    },
    { status: ok ? 200 : 503 },
  );
}
