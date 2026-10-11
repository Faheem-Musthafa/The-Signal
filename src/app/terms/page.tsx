// Template — review with legal counsel before launch.
import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use The Signal.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" updated="October 11, 2026" current="terms">
      <p>
        These terms apply when you use The Signal — the website, the briefing generator, share links and the daily
        email digest. By creating an account or using the service, you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        The Signal searches the public web for the topics you choose and uses AI models to summarize what it finds
        into a short briefing. You can generate briefings on demand, share them by link, and schedule a daily email
        digest. Free accounts can generate a limited number of new briefings per day; the limit resets at 00:00 UTC,
        and repeating a briefing we already have cached doesn&apos;t count against it.
      </p>

      <h2>AI-generated content</h2>
      <ul>
        <li>
          <strong>Summaries may contain errors.</strong> Briefings are written automatically by AI from third-party
          sources. They can be incomplete, out of date, or wrong, and may misattribute or misstate facts. Check the
          original source before relying on anything you read here.
        </li>
        <li>
          <strong>Not advice.</strong> Nothing in The Signal is financial, investment, legal or other professional
          advice. Don&apos;t make investment or business decisions based on a briefing alone.
        </li>
        <li>
          Linked sources belong to their publishers. We don&apos;t control or endorse third-party sites, and their
          own terms apply when you visit them.
        </li>
      </ul>

      <h2>Your account</h2>
      <ul>
        <li>You need an account to generate briefings or subscribe to the digest. Keep your sign-in secure.</li>
        <li>You must be at least 16 years old to use The Signal.</li>
        <li>
          You can delete your account at any time: open <Link href={"/settings" as Route}>Settings</Link>, go to the
          Security section of your account profile and choose <strong>Delete account</strong>. Doing so permanently
          removes your briefings, usage history and daily email subscription. Saved stories and reading history are
          stored only in your browser; you can clear them in Settings under &ldquo;Data on this device&rdquo;.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>Try to get around the daily limit, rate limits or other technical restrictions.</li>
        <li>Scrape, overload or attack the service, or use automated means to generate briefings at scale.</li>
        <li>Present AI-generated briefings as verified reporting, or use them to mislead others.</li>
        <li>Use the service in violation of any law.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>

      <h2>Sharing and email</h2>
      <ul>
        <li>
          Anyone with a share link can view that briefing until it expires, 30 days after it was generated. Only share
          links with people you&apos;re comfortable seeing it.
        </li>
        <li>
          The daily digest is sent only after you subscribe. You can unsubscribe at any time using the link in every
          email or from the Daily email page.
        </li>
      </ul>

      <h2>Privacy</h2>
      <p>
        Our <Link href={"/privacy" as Route}>Privacy Policy</Link> explains what we collect, which providers process
        it, and how long we keep it.
      </p>

      <h2>Availability and changes</h2>
      <p>
        The Signal is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. It depends on third-party search
        and AI providers, so briefings can occasionally fail or be delayed. We may change, limit or discontinue
        features, and we may update these terms — if the changes are significant, we&apos;ll update the date above
        and, where appropriate, let you know by email.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent permitted by law, The Signal is not liable for indirect or consequential losses, or for
        decisions made based on AI-generated content. Nothing in these terms limits rights you have under consumer
        protection laws that can&apos;t be waived.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms? Reply to any daily email, or write to the address listed in our email footer.</p>
    </LegalPage>
  );
}
