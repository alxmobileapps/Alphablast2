#!/usr/bin/env node
/**
 * Idempotently ensures AndroidManifest.xml carries the AdMob Application ID meta-data tag.
 * Run after `npx cap add android` / `npx cap sync android`, before building.
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
