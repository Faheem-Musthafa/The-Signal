import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlPage(message: string, ok: boolean) {
  const title = ok ? "You're unsubscribed" : "We couldn't unsubscribe you";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>The Signal — Unsubscribe</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<style>
  *{box-sizing:border-box;}
  body{margin:0;background:#F6F7FB;color:#0E1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px 16px;-webkit-font-smoothing:antialiased;}
  .wrap{max-width:440px;width:100%;}
  .brand{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 20px 0;font-size:15px;font-weight:700;letter-spacing:-0.2px;color:#0E1220;}
  .dot{width:10px;height:10px;border-radius:999px;background:#2F4BFF;box-shadow:0 0 0 4px #E8ECFF;}
  .card{background:#FFFFFF;border:1px solid #E3E6EF;border-radius:14px;padding:32px 28px;text-align:center;box-shadow:0 1px 2px rgba(14,18,32,0.04),0 8px 24px rgba(14,18,32,0.06);}
  .badge{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:999px;margin:0 0 16px 0;font-size:20px;font-weight:700;background:${ok ? "#E8ECFF" : "#FFE9E4"};color:${ok ? "#2F4BFF" : "#C2391B"};}
  h1{margin:0 0 10px 0;font-size:22px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:#0E1220;}
  p{margin:0 0 24px 0;color:#3B4256;line-height:1.55;font-size:16px;}
  a.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 22px;border-radius:999px;background:#2F4BFF;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;}
  a.btn:hover{background:#1F36D6;}
  a.btn:focus-visible{outline:3px solid #E8ECFF;outline-offset:2px;}
</style></head>
<body><main class="wrap">
  <div class="brand"><span class="dot" aria-hidden="true"></span>The Signal</div>
  <div class="card">
    <div class="badge" aria-hidden="true">${ok ? "&#10003;" : "!"}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a class="btn" href="/">Back to The Signal</a>
  </div>
</main></body></html>`;
}

async function processUnsubscribe(accountId: string | null, token: string | null) {
  if (!accountId || !token || accountId.length > 128 || token.length > 128) {
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
