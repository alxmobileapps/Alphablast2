const SWIPE_CONTROL_KEY = 'word_blast_swipe_controls_enabled';

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
