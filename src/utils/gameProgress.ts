import { INITIAL_CATEGORIES } from '../data/categories';
import { Category } from '../types';

const STORAGE_KEY_PROGRESS = 'word_blast_device_progress_v2';

export interface GameProgress {
  unlockedCategoryIds: number[];
  completedCategoryIds: number[];
  lastPlayedCategoryId: number;
  categoryHighScores: Record<number, number>;
  categoryStars: Record<number, number>;
  totalRoundsCleared: number;
  lastUpdated: number;
  coins: number;
  diamonds: number;
  awarded10kMilestones?: number[];
  awarded15kMilestones: number[];
  awarded20kMilestones: number[];
  hasRemovedAds?: boolean;
}

const DEFAULT_PROGRESS: GameProgress = {
  unlockedCategoryIds: [1], // Round 1 is always unlocked by default
  completedCategoryIds: [],
  lastPlayedCategoryId: 1,
  categoryHighScores: {},
  categoryStars: {},
  totalRoundsCleared: 0,
  lastUpdated: Date.now(),
  coins: 50, // 50 free coins for new users
  diamonds: 2, // 2 free diamonds for new users
  awarded10kMilestones: [],
  awarded15kMilestones: [],
  awarded20kMilestones: [],
  hasRemovedAds: false,
};

/**
 * Loads game progress from localStorage on the device
 */
export function loadGameProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (raw) {
      const parsed = JSON.parse(raw);
      
      // Ensure category 1 is always unlocked
      const unlocked = new Set<number>([1, ...(parsed.unlockedCategoryIds || [])]);
      const completed = new Set<number>(parsed.completedCategoryIds || []);

      // If a category was completed in prior session, guarantee the subsequent one is unlocked
      completed.forEach((catId) => {
        const nextCat = INITIAL_CATEGORIES.find((c) => c.id === catId + 1);
        if (nextCat) {
          unlocked.add(nextCat.id);
        }
      });

      return {
        unlockedCategoryIds: Array.from(unlocked),
        completedCategoryIds: Array.from(completed),
        lastPlayedCategoryId: parsed.lastPlayedCategoryId || 1,
        categoryHighScores: parsed.categoryHighScores || {},
        categoryStars: parsed.categoryStars || {},
        totalRoundsCleared: parsed.totalRoundsCleared || completed.size,
        lastUpdated: parsed.lastUpdated || Date.now(),
        coins: typeof parsed.coins === 'number' ? parsed.coins : 50,
        diamonds: typeof parsed.diamonds === 'number' ? parsed.diamonds : 2,
        awarded10kMilestones: Array.isArray(parsed.awarded10kMilestones) ? parsed.awarded10kMilestones : [],
        awarded15kMilestones: Array.isArray(parsed.awarded15kMilestones) ? parsed.awarded15kMilestones : [],
        awarded20kMilestones: Array.isArray(parsed.awarded20kMilestones) ? parsed.awarded20kMilestones : [],
        hasRemovedAds: Boolean(parsed.hasRemovedAds),
      };
    }
  } catch (err) {
    console.warn('Failed to load device game progress:', err);
  }

  // Fallback to default initial state
  saveGameProgress(DEFAULT_PROGRESS);
  return DEFAULT_PROGRESS;
}

/**
 * Saves game progress to localStorage on the device
 */
export function saveGameProgress(progress: GameProgress): void {
  try {
    const dataToSave: GameProgress = {
      ...progress,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(dataToSave));
  } catch (err) {
    console.warn('Failed to save device game progress:', err);
  }
}

/**
 * Check if a category is unlocked
 */
export function isCategoryUnlocked(categoryId: number, progress?: GameProgress): boolean {
  if (categoryId === 1) return true; // First category is always unlocked

  const prog = progress || loadGameProgress();
  // Unlocked if in the unlocked list or if the previous category is completed
  return (
    prog.unlockedCategoryIds.includes(categoryId) ||
    prog.completedCategoryIds.includes(categoryId - 1)
  );
}

/**
 * Check if a category has been completed
 */
export function isCategoryCompleted(categoryId: number, progress?: GameProgress): boolean {
  const prog = progress || loadGameProgress();
  return prog.completedCategoryIds.includes(categoryId);
}

/**
 * Mark a category as completed upon reaching target words, unlocking the next category
 */
export function completeCategory(
  categoryId: number,
  score: number = 0
): {
  progress: GameProgress;
  newlyUnlockedCategory: Category | null;
  isFirstCompletion: boolean;
} {
  const current = loadGameProgress();
  const completedSet = new Set<number>(current.completedCategoryIds);
  const unlockedSet = new Set<number>(current.unlockedCategoryIds);

  const isFirstCompletion = !completedSet.has(categoryId);
  completedSet.add(categoryId);

  // Determine next category to unlock
  let newlyUnlockedCategory: Category | null = null;
  const nextCat = INITIAL_CATEGORIES.find((c) => c.id === categoryId + 1);

  if (nextCat && !unlockedSet.has(nextCat.id)) {
    unlockedSet.add(nextCat.id);
    newlyUnlockedCategory = nextCat;
  }

  // Update high score for category
  const highScores = { ...current.categoryHighScores };
  const prevHighScore = highScores[categoryId] || 0;
  if (score > prevHighScore) {
    highScores[categoryId] = score;
  }

  const updatedProgress: GameProgress = {
    ...current,
    completedCategoryIds: Array.from(completedSet),
    unlockedCategoryIds: Array.from(unlockedSet),
    categoryHighScores: highScores,
    totalRoundsCleared: completedSet.size,
    lastPlayedCategoryId: categoryId,
  };

  saveGameProgress(updatedProgress);

  return {
    progress: updatedProgress,
    newlyUnlockedCategory,
    isFirstCompletion,
  };
}

/**
 * Saves current active category as last played
 */
export function setLastPlayedCategory(categoryId: number): void {
  const current = loadGameProgress();
  if (current.lastPlayedCategoryId !== categoryId) {
    current.lastPlayedCategoryId = categoryId;
    saveGameProgress(current);
  }
}

/**
 * Adds coins to player balance
 */
export function addCoins(amount: number): GameProgress {
  const current = loadGameProgress();
  const updated: GameProgress = {
    ...current,
    coins: (current.coins || 0) + Math.max(0, amount),
  };
  saveGameProgress(updated);
  return updated;
}

/**
 * Deducts coins if sufficient balance exists
 */
export function deductCoins(amount: number): { success: boolean; progress: GameProgress } {
  const current = loadGameProgress();
  if ((current.coins || 0) < amount) {
    return { success: false, progress: current };
  }
  const updated: GameProgress = {
    ...current,
    coins: current.coins - amount,
  };
  saveGameProgress(updated);
  return { success: true, progress: updated };
}

/**
 * Adds diamonds to player balance
 */
export function addDiamonds(amount: number): GameProgress {
  const current = loadGameProgress();
  const updated: GameProgress = {
    ...current,
    diamonds: (current.diamonds || 0) + Math.max(0, amount),
  };
  saveGameProgress(updated);
  return updated;
}

/**
 * Deducts diamonds if sufficient balance exists
 */
export function deductDiamonds(amount: number): { success: boolean; progress: GameProgress } {
  const current = loadGameProgress();
  if ((current.diamonds || 0) < amount) {
    return { success: false, progress: current };
  }
  const updated: GameProgress = {
    ...current,
    diamonds: current.diamonds - amount,
  };
  saveGameProgress(updated);
  return { success: true, progress: updated };
}

/**
 * Exchanges diamonds for coins
 */
export function exchangeDiamondsForCoins(diamonds: number, coins: number): { success: boolean; progress: GameProgress } {
  const current = loadGameProgress();
  if ((current.diamonds || 0) < diamonds) {
    return { success: false, progress: current };
  }
  const updated: GameProgress = {
    ...current,
    diamonds: current.diamonds - diamonds,
    coins: (current.coins || 0) + coins,
  };
  saveGameProgress(updated);
  return { success: true, progress: updated };
}

/**
 * Checks and awards diamonds when score in a category reaches score milestones:
 * - 20,000 PTS: +2 Diamonds (💎)
 * - 15,000 PTS: +1 Diamond (💎)
 */
export function checkAndAwardDiamondMilestones(
  categoryId: number,
  score: number
): { awarded: boolean; diamondsAwarded: number; milestoneName: string; progress: GameProgress } {
  const current = loadGameProgress();
  const milestones15k = new Set<number>(current.awarded15kMilestones || []);
  const milestones20k = new Set<number>(current.awarded20kMilestones || []);

  let diamondsToAdd = 0;

  // Check 20,000 threshold (+2 Diamonds reward)
  if (score >= 20000 && !milestones20k.has(categoryId)) {
    milestones20k.add(categoryId);
    milestones15k.add(categoryId);

    const alreadyGot15k = (current.awarded15kMilestones || []).includes(categoryId);
    // If they already got +1 from 15k earlier in a previous attempt, add remaining 1 diamond. Otherwise grant full 2 diamonds.
    const amount = alreadyGot15k ? 1 : 2;
    diamondsToAdd += amount;
  } else if (score >= 15000 && !milestones15k.has(categoryId)) {
    // Check 15,000 threshold (+1 Diamond reward)
    milestones15k.add(categoryId);
    diamondsToAdd += 1;
  }

  if (diamondsToAdd > 0) {
    const updated: GameProgress = {
      ...current,
      diamonds: (current.diamonds || 0) + diamondsToAdd,
      awarded15kMilestones: Array.from(milestones15k),
      awarded20kMilestones: Array.from(milestones20k),
    };
    saveGameProgress(updated);
    return {
      awarded: true,
      diamondsAwarded: diamondsToAdd,
      milestoneName: 'ROUND REWARD',
      progress: updated,
    };
  }

  return {
    awarded: false,
    diamondsAwarded: 0,
    milestoneName: '',
    progress: current,
  };
}

/**
 * Backward compatibility alias for checkAndAwardDiamondMilestones
 */
export function checkAndAward10kMilestone(
  categoryId: number,
  score: number
): { awarded: boolean; progress: GameProgress } {
  const res = checkAndAwardDiamondMilestones(categoryId, score);
  return { awarded: res.awarded, progress: res.progress };
}

/**
 * Converts all leftover colored tiles and remaining powerups after a round is finished to coins (1 each)
 */
export function convertRoundEndAssetsToCoins(
  coloredTilesCount: number,
  powerupsCount: number
): { coinsAdded: number; progress: GameProgress } {
  const totalAssets = Math.max(0, coloredTilesCount) + Math.max(0, powerupsCount);
  if (totalAssets <= 0) {
    return { coinsAdded: 0, progress: loadGameProgress() };
  }
  const updated = addCoins(totalAssets);
  return { coinsAdded: totalAssets, progress: updated };
}

/**
 * Purchases the "Remove All Ads" package.
 * - Sets hasRemovedAds to true
 * - Adds +100 diamonds
 * - Initial balances of power-ups become 2 each
 */
export function purchaseRemoveAllAds(): { progress: GameProgress } {
  const current = loadGameProgress();
  const updated: GameProgress = {
    ...current,
    hasRemovedAds: true,
    diamonds: (current.diamonds || 0) + 100,
  };
  saveGameProgress(updated);
  return { progress: updated };
}

/**
 * Resets all user game progress back to the default state.
 */
export function resetGameProgress(): GameProgress {
  try {
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
  } catch (err) {
    console.error('Failed to clear progress:', err);
  }
  const fresh: GameProgress = {
    ...DEFAULT_PROGRESS,
    lastUpdated: Date.now(),
  };
  saveGameProgress(fresh);
  return fresh;
}



