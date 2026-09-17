"use client";

import { useSyncExternalStore } from "react";

type Draft = { comment: string; timestamp: string };
const empty: Draft = { comment: "", timestamp: "" };
const drafts = new Map<string, Draft>();
const listeners = new Set<() => void>();
const prefix = "videoreview:draft:";

function notify() { listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => {
    if (event.key === null) drafts.clear();
    else if (event.key.startsWith(prefix)) drafts.delete(event.key);
    else return;
    notify();
  };
  window.addEventListener("storage", storage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", storage); };
}

function read(key: string): Draft {
  const existing = drafts.get(key);
  if (existing) return existing;
  let draft = empty;
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? "null");
    if (stored && typeof stored.comment === "string" && typeof stored.timestamp === "string") {
      draft = { comment: stored.comment.slice(0, 2000), timestamp: stored.timestamp.slice(0, 8) };
    }
  } catch { /* Blocked storage or malformed drafts must never prevent commenting. */ }
  drafts.set(key, draft);
  return draft;
}

/** Server snapshot stays empty; browser drafts restore without hydration mismatch. */
export function useReviewDraft(token: string, versionId: number) {
  const key = `${prefix}${token}:${versionId}`;
  const draft = useSyncExternalStore(subscribe, () => read(key), () => empty);
  function update(patch: Partial<Draft>) {
    const next = { ...read(key), ...patch };
    drafts.set(key, next);
    try {
      if (!next.comment && !next.timestamp) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(next));
    } catch { /* Keep the in-memory draft when browser storage is unavailable. */ }
    notify();
  }
  return { ...draft, update, clear: () => update(empty) };
}
