"use client";

import { useSyncExternalStore } from "react";

// One shared 30s ticker for countdowns. Server snapshot is 0, so time-based
// text renders only on the client (no hydration mismatch).
let now = 0;
let timer: number | undefined;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (timer === undefined) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  if (!now) now = Date.now();
  return now;
}

const getServerSnapshot = () => 0;

/** Epoch ms, refreshed every 30 seconds. 0 during SSR and hydration. */
export function useClock(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
