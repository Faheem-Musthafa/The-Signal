"use client";

import { useAuth, SignInButton, UserProfile } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AppShell pageTitle="Settings">
        <div className="text-sm text-ink-mute">Loading session…</div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell pageTitle="Settings">
        <div className="bg-white border border-rule rounded-xl shadow-sm p-8 max-w-md">
          <div className="eyebrow mb-3">Settings</div>
          <p className="font-display text-2xl font-semibold tracking-tight mb-3">Sign in to continue.</p>
          <p className="text-[14px] text-ink-2 mb-5">Manage your account, topics, and delivery preferences.</p>
          <SignInButton mode="modal">
            <button className="px-5 py-2.5 rounded-lg bg-signal text-white font-semibold text-[13px] tracking-tight hover:bg-signal-deep transition-colors">
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
                colorBackground: "#ffffff",
                colorText: "#09090b",
                colorTextSecondary: "#71717a",
                colorPrimary: "#2563eb",
                colorInputBackground: "#ffffff",
                colorInputText: "#09090b",
                borderRadius: "0.5rem",
                fontFamily: "var(--font-geist)",
              },
              elements: {
                rootBox: "w-full",
                card: "bg-white shadow-sm border border-rule rounded-xl",
                navbar: "border-r border-rule bg-paper-soft",
                navbarButton: "text-ink-mute hover:text-ink",
                pageScrollBox: "bg-white",
              },
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
