/**
 * Lightweight timing-log buffer, originally built to diagnose the
 * round-transition freeze WITHOUT needing USB debugging / Chrome DevTools
 * on the device. The on-screen overlay that used to render this buffer
 * (<PerfDebugOverlay/>, top-left corner) has been removed now that the
 * freeze was root-caused and fixed (AdMob.initialize() — see
 * universalAds.ts) — this file just keeps the in-memory buffer so the
 * existing perfMark() call sites throughout App.tsx stay harmless no-ops
 * instead of needing to be stripped out one by one.
 *
 * Call perfMark('some step') right before and right after any code
 * suspected of blocking the main thread. Each mark records how many
 * milliseconds elapsed since the PREVIOUS mark.
 */

export interface PerfEntry {
  label: string;
  deltaMs: number;
  atMs: number;
}

const MAX_ENTRIES = 30;
const entries: PerfEntry[] = [];
let lastMark = performance.now();
const listeners = new Set<() => void>();

export function perfMark(label: string): void {
  const now = performance.now();
  const deltaMs = now - lastMark;
  lastMark = now;
  entries.push({ label, deltaMs, atMs: now });
  if (entries.length > MAX_ENTRIES) entries.shift();
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors — this is a diagnostic overlay, never let
      // it affect the actual app
    }
  });
}

/** Resets the "since last mark" baseline without logging an entry. */
export function perfResetBaseline(): void {
  lastMark = performance.now();
}

export function getPerfEntries(): PerfEntry[] {
  return entries;
}

export function subscribePerf(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
