/**
 * Google Play Billing & TWA (PWABuilder) / Median.co Unified Bridge
 * Supports:
 * 1. PWABuilder / Trusted Web Activity (TWA) via Digital Goods API & PaymentRequest (https://play.google.com/billing)
 * 2. Median.co (GoNative) In-App Purchases & AdMob
 * 3. Browser simulation fallback for testing
 */

declare global {
  interface Window {
    median?: any;
    gonative?: any;
    getDigitalGoodsService?: (serviceName: string) => Promise<any>;
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
  purchaseToken?: string;
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
 * Check if running inside a TWA / PWABuilder environment that supports Google Play Billing
 */
export async function isDigitalGoodsSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ('getDigitalGoodsService' in window) {
    try {
      const service = await window.getDigitalGoodsService?.('https://play.google.com/billing');
      return !!service;
    } catch {
      return false;
    }
  }
  return false;
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
    console.log('[Ad Bridge] Simulating rewarded video watch.');
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
 * Core In-App Purchase Flow supporting PWABuilder (TWA Digital Goods / PaymentRequest) and Median
 */
export async function purchaseIAP(
  productId: string,
  callback: (success: boolean, result?: IapPurchaseResult) => void
): Promise<void> {
  // 1. Check if PWABuilder / TWA Google Play Billing PaymentRequest is available
  if (typeof window !== 'undefined' && 'PaymentRequest' in window) {
    try {
      const paymentMethodData = [
        {
          supportedMethods: 'https://play.google.com/billing',
          data: {
            sku: productId,
          },
        },
      ];

      const paymentDetails = {
        total: {
          label: 'Total',
          amount: { currency: 'PHP', value: '0' },
        },
      };

      const request = new (window as any).PaymentRequest(paymentMethodData, paymentDetails);
      const canMakePayment = await request.canMakePayment().catch(() => true);

      if (canMakePayment) {
        const paymentResponse = await request.show();
        const details = paymentResponse.details || {};
        const purchaseToken = details.purchaseToken || details.token || 'twa_token_' + Date.now();

        // If Digital Goods API is available, consume consumable items (diamonds)
        if ('getDigitalGoodsService' in window && window.getDigitalGoodsService) {
          try {
            const service = await window.getDigitalGoodsService('https://play.google.com/billing');
            if (service && purchaseToken) {
              if (productId.includes('diamonds') || productId.includes('coins')) {
                await service.consume(purchaseToken);
              }
            }
          } catch (consumeErr) {
            console.warn('[Digital Goods API] Consume note:', consumeErr);
          }
        }

        await paymentResponse.complete('success');
        callback(true, {
          status: 'success',
          productId,
          purchaseToken,
          transactionId: purchaseToken,
        });
        return;
      }
    } catch (err: any) {
      console.warn('[Google Play Billing PaymentRequest]', err);
      if (
        err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('cancel') ||
        err.message?.toLowerCase().includes('abort') ||
        err.message?.toLowerCase().includes('closed')
      ) {
        callback(false, { status: 'cancelled', productId, error: 'Cancelled' });
        return;
      }
      // If error occurred (e.g. not inside TWA container), try fallback below
    }
  }

  // 2. Check Median.co wrapper
  const median = (window as any)?.median || (window as any)?.gonative;
  if (median?.iap?.purchase) {
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
      return;
    } catch (err: any) {
      callback(false, { status: 'error', productId, error: err.message });
      return;
    }
  }

  // 3. Fallback for browser preview testing
  console.log(`[Google Play Billing Preview] Simulating test purchase for: ${productId}`);
  callback(true, {
    status: 'success',
    productId,
    simulated: true,
  });
}

// Alias for backwards compatibility with existing imports
export const purchaseMedianIAP = purchaseIAP;

/**
 * Restore Non-Consumable Purchases (e.g. "com.wordblast.removeads")
 */
export async function restorePurchases(
  onComplete: (restoredProductIds: string[]) => void,
  onError?: (err: string) => void
): Promise<void> {
  const restored: string[] = [];

  // 1. Check PWABuilder / TWA Digital Goods Service
  if (typeof window !== 'undefined' && 'getDigitalGoodsService' in window && window.getDigitalGoodsService) {
    try {
      const service = await window.getDigitalGoodsService('https://play.google.com/billing');
      if (service && service.listPurchases) {
        const purchases = await service.listPurchases();
        if (Array.isArray(purchases)) {
          for (const item of purchases) {
            if (item.itemId) {
              restored.push(item.itemId);
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[Digital Goods] listPurchases note:', e);
    }
  }

  // 2. Check Median wrapper
  const median = (window as any)?.median || (window as any)?.gonative;
  if (median?.iap?.restorePurchases) {
    try {
      median.iap.restorePurchases({
        callback: (res: { status: string; purchasedProductIds?: string[]; error?: string }) => {
          if (res.status === 'success') {
            const combined = Array.from(new Set([...restored, ...(res.purchasedProductIds || [])]));
            onComplete(combined);
          } else {
            if (onError) onError(res.error || 'Restore failed.');
            else onComplete(restored);
          }
        },
      });
      return;
    } catch (e: any) {
      if (onError) onError(e.message || 'Could not restore purchases.');
      return;
    }
  }

  // If items found via Digital Goods API
  if (restored.length > 0) {
    onComplete(restored);
    return;
  }

  // 3. Fallback for browser preview
  console.log('[Play Billing Preview] Restore simulated.');
  onComplete(['com.wordblast.removeads']);
}

// Alias for backwards compatibility
export const restoreMedianPurchases = restorePurchases;
