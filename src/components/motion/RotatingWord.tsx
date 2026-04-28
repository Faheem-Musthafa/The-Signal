"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * RotatingWord — cycles through a list of words, animating each in.
 * Use inside a headline: "Read the [signal | wire | pulse | brief]."
 */
export function RotatingWord({
  words,
  intervalMs = 2200,
  className = "",
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setI((p) => (p + 1) % words.length), intervalMs);
    return () => window.clearInterval(t);
  }, [words.length, intervalMs]);

  return (
    <span className={`relative inline-block align-baseline overflow-hidden ${className}`}>
      <span className="invisible whitespace-nowrap" aria-hidden>
        {words.reduce((longest, w) => (w.length > longest.length ? w : longest), "")}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[i]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 whitespace-nowrap"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
