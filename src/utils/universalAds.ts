/**
 * Universal Ads Controller for AlphaBlast
 * Automatically bridges across:
 *  1. Capacitor Native AdMob (@capacitor-community/admob) — real Android app builds
 *  2. Google H5 Game Ads (Google Ad Placement API / PWABuilder / Web)
 *  3. Median.co Native AdMob (window.median.admob) — legacy WebView wrapper builds
 *  4. In-Game Interactive Ad Simulation (Fallback / Testing)
 */

import { ADS_CONFIG, isH5GamesSdkAvailable } from '../config/adsConfig';

declare global {
  interface Window {
    adBreak?: (params: any) => void;
    adConfig?: (params: any) => void;
    adsbygoogle?: any[];
    Capacitor?: any;
    median?: any;
    gonative?: any;
  }
}

/**
 * True only inside a real Capacitor native shell (the Android app built via `npx cap sync android`),
 * never inside a plain mobile browser.
 */
export function isCapacitorNative(): boolean {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

/**
 * RESOLVED — this used to be a diagnostic kill-switch while we isolated the
 * ~4.5s white-screen freeze reported after round completion (a two-round
 * bisection confirmed it was native AdMob, not native Billing — see the
 * `diagnostic-disable-ads-billing` / `diagnostic-reenable-billing-only`
 * branches). Root cause: showUniversalInterstitialAd() would, if the next
 * interstitial hadn't finished preloading yet, `await AdMob.prepareInterstitial()`
 * live and then show it — blocking on a real network fetch of the ad
 * creative before the native ad Activity could paint anything, which is
 * exactly the multi-second blank/white transition that was reported. The
 * actual fix is below (showUniversalInterstitialAd now skips the ad
 * entirely rather than blocking when it isn't preloaded in time, and
 * preloadInterstitialAd retries on failure instead of giving up silently).
 * Native ads are back on (`false` here) as part of that fix.
 */
const DIAGNOSTIC_DISABLE_NATIVE_ADS = false;

function nativeAdsEnabled(): boolean {
  return isCapacitorNative() && !DIAGNOSTIC_DISABLE_NATIVE_ADS;
}

/**
 * TEMPORARY STOPGAP — the interstitial-freeze fix above turned out to only
 * cover the "ad not preloaded yet" case; the freeze is still reported when
 * a real interstitial actually gets shown (its own native Activity
 * transition). Rather than ship a broken interstitial while that gets
 * properly diagnosed with real device logs, only the interstitial is
 * disabled here — native banner ads and native Billing stay on as normal
 * (both already confirmed not to cause the freeze). Remove this flag once
 * the interstitial itself is fixed for real.
 */
const STOPGAP_DISABLE_NATIVE_INTERSTITIAL_ONLY = true;

function nativeInterstitialEnabled(): boolean {
  return nativeAdsEnabled() && !STOPGAP_DISABLE_NATIVE_INTERSTITIAL_ONLY;
}

let admobModulePromise: Promise<typeof import('@capacitor-community/admob')> | null = null;
let admobInitialized = false;
let admobListenersBound = false;

// Interstitial ads are loaded ahead of time (see preloadInterstitialAd) so that
// showUniversalInterstitialAd() can display an already-cached ad instantly
// instead of calling prepareInterstitial() + showInterstitial() back-to-back,
// which visibly stutters while the ad creative downloads over the network.
let interstitialPrepared = false;
let interstitialPreparing = false;

/**
 * Lazily loads the @capacitor-community/admob plugin.
 * Dynamic import keeps the plugin out of the web/H5 bundle entirely —
 * it's only ever fetched when actually running inside the native Android app.
 */
function loadAdMob() {
  if (!admobModulePromise) {
    admobModulePromise = import('@capacitor-community/admob');
  }
  return admobModulePromise;
}

async function ensureNativeAdMobInitialized(): Promise<void> {
  if (!nativeAdsEnabled() || admobInitialized) return;
  try {
    const { AdMob } = await loadAdMob();
    await AdMob.initialize({
      initializeForTesting: ADS_CONFIG.TEST_MODE,
      testingDevices: [],
    });
    admobInitialized = true;
    console.log('[UniversalAds] Native AdMob initialized (TEST_MODE=' + ADS_CONFIG.TEST_MODE + ')');
  } catch (e) {
    console.warn('[UniversalAds] Native AdMob init failed:', e);
  }
}

let interstitialRetryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Fetches an interstitial ad from AdMob ahead of time and caches it so the
 * next showUniversalInterstitialAd() call can display it immediately. Safe
 * to call repeatedly — it no-ops if one is already prepared or in flight.
 *
 * Retries on failure (e.g. a network hiccup during app startup) instead of
 * giving up silently — previously a single failed preload left
 * interstitialPrepared stuck at false until the next unrelated call site
 * happened to trigger it again, which meant the *next* round's interstitial
 * was likely to hit the not-ready path too. See showUniversalInterstitialAd
 * for why "not ready" matters: it now skips the ad rather than blocking on
 * a live fetch, so a stuck-false interstitialPrepared silently loses ad
 * impressions rather than freezing the app — but retrying here means that
 * should rarely happen in practice.
 */
export function preloadInterstitialAd(): void {
  if (!nativeInterstitialEnabled() || interstitialPrepared || interstitialPreparing) return;
  if (interstitialRetryTimer) {
    clearTimeout(interstitialRetryTimer);
    interstitialRetryTimer = null;
  }
  interstitialPreparing = true;
  void (async () => {
    try {
      const { AdMob } = await loadAdMob();
      await ensureNativeAdMobInitialized();
      await AdMob.prepareInterstitial({ adId: ADS_CONFIG.ADMOB_ANDROID.INTERSTITIAL_ID });
      interstitialPrepared = true;
    } catch (e) {
      console.warn('[UniversalAds] Interstitial preload failed, will retry in 15s:', e);
      interstitialRetryTimer = setTimeout(() => {
        interstitialRetryTimer = null;
        preloadInterstitialAd();
      }, 15000);
    } finally {
      interstitialPreparing = false;
    }
  })();
}

/**
 * Initialize Google H5 Game Ads (if script loaded) + Native AdMob (if on Capacitor Android)
 */
export function initUniversalAds(): void {
  if (typeof window === 'undefined') return;

  // Native AdMob (Capacitor Android app)
  if (nativeAdsEnabled()) {
    void ensureNativeAdMobInitialized();
    preloadInterstitialAd();
  }

  // Initialize H5 Game Ads if available (web / PWA only)
  if (typeof window.adConfig === 'function') {
    try {
      window.adConfig({
        preloadAdBreaks: 'on',
        onReady: () => {
          console.log('[UniversalAds] Google H5 Game Ads ready');
        },
      });
    } catch (e) {
      console.warn('[UniversalAds] Failed to init adConfig:', e);
    }
  }
}

/**
 * Request & Display a Rewarded Video Ad
 */
export function showUniversalRewardedAd(options: {
  name?: string;
  onReward: () => void;
  onDismiss?: () => void;
  onError?: (err: string) => void;
  fallbackToInteractiveModal?: () => void;
}): void {
  const { onReward, onDismiss, onError, fallbackToInteractiveModal } = options;

  // 1. Native AdMob (Capacitor Android app) — highest priority & Play policy compliant
  if (nativeAdsEnabled()) {
    void (async () => {
      try {
        const { AdMob, RewardAdPluginEvents } = await loadAdMob();
        await ensureNativeAdMobInitialized();

        let rewarded = false;
        const cleanup: Array<() => void> = [];

        const rewardedListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
          onReward();
        });
        cleanup.push(() => rewardedListener.remove());

        const dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          cleanup.forEach((fn) => fn());
          if (!rewarded && onDismiss) onDismiss();
        });
        cleanup.push(() => dismissedListener.remove());

        const failedListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err: any) => {
          console.warn('[UniversalAds] Native rewarded failed to load:', err);
          cleanup.forEach((fn) => fn());
          if (onError) onError(err?.message || 'Rewarded ad failed to load');
          else if (fallbackToInteractiveModal) fallbackToInteractiveModal();
          else onReward();
        });
        cleanup.push(() => failedListener.remove());

        await AdMob.prepareRewardVideoAd({ adId: ADS_CONFIG.ADMOB_ANDROID.REWARDED_ID });
        await AdMob.showRewardVideoAd();
      } catch (e: any) {
        console.warn('[UniversalAds] Native rewarded ad error:', e);
        if (onError) onError(e?.message || String(e));
        else if (fallbackToInteractiveModal) fallbackToInteractiveModal();
        else onReward();
      }
    })();
    return;
  }

  const { name = 'rewarded_bonus' } = options;

  // 2. Check Google H5 Game Ads (PWABuilder / Web)
  if (typeof window !== 'undefined' && typeof window.adBreak === 'function') {
    try {
      let rewarded = false;
      console.log('[UniversalAds] Invoking Google H5 adBreak for Rewarded Ad:', name);
      window.adBreak({
        type: 'reward',
        name,
        beforeAd: () => {
          console.log('[UniversalAds] H5 Rewarded: beforeAd (Audio muted)');
        },
        afterAd: () => {
          console.log('[UniversalAds] H5 Rewarded: afterAd (Audio restored)');
        },
        beforeReward: (showAdFn: () => void) => {
          console.log('[UniversalAds] H5 Rewarded: beforeReward prompt');
          if (typeof showAdFn === 'function') {
            showAdFn();
          }
        },
        adViewed: () => {
          console.log('[UniversalAds] H5 Rewarded: adViewed (Reward Granted!)');
          rewarded = true;
          onReward();
        },
        adDismissed: () => {
          console.log('[UniversalAds] H5 Rewarded: adDismissed');
          if (!rewarded && onDismiss) {
            onDismiss();
          }
        },
        adBreakDone: (placementInfo: any) => {
          console.log('[UniversalAds] H5 Rewarded: adBreakDone status:', placementInfo?.breakStatus);
          if (placementInfo?.breakStatus === 'dismissed' && !rewarded && onDismiss) {
            onDismiss();
          } else if (placementInfo?.breakStatus === 'error' || placementInfo?.breakStatus === 'timeout') {
            console.warn('[UniversalAds] H5 Rewarded not filled or in cooldown, falling back to in-game reward modal');
            if (fallbackToInteractiveModal) fallbackToInteractiveModal();
            else onReward();
          }
        },
      });
      return;
    } catch (e: any) {
      console.warn('[UniversalAds] H5 adBreak failed, falling back:', e);
    }
  }

  // 3. Check Median.co Native AdMob
  const median = window.median || window.gonative;
  if (median?.admob?.rewarded) {
    try {
      median.admob.rewarded.show({
        callback: (result: { status?: string; rewarded?: boolean; error?: string }) => {
          if (result?.rewarded || result?.status === 'rewarded') {
            onReward();
          } else if (result?.error) {
            if (onError) onError(result.error);
            else if (fallbackToInteractiveModal) fallbackToInteractiveModal();
            else onReward();
          } else {
            if (onDismiss) onDismiss();
          }
        },
      });
      return;
    } catch (e: any) {
      console.warn('[UniversalAds] Median rewarded failed:', e);
    }
  }

  // 4. Fallback to interactive in-game simulation modal
  if (fallbackToInteractiveModal) {
    fallbackToInteractiveModal();
  } else {
    onReward();
  }
}

/**
 * Request & Display an Interstitial Ad
 */
export function showUniversalInterstitialAd(options?: { name?: string; onAdCompleted?: () => void }): void {
  // 1. Native AdMob (Capacitor Android app)
  if (nativeInterstitialEnabled()) {
    if (!interstitialPrepared) {
      // ROOT CAUSE OF THE ~4.5s WHITE-SCREEN FREEZE: this used to fall
      // through to `await AdMob.prepareInterstitial()` right here and then
      // show it — i.e. it blocked on a live network fetch of the ad
      // creative before the native ad Activity had anything to paint,
      // which is exactly the multi-second blank/white transition players
      // reported. A live-fetched interstitial is not worth freezing the
      // game over, so we skip showing an ad this one time instead of
      // blocking, and kick off a preload so the *next* round's ad is
      // ready. The player sees no ad this round, but the game never
      // freezes waiting for one.
      console.warn('[UniversalAds] Native interstitial not preloaded in time — skipping this ad instead of blocking on a live fetch.');
      preloadInterstitialAd();
      if (options?.onAdCompleted) options.onAdCompleted();
      return;
    }

    void (async () => {
      try {
        const { AdMob, InterstitialAdPluginEvents } = await loadAdMob();
        await ensureNativeAdMobInitialized();

        let completed = false;
        const finish = () => {
          if (completed) return;
          completed = true;
          // Start fetching the *next* interstitial right away so it's ready
          // ahead of time for the round after this one.
          preloadInterstitialAd();
          if (options?.onAdCompleted) options.onAdCompleted();
        };

        const dismissedListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
          dismissedListener.remove();
          finish();
        });
        const failedListener = await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err: any) => {
          console.warn('[UniversalAds] Native interstitial failed to load:', err);
          failedListener.remove();
          interstitialPrepared = false;
          finish();
        });

        interstitialPrepared = false;
        await AdMob.showInterstitial();
      } catch (e) {
        console.warn('[UniversalAds] Native interstitial error:', e);
        if (options?.onAdCompleted) options.onAdCompleted();
      }
    })();
    return;
  }

  const name = options?.name || 'next_level';

  // 2. Check Google H5 Game Ads
  if (typeof window !== 'undefined' && typeof window.adBreak === 'function') {
    try {
      console.log('[UniversalAds] Invoking Google H5 adBreak for Interstitial Ad:', name);
      window.adBreak({
        type: 'next',
        name,
        beforeAd: () => {
          console.log('[UniversalAds] H5 Interstitial: beforeAd');
        },
        afterAd: () => {
          console.log('[UniversalAds] H5 Interstitial: afterAd');
        },
        adBreakDone: (placementInfo: any) => {
          console.log('[UniversalAds] H5 Interstitial: adBreakDone status:', placementInfo?.breakStatus);
          if (options?.onAdCompleted) options.onAdCompleted();
        },
      });
      return;
    } catch (e) {
      console.warn('[UniversalAds] H5 Interstitial failed:', e);
    }
  }

  // 3. Check Median.co Native AdMob
  const median = window.median || window.gonative;
  if (median?.admob?.interstitial) {
    try {
      median.admob.interstitial.show();
      if (options?.onAdCompleted) options.onAdCompleted();
      return;
    } catch (e) {
      console.warn('[UniversalAds] Median interstitial failed:', e);
    }
  }

  // 4. Complete directly if no native interceptor
  if (options?.onAdCompleted) {
    options.onAdCompleted();
  }
}

/**
 * Control Bottom Banner Visibility across platforms
 */
export function setUniversalBannerVisible(visible: boolean, position: 'top' | 'bottom' = 'bottom'): void {
  // 1. Native AdMob (Capacitor Android app)
  if (nativeAdsEnabled()) {
    void (async () => {
      try {
        const { AdMob, BannerAdPosition, BannerAdSize } = await loadAdMob();
        await ensureNativeAdMobInitialized();
        if (visible) {
          await AdMob.showBanner({
            adId: ADS_CONFIG.ADMOB_ANDROID.BANNER_ID,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
            isTesting: ADS_CONFIG.TEST_MODE,
          });
        } else {
          await AdMob.hideBanner();
        }
      } catch (e) {
        console.warn('[UniversalAds] Native banner control failed:', e);
      }
    })();
    return;
  }

  const median = window.median || window.gonative;
  if (median?.admob?.banner) {
    try {
      if (visible) {
        median.admob.banner.show({ position });
      } else {
        median.admob.banner.hide();
      }
    } catch (e) {
      console.warn('[UniversalAds] Median banner control failed:', e);
    }
  }
}
