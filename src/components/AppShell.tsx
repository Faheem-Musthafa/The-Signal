"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

type NavItem = {
  label: string;
  href: Route;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="0"></rect>
        <rect x="14" y="3" width="7" height="5" rx="0"></rect>
        <rect x="14" y="12" width="7" height="9" rx="0"></rect>
        <rect x="3" y="16" width="7" height="5" rx="0"></rect>
      </svg>
    ),
  },
  {
    label: "Briefings",
    href: "/briefings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 3v5h5"></path>
        <path d="M9 13h6"></path>
        <path d="M9 17h4"></path>
      </svg>
    ),
  },
  {
    label: "Newsletter",
    href: "/newsletter",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="0"></rect>
        <path d="m3 7 9 6 9-6"></path>
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings" as Route,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ),
  },
];

function SignalGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M2 16c5 0 5-9 11-9s5 18 11 18 5-9 6-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

type AppShellProps = {
  children: React.ReactNode;
  pageTitle: string;
  pageDescription?: string;
  rightSlot?: React.ReactNode;
  quotaUsed?: number;
  quotaLimit?: number;
};

export function AppShell({ children, pageTitle, pageDescription, rightSlot, quotaUsed, quotaLimit = 3 }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const usage = typeof quotaUsed === "number" ? quotaUsed : null;
  const remaining = usage !== null ? Math.max(0, quotaLimit - usage) : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
      {/* Sidebar */}
      <aside
        aria-label="Primary navigation"
        className={`fixed top-0 left-0 z-40 flex h-dvh w-[min(86vw,280px)] flex-col border-r border-rule bg-paper transition-transform duration-200 md:h-screen md:w-[260px] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Masthead */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-6 pb-4 sm:pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-signal text-white">
                <SignalGlyph size={18} />
              </span>
              <div>
                <span className="block text-[16px] font-semibold tracking-tight leading-none">
                  The Signal
                </span>
                <span className="block mt-1 text-[11px] text-ink-mute leading-none">
                  Tech intelligence
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-mute hover:bg-paper-deep hover:text-ink md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-dim">Workspace</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-11 items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${
                      isActive
                        ? "text-signal bg-signal-soft"
                        : "text-ink-mute hover:text-ink hover:bg-paper-deep"
                    }`}
                  >
                    <span className={isActive ? "text-signal" : "text-ink-dim"}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-rule">
          {usage !== null && (
            <div className="mb-4 rounded-xl border border-rule bg-paper-soft p-3">
              <div className="flex items-center justify-between mb-2 text-[11px] font-medium">
                <span className="text-ink-mute">Daily quota</span>
                <span className="text-ink tabular-nums">{usage}/{quotaLimit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-paper-deep overflow-hidden">
                <div
                  className="h-full rounded-full bg-signal transition-all"
                  style={{ width: `${Math.min(100, (usage / quotaLimit) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-ink-mute">
                {remaining} {remaining === 1 ? "briefing" : "briefings"} left today
              </p>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
            <span className="text-[11px] text-ink-dim">v1.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-ink/60 backdrop-blur-sm"
        />
      )}

      {/* Main */}
      <div className="md:pl-[260px] min-h-screen bg-paper-soft">
        <header className="sticky top-0 z-20 h-14 border-b border-rule bg-paper/80 backdrop-blur-md flex items-center px-3 sm:px-4 md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden mr-2 sm:mr-3 w-11 h-11 flex items-center justify-center rounded-lg text-ink-mute hover:text-ink hover:bg-paper-deep"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="flex-1 flex items-center gap-3 min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight truncate leading-none">{pageTitle}</h1>
            {pageDescription && (
              <>
                <span className="hidden sm:inline text-ink-faint">/</span>
                <p className="text-[13px] text-ink-mute truncate hidden sm:block">{pageDescription}</p>
              </>
            )}
          </div>

          {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
        </header>

        <main className="w-full max-w-[1280px] px-4 py-6 sm:py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
