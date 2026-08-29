import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { GameProgress, loadGameProgress, saveGameProgress } from './gameProgress';
import { getUserProfile, saveUserProfile, UserProfile } from './leaderboard';

export interface CloudUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  gameProgress: GameProgress;
  iapReceipts?: string[];
  lastSyncedAt: number;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Merges local and cloud progress safely so the player never loses achievements or currency
 */
export function mergeGameProgress(local: GameProgress, cloud: GameProgress): GameProgress {
  const unlockedSet = new Set<number>([
    1,
    ...(local.unlockedCategoryIds || []),
    ...(cloud.unlockedCategoryIds || []),
  ]);
  const completedSet = new Set<number>([
    ...(local.completedCategoryIds || []),
    ...(cloud.completedCategoryIds || []),
  ]);

  // Merge high scores (keep highest)
  const mergedScores: Record<number, number> = { ...(local.categoryHighScores || {}) };
  Object.entries(cloud.categoryHighScores || {}).forEach(([catIdStr, score]) => {
    const catId = Number(catIdStr);
    const existing = mergedScores[catId] || 0;
    if (typeof score === 'number' && score > existing) {
      mergedScores[catId] = score;
    }
  });

  // Merge stars (keep highest)
  const mergedStars: Record<number, number> = { ...(local.categoryStars || {}) };
  Object.entries(cloud.categoryStars || {}).forEach(([catIdStr, stars]) => {
    const catId = Number(catIdStr);
    const existing = mergedStars[catId] || 0;
    if (typeof stars === 'number' && stars > existing) {
      mergedStars[catId] = stars;
    }
  });

  // Milestone awards
  const m15k = new Set<number>([
    ...(local.awarded15kMilestones || []),
    ...(cloud.awarded15kMilestones || []),
  ]);
  const m20k = new Set<number>([
    ...(local.awarded20kMilestones || []),
    ...(cloud.awarded20kMilestones || []),
  ]);

  return {
    unlockedCategoryIds: Array.from(unlockedSet),
    completedCategoryIds: Array.from(completedSet),
    lastPlayedCategoryId: local.lastPlayedCategoryId || cloud.lastPlayedCategoryId || 1,
    categoryHighScores: mergedScores,
    categoryStars: mergedStars,
    totalRoundsCleared: Math.max(
      local.totalRoundsCleared || completedSet.size,
      cloud.totalRoundsCleared || completedSet.size,
      completedSet.size
    ),
    lastUpdated: Date.now(),
    // Currency: use highest value between local and cloud
    coins: Math.max(
      typeof local.coins === 'number' ? local.coins : 50,
      typeof cloud.coins === 'number' ? cloud.coins : 50
    ),
    diamonds: Math.max(
      typeof local.diamonds === 'number' ? local.diamonds : 2,
      typeof cloud.diamonds === 'number' ? cloud.diamonds : 2
    ),
    awarded15kMilestones: Array.from(m15k),
    awarded20kMilestones: Array.from(m20k),
    // IAP: If either local or cloud has removed ads, grant it permanently
    hasRemovedAds: Boolean(local.hasRemovedAds || cloud.hasRemovedAds),
  };
}

/**
 * Signs in with Google Popup and returns the authenticated user & cloud sync result
 */
export async function signInWithGoogleAccount(currentLocalProgress: GameProgress): Promise<{
  user: User;
  progress: GameProgress;
  cloudExisted: boolean;
  message: string;
}> {
  try {
    const userCred = await signInWithPopup(auth, googleProvider);
    const user = userCred.user;

    // Check if cloud save document exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    let finalProgress = currentLocalProgress;
    let cloudExisted = false;

    if (snap.exists()) {
      const data = snap.data() as Partial<CloudUserData>;
      if (data.gameProgress) {
        cloudExisted = true;
        // Merge cloud with local progress
        finalProgress = mergeGameProgress(currentLocalProgress, data.gameProgress);
      }
    }

    // Save/update cloud document with the latest merged progress
    const cloudPayload: CloudUserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      gameProgress: finalProgress,
      iapReceipts: finalProgress.hasRemovedAds ? ['com.wordblast.removeads'] : [],
      lastSyncedAt: Date.now(),
    };

    await setDoc(userDocRef, cloudPayload, { merge: true });

    // Update local storage
    saveGameProgress(finalProgress);

    // Also update local UserProfile name if default
    const currentProf: UserProfile = getUserProfile();
    if (
      user.displayName &&
      (!currentProf.name || currentProf.name === 'Player 1' || currentProf.name.startsWith('Guest'))
    ) {
      const updatedProf: UserProfile = {
        ...currentProf,
        name: user.displayName.slice(0, 16),
      };
      saveUserProfile(updatedProf);
    }

    return {
      user,
      progress: finalProgress,
      cloudExisted,
      message: cloudExisted
        ? 'Account linked! Progress & IAP restored from cloud.'
        : 'Account linked! Local progress backed up to cloud.',
    };
  } catch (err: any) {
    console.error('Google Sign-in failed:', err);
    throw new Error(err?.message || 'Failed to sign in with Google');
  }
}

/**
 * Syncs the current local game progress to the cloud
 */
export async function syncProgressToCloud(progress: GameProgress): Promise<number> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No Google account is currently linked. Please link your account first.');
  }

  const userDocRef = doc(db, 'users', user.uid);
  const now = Date.now();
  const cloudPayload: CloudUserData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    gameProgress: progress,
    iapReceipts: progress.hasRemovedAds ? ['com.wordblast.removeads'] : [],
    lastSyncedAt: now,
  };

  await setDoc(userDocRef, cloudPayload, { merge: true });
  return now;
}

/**
 * Downloads and restores cloud progress and IAP for the signed-in user
 */
export async function restoreCloudProgress(localProgress: GameProgress): Promise<{
  progress: GameProgress;
  restoredIAP: boolean;
  lastSyncedAt: number;
}> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No Google account is currently linked. Please sign in first.');
  }

  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    // Cloud document doesn't exist yet, upload local
    const now = Date.now();
    await syncProgressToCloud(localProgress);
    return {
      progress: localProgress,
      restoredIAP: Boolean(localProgress.hasRemovedAds),
      lastSyncedAt: now,
    };
  }

  const data = snap.data() as CloudUserData;
  const cloudProgress = data.gameProgress || localProgress;
  const merged = mergeGameProgress(localProgress, cloudProgress);

  // If IAP receipts indicate remove ads, ensure hasRemovedAds is true
  if (data.iapReceipts?.includes('com.wordblast.removeads')) {
    merged.hasRemovedAds = true;
  }

  saveGameProgress(merged);
  return {
    progress: merged,
    restoredIAP: Boolean(merged.hasRemovedAds),
    lastSyncedAt: data.lastSyncedAt || Date.now(),
  };
}

/**
 * Signs out the Google user
 */
export async function signOutGoogleAccount(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase Auth state changes
 */
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
