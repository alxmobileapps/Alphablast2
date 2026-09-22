#!/usr/bin/env node
/**
 * Patches android/app/build.gradle's versionCode/versionName after
 * `cap sync android`, before building.
 *
 * The android/ native project is bootstrapped fresh on every CI run (see
 * android-build.yml) via `npx cap add android`, which always scaffolds
 * versionCode 1 / versionName "1.0" -- fine for a first Play Console
 * upload, but every LATER upload needs a STRICTLY HIGHER versionCode or
 * Play Console rejects it ("You need to use a different version code
 * because you already have one with version code N").
 *
 * versionCode is computed here as ANDROID_VERSION_CODE_BASE (the workflow
 * sets this from the GitHub Actions run number, which only ever goes up)
 * plus an optional ANDROID_VERSION_CODE_OFFSET -- set that as a repo
 * variable (Settings -> Secrets and variables -> Actions -> Variables ->
 * ANDROID_VERSION_CODE_OFFSET) if Play Console ever rejects a build for
 * having too LOW a version code (e.g. after a manual upload from Android
 * Studio with a hand-set higher number, or after re-running old workflow
 * history) -- set it to (that higher number - the current run number) or
 * more, so the sum comfortably clears it.
 *
 * versionName is cosmetic (shown to players / in Play Console listings)
 * and only needs to be a string, no uniqueness required -- set here from
 * ANDROID_VERSION_NAME if provided, else derived from the version code.
 */
const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

const base = parseInt(process.env.ANDROID_VERSION_CODE_BASE || '', 10);
if (!Number.isFinite(base) || base <= 0) {
  console.error(
    `[patch-android-version] ANDROID_VERSION_CODE_BASE must be set to a positive integer (got: ${JSON.stringify(
      process.env.ANDROID_VERSION_CODE_BASE
    )})`
  );
  process.exit(1);
}
const offset = parseInt(process.env.ANDROID_VERSION_CODE_OFFSET || '0', 10);
const versionCode = base + (Number.isFinite(offset) ? offset : 0);
const versionName = process.env.ANDROID_VERSION_NAME || `1.0.${versionCode}`;

if (!fs.existsSync(gradlePath)) {
  console.error(`[patch-android-version] build.gradle not found at ${gradlePath}`);
  process.exit(1);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');

if (!/versionCode\s+\d+/.test(gradle)) {
  console.error('[patch-android-version] Could not find a "versionCode <N>" line in build.gradle');
  process.exit(1);
}
if (!/versionName\s+"[^"]*"/.test(gradle)) {
  console.error('[patch-android-version] Could not find a \'versionName "..."\' line in build.gradle');
  process.exit(1);
}

gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);

fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log(`[patch-android-version] Set versionCode=${versionCode} versionName="${versionName}" in build.gradle`);
