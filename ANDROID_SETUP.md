# AlphaBlast — Android (Capacitor) Setup

This branch (`capacitor-android-conversion`) adds a native Android app wrapper for
AlphaBlast using [Capacitor](https://capacitorjs.com/), with real native AdMob ads
and native Google Play Billing (in-app purchases) — not the old AdSense/Median
web-bridge simulation.

## What was added

- `capacitor.config.ts` — app id `com.alxmobileapps.alphablast`, app name
  `AlphaBlast`, `webDir: dist`.
- `src/utils/universalAds.ts` — now calls real `@capacitor-community/admob`
  (banner / interstitial / rewarded) when running inside the native Android
  app, using your existing AdMob IDs from `src/config/adsConfig.ts`
  (`ca-app-pub-2452250229562082~6856794170` app id, plus your banner/
  interstitial/rewarded unit ids). Falls back to H5 Games ads on web, then
  Median, exactly as before.
- `src/utils/medianBridge.ts` — `purchaseIAP` / `restorePurchases` now call
  real Google Play Billing via
  [`cordova-plugin-purchase`](https://github.com/j3k0/cordova-plugin-purchase)
  (works fine inside Capacitor) when native, for your existing product ids:
  `com.wordblast.removeads`, `com.wordblast.diamonds_10`,
  `com.wordblast.diamonds_50`.
- `.github/workflows/android-build.yml` — builds a debug APK on every push,
  and a **signed** release AAB + APK once you add signing secrets (below).
  It bootstraps the `android/` native project itself each run
  (`npx cap add android`), so it isn't committed to the repo.
- `scripts/patch-android-manifest.cjs` — safety net that makes sure the
  AdMob Application ID meta-data tag ends up in `AndroidManifest.xml`.

## ⚠️ Important — could not be build-tested here

This was written directly against the documented Capacitor/plugin APIs, but
this session's cloud sandbox has no access to the npm registry (blocked by
network policy) and no local Android build toolchain, so **none of this has
actually been compiled or run yet.** The GitHub Actions workflow is designed
to be the real first build/test — push this branch and check the "Actions"
tab. If a step fails, send me the log and I'll fix it.

## What you need to do

### 1. Confirm the package name

Currently set to `com.alxmobileapps.alphablast` in `capacitor.config.ts`.
**This is permanent once you publish to Play Store** — change it now if you
want something else, before your first release.

### 2. Point the app at your live backend (for AI word generation)

The game calls `/api/gemini/*` on the same origin, which only exists on your
deployed Firebase Hosting site — not in a locally-bundled app. In your GitHub
repo: **Settings → Secrets and variables → Actions → Variables tab** → add a
repo variable `CAPACITOR_SERVER_URL` set to your live URL (e.g.
`https://gen-lang-client-0566189915.web.app` or your custom domain). Without
it, the app still works but AI features will fail closed (built-in word lists
still work offline).

### 3. Add your signing keystore (for a real, signed release build)

In your repo: **Settings → Secrets and variables → Actions → Secrets tab**,
add:

- `ANDROID_KEYSTORE_BASE64` — run `base64 -w0 your-release.keystore` (or
  `certutil -encode` on Windows) and paste the output
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Without these, CI still builds a debug APK (unsigned for release, fine for
testing on your own device, not uploadable to Play Store).

**Keep your keystore file somewhere safe outside GitHub too** — if you ever
lose it, you can never update the app on Play Store again under the same
listing.

### 4. Create the in-app products in Google Play Console

Once you have an app listing in Play Console, add these products under
**Monetize → Products → In-app products**, matching the ids already in the
code:

- `com.wordblast.removeads` — one-time, non-consumable
- `com.wordblast.diamonds_10` — consumable
- `com.wordblast.diamonds_50` — consumable

### 5. (Optional) App icon / splash screen

The workflow auto-generates Android launcher icons + a splash screen from
`public/icon-512.png` via `@capacitor/assets`. Swap that source file (or add
a dedicated `public/splash.png`) if you want different branding for the app
vs. the web favicon.

### 6. Testing locally (optional)

If you'd rather iterate locally instead of waiting on CI each time:

```bash
npm install
npm run build:webonly
npx cap add android   # first time only
npx cap sync android
npx cap open android  # opens Android Studio
```

You'll need Android Studio / the Android SDK installed locally for this.
