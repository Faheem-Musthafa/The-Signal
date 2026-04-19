import { ConvexHttpClient } from "convex/browser";

export function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  const client = new ConvexHttpClient(url);
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (deployKey) {
    const maybeAdminClient = client as unknown as {
      setAdminAuth?: (token: string) => void;
    };
    maybeAdminClient.setAdminAuth?.(deployKey);
  }

  return client;
}
