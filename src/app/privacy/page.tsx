// Template — review with legal counsel before launch.
import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What The Signal collects, why, who processes it, and how long we keep it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="October 11, 2026" current="privacy">
      <p>
        The Signal turns the tech topics you pick into short, AI-generated briefings, and can email you a daily
        digest. This policy explains what we collect to do that, who helps us process it, and how long we keep it.
        We don&apos;t sell your data, and we don&apos;t use it for advertising.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details.</strong> Sign-in is handled by Clerk. We receive your account ID and email
          address; Clerk stores your login credentials and session, not us.
        </li>
        <li>
          <strong>Briefings you generate.</strong> The topics you chose, the generated stories (headline, summary,
          source and source link), the AI model used, and when it was generated — linked to your account ID.
        </li>
        <li>
          <strong>Usage counters.</strong> How many briefings your account generated each day (to enforce the daily
          limit), plus short-lived request counters keyed by IP address to prevent abuse.
        </li>
        <li>
          <strong>Daily email settings</strong> (only if you subscribe). Your email address, timezone, preferred
          delivery hour, chosen topics, and delivery status for each email we send.
        </li>
        <li>
          <strong>Analytics.</strong> Vercel Analytics records aggregated page views and basic device information.
          It does not use cookies to track you across sites.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To sign you in and keep your account secure.</li>
        <li>To generate briefings, show your recent history, and enforce the free daily quota.</li>
        <li>To send the daily digest you scheduled, at the hour and timezone you chose.</li>
        <li>To understand overall usage and keep the service reliable.</li>
      </ul>

      <h2>Who processes your data</h2>
      <p>We rely on a small number of service providers, each handling only what it needs:</p>
      <ul>
        <li><strong>Clerk</strong> — authentication and account management.</li>
        <li><strong>Convex</strong> — our database and backend, where briefings, usage counters and daily email settings are stored.</li>
        <li><strong>Resend</strong> — delivers the daily emails; receives your email address and the email content.</li>
        <li><strong>Vercel</strong> — hosts the app and provides privacy-friendly analytics.</li>
        <li>
          <strong>Firecrawl</strong> and <strong>OpenRouter</strong> — search the public web and run the AI models
          that write your briefing. They receive the topics you selected and public article text. We do not send
          them your name, email address or account ID.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <ul>
        <li>Generated briefings are deleted automatically 30 days after they are created.</li>
        <li>Daily usage counters and abuse-prevention counters are short-lived and cleaned up automatically.</li>
        <li>Daily email settings are kept until you unsubscribe or delete your account.</li>
        <li>Account data is kept until you delete your account.</li>
      </ul>

      <h2>Shared links</h2>
      <p>
        Every briefing has a share link. Anyone with that link can view the briefing (its topics and stories — not
        your name or email) until it expires 30 days after it was generated. Shared pages are excluded from search
        engines.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          <strong>Unsubscribe any time</strong> using the link at the bottom of every daily email, or from the
          Daily email page in the app.
        </li>
        <li>
          <strong>Delete your account</strong>: open <Link href={"/settings" as Route}>Settings</Link>, go to the
          Security section of your account profile and choose Delete account. Deleting your account permanently
          purges your briefings, usage history, daily email subscription and email delivery records.
        </li>
        <li>
          Depending on where you live, you may have rights to access, correct, export or delete your data. Contact
          us and we&apos;ll help.
        </li>
      </ul>

      <h2>Stored on your device</h2>
      <p>
        Some things are kept only in your browser&apos;s local storage, not on our servers: your default topics,
        your autoplay setting, which briefings you&apos;ve already opened, and the stories you save. You can clear
        saved stories and reading history in Settings under &ldquo;Data on this device&rdquo;, or by clearing your
        browser&apos;s site data.
      </p>

      <h2>Cookies</h2>
      <p>
        We only use cookies needed to keep you signed in (set by Clerk). We don&apos;t use advertising or
        cross-site tracking cookies.
      </p>

      <h2>Children</h2>
      <p>The Signal is not directed to children under 16, and we don&apos;t knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy in a meaningful way, we&apos;ll update the date above and, where appropriate, let
        you know by email.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Reply to any daily email, or write to the address listed in the footer of our
        emails. See also our <Link href={"/terms" as Route}>Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
