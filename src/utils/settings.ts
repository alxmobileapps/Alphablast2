const SWIPE_CONTROL_KEY = 'word_blast_swipe_controls_enabled';
const CLUES_ENABLED_KEY = 'word_blast_clues_enabled';
const SOUND_ENABLED_KEY = 'word_blast_sound_fx_enabled';
const MUSIC_ENABLED_KEY = 'word_blast_music_bgm_enabled';

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

