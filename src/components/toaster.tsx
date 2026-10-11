"use client";

import { useSyncExternalStore } from "react";
import { Toaster as Sonner } from "sonner";

/** Matches the AppShell breakpoint (md): below it there's a bottom tab bar + sticky bottom CTAs. */
const MOBILE_QUERY = "(max-width: 767px)";

function subscribeMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * App-wide toast host. Dark pills so they read on paper AND over the coloured
 * StoryPlayer. Mobile: top-center (below the notch), so they never cover the
 * bottom tab bar or sticky bottom CTAs. Desktop: bottom-center.
 * Sits above the story overlay.
 */
export function Toaster() {
  const mobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

  return (
    <Sonner
      position={mobile ? "top-center" : "bottom-center"}
      theme="light"
      gap={8}
      offset={24}
      mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)", left: 12, right: 12 }}
      toastOptions={{
        style: {
          background: "var(--ink)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          color: "#ffffff",
          boxShadow: "0 18px 40px -16px rgba(14, 18, 32, 0.55)",
          fontFamily: "var(--font-geist), system-ui, sans-serif",
          fontSize: "15px",
        },
        classNames: {
          description: "!text-white/75 !text-[13px]",
          actionButton: "!bg-white !text-ink !rounded-full !font-semibold !text-[13px]",
          cancelButton: "!bg-white/10 !text-white !rounded-full !text-[13px]",
          success: "[&_[data-icon]]:!text-[#7ee2b8]",
          error: "[&_[data-icon]]:!text-[#ff9a85]",
        },
      }}
    />
  );
}
