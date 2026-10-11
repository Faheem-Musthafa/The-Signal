import { describe, expect, it } from "vitest";
import {
  buildDigestEmail,
  buildWelcomeEmail,
  formatHourLabel,
  safeHttpUrl,
  type EmailStory,
} from "../../convex/lib/emailTemplate";

const footer = {
  unsubUrl: "https://signal.example.com/api/unsubscribe?u=user_1&t=tok",
  privacyUrl: "https://signal.example.com/privacy",
  manageUrl: "https://signal.example.com/newsletter",
};

function story(overrides: Partial<EmailStory> = {}): EmailStory {
  return {
    headline: "Chips get faster",
    category: "Hardware & Chips",
    summary: "A plain summary.",
    importance: 3,
    signal: "Plan for cheaper inference.",
    source: "The Verge",
    ...overrides,
  };
}

function digest(stories: EmailStory[], postalAddress?: string | null) {
  return buildDigestEmail({
    stories,
    generatedAt: Date.UTC(2026, 9, 9, 12),
    topics: ["Hardware & Chips"],
    shareUrl: "https://signal.example.com/share/abc123",
    timezone: "UTC",
    postalAddress,
    ...footer,
  });
}

describe("safeHttpUrl", () => {
  it("accepts only http(s)", () => {
    expect(safeHttpUrl("https://a.example.com/x")).toBe("https://a.example.com/x");
    expect(safeHttpUrl("http://a.example.com/")).toBe("http://a.example.com/");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,<b>x</b>")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
  });
});

describe("buildDigestEmail", () => {
  it("escapes HTML in headline, summary and signal", () => {
    const { html } = digest([
      story({
        headline: `<script>alert("x")</script>`,
        summary: `Tom & Jerry's <img src=x onerror=alert(1)>`,
        signal: `<b>bold</b>`,
      }),
    ]);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>bold</b>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("Tom &amp; Jerry&#39;s &lt;img");
  });

  it("links only http(s) story urls", () => {
    const { html, text } = digest([
      story({ headline: "Safe link story", url: "https://news.example.com/a?b=1&c=2" }),
      story({ headline: "Evil link story", url: "javascript:alert(document.cookie)" }),
    ]);
    expect(html).toContain('href="https://news.example.com/a?b=1&amp;c=2"');
    expect(html).not.toContain("javascript:");
    expect(text).toContain("Read: https://news.example.com/a?b=1&c=2");
    expect(text).not.toContain("javascript:");
  });

  it("includes unsubscribe and privacy links in html and text", () => {
    const { html, text } = digest([story()]);
    expect(html).toContain('href="https://signal.example.com/api/unsubscribe?u=user_1&amp;t=tok"');
    expect(html).toContain('href="https://signal.example.com/privacy"');
    expect(text).toContain(`Unsubscribe: ${footer.unsubUrl}`);
    expect(text).toContain(`Privacy: ${footer.privacyUrl}`);
  });

  it("renders the postal address only when provided", () => {
    const withAddress = digest([story()], "1 Main St, Springfield <USA>");
    expect(withAddress.html).toContain("1 Main St, Springfield &lt;USA&gt;");
    expect(withAddress.text).toContain("1 Main St, Springfield <USA>");

    const without = digest([story()], null);
    expect(without.html).not.toContain("Main St");
    expect(without.text).not.toContain("Main St");
    expect(digest([story()], "   ").text).not.toMatch(/\n\n\s+$/);
  });
});

describe("buildWelcomeEmail", () => {
  it("includes delivery time, footer links and escapes the timezone", () => {
    const { html, text, subject } = buildWelcomeEmail({
      topics: ["AI & LLMs"],
      deliveryHour: 0,
      timezone: "Europe/London",
      postalAddress: "PO Box 1",
      ...footer,
    });
    expect(subject).toContain("subscribed");
    expect(formatHourLabel(0)).toBe("12:00 AM");
    expect(formatHourLabel(13)).toBe("1:00 PM");
    expect(text).toContain("12:00 AM (Europe/London)");
    expect(html).toContain("AI &amp; LLMs");
    expect(html).toContain('href="https://signal.example.com/privacy"');
    expect(text).toContain(`Unsubscribe: ${footer.unsubUrl}`);
    expect(text).toContain("PO Box 1");
  });
});
