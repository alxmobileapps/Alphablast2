/**
 * Lightweight, always-on-screen timing log for diagnosing the round-
 * transition freeze WITHOUT needing USB debugging / Chrome DevTools on the
 * device — this shows up directly inside the app, so a plain screenshot
 * after a freeze is enough to see exactly which step took long.
 *
 * Call perfMark('some step') right before and right after any code
 * suspected of blocking the main thread. Each mark records how many
 * milliseconds elapsed since the PREVIOUS mark and shows it in
 * <PerfDebugOverlay/> (mounted once, near the top of App.tsx). Entries
 * over 300ms are highlighted so a multi-second gap is obvious at a glance.
 *
 * Temporary diagnostic tool — remove perfMark() calls and this file once
 * the round-transition freeze is found and fixed.
 */

export interface PerfEntry {
  label: string;
  deltaMs: number;
  atMs: number;
}

const MAX_ENTRIES = 14;
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
