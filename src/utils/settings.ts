const SWIPE_CONTROL_KEY = 'word_blast_swipe_controls_enabled';
const CLUES_ENABLED_KEY = 'word_blast_clues_enabled';
const SOUND_ENABLED_KEY = 'word_blast_sound_fx_enabled';
const MUSIC_ENABLED_KEY = 'word_blast_music_bgm_enabled';
const SPELLING_PREF_KEY = 'word_blast_spelling_preference';

export type SpellingPreference = 'US' | 'UK';

// Country/region codes where British-style spelling (COLOUR, CENTRE, ...)
// is the everyday standard -- used only to pick a sensible default the
// FIRST time a player opens the game (before they've ever touched this
// setting). Word acceptance during gameplay is unaffected either way --
// both spellings are always accepted (see dictionary.ts) -- this only
// controls which spelling is used for on-screen text like category names.
const UK_SPELLING_REGIONS = new Set([
  'GB', 'UK', 'IE', 'AU', 'NZ', 'ZA', 'IN', 'SG', 'MY', 'HK', 'PK', 'NG',
  'KE', 'GH', 'JM', 'TT', 'MT', 'CY', 'BD', 'LK',
  // NOT the Philippines: despite the region's British-spelling neighbors,
  // Philippine English follows AMERICAN spelling conventions (a legacy of
  // US, not British, colonial administration) -- "color", "center",
  // "organize", not "colour", "centre", "organise" -- so 'PH' correctly
  // falls through to the US default below.
]);

/**
 * Guesses a default US/UK spelling preference from the device's own
 * locale (navigator.language, e.g. "en-GB", "en-AU") -- only used the
 * first time this setting is read, before the player has ever chosen one
 * explicitly. Falls back to US on anything unrecognized/unavailable.
 */
function detectDefaultSpellingPreference(): SpellingPreference {
  try {
    const locale =
      (typeof navigator !== 'undefined' && (navigator.language || (navigator as any).userLanguage)) || '';
    const region = locale.split(/[-_]/)[1]?.toUpperCase();
    if (region && UK_SPELLING_REGIONS.has(region)) return 'UK';
  } catch {
    // Ignore -- fall through to the US default below.
  }
  return 'US';
}

/**
 * Reads the player's US/UK display-spelling preference (category names,
 * etc.). Defaults to a locale-based guess the first time it's read, then
 * whatever the player explicitly picked in Settings from then on.
 */
export function getSpellingPreference(): SpellingPreference {
  try {
    const val = localStorage.getItem(SPELLING_PREF_KEY);
    if (val === 'US' || val === 'UK') return val;
  } catch {
    // Ignore -- fall through to the locale-based default below.
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

