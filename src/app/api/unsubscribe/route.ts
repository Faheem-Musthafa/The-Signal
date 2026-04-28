import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

function htmlPage(message: string, ok: boolean) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>The Signal — Unsubscribe</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;background:#0a0a0a;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
  .card{max-width:440px;width:100%;background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;text-align:center;}
  h1{margin:0 0 12px 0;font-size:22px;color:${ok ? "#a5b4fc" : "#f87171"};letter-spacing:-0.3px;}
  p{margin:0 0 18px 0;color:#9ca3af;line-height:1.5;font-size:14px;}
  a{color:#a5b4fc;text-decoration:none;font-size:13px;font-weight:600;}
</style></head>
<body><div class="card">
  <h1>${ok ? "Unsubscribed" : "Unable to unsubscribe"}</h1>
  <p>${message}</p>
  <a href="/">Return to The Signal →</a>
</div></body></html>`;
}

async function processUnsubscribe(accountId: string | null, token: string | null) {
  if (!accountId || !token) {
    return new NextResponse(
      htmlPage("This link is missing required parameters. Please copy the unsubscribe link directly from your email.", false),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return new NextResponse(
      htmlPage("Server is misconfigured. Please contact support.", false),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const convex = new ConvexHttpClient(url);
  try {
    const result = await convex.action(api.internal.subscribers.unsubscribeByToken, {
      accountId,
      token,
    });

    if (!result.ok) {
      return new NextResponse(
        htmlPage("This unsubscribe link is invalid or has expired.", false),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    return new NextResponse(
      htmlPage("You won't receive any more daily digests from The Signal. Sign in any time to resubscribe.", true),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[unsubscribe] convex action failed: ${message}`);
    return new NextResponse(
      htmlPage("Something went wrong on our end. Please try again later.", false),
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return processUnsubscribe(url.searchParams.get("u"), url.searchParams.get("t"));
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  return processUnsubscribe(url.searchParams.get("u"), url.searchParams.get("t"));
}
