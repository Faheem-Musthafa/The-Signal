"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * "Seen" briefings (reading history on this device), synced across components
 * and tabs. Shared by /briefings (History rings + "New" badges), the briefing
 * page /briefing/[id] (mark as seen when opened) and Settings (clear history).
 *
 *   import { useSeenBriefings, markBriefingSeen, clearSeenBriefings } from "@/app/briefings/useSeenBriefings";
 *   const { isSeen, markSeen } = useSeenBriefings();   // hook
 *   markBriefingSeen(shareId);                          // plain function, safe outside React (no-op on the server)
 *   clearSeenBriefings();                               // forget everything
 */

/** localStorage key: shareIds of briefings the user has already opened. */
export const SEEN_STORAGE_KEY = "signal:seen-briefings";
const CHANGE_EVENT = "signal:seen-change";
const MAX_SEEN = 300;
const EMPTY: readonly string[] = [];

let memoryList: string[] | null = null;
let cachedRaw: string | null | undefined;
let cachedList: readonly string[] = EMPTY;

/** Seen shareIds, newest first. Never throws; empty on the server. */
export function readSeenBriefings(): readonly string[] {
  if (typeof window === "undefined") return EMPTY;
  if (memoryList) return memoryList;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedList = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : EMPTY;
  } catch {
    cachedList = EMPTY;
  }
  return cachedList;
}

function writeSeen(next: string[]) {
  try {
    if (next.length === 0) window.localStorage.removeItem(SEEN_STORAGE_KEY);
    else window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
    memoryList = null;
  } catch {
    memoryList = next;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Mark a briefing as seen. Safe to call from anywhere on the client. */
export function markBriefingSeen(shareId: string) {
  if (typeof window === "undefined" || !shareId) return;
  const current = readSeenBriefings();
  if (current.includes(shareId)) return;
  writeSeen([shareId, ...current].slice(0, MAX_SEEN));
}

/** Forget every seen briefing on this device. */
export function clearSeenBriefings() {
  if (typeof window === "undefined") return;
  writeSeen([]);
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === SEEN_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getServerSnapshot = () => EMPTY;

/** Seen state, synced across tabs. Empty during SSR / first paint. */
export function useSeenBriefings() {
  const seen = useSyncExternalStore(subscribe, readSeenBriefings, getServerSnapshot);
  const isSeen = useCallback((shareId: string) => seen.includes(shareId), [seen]);
  const markSeen = useCallback((shareId: string) => markBriefingSeen(shareId), []);
  return { seen, isSeen, markSeen, clear: clearSeenBriefings };
}
