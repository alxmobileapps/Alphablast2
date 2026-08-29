import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { GameProgress, saveGameProgress } from './gameProgress';
import { getUserProfile, saveUserProfile, UserProfile } from './leaderboard';

export interface CloudUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  avatar?: string | null;
  userProfile?: UserProfile;
  gameProgress: GameProgress;
  iapReceipts?: string[];
  lastSyncedAt: number;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const CLOUD_SYNC_KEY_STORAGE = 'alphablast_cloud_sync_key';

/**
 * Gets or generates a persistent local Cloud Sync Key (e.g. ALPHA-9842)
 */
export function getOrCreateLocalSyncKey(): string {
  try {
    let key = localStorage.getItem(CLOUD_SYNC_KEY_STORAGE);
    if (!key) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      key = `ALPHA-${randNum}`;
      localStorage.setItem(CLOUD_SYNC_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return 'ALPHA-1001';
  }
}

export function setLocalSyncKey(key: string): void {
  try {
    localStorage.setItem(CLOUD_SYNC_KEY_STORAGE, key.trim().toUpperCase());
  } catch {}
}

/**
 * Ensures anonymous auth is active if needed so Firestore writes succeed smoothly
 */
async function ensureAuthSession(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch {
    return null;
  }
}

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
      typeof local.coins === 'number' ? local.coins : 10,
      typeof cloud.coins === 'number' ? cloud.coins : 10
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
 * Direct Cloud Sync using a unique Sync Code (Always works 100% without domain whitelist issues)
 */
export async function syncProgressWithCloudKey(
  syncKey: string,
  currentLocalProgress: GameProgress,
  playerProfile?: UserProfile
): Promise<{
  progress: GameProgress;
  userProfile: UserProfile;
  syncedAt: number;
  message: string;
}> {
  const cleanKey = syncKey.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanKey || cleanKey.length < 3) {
    throw new Error('Please enter a valid Sync Code (at least 3 characters).');
  }

  await ensureAuthSession();

  const currentProf: UserProfile = playerProfile || getUserProfile();
  const docId = `sync_${cleanKey}`;
  const userDocRef = doc(db, 'users', docId);
  
  let cloudExisted = false;
  let finalProgress = currentLocalProgress;
  let mergedProfile: UserProfile = { ...currentProf };

  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<CloudUserData>;
      if (data.gameProgress) {
        cloudExisted = true;
        finalProgress = mergeGameProgress(currentLocalProgress, data.gameProgress);
      }
      if (data.userProfile) {
        // If current local name is placeholder and cloud had a custom name, use cloud name
        if (
          (!currentProf.name || currentProf.name === 'Player 1' || currentProf.name.startsWith('Guest')) &&
          data.userProfile.name
        ) {
          mergedProfile.name = data.userProfile.name;
        }
        if (data.userProfile.avatar) {
          mergedProfile.avatar = data.userProfile.avatar;
        }
      } else if (data.displayName) {
        if (!currentProf.name || currentProf.name === 'Player 1' || currentProf.name.startsWith('Guest')) {
          mergedProfile.name = data.displayName;
        }
      }
    }
  } catch (readErr) {
    console.warn('Could not read existing doc, proceeding to save directly:', readErr);
  }

  // Ensure current local user profile is stored
  saveUserProfile(mergedProfile);

  const now = Date.now();
  const cloudPayload: CloudUserData = {
    uid: docId,
    email: null,
    displayName: mergedProfile.name || 'Alpha Player',
    photoURL: null,
    avatar: mergedProfile.avatar || '👑',
    userProfile: mergedProfile,
    gameProgress: finalProgress,
    iapReceipts: finalProgress.hasRemovedAds ? ['com.wordblast.removeads'] : [],
    lastSyncedAt: now,
  };

  await setDoc(userDocRef, cloudPayload, { merge: true });
  saveGameProgress(finalProgress);
  setLocalSyncKey(cleanKey);

  return {
    progress: finalProgress,
    userProfile: mergedProfile,
    syncedAt: now,
    message: cloudExisted
      ? `Cloud Sync Connected! Username & Progress saved with Code: ${cleanKey}`
      : `Saved to Cloud! Backup Code: ${cleanKey}`,
  };
}

/**
 * Restores save, username, and IAP using a Cloud Sync Key
 */
export async function restoreWithCloudKey(
  syncKey: string,
  currentLocalProgress: GameProgress
): Promise<{
  progress: GameProgress;
  userProfile: UserProfile;
  restoredIAP: boolean;
  lastSyncedAt: number;
}> {
  const cleanKey = syncKey.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanKey) {
    throw new Error('Please enter your Cloud Sync Code.');
  }

  await ensureAuthSession();

  const docId = `sync_${cleanKey}`;
  const userDocRef = doc(db, 'users', docId);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    throw new Error(`No cloud save found for code "${cleanKey}". Please check your code.`);
  }

  const data = snap.data() as CloudUserData;
  const cloudProgress = data.gameProgress || currentLocalProgress;
  const merged = mergeGameProgress(currentLocalProgress, cloudProgress);

  if (data.iapReceipts?.includes('com.wordblast.removeads')) {
    merged.hasRemovedAds = true;
  }

  saveGameProgress(merged);
  setLocalSyncKey(cleanKey);

  // Restore player username and avatar
  const currentProf = getUserProfile();
  const restoredName = data.userProfile?.name || data.displayName || currentProf.name;
  const restoredAvatar = data.userProfile?.avatar || data.avatar || currentProf.avatar;

  const restoredProfile: UserProfile = {
    ...currentProf,
    name: restoredName,
    avatar: restoredAvatar,
    totalPoints: Math.max(currentProf.totalPoints, data.userProfile?.totalPoints || 0),
    totalWordsFormed: Math.max(currentProf.totalWordsFormed, data.userProfile?.totalWordsFormed || 0),
    categoriesCompleted: Math.max(currentProf.categoriesCompleted, data.userProfile?.categoriesCompleted || 0),
    highestWord: data.userProfile?.highestWord || currentProf.highestWord,
    highestWordPoints: Math.max(currentProf.highestWordPoints, data.userProfile?.highestWordPoints || 0),
  };
  saveUserProfile(restoredProfile);

  return {
    progress: merged,
    userProfile: restoredProfile,
    restoredIAP: Boolean(merged.hasRemovedAds),
    lastSyncedAt: data.lastSyncedAt || Date.now(),
  };
}

/**
 * Signs in with Google Popup and returns the authenticated user & cloud sync result
 */
export async function signInWithGoogleAccount(currentLocalProgress: GameProgress): Promise<{
  user: User;
  progress: GameProgress;
  userProfile: UserProfile;
  cloudExisted: boolean;
  message: string;
}> {
  try {
    const userCred = await signInWithPopup(auth, googleProvider);
    const user = userCred.user;

    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    let finalProgress = currentLocalProgress;
    let cloudExisted = false;

    const currentProf: UserProfile = getUserProfile();
    let mergedProfile: UserProfile = { ...currentProf };

    if (snap.exists()) {
      const data = snap.data() as Partial<CloudUserData>;
      if (data.gameProgress) {
        cloudExisted = true;
        finalProgress = mergeGameProgress(currentLocalProgress, data.gameProgress);
      }
      if (data.userProfile) {
        mergedProfile = {
          ...currentProf,
          name: data.userProfile.name || currentProf.name,
          avatar: data.userProfile.avatar || currentProf.avatar,
        };
      } else if (data.displayName) {
        mergedProfile.name = data.displayName;
      }
    } else {
      if (
        user.displayName &&
        (!currentProf.name || currentProf.name === 'Player 1' || currentProf.name.startsWith('Guest'))
      ) {
        mergedProfile.name = user.displayName.slice(0, 16);
      }
    }

    saveUserProfile(mergedProfile);

    const cloudPayload: CloudUserData = {
      uid: user.uid,
      email: user.email,
      displayName: mergedProfile.name,
      photoURL: user.photoURL,
      avatar: mergedProfile.avatar,
      userProfile: mergedProfile,
      gameProgress: finalProgress,
      iapReceipts: finalProgress.hasRemovedAds ? ['com.wordblast.removeads'] : [],
      lastSyncedAt: Date.now(),
    };

    await setDoc(userDocRef, cloudPayload, { merge: true });
    saveGameProgress(finalProgress);

    return {
      user,
      progress: finalProgress,
      userProfile: mergedProfile,
      cloudExisted,
      message: cloudExisted
        ? 'Account linked! Username, progress & IAP restored from cloud.'
        : 'Account linked! Local progress backed up to cloud.',
    };
  } catch (err: any) {
    console.error('Google Sign-in error details:', err);
    if (err?.code === 'auth/unauthorized-domain') {
      throw new Error(
        `Google domain authorization is still processing. Please use the instant "Backup to Cloud" button below!`
      );
    }
    throw new Error(err?.message || 'Failed to sign in with Google');
  }
}

/**
 * Syncs the current local game progress and profile to the cloud
 */
export async function syncProgressToCloud(progress: GameProgress): Promise<number> {
  const user = auth.currentUser;
  const currentProf = getUserProfile();

  if (!user || user.isAnonymous) {
    const key = getOrCreateLocalSyncKey();
    const res = await syncProgressWithCloudKey(key, progress, currentProf);
    return res.syncedAt;
  }

  const userDocRef = doc(db, 'users', user.uid);
  const now = Date.now();
  const cloudPayload: CloudUserData = {
    uid: user.uid,
    email: user.email,
    displayName: currentProf.name || user.displayName,
    photoURL: user.photoURL,
    avatar: currentProf.avatar,
    userProfile: currentProf,
    gameProgress: progress,
    iapReceipts: progress.hasRemovedAds ? ['com.wordblast.removeads'] : [],
    lastSyncedAt: now,
  };

  await setDoc(userDocRef, cloudPayload, { merge: true });
  return now;
}

/**
 * Downloads and restores cloud progress, profile, and IAP for the signed-in user
 */
export async function restoreCloudProgress(localProgress: GameProgress): Promise<{
  progress: GameProgress;
  userProfile: UserProfile;
  restoredIAP: boolean;
  lastSyncedAt: number;
}> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    const key = getOrCreateLocalSyncKey();
    return await restoreWithCloudKey(key, localProgress);
  }

  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    const now = Date.now();
    await syncProgressToCloud(localProgress);
    const prof = getUserProfile();
    return {
      progress: localProgress,
      userProfile: prof,
      restoredIAP: Boolean(localProgress.hasRemovedAds),
      lastSyncedAt: now,
    };
  }

  const data = snap.data() as CloudUserData;
  const cloudProgress = data.gameProgress || localProgress;
  const merged = mergeGameProgress(localProgress, cloudProgress);

  if (data.iapReceipts?.includes('com.wordblast.removeads')) {
    merged.hasRemovedAds = true;
  }

  saveGameProgress(merged);

  const currentProf = getUserProfile();
  const restoredProfile: UserProfile = {
    ...currentProf,
    name: data.userProfile?.name || data.displayName || currentProf.name,
    avatar: data.userProfile?.avatar || data.avatar || currentProf.avatar,
    totalPoints: Math.max(currentProf.totalPoints, data.userProfile?.totalPoints || 0),
    totalWordsFormed: Math.max(currentProf.totalWordsFormed, data.userProfile?.totalWordsFormed || 0),
    categoriesCompleted: Math.max(currentProf.categoriesCompleted, data.userProfile?.categoriesCompleted || 0),
    highestWord: data.userProfile?.highestWord || currentProf.highestWord,
    highestWordPoints: Math.max(currentProf.highestWordPoints, data.userProfile?.highestWordPoints || 0),
  };
  saveUserProfile(restoredProfile);

  return {
    progress: merged,
    userProfile: restoredProfile,
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
