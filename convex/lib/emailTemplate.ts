import type { GeneratedStory } from "./llm";

export type DigestEmail = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function importanceDots(importance: number): string {
  const filled = Math.max(0, Math.min(5, importance));
  return Array.from({ length: 5 })
    .map((_, i) => (i < filled ? "●" : "○"))
    .join(" ");
}

export function buildDigestEmail(args: {
  stories: GeneratedStory[];
  generatedAt: number;
  topics: string[];
  shareUrl: string | null;
  unsubUrl: string;
  brandName?: string;
}): DigestEmail {
  const brand = args.brandName ?? "The Signal";
  const date = new Date(args.generatedAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const subject = `${brand} — ${date}`;

  const storyBlocksHtml = args.stories
    .map((story) => {
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;border-collapse:collapse;">
          <tr>
            <td style="padding:20px 22px;background:#111111;border:1px solid #1f1f1f;border-radius:14px;">
              <p style="margin:0 0 10px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9aa0a6;">
                ${escapeHtml(story.category)} &nbsp;·&nbsp; <span style="color:#f0a83a;">${importanceDots(story.importance)}</span>
              </p>
              <h2 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#ffffff;">
                ${escapeHtml(story.headline)}
              </h2>
              <p style="margin:0 0 14px 0;padding:12px 14px;background:#1a1a1a;border-left:3px solid #6366f1;border-radius:6px;font-size:14px;line-height:1.5;color:#e5e7eb;">
                <strong style="color:#a5b4fc;font-size:11px;letter-spacing:1px;text-transform:uppercase;">The Signal</strong><br/>
                ${escapeHtml(story.signal)}
              </p>
              <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#c5c8cc;">
                ${escapeHtml(story.summary)}
              </p>
              <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
                Source: ${escapeHtml(story.source)}
              </p>
            </td>
          </tr>
        </table>
      `.trim();
    })
    .join("");

  const shareLinkHtml = args.shareUrl
    ? `<p style="margin:0 0 24px 0;text-align:center;"><a href="${escapeHtml(args.shareUrl)}" style="color:#a5b4fc;font-size:13px;">View this digest on the web →</a></p>`
    : "";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 0 28px 0;border-bottom:1px solid #1f1f1f;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;">${escapeHtml(brand)}</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${escapeHtml(date)}</h1>
              <p style="margin:8px 0 0 0;font-size:12px;color:#9ca3af;">${escapeHtml(args.topics.join(" · "))}</p>
            </td>
          </tr>
          <tr><td style="padding:32px 0 0 0;">${storyBlocksHtml}</td></tr>
          <tr>
            <td style="padding:8px 0 0 0;border-top:1px solid #1f1f1f;text-align:center;">
              ${shareLinkHtml}
              <p style="margin:24px 0 8px 0;font-size:11px;color:#6b7280;">
                You're receiving this because you subscribed to a daily ${escapeHtml(brand)} briefing.
              </p>
              <p style="margin:0;font-size:11px;color:#6b7280;">
                <a href="${escapeHtml(args.unsubUrl)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`;

  const textLines = [
    `${brand} — ${date}`,
    `Topics: ${args.topics.join(", ")}`,
    "",
    ...args.stories.map((story) => {
      return [
        `[${story.category}] (${story.importance}/5)`,
        story.headline,
        `Signal: ${story.signal}`,
        story.summary,
        `Source: ${story.source}`,
      ].join("\n");
    }),
    "",
    args.shareUrl ? `View on web: ${args.shareUrl}` : "",
    `Unsubscribe: ${args.unsubUrl}`,
  ];

  return { subject, html, text: textLines.filter(Boolean).join("\n\n") };
}
