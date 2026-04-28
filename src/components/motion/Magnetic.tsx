"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, type ReactNode, type MouseEvent } from "react";

/**
 * MagneticButton — wraps an interactive element with cursor-magnet motion.
 * Subtle: button shifts ~8px toward the cursor while hovered.
 */
export function MagneticButton({
  children,
  className = "",
  onClick,
  strength = 0.35,
  as = "button",
  href,
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
  as?: "button" | "a";
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const inner =
    as === "a" ? (
      <motion.a
        href={href}
        className={className}
        style={{ x: sx, y: sy }}
        aria-label={ariaLabel}
      >
        {children}
      </motion.a>
    ) : (
      <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={{ x: sx, y: sy }}
        aria-label={ariaLabel}
      >
        {children}
      </motion.button>
    );

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="inline-block"
    >
      {inner}
    </div>
  );
}
