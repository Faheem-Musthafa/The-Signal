"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { storyKey, type StoryLike } from "./storyUtils";
import { safeExternalUrl } from "@/components/siteUrl";

/**
 * Legacy (pre-account) localStorage key. Saves now live per account under
 * `signal:saved:<userId>` (see `savedStorageKey`); anything still under this key
 * is migrated once into the first account that signs in on this browser.
 */
export const SAVED_STORAGE_KEY = "signal:saved";
const MIGRATED_FLAG_KEY = "signal:saved:migrated";
const CHANGE_EVENT = "signal:saved-change";
const MAX_SAVED = 200;

/** Per-account storage key for saved stories. */
export function savedStorageKey(userId: string): string {
  return `${SAVED_STORAGE_KEY}:${userId}`;
}

export type SavedStory = {
  id: string;
  headline: string;
  category: string;
  summary: string;
  signal: string;
  source: string;
  url?: string;
  importance: number;
  /** epoch ms */
  savedAt: number;
  /** briefing this came from, when known (link back via /share/{shareId}) */
  shareId?: string;
};

const EMPTY: SavedStory[] = [];

// In-memory fallback per key when storage is unavailable (private mode / blocked).
const memoryLists = new Map<string, SavedStory[]>();
// Snapshot cache per key so useSyncExternalStore gets a stable reference.
const snapshotCache = new Map<string, { raw: string | null; list: SavedStory[] }>();
// The signed-in account the hook last saw (for the no-arg readSavedStories()).
let activeUserId: string | null = null;

function sanitize(value: unknown): SavedStory[] {
  if (!Array.isArray(value)) return EMPTY;
  const out: SavedStory[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.headline !== "string") continue;
    out.push({
      id: r.id,
      headline: r.headline,
      category: typeof r.category === "string" ? r.category : "",
      summary: typeof r.summary === "string" ? r.summary : "",
      signal: typeof r.signal === "string" ? r.signal : "",
      source: typeof r.source === "string" ? r.source : "",
      url: safeExternalUrl(r.url) ?? undefined,
      importance: typeof r.importance === "number" ? r.importance : 3,
      savedAt: typeof r.savedAt === "number" ? r.savedAt : typeof r.savedAt === "string" ? Date.parse(r.savedAt) || 0 : 0,
      shareId: typeof r.shareId === "string" ? r.shareId : undefined,
    });
  }
  return out;
}

function readKey(key: string): SavedStory[] {
  if (typeof window === "undefined") return EMPTY;
  const mem = memoryLists.get(key);
  if (mem) return mem;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.list;
  let list: SavedStory[];
  try {
    list = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    list = EMPTY;
  }
  snapshotCache.set(key, { raw, list });
  return list;
}

function writeKey(key: string, list: SavedStory[]) {
  const next = list.slice(0, MAX_SAVED);
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
    memoryLists.delete(key);
  } catch {
    memoryLists.set(key, next); // keep working for this session
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Read saved stories (newest first) for an account. Never throws; safe outside React.
 * With no argument it reads the account currently signed in (as last seen by
 * `useSavedStories`), or [] when signed out.
 */
export function readSavedStories(userId?: string | null): SavedStory[] {
  const id = userId === undefined ? activeUserId : userId;
  return id ? readKey(savedStorageKey(id)) : EMPTY;
}

/** One-time move of legacy `signal:saved` into the first account that signs in here. */
function migrateLegacy(userId: string) {
  try {
    const ls = window.localStorage;
    if (ls.getItem(MIGRATED_FLAG_KEY)) return;
    const raw = ls.getItem(SAVED_STORAGE_KEY);
    ls.setItem(MIGRATED_FLAG_KEY, userId);
    if (!raw) return;
    let legacy: SavedStory[] = EMPTY;
    try {
      legacy = sanitize(JSON.parse(raw));
    } catch {
      legacy = EMPTY;
    }
    ls.removeItem(SAVED_STORAGE_KEY);
    if (legacy.length === 0) return;
    const key = savedStorageKey(userId);
    const current = readKey(key);
    const seen = new Set(current.map((s) => s.id));
    const merged = [...current, ...legacy.filter((s) => !seen.has(s.id))].sort((a, b) => b.savedAt - a.savedAt);
    writeKey(key, merged);
  } catch {
    // storage blocked — nothing to migrate
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(SAVED_STORAGE_KEY)) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getServerSnapshot = () => EMPTY;

export function toSavedStory(story: StoryLike, opts: { shareId?: string } = {}): SavedStory {
  return {
    id: storyKey(story),
    headline: story.headline,
    category: story.category,
    summary: story.summary,
    signal: story.signal,
    source: story.source,
    url: safeExternalUrl(story.url) ?? undefined,
    importance: story.importance,
    savedAt: Date.now(),
    shareId: opts.shareId,
  };
}

/* ───────────────────────── account gate ───────────────────────── */

/**
 * Value-moment gate. Returns a function `(reason) => boolean`:
 * signed in → true; signed out → toasts `reason`, opens Clerk's sign-up modal
 * (returning to this page afterwards) and returns false.
 */
export function useRequireAccount(): (reason: string) => boolean {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  return useCallback(
    (reason: string) => {
      if (isSignedIn) return true;
      if (!isLoaded) {
        toast("One moment — still checking your account");
        return false;
      }
      toast(reason);
      const here = window.location.href;
      try {
        clerk.openSignUp({ fallbackRedirectUrl: here, signInFallbackRedirectUrl: here });
      } catch {
        window.location.assign(`/sign-up?redirect_url=${encodeURIComponent(here)}`);
      }
      return false;
    },
    [clerk, isLoaded, isSignedIn],
  );
}

const SAVE_PROMPT = "Create a free account to keep your saves";

/**
 * Saved stories for the signed-in account (`signal:saved:<userId>`), synced
 * across components and tabs. Returns [] during SSR, the first client render
 * and while signed out. Signed-out `save`/`toggle` store nothing: they prompt
 * sign-up instead and return false.
 */
export function useSavedStories() {
  const { userId } = useAuth();
  const id = userId ?? null;
  const requireAccount = useRequireAccount();

  useEffect(() => {
    activeUserId = id;
    if (id) migrateLegacy(id);
  }, [id]);

  const saved = useSyncExternalStore(
    subscribe,
    () => readSavedStories(id),
    getServerSnapshot,
  );

  const isSaved = useCallback((storyId: string) => saved.some((s) => s.id === storyId), [saved]);

  /** Save (no-op if already saved). Returns true if it was newly saved. Signed out → sign-up prompt, false. */
  const save = useCallback(
    (story: StoryLike, opts: { shareId?: string } = {}) => {
      if (!requireAccount(SAVE_PROMPT) || !id) return false;
      const entry = toSavedStory(story, opts);
      const current = readSavedStories(id);
      if (current.some((s) => s.id === entry.id)) return false;
      writeKey(savedStorageKey(id), [entry, ...current]);
      return true;
    },
    [id, requireAccount],
  );

  const remove = useCallback(
    (storyId: string) => {
      if (!id) return;
      writeKey(savedStorageKey(id), readSavedStories(id).filter((s) => s.id !== storyId));
    },
    [id],
  );

  /** Toggle; returns the new saved state. Signed out → sign-up prompt, false. */
  const toggle = useCallback(
    (story: StoryLike, opts: { shareId?: string } = {}) => {
      if (!requireAccount(SAVE_PROMPT) || !id) return false;
      const sid = storyKey(story);
      if (readSavedStories(id).some((s) => s.id === sid)) {
        remove(sid);
        return false;
      }
      return save(story, opts);
    },
    [id, remove, requireAccount, save],
  );

  const clear = useCallback(() => {
    if (id) writeKey(savedStorageKey(id), []);
  }, [id]);

  return { saved, isSaved, save, remove, toggle, clear, signedIn: !!id };
}
