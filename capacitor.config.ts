import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.alxmobileapps.alphablast',
  appName: 'AlphaBlast',
  webDir: 'dist',
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: true,
      }
    : {
        androidScheme: 'https',
      },
  plugins: {
    // Restored -- a recent refactor dropped this block along with emptying
    // out scripts/patch-android-manifest.cjs, which together removed BOTH
    // ways AndroidManifest.xml was getting the required AdMob Application
    // ID meta-data tag. Without it the Google Mobile Ads SDK crashes the
    // app immediately on launch. The manifest-patch script (restored
    // separately) is what actually guarantees the tag is present; this is
    // the belt-and-suspenders half for @capacitor-community/admob versions
    // that pick it up here automatically too.
    AdMob: {
      appId: 'ca-app-pub-2452250229562082~6856794170',
    },
  },
};

export default config;
