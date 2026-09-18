/**
 * ============================================================================
 *  ALPHABLAST - CENTRAL ADS CONFIGURATION
 * ============================================================================
 *  Update your Google AdMob & Google H5 Games (AdSense) IDs right here!
 *  
 *  TEST MODE:
 *  - Set `TEST_MODE: true` during development to avoid policy violations.
 *  - Set `TEST_MODE: false` when releasing to Google Play / App Store / Web.
 * ============================================================================
 */

export const ADS_CONFIG = {
  // Back to false (real ads, not Google's TEST creative). See
  // universalAds.ts and InterstitialAdModal.tsx / BottomBannerAd.tsx for
  // the current diagnostic: every native-ad on/off toggle so far left the
  // interstitial modal's expensive full-screen blur active regardless, so
  // that's what's being isolated now instead of these ad-network flags.
  TEST_MODE: false,

  // --------------------------------------------------------------------------
  // 1. GOOGLE H5 GAME ADS (Ad Placement API / AdSense for PWABuilder & Web)
  // --------------------------------------------------------------------------
  // Found in your Google AdSense Dashboard (Settings > Account > Account Info)
  H5_GAMES: {
    // Your Google Publisher Client ID (e.g. 'ca-pub-1234567890123456')
    CLIENT_ID: 'ca-pub-2452250229562082',
    
    // Optional AdSense Channel ID for granular tracking (e.g. '1234567890')
    CHANNEL_ID: '',

    // Frequency hint for ads: 'auto', '30s', '60s', '120s'
    FREQUENCY_HINT: '60s',
  },

  // --------------------------------------------------------------------------
  // 2. GOOGLE ADMOB - ANDROID (For Capacitor, Native APK, or Median.co)
  // --------------------------------------------------------------------------
  ADMOB_ANDROID: {
    APP_ID: 'ca-app-pub-2452250229562082~6856794170',
    BANNER_ID: 'ca-app-pub-2452250229562082/6665222489',
    INTERSTITIAL_ID: 'ca-app-pub-2452250229562082/4116593533',
    REWARDED_ID: 'ca-app-pub-2452250229562082/3272772387',
  },

  // --------------------------------------------------------------------------
  // 3. GOOGLE ADMOB - iOS (For iPhone / iPad builds)
  // --------------------------------------------------------------------------
  ADMOB_IOS: {
    APP_ID: 'ca-app-pub-2452250229562082~4011138987',
    BANNER_ID: 'ca-app-pub-2452250229562082/2506485625',
    INTERSTITIAL_ID: 'ca-app-pub-2452250229562082/2123342242',
    REWARDED_ID: 'ca-app-pub-2452250229562082/2666267726',
  },
};

/**
 * Returns whether running in a native mobile wrapper (Capacitor or Median)
 */
export function isNativeMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
  const isMedian = !!(window as any).median || !!(window as any).gonative;
  return isCapacitor || isMedian;
}

/**
 * Returns whether Google H5 Games SDK (adBreak) is loaded and available
 */
export function isH5GamesSdkAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).adBreak === 'function';
}
