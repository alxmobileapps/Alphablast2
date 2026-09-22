const SWIPE_CONTROL_KEY = 'word_blast_swipe_controls_enabled';
const CLUES_ENABLED_KEY = 'word_blast_clues_enabled';
const SOUND_ENABLED_KEY = 'word_blast_sound_fx_enabled';
const MUSIC_ENABLED_KEY = 'word_blast_music_bgm_enabled';
const SPELLING_PREF_KEY = 'word_blast_spelling_preference';

export type SpellingPreference = 'US' | 'UK';

/**
 * Default US/UK spelling preference before the player has ever touched
 * this setting: always US.
 *
 * This used to guess from the device's locale (navigator.language, e.g.
 * "en-GB" -> UK), but that reflects the device/browser's LANGUAGE
 * setting, not the player's actual location -- plenty of Android phones
 * (and desktop browsers, when testing a web build) ship with "English
 * (UK)" as their base English locale regardless of where the device
 * actually is or who's using it, which showed up as players in the
 * Philippines (whose devices report en-GB) seeing a UK default despite
 * Philippine English itself following American spelling. Defaulting to
 * US outright is simpler and matches this game's mostly Filipino
 * audience; a player who genuinely prefers UK spelling can switch it in
 * Settings, and that choice is remembered from then on.
 */
function detectDefaultSpellingPreference(): SpellingPreference {
  return 'US';
}

/**
 * Reads the player's US/UK display-spelling preference (category names,
 * etc.). Defaults to US the first time it's read, then whatever the
 * player explicitly picked in Settings from then on.
 */
export function getSpellingPreference(): SpellingPreference {
  try {
    const val = localStorage.getItem(SPELLING_PREF_KEY);
    if (val === 'US' || val === 'UK') return val;
  } catch {
    // Ignore -- fall through to the US default below.
  }
  return detectDefaultSpellingPreference();
}

/**
 * Persists the player's explicit US/UK display-spelling choice.
 */
export function setSpellingPreference(pref: SpellingPreference): void {
  try {
    localStorage.setItem(SPELLING_PREF_KEY, pref);
  } catch (err) {
    console.warn('Failed to save spelling preference:', err);
  }
}

/**
 * Checks if background music is enabled (default: true / ON)
 */
export function isMusicSettingEnabled(): boolean {
  try {
    const val = localStorage.getItem(MUSIC_ENABLED_KEY);
    if (val === null) return true; // Default is ON
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists background music preference
 */
export function setMusicSettingEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled));
  } catch (err) {
    console.warn('Failed to save music setting:', err);
  }
}

/**
 * Checks if sound effects (SFX) are enabled (default: true / ON)
 */
export function isSoundSettingEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_ENABLED_KEY);
    if (val === null) return true; // Default is ON
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists sound effects preference
 */
export function setSoundSettingEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch (err) {
    console.warn('Failed to save sound setting:', err);
  }
}

/**
 * Checks if swipe controls are enabled (default: true / ON)
 */
export function isSwipeControlsEnabled(): boolean {
  try {
    const val = localStorage.getItem(SWIPE_CONTROL_KEY);
    if (val === null) return true; // Default is ON
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists swipe controls preference
 */
export function setSwipeControlsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SWIPE_CONTROL_KEY, String(enabled));
  } catch (err) {
    console.warn('Failed to save swipe setting:', err);
  }
}

/**
 * Checks if word/inactivity clues are enabled (default: true / ON)
 */
export function isCluesEnabled(): boolean {
  try {
    const val = localStorage.getItem(CLUES_ENABLED_KEY);
    if (val === null) return true; // Default is ON
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists clues preference
 */
export function setCluesEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(CLUES_ENABLED_KEY, String(enabled));
  } catch (err) {
    console.warn('Failed to save clues setting:', err);
  }
}

