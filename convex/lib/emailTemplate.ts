export type EmailStory = {
  headline: string;
  category: string;
  summary: string;
  importance: number;
  signal: string;
  source: string;
  url?: string;
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

export type DigestEmail = BuiltEmail;

export type EmailFooterArgs = {
  unsubUrl: string;
  privacyUrl: string;
  manageUrl: string;
  postalAddress?: string | null;
  brandName?: string;
};

// Email-safe copy of the app palette (src/app/globals.css, src/lib/topicStyle.ts).
// Convex can't import from src/, so keep these in sync by hand.
const C = {
  page: "#F6F7FB",
  card: "#FFFFFF",
  ink: "#0E1220",
  ink2: "#3B4256",
  mute: "#6A7287",
  rule: "#E3E6EF",
  signal: "#2F4BFF",
  signalSoft: "#E8ECFF",
  barOff: "#D5D9E4",
};

const TOPIC_COLORS: Record<string, string> = {
  "AI & LLMs": "#4338CA",
  "Startup Funding": "#047857",
  "Big Tech": "#27272A",
  "Developer Tools": "#0369A1",
  "Crypto & Web3": "#C2410C",
  "Policy & Regulation": "#9F1239",
  "Hardware & Chips": "#0F766E",
  "Layoffs & Hiring": "#86198F",
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace";

function topicColor(topic: string): string {
  return TOPIC_COLORS[topic] ?? C.ink2;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only http(s) links are ever rendered; anything else (javascript:, data:, junk) is dropped.
export function safeHttpUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function formatHourLabel(h: number): string {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${h < 12 ? "AM" : "PM"}`;
}

function formatDate(ms: number, timezone: string | undefined, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Date(ms).toLocaleDateString("en-US", { ...opts, timeZone: timezone || "UTC" });
  } catch {
    return new Date(ms).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  }
}

function clampImportance(n: number): number {
  return Math.max(1, Math.min(5, Math.round(n) || 1));
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

function readingMinutes(stories: EmailStory[]): number {
  const words = stories.reduce(
    (sum, s) => sum + `${s.headline} ${s.summary} ${s.signal}`.split(/\s+/).filter(Boolean).length,
    0,
  );
  return Math.max(1, Math.round(words / 220));
}

function siteOrigin(manageUrl: string): string | null {
  try {
    return new URL(manageUrl).origin;
  } catch {
    return null;
  }
}

/* ───────────── building blocks (table-based so Outlook renders them) ───────────── */

// Importance as five rising bars, like a phone's signal strength.
function signalBarsHtml(importance: number, on: string, off: string): string {
  const level = clampImportance(importance);
  const cells = [6, 9, 12, 15, 18]
    .map(
      (h, i) =>
        `<td valign="bottom" style="padding:0 2px 0 0;"><div style="width:4px;height:${h}px;line-height:${h}px;font-size:0;background:${i < level ? on : off};border-radius:1px;">&nbsp;</div></td>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;vertical-align:middle;" aria-label="Importance ${level} of 5"><tr>${cells}</tr></table>`;
}

function buttonHtml(href: string, label: string, opts: { bg: string; fg: string; border?: string }): string {
  const border = opts.border ?? opts.bg;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;"><tr>
<td align="center" bgcolor="${opts.bg}" style="border-radius:999px;background:${opts.bg};border:1px solid ${border};">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:${opts.fg};text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function eyebrow(text: string, color: string, cls = ""): string {
  return `<p class="sig-eyebrow ${cls}" style="margin:0;font-family:${MONO};font-size:12px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${color};">${text}</p>`;
}

function footerHtml(args: EmailFooterArgs, reason: string): string {
  const link = (href: string, label: string) =>
    `<a class="sig-foot" href="${escapeHtml(href)}" style="color:${C.ink2};text-decoration:underline;">${escapeHtml(label)}</a>`;
  const address = args.postalAddress?.trim()
    ? `<p class="sig-mute" style="margin:10px 0 0 0;font-size:12px;line-height:18px;color:${C.mute};">${escapeHtml(args.postalAddress.trim())}</p>`
    : "";
  return `<tr><td class="sig-pad" style="padding:28px 32px 40px 32px;font-family:${FONT};text-align:center;">
<p class="sig-mute" style="margin:0 0 10px 0;font-size:12px;line-height:18px;color:${C.mute};">${escapeHtml(reason)}</p>
<p class="sig-mute" style="margin:0;font-size:12px;line-height:18px;color:${C.mute};">${link(args.manageUrl, "Manage preferences")} &nbsp;·&nbsp; ${link(args.privacyUrl, "Privacy")} &nbsp;·&nbsp; ${link(args.unsubUrl, "Unsubscribe")}</p>${address}
</td></tr>`;
}

function footerText(args: EmailFooterArgs, reason: string): string[] {
  return [
    reason,
    `Manage preferences: ${args.manageUrl}`,
    `Privacy: ${args.privacyUrl}`,
    `Unsubscribe: ${args.unsubUrl}`,
    args.postalAddress?.trim() ?? "",
  ];
}

function mastheadHtml(brand: string, kicker: string): string {
  return `<tr><td class="sig-pad" style="padding:32px 32px 8px 32px;font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="28" height="28" align="center" valign="middle" bgcolor="${C.signal}" style="width:28px;height:28px;background:${C.signal};border-radius:8px;font-family:${FONT};font-size:15px;line-height:28px;font-weight:800;color:#FFFFFF;">S</td>
<td style="padding-left:10px;font-family:${FONT};font-size:17px;font-weight:700;letter-spacing:-0.2px;color:${C.ink};" class="sig-ink">${escapeHtml(brand)}</td>
</tr></table></td>
<td align="right" valign="middle">${eyebrow(escapeHtml(kicker), C.mute, "sig-mute")}</td>
</tr></table>
</td></tr>`;
}

// Hidden inbox preview line, padded so clients don't pull body text after it.
function preheaderHtml(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};opacity:0;">${escapeHtml(text)}${"&#8199;&#65279;&#847; ".repeat(40)}</div>`;
}

function wrapHtml(title: string, preheader: string, rows: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light dark"/>
<meta name="supported-color-schemes" content="light dark"/>
<title>${escapeHtml(title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  a{text-decoration-skip-ink:auto;}
  @media (max-width:620px){
    .sig-container{width:100% !important;}
    .sig-pad{padding-left:20px !important;padding-right:20px !important;}
    .sig-card-pad{padding:20px !important;}
    .sig-h1{font-size:26px !important;line-height:32px !important;}
    .sig-hero-h{font-size:22px !important;line-height:29px !important;}
  }
  @media (prefers-color-scheme:dark){
    .sig-page{background:#0C0E13 !important;}
    .sig-card{background:#141821 !important;border-color:#262C38 !important;}
    .sig-ink,.sig-ink a{color:#EEF1F6 !important;}
    .sig-ink2{color:#C3C9D5 !important;}
    .sig-why{background:#17223D !important;}
    .sig-rule{border-color:#262C38 !important;}
    .sig-link,.sig-link a{color:#7AA2FF !important;}
    .sig-mute{color:#8B93A5 !important;}
    .sig-foot{color:#C3C9D5 !important;}
    .sig-topic{color:#C3C9D5 !important;}
  }
  [data-ogsc] .sig-page{background:#0C0E13 !important;}
  [data-ogsc] .sig-card{background:#141821 !important;border-color:#262C38 !important;}
  [data-ogsc] .sig-ink,[data-ogsc] .sig-ink a{color:#EEF1F6 !important;}
  [data-ogsc] .sig-ink2{color:#C3C9D5 !important;}
  [data-ogsc] .sig-why{background:#17223D !important;}
  [data-ogsc] .sig-link{color:#7AA2FF !important;}
  [data-ogsc] .sig-mute{color:#8B93A5 !important;}
  [data-ogsc] .sig-foot{color:#C3C9D5 !important;}
  [data-ogsc] .sig-topic{color:#C3C9D5 !important;}
</style>
</head>
<body class="sig-page" style="margin:0;padding:0;width:100%;background:${C.page};">
${preheaderHtml(preheader)}
<table role="presentation" class="sig-page" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:0 8px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="sig-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
${rows}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

/* ───────────── digest ───────────── */

function heroStoryHtml(story: EmailStory, index: number, total: number): string {
  const color = topicColor(story.category);
  const href = safeHttpUrl(story.url);
  const headline = href
    ? `<a href="${escapeHtml(href)}" style="color:#FFFFFF;text-decoration:none;">${escapeHtml(story.headline)}</a>`
    : escapeHtml(story.headline);
  const read = href
    ? `<p style="margin:16px 0 0 0;font-size:14px;line-height:20px;"><a href="${escapeHtml(href)}" style="color:#FFFFFF;font-weight:600;text-decoration:underline;">Read the full story at ${escapeHtml(story.source)} →</a></p>`
    : `<p style="margin:16px 0 0 0;font-size:14px;line-height:20px;color:#FFFFFF;opacity:0.85;">Source: ${escapeHtml(story.source)}</p>`;
  return `<tr><td class="sig-pad" style="padding:0 32px 16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${color}" style="background:${color};border-radius:18px;">
<tr><td class="sig-card-pad" style="padding:26px 26px 24px 26px;font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle">${eyebrow(`Top story · ${escapeHtml(story.category)}`, "#FFFFFF")}</td>
<td align="right" valign="middle" style="font-family:${MONO};font-size:12px;color:#FFFFFF;">${signalBarsHtml(story.importance, "#FFFFFF", "rgba(255,255,255,0.35)")}&nbsp; ${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}</td>
</tr></table>
<h2 class="sig-hero-h" style="margin:14px 0 16px 0;font-family:${FONT};font-size:25px;line-height:32px;font-weight:800;letter-spacing:-0.4px;color:#FFFFFF;">${headline}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background:#FFFFFF;border-radius:12px;"><tr><td style="padding:14px 16px;font-family:${FONT};">
${eyebrow("Why it matters · AI analysis", C.signal)}
<p style="margin:6px 0 0 0;font-size:16px;line-height:24px;font-weight:600;color:${C.ink};">${escapeHtml(story.signal)}</p>
</td></tr></table>
<p style="margin:16px 0 0 0;font-size:15px;line-height:24px;color:#FFFFFF;">${escapeHtml(story.summary)}</p>
${read}
</td></tr></table>
</td></tr>`;
}

function storyCardHtml(story: EmailStory, index: number, total: number): string {
  const color = topicColor(story.category);
  const href = safeHttpUrl(story.url);
  const headline = href
    ? `<a href="${escapeHtml(href)}" style="color:${C.ink};text-decoration:none;">${escapeHtml(story.headline)}</a>`
    : escapeHtml(story.headline);
  const read = href
    ? `<a class="sig-link" href="${escapeHtml(href)}" style="color:${C.signal};font-weight:600;text-decoration:none;">Read the full story →</a>`
    : "";
  return `<tr><td class="sig-pad" style="padding:0 32px 16px 32px;">
<table role="presentation" class="sig-card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.rule};border-radius:14px;">
<tr><td class="sig-card-pad" style="padding:22px 24px 22px 21px;border-left:4px solid ${color};border-radius:13px 0 0 13px;font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle">${eyebrow(escapeHtml(story.category), color, "sig-topic")}</td>
<td align="right" valign="middle" style="font-family:${MONO};font-size:12px;color:${C.mute};">${signalBarsHtml(story.importance, color, C.barOff)}&nbsp; ${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}</td>
</tr></table>
<h3 class="sig-ink" style="margin:12px 0 14px 0;font-family:${FONT};font-size:20px;line-height:27px;font-weight:700;letter-spacing:-0.2px;color:${C.ink};">${headline}</h3>
<table role="presentation" class="sig-why" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.signalSoft}" style="background:${C.signalSoft};border-radius:10px;"><tr><td style="padding:12px 14px;border-left:3px solid ${C.signal};border-radius:10px;font-family:${FONT};">
${eyebrow("Why it matters", C.signal, "sig-link")}
<p class="sig-ink" style="margin:4px 0 0 0;font-size:15px;line-height:22px;font-weight:600;color:${C.ink};">${escapeHtml(story.signal)}</p>
</td></tr></table>
<p class="sig-ink2" style="margin:14px 0 0 0;font-size:15px;line-height:24px;color:${C.ink2};">${escapeHtml(story.summary)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>
<td class="sig-ink2" style="font-family:${FONT};font-size:13px;line-height:18px;color:${C.mute};">Source: ${escapeHtml(story.source)}</td>
<td align="right" style="font-family:${FONT};font-size:14px;line-height:18px;">${read}</td>
</tr></table>
</td></tr></table>
</td></tr>`;
}

function indexHtml(stories: EmailStory[]): string {
  const rows = stories
    .map((s, i) => {
      const color = topicColor(s.category);
      return `<tr>
<td valign="top" width="28" style="padding:7px 0;font-family:${MONO};font-size:13px;line-height:20px;color:${C.mute};">${String(i + 1).padStart(2, "0")}</td>
<td valign="top" width="12" style="padding:13px 0 0 0;"><div style="width:8px;height:8px;line-height:8px;font-size:0;border-radius:4px;background:${color};">&nbsp;</div></td>
<td valign="top" class="sig-ink" style="padding:7px 0 7px 8px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;color:${C.ink};">${escapeHtml(s.headline)}</td>
</tr>`;
    })
    .join("");
  return `<tr><td class="sig-pad" style="padding:0 32px 20px 32px;">
<table role="presentation" class="sig-card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.rule};border-radius:14px;">
<tr><td class="sig-card-pad" style="padding:18px 22px 12px 22px;">
${eyebrow("In this briefing", C.mute, "sig-mute")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;">${rows}</table>
</td></tr></table>
</td></tr>`;
}

export function buildDigestEmail(
  args: {
    stories: EmailStory[];
    generatedAt: number;
    topics: string[];
    shareUrl: string | null;
    timezone?: string;
    /** Subscriber's local delivery hour, used for the "next briefing" line. */
    deliveryHour?: number;
  } & EmailFooterArgs,
): DigestEmail {
  const brand = args.brandName ?? "The Signal";
  const longDate = formatDate(args.generatedAt, args.timezone, { weekday: "long", month: "long", day: "numeric" });
  const shortDate = formatDate(args.generatedAt, args.timezone, { month: "short", day: "numeric" });
  const stories = [...args.stories].sort((a, b) => clampImportance(b.importance) - clampImportance(a.importance));
  const total = stories.length;
  const top = stories[0];
  const minutes = readingMinutes(stories);

  const subject = top ? `${truncate(top.headline, 70)} · ${brand}, ${shortDate}` : `${brand} — ${longDate}`;
  const preheader = top
    ? `${top.signal} Plus ${total - 1} more ${total - 1 === 1 ? "story" : "stories"} · ${minutes} min read.`
    : `Your ${brand} briefing for ${longDate}.`;

  const shareHref = safeHttpUrl(args.shareUrl);
  const nextLine =
    typeof args.deliveryHour === "number"
      ? `Your next briefing arrives tomorrow around ${formatHourLabel(args.deliveryHour)}.`
      : "Your next briefing arrives tomorrow.";

  const intro = `<tr><td class="sig-pad" style="padding:20px 32px 22px 32px;font-family:${FONT};">
${eyebrow(escapeHtml(longDate), C.signal, "sig-link")}
<h1 class="sig-h1 sig-ink" style="margin:8px 0 10px 0;font-family:${FONT};font-size:30px;line-height:36px;font-weight:800;letter-spacing:-0.6px;color:${C.ink};">Today&rsquo;s ${total} ${total === 1 ? "story" : "stories"} that matter</h1>
<p class="sig-ink2" style="margin:0;font-size:15px;line-height:22px;color:${C.ink2};">${escapeHtml(args.topics.join(" · "))} &nbsp;·&nbsp; ${minutes} min read &nbsp;·&nbsp; most important first</p>
</td></tr>`;

  const storyRows = stories.map((s, i) => (i === 0 ? heroStoryHtml(s, i, total) : storyCardHtml(s, i, total))).join("\n");

  const caughtUp = `<tr><td class="sig-pad" style="padding:8px 32px 8px 32px;">
<table role="presentation" class="sig-card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.rule};border-radius:18px;">
<tr><td class="sig-card-pad" align="center" style="padding:28px 24px;font-family:${FONT};text-align:center;">
${eyebrow("End of briefing", C.mute, "sig-mute")}
<h2 class="sig-ink" style="margin:8px 0 8px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:800;color:${C.ink};">You&rsquo;re caught up.</h2>
<p class="sig-ink2" style="margin:0 0 20px 0;font-size:15px;line-height:22px;color:${C.ink2};">That&rsquo;s everything that mattered today. ${escapeHtml(nextLine)}</p>
${shareHref ? buttonHtml(shareHref, "Read and share on the web", { bg: C.signal, fg: "#FFFFFF" }) : ""}
<p style="margin:16px 0 0 0;font-size:14px;line-height:20px;"><a class="sig-link" href="${escapeHtml(args.manageUrl)}" style="color:${C.signal};text-decoration:none;font-weight:600;">Change topics or delivery time</a></p>
</td></tr></table>
</td></tr>
<tr><td class="sig-pad" style="padding:16px 32px 0 32px;font-family:${FONT};text-align:center;">
<p class="sig-ink2" style="margin:0;font-size:12px;line-height:18px;color:${C.mute};">Summaries and &ldquo;Why it matters&rdquo; notes are AI-generated from the linked sources and can contain mistakes. Check the original before acting on them.</p>
</td></tr>`;

  const reason = `You're receiving this because you subscribed to a daily ${brand} briefing.`;
  const html = wrapHtml(
    subject,
    preheader,
    [mastheadHtml(brand, "Daily briefing"), intro, total > 1 ? indexHtml(stories) : "", storyRows, caughtUp, footerHtml(args, reason)].join("\n"),
  );

  const textLines = [
    `${brand} — ${longDate}`,
    `Today's ${total} ${total === 1 ? "story" : "stories"} that matter · ${args.topics.join(", ")} · ${minutes} min read`,
    ...stories.map((story, i) => {
      const href = safeHttpUrl(story.url);
      return [
        `${i + 1}. [${story.category}] Importance ${clampImportance(story.importance)}/5`,
        story.headline,
        `Why it matters: ${story.signal}`,
        story.summary,
        `Source: ${story.source}`,
        href ? `Read: ${href}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }),
    `You're caught up. ${nextLine}`,
    shareHref ? `Read and share on the web: ${shareHref}` : "",
    "Summaries and \"Why it matters\" notes are AI-generated from the linked sources and can contain mistakes.",
    ...footerText(args, reason),
  ];

  return { subject, html, text: textLines.filter(Boolean).join("\n\n") };
}

/* ───────────── welcome ───────────── */

export function buildWelcomeEmail(
  args: {
    topics: string[];
    deliveryHour: number;
    timezone: string;
  } & EmailFooterArgs,
): BuiltEmail {
  const brand = args.brandName ?? "The Signal";
  const subject = `You're subscribed to ${brand}`;
  const time = formatHourLabel(args.deliveryHour);
  const origin = siteOrigin(args.manageUrl);

  const chips = args.topics
    .map((t) => {
      const color = topicColor(t);
      return `<span style="display:inline-block;margin:0 6px 8px 0;padding:6px 12px;border-radius:999px;background:${color};color:#FFFFFF;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;">${escapeHtml(t)}</span>`;
    })
    .join("");

  const point = (title: string, body: string) => `<tr>
<td valign="top" width="22" style="padding:8px 0;"><div style="width:10px;height:10px;line-height:10px;font-size:0;margin-top:5px;border-radius:5px;background:${C.signal};">&nbsp;</div></td>
<td valign="top" class="sig-ink2" style="padding:8px 0;font-family:${FONT};font-size:15px;line-height:22px;color:${C.ink2};"><strong class="sig-ink" style="color:${C.ink};">${title}</strong> ${body}</td>
</tr>`;

  const rows = [
    mastheadHtml(brand, "Daily email"),
    `<tr><td class="sig-pad" style="padding:20px 32px 22px 32px;font-family:${FONT};">
${eyebrow("Subscription confirmed", C.signal, "sig-link")}
<h1 class="sig-h1 sig-ink" style="margin:8px 0 10px 0;font-family:${FONT};font-size:30px;line-height:36px;font-weight:800;letter-spacing:-0.6px;color:${C.ink};">You&rsquo;re in.</h1>
<p class="sig-ink2" style="margin:0;font-size:16px;line-height:24px;color:${C.ink2};">Your briefing arrives every day shortly after <strong class="sig-ink" style="color:${C.ink};">${escapeHtml(time)}</strong> (${escapeHtml(args.timezone)}).</p>
</td></tr>`,
    `<tr><td class="sig-pad" style="padding:0 32px 16px 32px;">
<table role="presentation" class="sig-card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.rule};border-radius:14px;">
<tr><td class="sig-card-pad" style="padding:22px 24px 14px 24px;font-family:${FONT};">
${eyebrow("Your topics", C.mute, "sig-mute")}
<div style="margin-top:12px;">${chips}</div>
</td></tr></table>
</td></tr>`,
    `<tr><td class="sig-pad" style="padding:0 32px 16px 32px;">
<table role="presentation" class="sig-card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.rule};border-radius:14px;">
<tr><td class="sig-card-pad" style="padding:22px 24px 14px 24px;font-family:${FONT};">
${eyebrow("What you'll get", C.mute, "sig-mute")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;">
${point("The stories that matter,", "most important first. Usually 5–7, about a 2-minute read.")}
${point("Why it matters.", "One line per story on what it means for you.")}
${point("Links to every source,", "so you can read the original.")}
</table>
</td></tr></table>
</td></tr>`,
    `<tr><td class="sig-pad" align="center" style="padding:8px 32px 0 32px;font-family:${FONT};text-align:center;">
${origin ? buttonHtml(origin, "Read today's briefing now", { bg: C.signal, fg: "#FFFFFF" }) : ""}
<p style="margin:16px 0 0 0;font-size:14px;line-height:20px;"><a class="sig-link" href="${escapeHtml(args.manageUrl)}" style="color:${C.signal};text-decoration:none;font-weight:600;">Change topics or delivery time</a></p>
</td></tr>`,
    footerHtml(args, `You're receiving this because you subscribed to ${brand} with this address.`),
  ].join("\n");

  const reason = `You're receiving this because you subscribed to ${brand} with this address.`;
  const html = wrapHtml(subject, `Your first briefing arrives shortly after ${time}. Here's what to expect.`, rows);

  const text = [
    `${brand} — you're in.`,
    `Your daily briefing will arrive shortly after ${time} (${args.timezone}).`,
    `Topics: ${args.topics.join(", ")}`,
    "What you'll get: the stories that matter, most important first; one line on why each matters; links to every source.",
    origin ? `Read today's briefing now: ${origin}` : "",
    `Change topics or delivery time: ${args.manageUrl}`,
    ...footerText(args, reason),
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text };
}
