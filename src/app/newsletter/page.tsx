"use client";

import { useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import { SubscribeCard } from "@/components/SubscribeCard";
import { IconMail, TopicChip, buttonClasses } from "@/components/ui";
import { TOPIC_STYLES } from "@/lib/topicStyle";

export default function NewsletterPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AppShell pageTitle="Daily email">
        <div role="status" aria-label="Loading" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-[260px] rounded-[18px] bg-surface-2 animate-pulse-soft lg:order-2" />
          <div className="h-[420px] rounded-card bg-surface-2 animate-pulse-soft lg:order-1" />
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell pageTitle="Daily email">
        <section
          aria-labelledby="nl-pitch"
          className="grain relative max-w-2xl overflow-hidden rounded-[18px] bg-ink p-6 text-white shadow-lift sm:p-9"
        >
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">Daily email</p>
          <h2 id="nl-pitch" className="display-md mt-3 max-w-[18ch] text-white">
            Your briefing in your inbox, every day.
          </h2>
          <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-white/80">
            Pick your topics and a time. We send you the top stories once a day, in your time zone. It doesn&apos;t use
            your 3 free briefings, and every email has a one-click unsubscribe link.
          </p>
          <ul aria-label="Topics you can pick" className="mt-6 flex flex-wrap gap-1.5">
            {TOPIC_STYLES.map((t) => (
              <li key={t.key}>
                <TopicChip topic={t.topic} short />
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <SignUpButton mode="modal">
              <button type="button" className={buttonClasses({ variant: "inverse", size: "lg" })}>
                <IconMail />
                Get the daily email — free
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button type="button" className={buttonClasses({ variant: "glass", size: "lg" })}>
                Sign in
              </button>
            </SignInButton>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Daily email" pageDescription="Get your briefing by email once a day">
      {/* No transform-based entrance here: SubscribeCard pins a fixed CTA on mobile. */}
      <SubscribeCard />
    </AppShell>
  );
}
