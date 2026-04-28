"use client";

import { useAuth, SignInButton, UserProfile } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AppShell pageTitle="Settings">
        <div className="dateline">Loading session…</div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell pageTitle="Settings">
        <div className="border-2 border-ink bg-paper-card p-8 max-w-md">
          <div className="eyebrow mb-3">Settings</div>
          <p className="font-display text-2xl font-semibold tracking-tight mb-3">Sign in to continue.</p>
          <p className="text-[14px] text-ink-2 mb-5">Manage your account, topics, and delivery preferences.</p>
          <SignInButton mode="modal">
            <button className="px-5 py-2.5 bg-ink text-paper font-semibold text-[13px] tracking-tight hover:bg-signal transition-colors duration-300">
              Sign in
            </button>
          </SignInButton>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      pageTitle="Settings"
      pageDescription="Account, security, and preferences"
    >
      <div className="animate-fade-in-up space-y-6">
        <div className="flex items-center justify-center md:justify-start">
          <UserProfile
            path="/settings"
            appearance={{
              variables: {
                colorBackground: "#f6efde",
                colorText: "#0e0d0a",
                colorTextSecondary: "#6b6760",
                colorPrimary: "#d6321b",
                colorInputBackground: "#f1e9d6",
                colorInputText: "#0e0d0a",
                borderRadius: "0",
                fontFamily: "var(--font-geist)",
              },
              elements: {
                rootBox: "w-full",
                card: "bg-paper-card shadow-none border-2 border-ink",
                navbar: "border-r border-rule-bold bg-paper-soft",
                navbarButton: "text-ink-mute hover:text-ink",
                pageScrollBox: "bg-paper-card",
              },
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
