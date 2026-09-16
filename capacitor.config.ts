import type { CapacitorConfig } from '@capacitor/cli';

// AlphaBlast has a server-side AI feature (Gemini word generation via /api/gemini/*),
// so the packaged Android app points its WebView at the live deployed site instead of
// a fully offline static bundle. Set CAPACITOR_SERVER_URL (e.g. in your GitHub Actions
// workflow / local .env) to your production Firebase Hosting URL, e.g.
// "https://gen-lang-client-0566189915.web.app". When unset, the app falls back to the
// bundled dist/ assets and any /api/* calls will simply fail closed (SMART_THEME_FALLBACKS
// word lists still work offline).
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.alxmobileapps.alphablast',
  appName: 'AlphaBlast',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-2452250229562082~6856794170',
    },
    StatusBar: {
      // These two only matter if the status bar is ever visible; the real
      // fullscreen behavior (hiding both the status bar AND the nav bar) is
      // set up natively in MainActivity.java — see
      // scripts/patch-android-mainactivity.cjs and src/utils/nativeShell.ts.
      overlaysWebView: false,
      backgroundColor: '#071330',
    },
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: false,
  };
}

export default config;
