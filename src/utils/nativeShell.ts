/**
 * Native Android shell setup (Capacitor only).
 *
 * By default, recent Capacitor/Android builds render the WebView edge-to-edge —
 * i.e. behind the system status bar — which is why the top of the game
 * (player badge, coin/diamond counters) was overlapping with the phone's
 * clock/battery/signal icons. This turns that off and gives the status bar a
 * background that matches AlphaBlast's dark theme instead of the default
 * transparent/white one.
 */
export async function initNativeStatusBar(): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) {
    return;
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');

    // Stop the WebView from drawing underneath the status bar.
    await StatusBar.setOverlaysWebView({ overlay: false });

    // Match the app's dark navy theme (see index.html theme-color / TileColor).
    await StatusBar.setBackgroundColor({ color: '#071330' });

    // Light (white) status bar icons read best on our dark background.
    // Flip to Style.Dark if icons ever look invisible on a lighter screen.
    await StatusBar.setStyle({ style: Style.Light });
  } catch (e) {
    console.warn('[NativeShell] StatusBar setup failed:', e);
  }
}
