#!/usr/bin/env node
/**
 * Idempotently ensures AndroidManifest.xml carries:
 *   1. The AdMob Application ID meta-data tag (required or the Google Mobile
 *      Ads SDK hard-crashes the app on launch -- see history below).
 *   2. The com.google.android.gms.permission.AD_ID permission (required
 *      whenever the app declares "uses advertising ID" in Play Console's
 *      Data Safety / Advertising ID form -- see history below).
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
 *
 * AD_ID PERMISSION: Play Console's "closed testing release" upload flow
 * flagged that our Advertising ID declaration says the app uses advertising
 * ID (true -- AdMob needs it), but the uploaded AAB's manifest did not
 * include com.google.android.gms.permission.AD_ID, so Google would zero out
 * the ad ID on-device (breaking AdMob personalization/attribution and
 * lowering ad revenue), even though it wasn't upload-blocking. The Google
 * Mobile Ads SDK (play-services-ads) is supposed to merge this permission in
 * automatically, but we saw it missing from the built manifest in practice,
 * so -- same belt-and-suspenders reasoning as the APPLICATION_ID tag above
 * -- we add it explicitly here instead of relying on an upstream manifest
 * merge we don't control.
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
let changed = false;

// 1. AdMob Application ID meta-data (inside <application>)
if (manifest.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  console.log('[patch-android-manifest] AdMob APPLICATION_ID meta-data already present, skipping.');
} else {
  const metaDataTag = `        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${ADMOB_APP_ID}"/>\n`;

  if (!manifest.includes('</application>')) {
    console.error('[patch-android-manifest] Could not find </application> in AndroidManifest.xml');
    process.exit(1);
  }

  manifest = manifest.replace('</application>', `${metaDataTag}    </application>`);
  changed = true;
  console.log('[patch-android-manifest] Inserted AdMob APPLICATION_ID meta-data into AndroidManifest.xml');
}

// 2. AD_ID permission (direct child of <manifest>, alongside the other uses-permission tags)
if (manifest.includes('com.google.android.gms.permission.AD_ID')) {
  console.log('[patch-android-manifest] AD_ID permission already present, skipping.');
} else {
  const adIdPermissionTag = `    <uses-permission android:name="com.google.android.gms.permission.AD_ID"/>\n`;

  if (!manifest.includes('<application')) {
    console.error('[patch-android-manifest] Could not find <application in AndroidManifest.xml');
    process.exit(1);
  }

  // Insert right before the <application ...> tag, so it lands alongside any
  // other top-level <uses-permission> entries rather than inside <application>.
  manifest = manifest.replace('<application', `${adIdPermissionTag}\n    <application`);
  changed = true;
  console.log('[patch-android-manifest] Inserted AD_ID permission into AndroidManifest.xml');
}

if (changed) {
  fs.writeFileSync(manifestPath, manifest, 'utf8');
} else {
  console.log('[patch-android-manifest] Nothing to change.');
}
