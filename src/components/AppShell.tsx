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

  const usage = typeof quotaUsed === "number" ? quotaUsed : null;
  const remaining = usage !== null ? Math.max(0, quotaLimit - usage) : null;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-[260px] border-r border-rule-bold bg-paper-soft flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Masthead */}
        <div className="px-5 pt-6 pb-5 border-b-2 border-ink">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-signal"><SignalGlyph size={22} /></span>
            <span className="font-display text-[20px] font-semibold tracking-tight leading-none">
              The Signal
            </span>
          </div>
          <div className="dateline">Editorial Wire Service</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-2 dateline mb-4">Workspace</p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium transition-colors relative ${
                      isActive
                        ? "text-ink bg-paper-card"
                        : "text-ink-mute hover:text-ink hover:bg-paper-card/60"
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-signal" />}
                    <span className={isActive ? "text-signal" : "text-ink-dim"}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4 py-5 border-t border-rule-bold bg-paper-card">
          {usage !== null && (
            <div className="mb-4">
              <div className="flex items-center justify-between dateline mb-2">
                <span>Daily quota</span>
                <span className="text-ink">{usage}/{quotaLimit}</span>
              </div>
              <div className="h-[3px] bg-rule overflow-hidden">
                <div
                  className="h-full bg-signal transition-all"
                  style={{ width: `${Math.min(100, (usage / quotaLimit) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-ink-mute font-mono">
                {remaining} {remaining === 1 ? "briefing" : "briefings"} left today
              </p>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
            <span className="dateline">v1.0</span>
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
      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-20 h-14 border-b border-rule-bold bg-paper/85 backdrop-blur-md flex items-center px-4 md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden mr-3 w-8 h-8 flex items-center justify-center text-ink-mute hover:text-ink hover:bg-paper-card"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="flex-1 flex items-center gap-3 min-w-0">
            <h1 className="font-display text-[18px] font-semibold tracking-tight truncate leading-none">{pageTitle}</h1>
            {pageDescription && (
              <>
                <span className="text-rule-strong">/</span>
                <p className="text-[12px] text-ink-mute truncate hidden sm:block">{pageDescription}</p>
              </>
            )}
          </div>

          {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
        </header>

        <main className="px-4 md:px-8 py-8 md:py-10 max-w-[1280px]">
          {children}
        </main>
      </div>
    </div>
  );
}
