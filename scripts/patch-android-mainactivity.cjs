#!/usr/bin/env node
/**
 * Overwrites MainActivity.java with a version that puts the app into true
 * immersive fullscreen: BOTH the status bar (top) and the navigation bar
 * (bottom) are hidden, not just avoided. The user can still swipe from an
 * edge to reveal them briefly (BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE) —
 * they auto-hide again once the window regains focus.
 *
 * Run after `npx cap add android` (that's what creates this file fresh
 * from Capacitor's default minimal template every CI run), before building.
 *
 * Why native code instead of the @capacitor/status-bar JS plugin: that
 * plugin only ever touches the status bar, not the navigation bar, and
 * (per the earlier status-bar-overlap bug) apps targeting Android 15/SDK 35
 * have edge-to-edge enforced by the OS regardless of what JS asks for at
 * runtime — hiding both bars natively, at Activity creation, is the
 * reliable way to get a real fullscreen game view on current Android.
 */
const fs = require('fs');
const path = require('path');

const APP_ID = 'com.alxmobileapps.alphablast'; // must match capacitor.config.ts's appId
const packagePath = APP_ID.split('.').join(path.sep);
const mainActivityPath = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'java',
  packagePath,
  'MainActivity.java'
);

if (!fs.existsSync(mainActivityPath)) {
  console.error(`[patch-android-mainactivity] MainActivity.java not found at ${mainActivityPath}`);
  console.error('[patch-android-mainactivity] Does APP_ID in this script still match capacitor.config.ts\'s appId?');
  process.exit(1);
}

const contents = `package ${APP_ID};

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * True immersive fullscreen: hides both the status bar and the navigation
 * bar so the game uses the whole screen. Swiping from an edge reveals them
 * briefly; they hide again once this re-applies on focus regain.
 *
 * IMPORTANT: onWindowFocusChanged only re-HIDES the bars below — it must NOT
 * call setDecorFitsSystemWindows() again on every focus change. That call
 * forces Android to redo a full window layout pass (it internally requests
 * a fresh insets/layout computation for the whole window), and
 * onWindowFocusChanged fires far more often during real play than it looks
 * like it should — a system-gesture edge swipe (the game board sits close
 * to the left/right screen edges, so a drag-to-select gesture near the edge
 * can be read as a system gesture), a transient status-bar peek, a native
 * AdMob view opening/closing, etc. Each of those was re-triggering a full
 * layout pass while this method also re-set decorFitsSystemWindows every
 * time, and on some devices/GPU drivers the WebView's surface briefly
 * renders blank/white while it recomposites after that — which lines up
 * exactly with a screen recording showing random white flashes during
 * ordinary mid-round gameplay (not just round transitions), at moments with
 * zero corresponding JS activity in the app's own on-screen timing log.
 * Setting decorFitsSystemWindows and the transient-bar behavior only ONCE,
 * in onCreate, avoids re-triggering that relayout on every focus change
 * while still re-hiding the bars each time focus is regained.
 *
 * SEPARATE ISSUE, same symptom: white screen / flicker specifically when
 * returning to the app after it sat in the background for a while (not
 * during ordinary play). This is a well-documented Android WebView
 * behavior, distinct from the focus-change relayout bug above: the longer
 * an app is backgrounded, the more likely Android is to reclaim the
 * WebView's GPU rendering surface/hardware layer to free memory for
 * whatever else is running. The Activity itself is NOT destroyed (so this
 * app's JS state survives — unlike a full process kill), but the surface
 * that WebView was last drawing into is gone, so the screen shows
 * blank/white for a beat after resume until something forces a fresh
 * composite. onResume() below forces that immediately: invalidate() +
 * requestLayout() ask for a fresh draw pass, and the visibility toggle
 * posted right after is a stronger fallback for the case where the
 * hardware layer itself (not just its last-drawn content) was released,
 * since toggling visibility forces Android to rebuild that layer from
 * scratch rather than trying to reuse a torn-down one.
 *
 * THIRD, related: whatever the WebView hasn't drawn in a given frame shows
 * the color BEHIND the page -- the WebView's own background (white by
 * default) and the window behind that (the app theme's light background).
 * A screen recording showed exactly that: a light-gray band where the
 * app's navy background should be, plus white boxes flashing over single
 * elements. Painting both of those navy (#071330, the app's own background
 * color) makes any such gap blend in with the page instead of flashing.
 * capacitor.config.ts's backgroundColor sets the WebView's color too; this
 * repeats it here so it holds even if that setting isn't picked up.
 *
 * Generated by scripts/patch-android-mainactivity.cjs — do not hand-edit,
 * this file is overwritten fresh on every CI build.
 */
public class MainActivity extends BridgeActivity {
  private static final int APP_BACKGROUND = Color.parseColor("#071330");

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setBackgroundDrawable(new ColorDrawable(APP_BACKGROUND));
    final View webView = getBridge() != null ? getBridge().getWebView() : null;
    if (webView != null) {
      webView.setBackgroundColor(APP_BACKGROUND);
    }
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (controller != null) {
      controller.setSystemBarsBehavior(
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
    hideSystemBars();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      hideSystemBars();
    }
  }

  @Override
  public void onResume() {
    super.onResume();
    forceWebViewRepaint();
  }

  /**
   * See the class doc above — forces a fresh composite of the WebView
   * right when the Activity resumes, instead of waiting on Android to
   * notice on its own that the surface it was drawing into is stale.
   */
  private void forceWebViewRepaint() {
    final View webView = getBridge() != null ? getBridge().getWebView() : null;
    if (webView == null) {
      return;
    }
    webView.invalidate();
    webView.requestLayout();
    webView.post(() -> {
      webView.setVisibility(View.INVISIBLE);
      webView.setVisibility(View.VISIBLE);
    });
  }

  private void hideSystemBars() {
    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (controller != null) {
      controller.hide(WindowInsetsCompat.Type.systemBars());
    }
  }
}
`;

fs.writeFileSync(mainActivityPath, contents, 'utf8');
console.log(`[patch-android-mainactivity] Wrote immersive-mode MainActivity.java to ${mainActivityPath}`);
