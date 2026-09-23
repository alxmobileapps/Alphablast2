import { Category, CustomGameMode } from '../types';
import { registerCustomCategory } from '../data/dictionary';

export const CUSTOM_CATEGORY_DURATION_MS = 60 * 60 * 1000; // 1 Hour (3,600,000 ms)
export const CUSTOM_CATEGORY_DIAMOND_COST = 10;
export const DEFAULT_TIMER_SECONDS = 120; // 2 Minutes

const STORAGE_KEY = 'word_blast_custom_categories_v2';

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
 * Creates and publishes a custom category (persisted in local storage and active for 1 hour).
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
  return updatedCategory;
}

/**
 * Subscribes to all active (unexpired) community categories with real-time updates.
 */
export function subscribeToActiveCustomCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const notify = () => {
      const active = getStoredCategories();
      active.forEach((cat) => registerCustomCategory(cat));
      onUpdate(active);
    };

    // Initial emit
    notify();

    // Listen for cross-tab or local updates
    const handleStorage = () => notify();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('custom-categories-updated', handleStorage);

    // Periodic cleanup of expired categories every 30s
    const timer = setInterval(() => {
      notify();
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('custom-categories-updated', handleStorage);
      clearInterval(timer);
    };
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Increments play count for a custom category.
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
}
