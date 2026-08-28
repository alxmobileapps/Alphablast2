/**
 * Median.co (GoNative) JavaScript Bridge for AdMob & In-App Purchases (IAP)
 * Documentation reference: https://median.co/docs
 */

declare global {
  interface Window {
    median?: any;
    gonative?: any;
  }
}

export interface IapProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros?: number;
  currencyCode?: string;
}

export interface IapPurchaseResult {
  status: 'success' | 'cancelled' | 'error';
  productId: string;
  transactionId?: string;
  receipt?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Checks if the app is currently running inside a Median.co native wrapper
 */
export function isMedianApp(): boolean {
  return typeof window !== 'undefined' && (!!window.median || !!window.gonative);
}

/**
 * Trigger Median.co native AdMob Rewarded Ad
 * Falls back to simulation in desktop/web preview
 */
export function showMedianRewardedAd(
  onRewardEarned: () => void,
  onDismissed?: () => void,
  onError?: (err: string) => void
): void {
  const median = window.median || window.gonative;

  if (median?.admob?.rewarded) {
    try {
      median.admob.rewarded.show({
        callback: (result: { status?: string; rewarded?: boolean; error?: string }) => {
          if (result?.rewarded || result?.status === 'rewarded') {
            onRewardEarned();
          } else if (result?.error) {
            if (onError) onError(result.error);
            else if (onDismissed) onDismissed();
          } else {
            if (onDismissed) onDismissed();
          }
        },
      });
    } catch (e: any) {
      console.warn('Median AdMob Rewarded failed, using fallback:', e);
      onRewardEarned();
    }
  } else {
    // Browser preview simulation
    console.log('[Median Bridge] Not running inside native app. Using simulated rewarded video.');
    onRewardEarned();
  }
}

/**
 * Trigger Median.co native AdMob Interstitial Ad
 */
export function showMedianInterstitialAd(): void {
  const median = window.median || window.gonative;
  if (median?.admob?.interstitial) {
    try {
      median.admob.interstitial.show();
    } catch (e) {
      console.warn('Median AdMob Interstitial failed:', e);
    }
  }
}

/**
 * Toggle native banner ad
 */
export function setMedianBannerVisible(visible: boolean, position: 'top' | 'bottom' = 'bottom'): void {
  const median = window.median || window.gonative;
  if (median?.admob?.banner) {
    try {
      if (visible) {
        median.admob.banner.show({ position });
      } else {
        median.admob.banner.hide();
      }
    } catch (e) {
      console.warn('Median Banner toggle failed:', e);
    }
  }
}

/**
 * Purchase an In-App Product via Median.co StoreKit / Google Play Billing
 */
export function purchaseMedianIAP(
  productId: string,
  callback: (success: boolean, result?: IapPurchaseResult) => void
): void {
  const median = window.median || window.gonative;

  if (median?.iap) {
    try {
      median.iap.purchase({
        productId,
        callback: (res: { status: string; productId?: string; transactionId?: string; error?: string }) => {
          if (res.status === 'success') {
            callback(true, {
              status: 'success',
              productId: res.productId || productId,
              transactionId: res.transactionId,
            });
          } else if (res.status === 'cancelled') {
            callback(false, { status: 'cancelled', productId });
          } else {
            callback(false, { status: 'error', productId, error: res.error });
          }
        },
      });
    } catch (err: any) {
      callback(false, { status: 'error', productId, error: err.message });
    }
  } else {
    // Browser preview simulation mode
    console.log(`[Median Bridge Preview] Simulating purchase for: ${productId}`);
    callback(true, {
      status: 'success',
      productId,
      simulated: true,
    });
  }
}

export function purchaseMedianIap(
  productId: string,
  onSuccess: (result: IapPurchaseResult) => void,
  onError: (errorMsg: string) => void
): void {
  purchaseMedianIAP(productId, (success, res) => {
    if (success && res) {
      onSuccess(res);
    } else {
      onError(res?.error || 'Purchase failed');
    }
  });
}

/**
 * Restore Non-Consumable Purchases (e.g. "remove_ads")
 */
export function restoreMedianPurchases(
  onComplete: (restoredProductIds: string[]) => void,
  onError?: (err: string) => void
): void {
  const median = window.median || window.gonative;

  if (median?.iap?.restorePurchases) {
    try {
      median.iap.restorePurchases({
        callback: (res: { status: string; purchasedProductIds?: string[]; error?: string }) => {
          if (res.status === 'success') {
            onComplete(res.purchasedProductIds || []);
          } else {
            if (onError) onError(res.error || 'Restore failed.');
          }
        },
      });
    } catch (e: any) {
      if (onError) onError(e.message || 'Could not restore purchases.');
    }
  } else {
    console.log('[Median Bridge Preview] Restore simulated.');
    onComplete(['com.wordblast.removeads']);
  }
}
