// Cross-platform Web Haptics Engine for Mobile Web & Native Wrappers

type HapticPattern = number | number[];

function canVibrate(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

function triggerVibration(pattern: HapticPattern): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore environments where vibration permissions are restricted
  }
}

export const haptics = {
  // Light subtle tap on selecting a tile or tapping UI buttons
  tap: () => triggerVibration(10),

  // Tactile click on successful tile swap
  swap: () => triggerVibration(22),

  // Soft buzz for invalid moves / blocked taps
  invalid: () => triggerVibration([30, 40, 30]),

  // Satisfying double-pulse when a valid word is formed
  wordMatch: () => triggerVibration([25, 30, 45]),

  // Special tile created (Bomb / Electric Card)
  specialCreated: () => triggerVibration([35, 25, 60]),

  // Heavy booming rumble for Bomb explosion
  bomb: () => triggerVibration([60, 30, 80, 40, 110]),

  // High-voltage electric surge vibration
  electric: () => triggerVibration([25, 20, 35, 20, 55]),

  // Rapid crisp micro-tick for sequential letter electrocution during wipeout
  wipeoutZap: () => triggerVibration(12),

  // Fiery blazing inferno vibration
  fireWipe: () => triggerVibration([40, 25, 70, 30, 100, 35, 140]),

  // Fiery micro-crackle when letter burns
  fireCrackle: () => triggerVibration(10),

  // Heavy hammer impact smash
  hammerSmash: () => triggerVibration([80, 40, 120, 30, 90]),

  // Power-up tool activation
  powerUp: () => triggerVibration(28),

  // Celebratory burst when round completes
  roundComplete: () => triggerVibration([40, 30, 60, 30, 100, 40, 140]),

  // Game over buzzer
  gameOver: () => triggerVibration([80, 50, 80]),
};
