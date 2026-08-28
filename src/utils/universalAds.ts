/**
 * Universal Ads Controller for AlphaBlast
 * Automatically bridges across:
 *  1. Google H5 Game Ads (Google Ad Placement API / PWABuilder / Web)
 *  2. Capacitor Native AdMob (@capacitor-community/admob)
 *  3. Median.co Native AdMob (window.median.admob)
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
 * Initialize Google H5 Game Ads (if script loaded)
 */
export function initUniversalAds(): void {
  if (typeof window === 'undefined') return;

  // Initialize H5 Game Ads if available
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
  const { name = 'rewarded_bonus', onReward, onDismiss, onError, fallbackToInteractiveModal } = options;

  // 1. Check Google H5 Game Ads (PWABuilder / Web)
  if (isH5GamesSdkAvailable() && typeof window.adBreak === 'function') {
    try {
      let rewarded = false;
      window.adBreak({
        type: 'reward',
        name,
        beforeReward: (showAdFn: () => void) => {
          showAdFn();
        },
        adViewed: () => {
          rewarded = true;
          onReward();
        },
        adDismissed: () => {
          if (!rewarded && onDismiss) {
            onDismiss();
          }
        },
        adBreakDone: (placementInfo: any) => {
          if (placementInfo?.breakStatus === 'dismissed' && !rewarded && onDismiss) {
            onDismiss();
          } else if (placementInfo?.breakStatus === 'error') {
            console.warn('[UniversalAds] H5 Rewarded error, falling back to simulated modal');
            if (fallbackToInteractiveModal) fallbackToInteractiveModal();
            else onReward();
          }
        },
      });
      return;
    } catch (e: any) {
      console.warn('[UniversalAds] H5 adBreak failed:', e);
    }
  }

  // 2. Check Median.co Native AdMob
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

  // 3. Fallback to interactive in-game simulation modal
  if (fallbackToInteractiveModal) {
    fallbackToInteractiveModal();
  } else {
    onReward();
  }
}

/**
 * Request & Display an Interstitial Ad
 */
export function showUniversalInterstitialAd(options?: {
  name?: string;
  onAdCompleted?: () => void;
}): void {
  const name = options?.name || 'next_level';

  // 1. Check Google H5 Game Ads
  if (isH5GamesSdkAvailable() && typeof window.adBreak === 'function') {
    try {
      window.adBreak({
        type: 'next',
        name,
        adBreakDone: (placementInfo: any) => {
          if (options?.onAdCompleted) options.onAdCompleted();
        },
      });
      return;
    } catch (e) {
      console.warn('[UniversalAds] H5 Interstitial failed:', e);
    }
  }

  // 2. Check Median.co Native AdMob
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

  // 3. Complete directly if no native interceptor
  if (options?.onAdCompleted) {
    options.onAdCompleted();
  }
}

/**
 * Control Bottom Banner Visibility across platforms
 */
export function setUniversalBannerVisible(visible: boolean, position: 'top' | 'bottom' = 'bottom'): void {
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
