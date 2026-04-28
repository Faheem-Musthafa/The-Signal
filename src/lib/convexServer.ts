import { ConvexHttpClient } from "convex/browser";
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
