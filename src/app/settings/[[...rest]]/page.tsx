"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { useAuth, SignInButton, UserProfile } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import { Card, IconArrowRight, IconBookmark, IconNewsletter, IconSettings, buttonClasses } from "@/components/ui";
import { clerkVariables } from "@/app/sign-in/_components/clerkAppearance";
import { AppPreferences } from "./AppPreferences";

const SHORTCUTS: ReadonlyArray<{ href: string; title: string; body: string; icon: ReactNode }> = [
  {
    href: "/newsletter",
    title: "Daily email",
    body: "Topics and send time",
    icon: <IconNewsletter size={20} />,
  },
  {
    href: "/briefings#saved",
    title: "Saved stories",
    body: "Stories you kept to read again",
    icon: <IconBookmark size={20} />,
  },
  {
    href: "/privacy",
    title: "Privacy & data",
    body: "What we keep, and for how long",
    icon: <IconSettings size={20} />,
  },
];

function Shortcuts() {
  return (
    <nav aria-label="Settings shortcuts">
      <ul className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {SHORTCUTS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href as Route}
              className="group flex min-h-[64px] items-center gap-3 rounded-card border border-rule bg-surface px-4 py-3 shadow-soft transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal-soft text-signal">{s.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-ink">{s.title}</span>
                <span className="block truncate text-[13px] text-ink-mute">{s.body}</span>
              </span>
              <IconArrowRight size={18} className="shrink-0 text-ink-faint transition-colors group-hover:text-signal" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AppShell pageTitle="Settings">
        <div role="status" aria-label="Loading settings" className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-card bg-surface-2 animate-pulse-soft" />
            ))}
          </div>
          <div className="h-[420px] rounded-card bg-surface-2 animate-pulse-soft" />
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell pageTitle="Settings">
        <Card padding="lg" className="max-w-md">
          <h2 className="display-sm mb-2">Sign in to see your settings.</h2>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-2">
            Change your topics, your daily email and your account.
          </p>
          <SignInButton mode="modal">
            <button type="button" className={buttonClasses({ variant: "primary" })}>
              Sign in
            </button>
          </SignInButton>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Settings" pageDescription="Your topics, this device and your account">
      <div className="animate-fade-in-up space-y-6 md:space-y-8">
        <Shortcuts />

        <AppPreferences />

        <section aria-labelledby="account-heading">
          <div className="mb-3">
            <h2 id="account-heading" className="display-sm">
              Account
            </h2>
            <p className="mt-1 text-[14.5px] text-ink-mute">
              Your email, password and sign-in. To delete your account, open <span className="font-semibold text-ink-2">Security</span>{" "}
              and choose <span className="font-semibold text-ink-2">Delete account</span>.
            </p>
          </div>
          <UserProfile
            path="/settings"
            appearance={{
              variables: clerkVariables,
              elements: {
                rootBox: "w-full max-w-full",
                cardBox: "w-full max-w-full rounded-card border border-rule shadow-soft",
                card: "w-full max-w-full overflow-hidden bg-surface",
                navbar: "border-r border-rule bg-surface-2",
                navbarButton: "min-h-11 rounded-full text-ink-2 hover:text-ink",
                navbarButtonIcon: "text-current",
                pageScrollBox: "bg-surface",
                headerTitle: "font-display stretch-wide font-extrabold tracking-[-0.02em] text-ink",
                profileSectionTitleText: "font-semibold text-ink",
                formButtonPrimary: "rounded-full font-semibold",
              },
            }}
          />
        </section>
      </div>
    </AppShell>
  );
}
