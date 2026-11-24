"use client";

import { useSyncExternalStore } from "react";

/** What a saved or recently viewed role keeps on this device; no account is involved. */
export type StoredJob = {
  id: string;
  title: string;
  company: string;
  where: string;
  deadline: string;
};

const SAVED = "akazi-saved";
const RECENT = "akazi-recent";
const RECENT_LIMIT = 12;
const CHANGE = "akazi-jobs-change";
const EMPTY: StoredJob[] = [];

const snapshots = new Map<string, { raw: string | null; list: StoredJob[] }>();

function read(key: string): StoredJob[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.list;
  let list: StoredJob[] = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) {
      list = parsed.filter(
        (item): item is StoredJob =>
          Boolean(item) && typeof item.id === "string" && typeof item.title === "string" && typeof item.company === "string",
      );
    }
  } catch {
    list = EMPTY;
  }
  snapshots.set(key, { raw, list });
  return list;
}

function write(key: string, list: StoredJob[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Private windows can refuse storage; saving then just does nothing.
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(notify: () => void) {
  window.addEventListener(CHANGE, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CHANGE, notify);
    window.removeEventListener("storage", notify);
  };
}

export function useSavedJobs() {
  return useSyncExternalStore(subscribe, () => read(SAVED), () => EMPTY);
}

export function useRecentJobs() {
  return useSyncExternalStore(subscribe, () => read(RECENT), () => EMPTY);
}

export function toggleSaved(job: StoredJob) {
  const list = read(SAVED);
  write(SAVED, list.some((item) => item.id === job.id) ? list.filter((item) => item.id !== job.id) : [job, ...list]);
}

export function removeSaved(id: string) {
  write(
    SAVED,
    read(SAVED).filter((item) => item.id !== id),
  );
}

export function rememberViewed(job: StoredJob) {
  write(RECENT, [job, ...read(RECENT).filter((item) => item.id !== job.id)].slice(0, RECENT_LIMIT));
}

export function clearRecent() {
  write(RECENT, []);
}
