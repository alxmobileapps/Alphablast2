/**
 * Remote Ads Configuration Service
 * Syncs AdMob & Google H5 Game Ads IDs dynamically with Firestore.
 * 
 * Allows you to change Ad IDs and testMode on the fly directly in your Firebase Console!
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ADS_CONFIG } from '../config/adsConfig';

export interface RemoteAdsData {
  testMode?: boolean;
  h5ClientId?: string;
  h5ChannelId?: string;
  admobAndroidAppId?: string;
  admobAndroidBannerId?: string;
  admobAndroidInterstitialId?: string;
  admobAndroidRewardedId?: string;
  admobIosAppId?: string;
  admobIosBannerId?: string;
  admobIosInterstitialId?: string;
  admobIosRewardedId?: string;
  updatedAt?: number;
}

const CONFIG_DOC_PATH = 'app_config';
const ADS_DOC_ID = 'ads';

/**
 * Applies remote Firestore values to runtime memory ADS_CONFIG
 */
function applyRemoteValues(data: RemoteAdsData) {
  if (data.testMode !== undefined) {
    ADS_CONFIG.TEST_MODE = data.testMode;
  }
  if (data.h5ClientId) {
    ADS_CONFIG.H5_GAMES.CLIENT_ID = data.h5ClientId;
  }
  if (data.h5ChannelId !== undefined) {
    ADS_CONFIG.H5_GAMES.CHANNEL_ID = data.h5ChannelId;
  }
  if (data.admobAndroidAppId) {
    ADS_CONFIG.ADMOB_ANDROID.APP_ID = data.admobAndroidAppId;
  }
  if (data.admobAndroidBannerId) {
    ADS_CONFIG.ADMOB_ANDROID.BANNER_ID = data.admobAndroidBannerId;
  }
  if (data.admobAndroidInterstitialId) {
    ADS_CONFIG.ADMOB_ANDROID.INTERSTITIAL_ID = data.admobAndroidInterstitialId;
  }
  if (data.admobAndroidRewardedId) {
    ADS_CONFIG.ADMOB_ANDROID.REWARDED_ID = data.admobAndroidRewardedId;
  }
  if (data.admobIosAppId) {
    ADS_CONFIG.ADMOB_IOS.APP_ID = data.admobIosAppId;
  }
  if (data.admobIosBannerId) {
    ADS_CONFIG.ADMOB_IOS.BANNER_ID = data.admobIosBannerId;
  }
  if (data.admobIosInterstitialId) {
    ADS_CONFIG.ADMOB_IOS.INTERSTITIAL_ID = data.admobIosInterstitialId;
  }
  if (data.admobIosRewardedId) {
    ADS_CONFIG.ADMOB_IOS.REWARDED_ID = data.admobIosRewardedId;
  }
  console.log('[RemoteAds] Synced ad config from Firestore:', ADS_CONFIG);
}

/**
 * Initializes real-time listener for app_config/ads in Firestore.
 * If the document doesn't exist yet, seeds it with the initial default config.
 */
export function initRemoteAdsListener(): () => void {
  try {
    const adsDocRef = doc(db, CONFIG_DOC_PATH, ADS_DOC_ID);

    // Initial check & auto-seed if document does not exist or update defaults
    getDoc(adsDocRef)
      .then((snapshot) => {
        const initialSeed: RemoteAdsData = {
          testMode: ADS_CONFIG.TEST_MODE,
          h5ClientId: ADS_CONFIG.H5_GAMES.CLIENT_ID,
          h5ChannelId: ADS_CONFIG.H5_GAMES.CHANNEL_ID,
          admobAndroidAppId: ADS_CONFIG.ADMOB_ANDROID.APP_ID,
          admobAndroidBannerId: ADS_CONFIG.ADMOB_ANDROID.BANNER_ID,
          admobAndroidInterstitialId: ADS_CONFIG.ADMOB_ANDROID.INTERSTITIAL_ID,
          admobAndroidRewardedId: ADS_CONFIG.ADMOB_ANDROID.REWARDED_ID,
          admobIosAppId: ADS_CONFIG.ADMOB_IOS.APP_ID,
          admobIosBannerId: ADS_CONFIG.ADMOB_IOS.BANNER_ID,
          admobIosInterstitialId: ADS_CONFIG.ADMOB_IOS.INTERSTITIAL_ID,
          admobIosRewardedId: ADS_CONFIG.ADMOB_IOS.REWARDED_ID,
          updatedAt: Date.now(),
        };

        if (!snapshot.exists()) {
          setDoc(adsDocRef, initialSeed, { merge: true }).catch((err) => {
            console.warn('[RemoteAds] Could not seed initial config doc:', err);
          });
        }
      })
      .catch((err) => {
        console.warn('[RemoteAds] Initial fetch error:', err);
      });

    // Real-time snapshot listener
    const unsubscribe = onSnapshot(
      adsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as RemoteAdsData;
          // Auto-migrate obsolete publisher ID in Firestore if present
          if (data.h5ClientId === 'ca-pub-2452250229562082') {
            data.h5ClientId = ADS_CONFIG.H5_GAMES.CLIENT_ID;
            setDoc(adsDocRef, { h5ClientId: ADS_CONFIG.H5_GAMES.CLIENT_ID, updatedAt: Date.now() }, { merge: true }).catch(() => {});
          }
          applyRemoteValues(data);
        }
      },
      (error) => {
        console.warn('[RemoteAds] Snapshot listener warning:', error.message);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('[RemoteAds] Failed to start listener:', e);
    return () => {};
  }
}

/**
 * Updates the Firestore remote ads configuration directly from code or admin UI
 */
export async function updateRemoteAdsConfig(newConfig: Partial<RemoteAdsData>): Promise<void> {
  const adsDocRef = doc(db, CONFIG_DOC_PATH, ADS_DOC_ID);
  await setDoc(
    adsDocRef,
    {
      ...newConfig,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}
