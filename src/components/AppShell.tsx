"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import { MotionConfig, motion } from "motion/react";
import { Logo } from "@/components/ui/Logo";
import { QuotaBattery } from "@/components/ui/QuotaBattery";
import { IconBriefings, IconNewsletter, IconSettings, IconToday } from "@/components/ui/icons";
import { haptic } from "@/components/story/storyUtils";
import { QUOTA_CHANGED_EVENT, fetchQuota, formatResetTime, quotaLabel, type QuotaInfo } from "@/lib/quota";

// Re-exported for existing callers: import { QuotaInfo, formatResetTime } from "@/components/AppShell"
export { formatResetTime };
export type { QuotaInfo };

type NavItem = {
  label: string;
  href: Route;
  Icon: (p: { size?: number; strokeWidth?: number }) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Today", href: "/", Icon: IconToday },
  { label: "History", href: "/briefings" as Route, Icon: IconBriefings },
  { label: "Daily email", href: "/newsletter" as Route, Icon: IconNewsletter },
  { label: "Settings", href: "/settings" as Route, Icon: IconSettings },
];

type AppShellProps = {
  children: React.ReactNode;
  pageTitle: string;
  pageDescription?: string;
  rightSlot?: React.ReactNode;
  /**
   * Daily quota for the meter. Leave undefined to let the shell fetch `/api/usage`
   * itself (signed-in users only); pass null to hide the meter.
   */
  quota?: QuotaInfo | null;
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

const indicatorSpring = { type: "spring", stiffness: 520, damping: 40 } as const;

/**
 * The quota to show: the `quota` prop when the page passes one (or null), otherwise
 * self-fetched from /api/usage for signed-in users, refreshed when the tab regains
 * focus and whenever something calls `announceQuota()` from "@/lib/quota".
 */
function useShellQuota(quotaProp: QuotaInfo | null | undefined): QuotaInfo | null {
  const { isSignedIn } = useAuth();
  const selfFetch = quotaProp === undefined && isSignedIn === true;
  const [fetched, setFetched] = useState<QuotaInfo | null>(null);

  useEffect(() => {
    if (!selfFetch) return;
    let ctrl = new AbortController();
    const load = () => {
      ctrl.abort();
      ctrl = new AbortController();
      const { signal } = ctrl;
      void fetchQuota(signal).then((q) => {
        if (!signal.aborted && q) setFetched(q);
      });
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    const onAnnounce = (e: Event) => {
      const detail = (e as CustomEvent<QuotaInfo | null>).detail;
      if (detail) setFetched(detail);
      else load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(QUOTA_CHANGED_EVENT, onAnnounce);
    return () => {
      ctrl.abort();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(QUOTA_CHANGED_EVENT, onAnnounce);
    };
  }, [selfFetch]);

  if (quotaProp !== undefined) return quotaProp;
  return isSignedIn ? fetched : null;
}

export function AppShell({ children, pageTitle, pageDescription, rightSlot, quota: quotaProp }: AppShellProps) {
  const pathname = usePathname() ?? "/";
  const quota = useShellQuota(quotaProp);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh overflow-x-clip bg-paper text-ink">
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>

        {/* ── Desktop: slim left rail ── */}
        <aside
          aria-label="Sidebar"
          className="fixed inset-y-0 left-0 z-40 hidden w-[var(--rail-w)] flex-col items-center border-r border-rule bg-surface/85 py-5 backdrop-blur-xl md:flex"
        >
          <Logo href="/" wordmark={false} size="md" />

          <nav aria-label="Primary" className="mt-9">
            <ul className="flex flex-col gap-1.5">
              {NAV_ITEMS.map(({ label, href, Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex min-h-[56px] w-[76px] flex-col items-center gap-1 rounded-[14px] px-1 py-2.5 text-center text-[12px] font-semibold leading-tight tracking-[-0.005em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                        active ? "text-signal" : "text-ink-mute hover:bg-ink/[0.045] hover:text-ink"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="rail-active"
                          transition={indicatorSpring}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-[14px] bg-signal-soft"
                        />
                      )}
                      {active && (
                        <motion.span
                          layoutId="rail-active-bar"
                          transition={indicatorSpring}
                          aria-hidden="true"
                          className="absolute -left-[10px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-signal"
                        />
                      )}
                      <span className="relative">
                        <Icon size={22} strokeWidth={active ? 2.2 : 1.9} />
                      </span>
                      <span className="relative">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col items-center gap-4">
            {quota && (
              <div
                className="flex w-[76px] flex-col items-center gap-1.5 rounded-[14px] bg-surface-2 px-1 py-2.5"
                title={`${quotaLabel(quota)}. ${formatResetTime(quota.resetsAt)}`}
              >
                <span aria-hidden="true" className="inline-flex">
                  <QuotaBattery quota={quota} variant="cells" />
                </span>
                <span className="font-mono text-[14px] font-semibold tabular-nums text-ink" aria-hidden="true">
                  {Math.max(0, quota.remaining)} of {quota.limit}
                </span>
                <span className="text-center text-[12px] font-medium leading-tight text-ink-mute" aria-hidden="true">
                  Briefings left today
                </span>
                <span className="sr-only">{quotaLabel(quota)}</span>
              </div>
            )}
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            <nav aria-label="Legal" className="flex flex-col items-center gap-0.5 text-[12px] font-medium text-ink-mute">
              <Link href={"/privacy" as Route} className="rounded px-1 py-0.5 transition-colors hover:text-ink">
                Privacy
              </Link>
              <Link href={"/terms" as Route} className="rounded px-1 py-0.5 transition-colors hover:text-ink">
                Terms
              </Link>
            </nav>
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="md:pl-[var(--rail-w)]">
          <header className="pt-safe sticky top-0 z-30 border-b border-rule/80 bg-paper/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-3 px-4 md:h-[68px] md:px-8">
              <span className="md:hidden">
                <Logo href="/" wordmark={false} size="sm" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="font-display stretch-wide truncate text-[18px] font-extrabold leading-none tracking-[-0.02em] md:text-[22px]">
                  {pageTitle}
                </h1>
                {pageDescription && (
                  <p className="mt-1.5 hidden truncate text-[12.5px] leading-none text-ink-mute sm:block">{pageDescription}</p>
                )}
              </div>
              {rightSlot && <div className="flex shrink-0 items-center gap-2">{rightSlot}</div>}
              {quota && (
                <span
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[12px] font-semibold tabular-nums text-ink-2 shadow-[inset_0_0_0_1px_rgb(var(--rule-rgb))] md:hidden"
                  title={`${quotaLabel(quota)}. ${formatResetTime(quota.resetsAt)}`}
                >
                  <span aria-hidden="true" className="inline-flex">
                    <QuotaBattery quota={quota} variant="cells" />
                  </span>
                  <span aria-hidden="true">
                    {Math.max(0, quota.remaining)}/{quota.limit} left
                  </span>
                  <span className="sr-only">{quotaLabel(quota)}</span>
                </span>
              )}
              <span className="flex shrink-0 items-center md:hidden">
                <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
              </span>
            </div>
          </header>

          <main
            id="main"
            className="mx-auto w-full max-w-[1280px] px-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px)+28px)] pt-5 sm:pt-7 md:px-8 md:pb-14 md:pt-9"
          >
            {children}

            {/* legal links for mobile (the rail carries them on desktop) */}
            <nav aria-label="Legal" className="mt-14 flex justify-center gap-5 text-[13px] text-ink-mute md:hidden">
              <Link href={"/privacy" as Route} className="py-2 hover:text-ink">
                Privacy
              </Link>
              <Link href={"/terms" as Route} className="py-2 hover:text-ink">
                Terms
              </Link>
            </nav>
          </main>

        </div>

        {/* ── Mobile: bottom tab bar ── */}
        <nav
          aria-label="Primary"
          className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/90 backdrop-blur-xl md:hidden"
        >
          <ul className="mx-auto grid h-[var(--tabbar-h)] max-w-lg grid-cols-4">
            {NAV_ITEMS.map(({ label, href, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href} className="h-full">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => haptic(6)}
                    className={`flex h-full flex-col items-center justify-center gap-0.5 whitespace-nowrap text-[12px] font-semibold leading-tight tracking-[-0.005em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-signal active:scale-95 ${
                      active ? "text-signal" : "text-ink-mute"
                    }`}
                  >
                    <span className="relative flex h-8 w-14 items-center justify-center">
                      {active && (
                        <motion.span
                          layoutId="tab-active"
                          transition={indicatorSpring}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-signal-soft"
                        />
                      )}
                      <span className="relative">
                        <Icon size={22} strokeWidth={active ? 2.2 : 1.9} />
                      </span>
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </MotionConfig>
  );
}
