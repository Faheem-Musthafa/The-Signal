"use client";

import { useEffect, useState } from "react";
import { SignUpButton } from "@clerk/nextjs";
import { IconArrowRight, buttonClasses } from "@/components/ui";

const DEFAULT_WATCH: readonly string[] = ["hero-cta", "final-cta"];

/**
 * Mobile-only primary CTA pinned in the thumb zone. It stays out of the way
 * while the hero (or final) call-to-action is on screen, then slides in.
 */
export function StickyCta({ watchIds = DEFAULT_WATCH }: { watchIds?: readonly string[] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const targets = watchIds.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setShow(visible.size === 0);
      },
      { threshold: 0 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [watchIds]);

  return (
    <div
      className={`pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/90 px-4 pt-3 backdrop-blur-md transition-[transform,opacity] duration-300 ease-out-expo motion-reduce:transition-none md:hidden ${
        show ? "translate-y-0 opacity-100" : "invisible translate-y-full opacity-0"
      }`}
    >
      <div className="pb-3">
        <SignUpButton mode="modal">
          <button type="button" className={buttonClasses({ size: "lg", fullWidth: true })}>
            Get my briefing — free
            <IconArrowRight />
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}
