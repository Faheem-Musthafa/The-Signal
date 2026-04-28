"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import { SubscribeCard } from "@/components/SubscribeCard";

export default function NewsletterPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AppShell pageTitle="Newsletter">
        <div className="text-sm text-text-muted">Loading session…</div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell pageTitle="Newsletter">
        <div className="elev-1 rounded-xl p-8 max-w-md">
          <p className="text-sm text-text-muted mb-5">Sign in to manage your newsletter subscription.</p>
          <SignInButton mode="modal">
            <button className="px-4 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors">
              Sign in
            </button>
          </SignInButton>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      pageTitle="Newsletter"
      pageDescription="Schedule a daily digest to your inbox"
    >
      <div className="animate-fade-in-up">
        <SubscribeCard initialTopics={["AI & LLMs", "Startup Funding", "Big Tech"]} />
      </div>
    </AppShell>
  );
}
