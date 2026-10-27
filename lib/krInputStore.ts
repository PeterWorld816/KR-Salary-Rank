// The visitor's income input, kept out of the address bar. Lives in memory
// (shared by every component through useKrInput) and in sessionStorage so it
// survives navigation and reloads within the tab — and nowhere else: never
// sent to a server, gone when the tab closes.
//
// The only time `d`/`o` appear in a URL is a share link (buildKrShareSearch in
// lib/krInput.ts). consumeKrInputFromUrl() reads them — and old `?d=` links —
// into this store, then strips them with history.replaceState so the address
// bar goes back to a clean path.
import { useSyncExternalStore } from "react";
import { DEFAULT_KR_INPUT, readKrInputFromSearch, type KrInput } from "@/lib/krInput";

const STORAGE_KEY = "kr-input";
const URL_KEYS = ["d", "o", "lang"];

type Stored = { input: KrInput; touched: boolean }; // touched = the visitor set a value at least once

const SERVER_SNAPSHOT: Stored = { input: DEFAULT_KR_INPUT, touched: false };
let current: Stored | null = null;
const listeners = new Set<() => void>();

function load(): Stored {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<KrInput>;
      const input = readKrInputFromSearch({
        get: (k) => (k === "d" ? String(parsed.annualIncome ?? "") : k === "o" ? parsed.occupationId ?? null : null),
      });
      return { input, touched: true };
    }
  } catch {
    // Storage blocked (private mode etc.) — fall back to the in-memory default.
  }
  return SERVER_SNAPSHOT;
}

function getSnapshot(): Stored {
  if (current == null) current = typeof window === "undefined" ? SERVER_SNAPSHOT : load();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setKrInput(input: KrInput) {
  current = { input, touched: true };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // Keep working in memory only.
  }
  listeners.forEach((l) => l());
}

export function getKrInputState(): Stored {
  return getSnapshot();
}

export function useKrInputState(): Stored {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function useKrInput(): KrInput {
  return useKrInputState().input;
}

// Call once on mount (KrInputPanel does). Returns true if the URL carried input.
export function consumeKrInputFromUrl(): boolean {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("d") && !url.searchParams.has("o")) return false;
  const fromUrl = readKrInputFromSearch(url.searchParams);
  const base = getSnapshot().input;
  setKrInput({
    annualIncome: url.searchParams.get("d") ? fromUrl.annualIncome : base.annualIncome,
    occupationId: url.searchParams.get("o") ? fromUrl.occupationId : base.occupationId,
  });
  for (const key of URL_KEYS) url.searchParams.delete(key);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
}
