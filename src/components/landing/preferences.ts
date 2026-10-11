"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";

/**
 * Device preferences shared by the landing "Make it yours" picker, Settings and
 * the Daily email page. Everything lives in localStorage (wrapped in try/catch),
 * is synced across components and tabs, and reads as "unset" during SSR.
 *
 * - `signal:selectedTopics` — the dashboard's topic picks (JSON array of topics)
 * - `signal:autoplay` — "true" | "false": Play briefing starts moving on its own
 */
export const TOPICS_STORAGE_KEY = "signal:selectedTopics";
export const AUTOPLAY_STORAGE_KEY = "signal:autoplay";
export const DEFAULT_TOPICS: readonly Topic[] = ["AI & LLMs", "Startup Funding", "Big Tech"];

const CHANGE_EVENT = "signal:prefs-change";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode); the choice still works for this page
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === TOPICS_STORAGE_KEY || e.key === AUTOPLAY_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function sanitizeTopics(value: unknown): Topic[] {
  if (!Array.isArray(value)) return [];
  const out: Topic[] = [];
  for (const item of value) {
    if (typeof item === "string" && (ALLOWED_TOPICS as readonly string[]).includes(item) && !out.includes(item as Topic)) {
      out.push(item as Topic);
    }
  }
  return out;
}

/* ── topics ── */

let topicsRaw: string | null | undefined;
let topicsCache: readonly Topic[] | null = null;

/** Stored topic picks, or null when nothing valid is stored. Never throws. */
export function readStoredTopics(): readonly Topic[] | null {
  if (typeof window === "undefined") return null;
  const raw = readRaw(TOPICS_STORAGE_KEY);
  if (raw === topicsRaw) return topicsCache;
  topicsRaw = raw;
  try {
    const list = raw ? sanitizeTopics(JSON.parse(raw)) : [];
    topicsCache = list.length > 0 ? list : null;
  } catch {
    topicsCache = null;
  }
  return topicsCache;
}

/** Saves topic picks (ignores an empty list so the dashboard always has at least one). */
export function writeStoredTopics(topics: readonly Topic[]) {
  const clean = sanitizeTopics(topics);
  if (clean.length === 0) return;
  writeRaw(TOPICS_STORAGE_KEY, JSON.stringify(clean));
}

const serverTopics = () => null;

/** The stored topic picks (null during SSR / first paint or when unset). */
export function useStoredTopics(): readonly Topic[] | null {
  return useSyncExternalStore(subscribe, readStoredTopics, serverTopics);
}

/* ── autoplay ── */

/** True only when the person turned autoplay on. Default is off (the player waits for Play). */
export function readAutoplayPreference(): boolean {
  if (typeof window === "undefined") return false;
  return readRaw(AUTOPLAY_STORAGE_KEY) === "true";
}

const serverAutoplay = () => false;

export function useAutoplayPreference(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, readAutoplayPreference, serverAutoplay);
  const set = useCallback((next: boolean) => writeRaw(AUTOPLAY_STORAGE_KEY, next ? "true" : "false"), []);
  return [on, set];
}
