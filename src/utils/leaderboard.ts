import { INITIAL_CATEGORIES } from '../data/categories';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  avatar: string;
  score: number;
  categoryId?: number; // undefined or 0 for Overall game
  categoryName?: string;
  wordsCount: number;
  highestWord: string;
  highestWordPoints: number;
  date: string;
  isCurrentUser?: boolean;
  timeConsumedSeconds?: number;
  timestamp?: any;
}

export interface UserProfile {
  playerId: string;
  name: string;
  avatar: string;
  totalPoints: number;
  totalWordsFormed: number;
  categoriesCompleted: number;
  highestWord: string;
  highestWordPoints: number;
}

const STORAGE_KEY_LEADERBOARD = 'word_blast_leaderboards_v2';
const STORAGE_KEY_USER_PROFILE = 'word_blast_user_profile_v2';
const STORAGE_KEY_PLAYER_ID = 'word_blast_unique_player_id';

export const DEFAULT_AVATARS = ['👑', '🦁', '🦊', '🦉', '⚡', '🚀', '💎', '🎯', '🔥', '🌟', '🦄', '🐲'];

export function getPlayerUniqueId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_PLAYER_ID, id);
    }
    return id;
  } catch {
    return 'usr_guest_' + Date.now();
  }
}

export function setPlayerUniqueId(id: string): void {
  try {
    if (id && typeof id === 'string') {
      localStorage.setItem(STORAGE_KEY_PLAYER_ID, id.trim());
    }
  } catch {
    // ignore
  }
}

// Generate realistic default pre-seeded category entries as initial foundation
function generateDefaultCategoryEntries(categoryId: number, categoryName: string): LeaderboardEntry[] {
  const baseScores = [
    { name: 'WordMaster', avatar: '👑', score: 14800, words: 16, word: 'ELEPHANT', pts: 1800, date: 'Yesterday', time: 74 },
    { name: 'LexiQueen', avatar: '💎', score: 12400, words: 14, word: 'CHEETAH', pts: 1600, date: '2d ago', time: 88 },
    { name: 'LexiKing', avatar: '🏆', score: 10900, words: 12, word: 'GIRAFFE', pts: 1500, date: '3d ago', time: 105 },
    { name: 'AlphaBeast', avatar: '🦁', score: 9200, words: 11, word: 'GORILLA', pts: 1300, date: '4d ago', time: 120 },
    { name: 'PuzzlePro', avatar: '🎯', score: 7800, words: 9, word: 'PANTHER', pts: 1200, date: '5d ago', time: 142 },
  ];

  return baseScores.map((b, idx) => ({
    id: `cat-${categoryId}-seed-${idx}`,
    playerName: b.name,
    avatar: b.avatar,
    score: b.score + (categoryId * 250),
    categoryId,
    categoryName,
    wordsCount: b.words,
    highestWord: b.word,
    highestWordPoints: b.pts,
    date: b.date,
    isCurrentUser: false,
    timeConsumedSeconds: b.time,
  }));
}

// Generate realistic default overall leaderboard
function generateDefaultOverallEntries(): LeaderboardEntry[] {
  return [
    { id: 'ov-seed-1', playerName: 'WordMaster', avatar: '👑', score: 86500, wordsCount: 94, highestWord: 'RHINOCEROS', highestWordPoints: 2400, date: '1d ago', isCurrentUser: false, timeConsumedSeconds: 520 },
    { id: 'ov-seed-2', playerName: 'LexiQueen', avatar: '💎', score: 74200, wordsCount: 82, highestWord: 'SPAGHETTI', highestWordPoints: 2100, date: '2d ago', isCurrentUser: false, timeConsumedSeconds: 610 },
    { id: 'ov-seed-3', playerName: 'LexiKing', avatar: '🏆', score: 68900, wordsCount: 76, highestWord: 'CHINCHILLA', highestWordPoints: 2200, date: '3d ago', isCurrentUser: false, timeConsumedSeconds: 680 },
    { id: 'ov-seed-4', playerName: 'AlphaBeast', avatar: '🦁', score: 58400, wordsCount: 65, highestWord: 'HIPPOPOTAMUS', highestWordPoints: 2500, date: '4d ago', isCurrentUser: false, timeConsumedSeconds: 790 },
    { id: 'ov-seed-5', playerName: 'SpellCraft', avatar: '⚡', score: 49800, wordsCount: 57, highestWord: 'CROISSANT', highestWordPoints: 1900, date: '5d ago', isCurrentUser: false, timeConsumedSeconds: 840 },
    { id: 'ov-seed-6', playerName: 'PuzzlePro', avatar: '🎯', score: 43200, wordsCount: 48, highestWord: 'KANGAROO', highestWordPoints: 1700, date: '6d ago', isCurrentUser: false, timeConsumedSeconds: 910 },
    { id: 'ov-seed-7', playerName: 'TileTitan', avatar: '🚀', score: 37500, wordsCount: 42, highestWord: 'PLATYPUS', highestWordPoints: 1800, date: '1w ago', isCurrentUser: false, timeConsumedSeconds: 980 },
  ];
}

export function getUserProfile(): UserProfile {
  const playerId = getPlayerUniqueId();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, playerId };
    }
  } catch {
    // fallback
  }

  const defaultProfile: UserProfile = {
    playerId,
    name: 'Player 1',
    avatar: '👑',
    totalPoints: 0,
    totalWordsFormed: 0,
    categoriesCompleted: 0,
    highestWord: '',
    highestWordPoints: 0,
  };
  saveUserProfile(defaultProfile);
  return defaultProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }

  // Also sync profile name and avatar to cloud if score exists
  if (profile.totalPoints > 0) {
    syncUserToGlobalFirestore(profile).catch((e) => console.warn('Firestore profile sync silent notice:', e));
  }
}

interface StoredLeaderboards {
  overall: LeaderboardEntry[];
  byCategory: Record<number, LeaderboardEntry[]>;
}

function loadLocalLeaderboards(): StoredLeaderboards {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  const initialData: StoredLeaderboards = {
    overall: generateDefaultOverallEntries(),
    byCategory: {},
  };

  INITIAL_CATEGORIES.forEach((cat) => {
    initialData.byCategory[cat.id] = generateDefaultCategoryEntries(cat.id, cat.name);
  });

  saveLocalLeaderboards(initialData);
  return initialData;
}

function saveLocalLeaderboards(data: StoredLeaderboards): void {
  try {
    localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Deduplicate leaderboard entries so that the current user's local & cloud sessions
 * are consolidated into a single entry with their highest career stats, while
 * other distinct players who happen to share the same name REMAIN SEPARATE entries!
 */
function deduplicateLeaderboardEntries(entries: LeaderboardEntry[], currentProfile: UserProfile): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  const currentLocalId = (currentProfile.playerId || '').trim();

  for (const entry of entries) {
    const entryId = (entry.id || '').trim();

    // Determine if this entry belongs to the current local player
    const isCurrent =
      entry.isCurrentUser === true ||
      (Boolean(currentLocalId) && (entryId === currentLocalId || entryId.includes(currentLocalId) || currentLocalId.includes(entryId)));

    // Grouping key:
    // - The current active player collapses into '__CURRENT_USER__' (merging past local/cloud sessions)
    // - Other players use their unique `entry.id` (or fallback unique key), so multiple distinct players with the same nickname NEVER overwrite or merge each other!
    const groupKey = isCurrent ? '__CURRENT_USER__' : (entryId || `player_${entry.playerName}_${entry.score}`);

    const candidate: LeaderboardEntry = {
      ...entry,
      isCurrentUser: isCurrent,
      playerName: isCurrent ? (currentProfile.name || entry.playerName || 'You') : entry.playerName,
      avatar: isCurrent ? (currentProfile.avatar || entry.avatar || '👑') : (entry.avatar || '👑'),
    };

    if (!map.has(groupKey)) {
      map.set(groupKey, candidate);
    } else {
      const existing = map.get(groupKey)!;
      // Merge records by keeping highest score, wordsCount, and best word
      const bestScore = Math.max(existing.score, candidate.score);
      const bestWords = Math.max(existing.wordsCount, candidate.wordsCount);
      const useCandidateWord = (candidate.highestWordPoints || 0) > (existing.highestWordPoints || 0);

      map.set(groupKey, {
        ...existing,
        id: isCurrent ? currentProfile.playerId : existing.id,
        isCurrentUser: isCurrent,
        playerName: isCurrent ? (currentProfile.name || existing.playerName) : existing.playerName,
        avatar: isCurrent ? (currentProfile.avatar || existing.avatar) : existing.avatar,
        score: bestScore,
        wordsCount: bestWords,
        highestWord: useCandidateWord ? candidate.highestWord : (existing.highestWord || candidate.highestWord),
        highestWordPoints: Math.max(existing.highestWordPoints || 0, candidate.highestWordPoints || 0),
        date: existing.date === 'Today' || candidate.date === 'Today' ? 'Today' : (existing.date || candidate.date),
      });
    }
  }

  // Ensure current user is in the list if they have points
  if (currentProfile.totalPoints > 0) {
    const userDoc = map.get('__CURRENT_USER__');
    if (userDoc) {
      userDoc.score = Math.max(userDoc.score, currentProfile.totalPoints);
      userDoc.wordsCount = Math.max(userDoc.wordsCount, currentProfile.totalWordsFormed);
      if ((currentProfile.highestWordPoints || 0) > (userDoc.highestWordPoints || 0)) {
        userDoc.highestWord = currentProfile.highestWord;
        userDoc.highestWordPoints = currentProfile.highestWordPoints;
      }
    } else {
      map.set('__CURRENT_USER__', {
        id: currentProfile.playerId,
        playerName: currentProfile.name || 'You',
        avatar: currentProfile.avatar || '👑',
        score: currentProfile.totalPoints,
        wordsCount: currentProfile.totalWordsFormed,
        highestWord: currentProfile.highestWord || 'WORD',
        highestWordPoints: currentProfile.highestWordPoints || 500,
        date: 'Today',
        isCurrentUser: true,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

/**
 * Fetch live global overall leaderboard from Firestore, falling back seamlessly to local cache.
 */
export async function fetchLiveGlobalOverall(): Promise<LeaderboardEntry[]> {
  const profile = getUserProfile();
  try {
    const q = query(
      collection(db, 'global_leaderboard'),
      orderBy('score', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const liveList: LeaderboardEntry[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const isCurrent = docSnap.id === profile.playerId || d.playerId === profile.playerId;
        return {
          id: docSnap.id,
          playerName: d.playerName || 'Player',
          avatar: d.avatar || '👑',
          score: Number(d.score) || 0,
          wordsCount: Number(d.wordsCount) || 0,
          highestWord: d.highestWord || '',
          highestWordPoints: Number(d.highestWordPoints) || 0,
          date: d.date || 'Live',
          isCurrentUser: isCurrent,
          timeConsumedSeconds: d.timeConsumedSeconds ? Number(d.timeConsumedSeconds) : undefined,
        };
      });

      const deduplicated = deduplicateLeaderboardEntries(liveList, profile);

      // Cache locally
      const stored = loadLocalLeaderboards();
      stored.overall = deduplicated;
      saveLocalLeaderboards(stored);
      return deduplicated;
    }
  } catch (err) {
    console.warn('Could not load live Firestore leaderboard, using local fallback:', err);
  }

  return getOverallLeaderboard();
}

/**
 * Fetch live global category scores from Firestore
 */
export async function fetchLiveGlobalCategory(categoryId: number, categoryName?: string): Promise<LeaderboardEntry[]> {
  const profile = getUserProfile();
  const isCustomGame = categoryId >= 1000;
  const cat = INITIAL_CATEGORIES.find((c) => c.id === categoryId);
  const catName = categoryName || (cat ? cat.name : (isCustomGame ? 'Custom Game' : `Round ${categoryId}`));

  try {
    const q = query(
      collection(db, 'category_scores'),
      orderBy('score', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const matchingDocs = snap.docs.filter((d) => Number(d.data().categoryId) === Number(categoryId));
      if (matchingDocs.length > 0) {
        const liveList: LeaderboardEntry[] = matchingDocs.map((docSnap) => {
          const d = docSnap.data();
          const isCurrent = d.playerId === profile.playerId || docSnap.id.includes(profile.playerId);
          return {
            id: docSnap.id,
            playerName: d.playerName || 'Player',
            avatar: d.avatar || '👑',
            score: Number(d.score) || 0,
            categoryId: Number(d.categoryId),
            categoryName: d.categoryName || catName,
            wordsCount: Number(d.wordsCount) || 0,
            highestWord: d.highestWord || '',
            highestWordPoints: Number(d.highestWordPoints) || 0,
            date: d.date || 'Live',
            isCurrentUser: isCurrent,
            timeConsumedSeconds: d.timeConsumedSeconds ? Number(d.timeConsumedSeconds) : undefined,
          };
        });

        // For campaign categories (< 1000), merge with defaults if few scores.
        if (!isCustomGame) {
          const defaults = generateDefaultCategoryEntries(categoryId, catName);
          const combined = [...liveList, ...defaults];
          return deduplicateLeaderboardEntries(combined, profile);
        }

        return deduplicateLeaderboardEntries(liveList, profile);
      }
    }
  } catch (err) {
    console.warn('Could not load live category scores from Firestore, using fallback:', err);
  }

  return getCategoryLeaderboard(categoryId, catName);
}

export function getOverallLeaderboard(): LeaderboardEntry[] {
  const data = loadLocalLeaderboards();
  const profile = getUserProfile();
  return deduplicateLeaderboardEntries(data.overall || [], profile);
}

export function getCategoryLeaderboard(categoryId: number, categoryName?: string): LeaderboardEntry[] {
  const data = loadLocalLeaderboards();
  const profile = getUserProfile();
  const isCustomGame = categoryId >= 1000;
  const cat = INITIAL_CATEGORIES.find((c) => c.id === categoryId);
  const catName = categoryName || (cat ? cat.name : (isCustomGame ? 'Custom Game' : `Round ${categoryId}`));

  let list = data.byCategory[categoryId];
  if (!list || list.length === 0) {
    if (isCustomGame) {
      list = [];
    } else {
      list = generateDefaultCategoryEntries(categoryId, catName);
    }
    data.byCategory[categoryId] = list;
    saveLocalLeaderboards(data);
  }

  // If this is a custom game, sanitize to ensure no dummy seed records exist
  if (isCustomGame) {
    list = (list || []).filter((e) => !e.id.includes('seed-'));
  }

  return deduplicateLeaderboardEntries(list, profile);
}

async function syncUserToGlobalFirestore(profile: UserProfile): Promise<void> {
  if (!profile.playerId || profile.totalPoints <= 0) return;
  try {
    const docRef = doc(db, 'global_leaderboard', profile.playerId);
    await setDoc(
      docRef,
      {
        playerId: profile.playerId,
        playerName: profile.name || 'Player',
        avatar: profile.avatar || '👑',
        score: profile.totalPoints,
        wordsCount: profile.totalWordsFormed,
        highestWord: profile.highestWord || '',
        highestWordPoints: profile.highestWordPoints || 0,
        categoriesCompleted: profile.categoriesCompleted,
        updatedAt: serverTimestamp(),
        date: 'Today',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore global write background notice:', err);
  }
}

async function syncCategoryScoreToFirestore({
  categoryId,
  categoryName,
  score,
  wordsCount,
  highestWord,
  highestWordPoints,
  timeConsumedSeconds,
  profile,
}: {
  categoryId: number;
  categoryName: string;
  score: number;
  wordsCount: number;
  highestWord: string;
  highestWordPoints: number;
  timeConsumedSeconds?: number;
  profile: UserProfile;
}): Promise<void> {
  if (!profile.playerId || score <= 0) return;
  try {
    const docKey = `${profile.playerId}_cat_${categoryId}`;
    const docRef = doc(db, 'category_scores', docKey);
    await setDoc(
      docRef,
      {
        playerId: profile.playerId,
        playerName: profile.name || 'Player',
        avatar: profile.avatar || '👑',
        score,
        categoryId,
        categoryName,
        wordsCount,
        highestWord,
        highestWordPoints,
        timeConsumedSeconds: timeConsumedSeconds || 0,
        updatedAt: serverTimestamp(),
        date: 'Today',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore category score write notice:', err);
  }
}

export function recordScore({
  categoryId,
  categoryName,
  categoryScore,
  wordsCount,
  highestWord,
  highestWordPoints,
  isRoundComplete = false,
  timeConsumedSeconds,
}: {
  categoryId: number;
  categoryName: string;
  categoryScore: number;
  wordsCount: number;
  highestWord: string;
  highestWordPoints: number;
  isRoundComplete?: boolean;
  timeConsumedSeconds?: number;
}): { newOverallRank: number; newCategoryRank: number } {
  const profile = getUserProfile();
  const data = loadLocalLeaderboards();

  // 1. Update user profile cumulative stats
  profile.totalPoints = (profile.totalPoints || 0) + categoryScore;
  profile.totalWordsFormed = (profile.totalWordsFormed || 0) + wordsCount;
  if (isRoundComplete) {
    profile.categoriesCompleted = (profile.categoriesCompleted || 0) + 1;
  }
  if (highestWordPoints > (profile.highestWordPoints || 0)) {
    profile.highestWord = highestWord;
    profile.highestWordPoints = highestWordPoints;
  }
  saveUserProfile(profile);

  // 2. Update Category Leaderboard
  const isCustom = categoryId >= 1000;
  let catList = data.byCategory[categoryId] || (isCustom ? [] : generateDefaultCategoryEntries(categoryId, categoryName));
  if (isCustom) {
    catList = catList.filter((e) => !e.id.includes('seed-'));
  }
  const userCatIdx = catList.findIndex((e) => e.isCurrentUser || e.id.includes(profile.playerId));

  const existingUserScore = userCatIdx >= 0 ? catList[userCatIdx].score : 0;
  const bestScore = Math.max(existingUserScore, categoryScore);

  const userCatEntry: LeaderboardEntry = {
    id: `user-${profile.playerId}-cat-${categoryId}`,
    playerName: profile.name || 'You',
    avatar: profile.avatar || '👑',
    score: bestScore,
    categoryId,
    categoryName,
    wordsCount: Math.max(wordsCount, userCatIdx >= 0 ? catList[userCatIdx].wordsCount : 0),
    highestWord: highestWord || (userCatIdx >= 0 ? catList[userCatIdx].highestWord : ''),
    highestWordPoints: Math.max(highestWordPoints, userCatIdx >= 0 ? catList[userCatIdx].highestWordPoints : 0),
    date: 'Today',
    isCurrentUser: true,
    timeConsumedSeconds:
      timeConsumedSeconds !== undefined
        ? timeConsumedSeconds
        : userCatIdx >= 0
        ? catList[userCatIdx].timeConsumedSeconds
        : undefined,
  };

  if (userCatIdx >= 0) {
    catList[userCatIdx] = userCatEntry;
  } else {
    catList.push(userCatEntry);
  }

  // Ranking is strictly based on points (descending by score)
  catList.sort((a, b) => b.score - a.score);
  data.byCategory[categoryId] = catList;

  const newCategoryRank = catList.findIndex((e) => e.isCurrentUser) + 1;

  // 3. Update Overall Leaderboard
  let overallList = data.overall || generateDefaultOverallEntries();
  const userOvIdx = overallList.findIndex((e) => e.isCurrentUser || e.id === profile.playerId);

  const userOvEntry: LeaderboardEntry = {
    id: profile.playerId,
    playerName: profile.name || 'You',
    avatar: profile.avatar || '👑',
    score: profile.totalPoints,
    wordsCount: profile.totalWordsFormed,
    highestWord: profile.highestWord || highestWord,
    highestWordPoints: profile.highestWordPoints || highestWordPoints,
    date: 'Active',
    isCurrentUser: true,
  };

  if (userOvIdx >= 0) {
    overallList[userOvIdx] = userOvEntry;
  } else {
    overallList.push(userOvEntry);
  }

  overallList.sort((a, b) => b.score - a.score);
  data.overall = overallList;

  const newOverallRank = overallList.findIndex((e) => e.isCurrentUser) + 1;

  saveLocalLeaderboards(data);

  // Only push to Firestore once the round is actually finished, not on every
  // single word match. During a round (especially with chain-reaction/special
  // effects rounds that can trigger many matches within milliseconds of each
  // other) this used to fire a network write per word; the player's local
  // score/rank above is already updated instantly on every match, so nothing
  // about their in-game experience needs the live network round-trip — only
  // the shared leaderboard does, and that can wait until the round result is
  // final.
  if (isRoundComplete) {
    syncUserToGlobalFirestore(profile);
    syncCategoryScoreToFirestore({
      categoryId,
      categoryName,
      score: bestScore,
      wordsCount,
      highestWord,
      highestWordPoints,
      timeConsumedSeconds,
      profile,
    });
  }

  return {
    newOverallRank: newOverallRank > 0 ? newOverallRank : 1,
    newCategoryRank: newCategoryRank > 0 ? newCategoryRank : 1,
  };
}

export function resetLeaderboards(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LEADERBOARD);
    localStorage.removeItem(STORAGE_KEY_USER_PROFILE);
  } catch {
    // ignore
  }
}
