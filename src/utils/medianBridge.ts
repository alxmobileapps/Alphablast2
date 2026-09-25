/**
 * Google Play Billing & TWA (PWABuilder) / Median.co Unified Bridge
 * Supports:
 * 0. Capacitor Native Google Play Billing (cordova-plugin-purchase / "cdv-purchase") — the real Android app
 * 1. PWABuilder / Trusted Web Activity (TWA) via Digital Goods API & PaymentRequest (https://play.google.com/billing)
 * 2. Median.co (GoNative) In-App Purchases & AdMob
 * 3. Browser simulation fallback for testing
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

// ---------------------------------------------------------------------------
// 0. Capacitor native Google Play Billing (cordova-plugin-purchase v13)
//
// RESTORED: this whole native path (and the cordova-plugin-purchase
// dependency in package.json) was deleted by commit 9d09bb9 ("chore: cleanup
// and refactor Capacitor configuration"). Without it, the Capacitor Android
// app fell through to the TWA / Median / browser paths below, none of which
// exist in a Capacitor app — so every purchase ended with the "install
// AlphaBlast from the Play Store" message, even inside the installed app.
// ---------------------------------------------------------------------------

/** All known Google Play Billing product IDs used by AlphaBlast's shop. */
const NATIVE_BILLING_PRODUCTS: Array<{ id: string; consumable: boolean }> = [
  { id: 'com.wordblast.removeads', consumable: false },
  { id: 'com.wordblast.diamonds_10', consumable: true },
  { id: 'com.wordblast.diamonds_50', consumable: true },
];

type PendingPurchase = {
  callback: (success: boolean, result?: IapPurchaseResult) => void;
};

let nativeBillingReady: Promise<boolean> | null = null;
const pendingPurchases = new Map<string, PendingPurchase>();

function isCapacitorNativeBilling(): boolean {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

function nativeBillingEnabled(): boolean {
  return isCapacitorNativeBilling();
}

/**
 * cordova-plugin-purchase's JS (window.CdvPurchase) is injected by
 * Capacitor's Cordova bridge and may not exist yet when React first mounts.
 * Wait for it (deviceready / short polling) instead of giving up instantly.
 */
function waitForCdvPurchase(timeoutMs = 10000): Promise<any | null> {
  return new Promise((resolve) => {
    if (window.CdvPurchase) {
      resolve(window.CdvPurchase);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(timer);
      document.removeEventListener('deviceready', onReady);
      resolve(window.CdvPurchase || null);
    };
    const onReady = () => {
      if (window.CdvPurchase) finish();
    };
    document.addEventListener('deviceready', onReady);
    const poll = setInterval(() => {
      if (window.CdvPurchase) finish();
    }, 250);
    const timer = setTimeout(finish, timeoutMs);
  });
}

function billingErrorText(err: any): string {
  // NOTE: must not contain "Google Play" / "Android" — ShopModal treats those
  // words as "not running in the app" and shows the install-from-Play-Store
  // popup instead of the real error.
  return err?.message || 'Purchase could not be completed. Please try again.';
}

function isCancelError(CdvPurchase: any, err: any): boolean {
  const cancelCode = CdvPurchase?.ErrorCode?.PAYMENT_CANCELLED;
  return (
    (cancelCode !== undefined && err?.code === cancelCode) ||
    String(err?.message || '').toLowerCase().includes('cancel')
  );
}

/**
 * Initializes the cdv-purchase store once (registers products + wires event
 * handlers). Resolves true when the store is usable. A failed attempt is not
 * cached, so the next purchase tap tries again.
 */
function ensureNativeBillingReady(): Promise<boolean> {
  if (nativeBillingReady) return nativeBillingReady;

  const attempt = (async (): Promise<boolean> => {
    const CdvPurchase = await waitForCdvPurchase();
    if (!CdvPurchase) {
      console.warn('[NativeBilling] window.CdvPurchase not found (cordova-plugin-purchase not installed/synced)');
      return false;
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

      store
        .when()
        .approved((transaction: any) => transaction.verify())
        .verified((receipt: any) => receipt.finish())
        .finished((transaction: any) => {
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
        const productId: string | undefined = err?.productId;
        if (productId) {
          const pending = pendingPurchases.get(productId);
          if (pending) {
            pendingPurchases.delete(productId);
            pending.callback(
              false,
              isCancelError(CdvPurchase, err)
                ? { status: 'cancelled', productId }
                : { status: 'error', productId, error: billingErrorText(err) }
            );
          }
        }
      });

      const initErrors = await store.initialize([Platform.GOOGLE_PLAY]);
      if (Array.isArray(initErrors) && initErrors.length > 0) {
        console.warn('[NativeBilling] initialize() reported errors:', initErrors);
      }
      console.log('[NativeBilling] cdv-purchase store initialized');
      return true;
    } catch (e) {
      console.warn('[NativeBilling] Failed to set up store:', e);
      return false;
    }
  })();

  nativeBillingReady = attempt.then((ok) => {
    if (!ok) nativeBillingReady = null; // allow a retry on the next purchase
    return ok;
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
  const ready = await ensureNativeBillingReady();
  const CdvPurchase = window.CdvPurchase;
  if (!ready || !CdvPurchase) {
    callback(false, { status: 'error', productId, error: 'The store is not ready yet. Please check your connection and try again.' });
    return;
  }

  try {
    const { store } = CdvPurchase;
    const product = store.get(productId);

    // Already-owned non-consumable (e.g. Remove Ads bought before, then the
    // app was reinstalled): grant it instead of failing with "already owned".
    const def = NATIVE_BILLING_PRODUCTS.find((p) => p.id === productId);
    if (product?.owned && def && !def.consumable) {
      callback(true, { status: 'success', productId });
      return;
    }

    const offer = product?.getOffer?.();
    if (!offer) {
      callback(false, { status: 'error', productId, error: 'This item is not available in the store right now. Please try again later.' });
      return;
    }

    pendingPurchases.set(productId, { callback });
    // cdv-purchase v13: order() resolves with an error object on failure
    // (including when the player cancels) rather than throwing.
    const orderError = await offer.order();
    if (orderError) {
      const pending = pendingPurchases.get(productId);
      pendingPurchases.delete(productId);
      if (pending) {
        pending.callback(
          false,
          isCancelError(CdvPurchase, orderError)
            ? { status: 'cancelled', productId }
            : { status: 'error', productId, error: billingErrorText(orderError) }
        );
      }
    }
  } catch (e: any) {
    const pending = pendingPurchases.get(productId);
    pendingPurchases.delete(productId);
    const cb = pending?.callback || callback;
    if (isCancelError(window.CdvPurchase, e)) {
      cb(false, { status: 'cancelled', productId });
    } else {
      cb(false, { status: 'error', productId, error: billingErrorText(e) });
    }
  }
}

async function restoreNative(
  onComplete: (restoredProductIds: string[]) => void,
  onError?: (err: string) => void
): Promise<void> {
  const ready = await ensureNativeBillingReady();
  const CdvPurchase = window.CdvPurchase;
  if (!ready || !CdvPurchase) {
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
  // 0. Capacitor Native Google Play Billing (the real Android app)
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
  // 0. Capacitor Native Google Play Billing (the real Android app)
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
