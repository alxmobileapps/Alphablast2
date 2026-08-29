/**
 * Screen Orientation Manager
 * Enforces Portrait Mode across PWA, Web, and Native WebView wrappers (Median / Capacitor)
 */

/**
 * Attempts to lock screen orientation to portrait
 */
export async function enforcePortraitLock(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Median.co Native Wrapper Lock
  const median = (window as any).median || (window as any).gonative;
  if (median?.screen?.setOrientation) {
    try {
      median.screen.setOrientation({ mode: 'portrait' });
    } catch (e) {
      console.warn('Median orientation lock failed:', e);
    }
  }

  // 2. Standard Web Screen Orientation API (Supported in PWAs and modern mobile browsers)
  try {
    const orientation = window.screen?.orientation as any;
    if (orientation?.lock) {
      await orientation.lock('portrait');
      return true;
    }
    // Legacy prefix support
    const legacyScreen = window.screen as any;
    if (legacyScreen?.lockOrientation) {
      legacyScreen.lockOrientation('portrait');
      return true;
    }
    if (legacyScreen?.mozLockOrientation) {
      legacyScreen.mozLockOrientation('portrait');
      return true;
    }
    if (legacyScreen?.msLockOrientation) {
      legacyScreen.msLockOrientation('portrait');
      return true;
    }
  } catch (err) {
    // Expected on desktop browsers or mobile browsers prior to user gesture / fullscreen
  }

  return false;
}

/**
 * Hook up global user interaction triggers to lock orientation as early as possible
 */
export function initOrientationLock(): void {
  if (typeof window === 'undefined') return;

  // Initial attempt
  enforcePortraitLock();

  // Retry on any user gesture (browser requirement for Screen Orientation API)
  const tryLockOnGesture = () => {
    enforcePortraitLock();
  };

  window.addEventListener('click', tryLockOnGesture, { passive: true });
  window.addEventListener('touchstart', tryLockOnGesture, { passive: true });
  window.addEventListener('pointerdown', tryLockOnGesture, { passive: true });

  // Re-enforce on visibility changes (when returning to app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      enforcePortraitLock();
    }
  });

  // Re-enforce on orientation changes
  if (window.screen?.orientation) {
    window.screen.orientation.addEventListener('change', () => {
      if (window.screen.orientation.type.includes('landscape')) {
        enforcePortraitLock();
      }
    });
  } else {
    window.addEventListener('orientationchange', () => {
      enforcePortraitLock();
    });
  }
}
