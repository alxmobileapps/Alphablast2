import { Category, CustomGameMode } from '../types';
import { registerCustomCategory } from '../data/dictionary';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export const CUSTOM_CATEGORY_DURATION_MS = 60 * 60 * 1000; // 1 Hour (3,600,000 ms)
export const CUSTOM_CATEGORY_DIAMOND_COST = 10;
export const DEFAULT_TIMER_SECONDS = 120; // 2 Minutes

const STORAGE_KEY = 'word_blast_custom_categories_v2';

// Global "Public Shelf" — every published custom category is written here so it
// becomes visible, in real time, to every other device (and the website), not
// just other browser tabs on the same machine.
const CUSTOM_CATEGORIES_COLLECTION = 'custom_categories';

export interface CreateCustomCategoryInput {
  name: string;
  icon: string;
  words: string[];
  creatorName: string;
  color?: string;
  targetCount?: number;
  gameMode?: CustomGameMode;
  timerSeconds?: number;
}

/**
 * Normalizes words for custom categories:
 * - Uppercase
 * - Trim and strip special characters
 * - Only keeps valid length (3-8 letters)
 * - Removes duplicates
 */
export function sanitizeCategoryWords(rawWords: string[]): string[] {
  const set = new Set<string>();
  for (const raw of rawWords) {
    const clean = raw
      .toUpperCase()
      .trim()
      .replace(/[^A-Z]/g, '');
    if (clean.length >= 3 && clean.length <= 8) {
      set.add(clean);
    }
  }
  const result = Array.from(set);
  result.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return result;
}

function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: Category[] = JSON.parse(raw);
    const now = Date.now();
    // Filter only non-expired
    const active = list.filter((c) => (c.expiresAt ? c.expiresAt > now : true));
    return active;
  } catch {
    return [];
  }
}

function saveStoredCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    // Trigger storage event for same-tab / multi-tab listeners
    window.dispatchEvent(new Event('custom-categories-updated'));
  } catch (e) {
    console.warn('Failed to save custom category locally:', e);
  }
}

/**
 * Converts a Category into a plain object safe to write to Firestore
 * (Firestore rejects `undefined` field values).
 */
function categoryToFirestoreData(cat: Category): DocumentData {
  const data: DocumentData = {
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    targetCount: cat.targetCount,
    words: cat.words,
    color: cat.color,
    isCustom: true,
    creatorName: cat.creatorName || 'Player',
    createdAt: cat.createdAt || Date.now(),
    expiresAt: cat.expiresAt,
    firestoreDocId: cat.firestoreDocId,
    plays: cat.plays || 0,
    gameMode: cat.gameMode || 'target',
    updatedAt: serverTimestamp(),
  };
  if (cat.timerSeconds !== undefined) {
    data.timerSeconds = cat.timerSeconds;
  }
  return data;
}

function firestoreDocToCategory(docSnap: QueryDocumentSnapshot<DocumentData>): Category {
  const d = docSnap.data();
  return {
    id: Number(d.id) || 0,
    name: d.name || 'Custom Game',
    icon: d.icon || '⭐',
    targetCount: Number(d.targetCount) || 8,
    words: Array.isArray(d.words) ? d.words : [],
    color: d.color || 'purple',
    isCustom: true,
    creatorName: d.creatorName || 'Player',
    createdAt: Number(d.createdAt) || Date.now(),
    expiresAt: Number(d.expiresAt) || 0,
    firestoreDocId: d.firestoreDocId || docSnap.id,
    plays: Number(d.plays) || 0,
    gameMode: d.gameMode || 'target',
    timerSeconds: d.timerSeconds !== undefined ? Number(d.timerSeconds) : undefined,
  };
}

/**
 * Publishes the category to the global Firestore "Public Shelf" so it becomes
 * visible in real time to other players' devices and to the website. Runs in
 * the background — publishing never blocks on the network, and if it fails
 * (offline, etc.) the category still works locally for its creator.
 */
function syncCategoryToFirestore(cat: Category): void {
  if (!cat.firestoreDocId) return;
  try {
    setDoc(doc(db, CUSTOM_CATEGORIES_COLLECTION, cat.firestoreDocId), categoryToFirestoreData(cat), {
      merge: true,
    }).catch((err) => {
      console.warn('Firestore custom category publish background notice:', err);
    });
  } catch (err) {
    console.warn('Firestore custom category publish notice:', err);
  }
}

/**
 * Creates and publishes a custom category (persisted locally for the creator's
 * own device, and synced to Firestore so it's active — and visible to everyone
 * else — for 1 hour).
 */
export async function publishCustomCategory(
  input: CreateCustomCategoryInput
): Promise<Category> {
  const targetCount = Math.max(3, Math.min(30, input.targetCount || 8));
  const minRequiredWords = input.gameMode === 'timer' ? 5 : Math.max(5, targetCount);
  const cleanWords = sanitizeCategoryWords(input.words);

  if (cleanWords.length < minRequiredWords) {
    throw new Error(
      `Please provide at least ${minRequiredWords} valid theme words (target goal: ${targetCount} words). Currently provided: ${cleanWords.length}.`
    );
  }

  const now = Date.now();
  const expiresAt = now + CUSTOM_CATEGORY_DURATION_MS;
  const numericId = 20000 + Math.floor(Math.random() * 79000);
  const docId = `custom-cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const createdCategory: Category = {
    id: numericId,
    name: input.name.trim().substring(0, 30),
    icon: input.icon.trim() || '⭐',
    targetCount,
    words: cleanWords,
    color: input.color || 'purple',
    isCustom: true,
    creatorName: input.creatorName.trim().substring(0, 24) || 'Player',
    createdAt: now,
    expiresAt,
    firestoreDocId: docId,
    plays: 0,
    gameMode: input.gameMode || 'target',
    timerSeconds: input.timerSeconds || (input.gameMode === 'timer' ? DEFAULT_TIMER_SECONDS : undefined),
  };

  const existing = getStoredCategories();
  const updated = [createdCategory, ...existing];
  saveStoredCategories(updated);

  // Register in runtime dictionary immediately
  registerCustomCategory(createdCategory);

  // Publish to the shared Public Shelf (background — does not block the UI)
  syncCategoryToFirestore(createdCategory);

  return createdCategory;
}

/**
 * Updates an existing custom category (e.g. changing timer duration, name, icon, words).
 */
export function updateCustomCategory(
  id: number | string,
  updates: Partial<Category>
): Category | null {
  const existing = getStoredCategories();
  const index = existing.findIndex((c) => c.id === Number(id) || c.firestoreDocId === String(id));
  if (index === -1) return null;

  const current = existing[index];
  const updatedCategory: Category = {
    ...current,
    ...updates,
  };

  if (updates.words) {
    updatedCategory.words = sanitizeCategoryWords(updates.words);
    registerCustomCategory(updatedCategory);
  }

  existing[index] = updatedCategory;
  saveStoredCategories(existing);

  // Keep the Public Shelf in sync with the edit
  syncCategoryToFirestore(updatedCategory);

  return updatedCategory;
}

// Cache of the most recent live Firestore snapshot, shared by every active
// subscription so we can re-filter expired entries on a timer without
// re-querying the network.
let latestRemoteCategories: Category[] = [];

function mergeLocalAndRemote(local: Category[], remote: Category[]): Category[] {
  const now = Date.now();
  const byDocId = new Map<string, Category>();

  // Remote (the shared Public Shelf) is the source of truth for anything it has.
  for (const cat of remote) {
    if (!cat.expiresAt || cat.expiresAt > now) {
      byDocId.set(cat.firestoreDocId || String(cat.id), cat);
    }
  }
  // Fold in local-only categories (e.g. published while offline, not yet synced).
  for (const cat of local) {
    const key = cat.firestoreDocId || String(cat.id);
    if (!byDocId.has(key)) {
      byDocId.set(key, cat);
    }
  }

  return Array.from(byDocId.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Subscribes to all active (unexpired) community categories with real-time
 * updates. Combines the shared Firestore "Public Shelf" (visible to every
 * player and to the website) with same-device local storage as an offline
 * fallback, so publishing still works instantly even without a connection.
 */
export function subscribeToActiveCustomCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    // notify() runs on a 15s timer, on every Firestore snapshot and on every
    // local write. Only push a new list into React (which re-renders the
    // whole App, mid-game included) and only re-index a category's words
    // when something actually changed — otherwise the game got a needless
    // full re-render every 15 seconds while playing.
    let lastListSignature = '';
    const registeredSignatures = new Map<number, string>();
    const categorySignature = (c: Category) =>
      [
        c.firestoreDocId || c.id,
        c.name,
        c.icon,
        c.color,
        c.targetCount,
        c.gameMode,
        c.timerSeconds ?? '',
        c.expiresAt ?? '',
        c.plays ?? 0,
        c.creatorName ?? '',
        (c.words || []).join(','),
      ].join('|');

    const notify = () => {
      const local = getStoredCategories();
      const merged = mergeLocalAndRemote(local, latestRemoteCategories);
      const sigs = merged.map(categorySignature);

      merged.forEach((cat, i) => {
        if (registeredSignatures.get(cat.id) !== sigs[i]) {
          registerCustomCategory(cat);
          registeredSignatures.set(cat.id, sigs[i]);
        }
      });

      const listSignature = sigs.join('\n');
      if (listSignature === lastListSignature) return;
      lastListSignature = listSignature;
      onUpdate(merged);
    };

    // Initial emit (local cache, so the UI has something immediately)
    notify();

    // Listen for cross-tab or local updates
    const handleStorage = () => notify();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('custom-categories-updated', handleStorage);

    // Periodic re-filter so entries that just expired drop out even without
    // a new Firestore snapshot or local write arriving.
    const pruneTimer = setInterval(notify, 15000);

    // Live subscription to the shared Public Shelf
    let unsubscribeFirestore: () => void = () => {};
    try {
      const q = query(
        collection(db, CUSTOM_CATEGORIES_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      unsubscribeFirestore = onSnapshot(
        q,
        (snap) => {
          latestRemoteCategories = snap.docs.map((d) => firestoreDocToCategory(d));
          notify();
        },
        (err) => {
          console.warn('Firestore custom categories live subscription notice:', err);
          if (onError) onError(err as unknown as Error);
        }
      );
    } catch (err: any) {
      console.warn('Could not start Firestore custom categories subscription:', err);
      if (onError) onError(err);
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('custom-categories-updated', handleStorage);
      clearInterval(pruneTimer);
      unsubscribeFirestore();
    };
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Increments play count for a custom category, both locally and on the
 * shared Public Shelf.
 */
export async function recordCategoryPlay(firestoreDocId?: string) {
  if (!firestoreDocId) return;
  try {
    const existing = getStoredCategories();
    const target = existing.find((c) => c.firestoreDocId === firestoreDocId || String(c.id) === firestoreDocId);
    if (target) {
      target.plays = (target.plays || 0) + 1;
      saveStoredCategories(existing);
    }
  } catch {
    // Non-critical, ignore
  }

  try {
    await updateDoc(doc(db, CUSTOM_CATEGORIES_COLLECTION, firestoreDocId), {
      plays: increment(1),
    });
  } catch (err) {
    // Non-critical (e.g. category was creator-local only, or offline)
    console.warn('Firestore custom category play-count sync notice:', err);
  }
}
