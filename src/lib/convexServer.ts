import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { auth } from "@clerk/nextjs/server";

function buildClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function getConvexClient(): ConvexHttpClient {
  return buildClient();
}

export async function getAuthedConvexClient(): Promise<ConvexHttpClient> {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    throw new Error("Convex JWT unavailable. Ensure the Clerk JWT template named 'convex' exists.");
  }
  const client = buildClient();
  client.setAuth(token);
  return client;
}

export type ConvexErrorData = {
  code?: string;
  message?: string;
  remaining?: number;
  limit?: number;
};

// ConvexHttpClient rethrows application errors as ConvexError with `.data` set.
// Duck-typed so it still works if two copies of `convex` end up bundled.
export function getConvexErrorData(error: unknown): ConvexErrorData | null {
  if (error instanceof ConvexError || (error instanceof Error && error.name === "ConvexError")) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object") return data as ConvexErrorData;
    if (typeof data === "string") return { message: data };
  }
  return null;
}
