#!/usr/bin/env node
/**
 * Idempotently ensures AndroidManifest.xml carries the AdMob Application ID meta-data tag.
 * Run after `npx cap add android` / `npx cap sync android`, before building.
 *
 * RESTORED: this file was accidentally emptied out to 0 bytes by a recent
 * refactor (capacitor.config.ts's plugins.AdMob.appId block was dropped in
 * the same change), which silently removed BOTH ways this app had of
 * getting the AdMob Application ID into AndroidManifest.xml. The workflow
 * still calls this script every build, but an empty .cjs file just runs
 * and exits 0 doing nothing -- no error, no warning, nothing in the build
 * log to catch. The Google Mobile Ads SDK hard-crashes the app on launch
 * (IllegalStateException) the moment it initializes without this manifest
 * meta-data tag present, which is exactly what a screen recording showed:
 * the app opens, flashes white, and is back on the home screen within
 * about 2 seconds -- every single build since that refactor landed has
 * been an instant crash-on-launch on a real device, even though CI itself
 * reported green the whole time (a missing manifest tag isn't something
 * `gradlew assembleDebug` can detect -- it's a *runtime* AdMob SDK check).
 *
 * Some @capacitor-community/admob versions inject this automatically via
 * capacitor.config.ts's plugins.AdMob.appId; this script is a safety net for
 * versions that don't, so CI never silently ships a build missing the tag
 * (Play Console rejects/crashes AdMob apps without it).
 */
const fs = require('fs');
const path = require('path');

const ADMOB_APP_ID = 'ca-app-pub-2452250229562082~6856794170';
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.error(`[patch-android-manifest] AndroidManifest.xml not found at ${manifestPath}`);
  process.exit(1);
}

let manifest = fs.readFileSync(manifestPath, 'utf8');

if (manifest.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  console.log('[patch-android-manifest] AdMob APPLICATION_ID meta-data already present, skipping.');
  process.exit(0);
}

const metaDataTag = `        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${ADMOB_APP_ID}"/>\n`;

if (!manifest.includes('</application>')) {
  console.error('[patch-android-manifest] Could not find </application> in AndroidManifest.xml');
  process.exit(1);
}

manifest = manifest.replace('</application>', `${metaDataTag}    </application>`);
fs.writeFileSync(manifestPath, manifest, 'utf8');
console.log('[patch-android-manifest] Inserted AdMob APPLICATION_ID meta-data into AndroidManifest.xml');
