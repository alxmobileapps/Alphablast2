/**
 * Native Android shell setup (Capacitor only).
 *
 * The app now runs in true immersive fullscreen: MainActivity.java (see
 * scripts/patch-android-mainactivity.cjs) hides both the status bar and the
 * navigation bar natively at Activity creation, so the game gets the whole
 * screen instead of just avoiding an overlap with it. That native call is
 * the one that actually matters and already runs before any JS loads.
 *
 * This just asks the @capacitor/status-bar plugin to hide the status bar
 * too, as a belt-and-suspenders JS-side call — harmless if the native side
 * already did it, and a fallback in case a given Android/WebView
 * combination ever ignores the native immersive call.
 */
export async function initNativeStatusBar(): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) {
    return;
  }

  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.hide();
  } catch (e) {
    console.warn('[NativeShell] StatusBar hide failed:', e);
  }
}
