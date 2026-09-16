/**
 * Google Play Billing & TWA (PWABuilder) / Median.co Unified Bridge
 * Supports:
 * 0. Capacitor Native Google Play Billing (cordova-plugin-purchase / "cdv-purchase") — real Android app builds
 * 1. PWABuilder / Trusted Web Activity (TWA) via Digital Goods API & PaymentRequest (https://play.google.com/billing)
 * 2. Median.co (GoNative) In-App Purchases & AdMob
 * 3. Browser simulation fallback for testing
 *
 * NOTE on the native (cdv-purchase) path: it was scaffolded against the documented
 * cdv-purchase v13 "Capacitor" integration API but could not be build-tested locally
 * in this environment (no local Android toolchain / npm registry access at the time
 * it was written). Verify against a real device build (see .github/workflows/android-build.yml)
 * and the plugin's own Capacitor guide before shipping: https://github.com/j3k0/cordova-plugin-purchase
 */

declare global {
  interface Window {
    median?: any;
    gonative?: any;
    getDigitalGoodsService?: (serviceName: string) => Promise<any>;
    Capacitor?: any;
    CdvPurchase?: any;
  }
}

/** All known Google Play Billing product IDs used by AlphaBlast's shop. */
const NATIVE_BILLING_PRODUCTS: Array<{ id: string; consumable: boolean }> = [
  { id: 'com.wordblast.removeads', consumable: false },
  { id: 'com.wordblast.diamonds_10', consumable: true },
  { id: 'com.wordblast.diamonds_50', consumable: true },
];

type PendingPurchase = {
  callback: (success: boolean, result?: IapPurchaseResult) => void;
};

let nativeBillingReady: Promise<void> | null = null;
const pendingPurchases = new Map<string, PendingPurchase>();

function isCapacitorNativeBilling(): boolean {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

// TEMPORARY DIAGNOSTIC FLAG — see the matching flag in universalAds.ts for
// the full rationale. Set to true, this makes the app behave as if native
// Google Play Billing (cdv-purchase) were unavailable, falling through to
// the PWABuilder/Median/web-fallback paths below — exactly like the old
// working PWABuilder build. This is to isolate whether the native billing
// code path (as opposed to the native AdMob code path, gated separately)
// is contributing to the ~4.5s white-screen freeze after round completion.
// MUST be set back to false (or removed) before shipping to production —
// leaving it true ships a build where real-money purchases don't work.
const DIAGNOSTIC_DISABLE_NATIVE_BILLING = true;

function nativeBillingEnabled(): boolean {
  return isCapacitorNativeBilling() && !DIAGNOSTIC_DISABLE_NATIVE_BILLING;
}

/**
 * Initializes the cdv-purchase store once (registers products + wires event handlers).
 * Safe to call multiple times — subsequent calls reuse the same initialization promise.
 */
function ensureNativeBillingReady(): Promise<void> {
  if (nativeBillingReady) return nativeBillingReady;

  nativeBillingReady = new Promise<void>((resolve) => {
    const CdvPurchase = window.CdvPurchase;
    if (!CdvPurchase) {
      console.warn('[NativeBilling] window.CdvPurchase not found (cordova-plugin-purchase not installed/synced yet)');
      resolve();
      return;
    }

    try {
      const { store, ProductType, Platform } = CdvPurchase;

      store.register(
        NATIVE_BILLING_PRODUCTS.map((p) => ({
          id: p.id,
          type: p.consumable ? ProductType.CONSUMABLE : ProductType.NON_CONSUMABLE,
          platform: Platform.GOOGLE_PLAY,
        }))
      );

      store.when().approved((transaction: any) => {
        transaction.verify();
      });

      store.when().verified((receipt: any) => {
        receipt.finish();
      });

      store.when().finished((transaction: any) => {
        const productId: string | undefined = transaction?.products?.[0]?.id;
        if (!productId) return;
        const pending = pendingPurchases.get(productId);
        if (pending) {
          pendingPurchases.delete(productId);
          pending.callback(true, {
            status: 'success',
            productId,
            transactionId: transaction.transactionId,
            purchaseToken: transaction.purchaseId || transaction.nativePurchase?.purchaseToken,
          });
        }
      });

      store.error((err: any) => {
        console.warn('[NativeBilling] Store error:', err);
        // If the error carries a productId we were waiting on, fail that specific purchase.
        const productId = err?.productId;
        if (productId && pendingPurchases.has(productId)) {
          pendingPurchases.delete(productId);
          pendingPurchases.get(productId);
          const pending = pendingPurchases.get(productId);
          pending?.callback(false, { status: 'error', productId, error: err?.message || 'Billing error' });
        }
      });

      store.initialize([Platform.GOOGLE_PLAY]).then(() => {
        console.log('[NativeBilling] cdv-purchase store initialized');
        resolve();
      }).catch((e: any) => {
        console.warn('[NativeBilling] initialize() failed:', e);
        resolve();
      });
    } catch (e) {
      console.warn('[NativeBilling] Failed to set up store:', e);
      resolve();
    }
  });

  return nativeBillingReady;
}

/** Kick off native billing initialization as early as possible (call once on app mount). */
export function initNativeBilling(): void {
  if (nativeBillingEnabled()) {
    void ensureNativeBillingReady();
  }
}

async function purchaseNative(
  productId: string,
  callback: (success: boolean, result?: IapPurchaseResult) => void
): Promise<void> {
  await ensureNativeBillingReady();
  const CdvPurchase = window.CdvPurchase;
  if (!CdvPurchase) {
    callback(false, { status: 'error', productId, error: 'Native billing unavailable on this build.' });
    return;
  }

  try {
    const { store } = CdvPurchase;
    const product = store.get(productId);
    const offer = product?.getOffer?.();
    if (!offer) {
      callback(false, { status: 'error', productId, error: 'Product not available from Google Play yet.' });
      return;
    }
    pendingPurchases.set(productId, { callback });
    await offer.order();
  } catch (e: any) {
    pendingPurchases.delete(productId);
    const message: string = e?.message || String(e);
    if (message.toLowerCase().includes('cancel')) {
      callback(false, { status: 'cancelled', productId });
    } else {
      callback(false, { status: 'error', productId, error: message });
    }
  }
}

async function restoreNative(
  onComplete: (restoredProductIds: string[]) => void,
  onError?: (err: string) => void
): Promise<void> {
  await ensureNativeBillingReady();
  const CdvPurchase = window.CdvPurchase;
  if (!CdvPurchase) {
    onComplete([]);
    return;
  }
  try {
    const { store } = CdvPurchase;
    await store.restorePurchases();
    const restored: string[] = NATIVE_BILLING_PRODUCTS
      .filter((p) => !p.consumable)
      .map((p) => p.id)
      .filter((id) => store.get(id)?.owned);
    onComplete(restored);
  } catch (e: any) {
    if (onError) onError(e?.message || 'Could not restore purchases.');
    else onComplete([]);
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
  // 0. Capacitor Native Google Play Billing (real Android app build)
  if (nativeBillingEnabled()) {
    await purchaseNative(productId, callback);
    return;
  }

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

  // 3. Web Browser Fallback (Google Play Billing is not supported in standard web browsers)
  // Strictly DO NOT grant goods for free
  console.log(`[Google Play Billing] Direct web browser purchase attempted for: ${productId}. Real payment requires Google Play Android app.`);
  callback(false, {
    status: 'error',
    productId,
    error: 'Google Play Billing is only available in the AlphaBlast Android App. Please install or open AlphaBlast on your Android device to complete real-money purchases.',
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
  // 0. Capacitor Native Google Play Billing (real Android app build)
  if (nativeBillingEnabled()) {
    await restoreNative(onComplete, onError);
    return;
  }

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

  // Return real restored products only
  onComplete(restored);
}

// Alias for backwards compatibility
export const restoreMedianPurchases = restorePurchases;
