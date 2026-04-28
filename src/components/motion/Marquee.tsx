"use client";

import type { ReactNode } from "react";

/**
 * Marquee — infinite horizontal scroll. Renders children twice for a seamless loop.
 * Use for the wire-service ticker bar.
 */
export function Marquee({
  children,
  className = "",
  speed = "normal",
}: {
  children: ReactNode;
  className?: string;
  speed?: "normal" | "fast";
}) {
  const animClass = speed === "fast" ? "animate-marquee-fast" : "animate-marquee";
  return (
    <div className={`overflow-hidden ${className}`} style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
      <div className={`flex w-max gap-12 ${animClass}`}>
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
