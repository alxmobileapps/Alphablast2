// Official Standard Letter Point Values & Multipliers for AlphaBlast
// Multiplied by 100 for word formations: (Standard Points * 100)

export const LETTER_POINTS: Record<string, number> = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
  F: 4,
  G: 2,
  H: 4,
  I: 1,
  J: 8,
  K: 5,
  L: 1,
  M: 3,
  N: 1,
  O: 1,
  P: 3,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 4,
  X: 8,
  Y: 4,
  Z: 10,
};

export interface WordScoringResult {
  word: string;
  baseLetterPoints: number; // Raw sum of letter points (e.g., 5 for CAT)
  points: number; // Final calculated points (baseLetterPoints * 100 + bonuses)
  isCategory: boolean;
  categoryBonus: number;
  lengthBonus: number;
  letterPoints: { letter: string; points: number }[];
}

export function getLetterPoints(letter: string): number {
  const ch = (letter || '').toUpperCase().trim();
  return LETTER_POINTS[ch] || 1;
}

export function calculateWordPoints(word: string, isCategory = false): WordScoringResult {
  const cleanWord = (word || '').toUpperCase().trim();
  const letterPoints = cleanWord.split('').map((ch) => ({
    letter: ch,
    points: getLetterPoints(ch),
  }));

  const baseLetterPoints = letterPoints.reduce((sum, item) => sum + item.points, 0);

  // Base letter points multiplied by 100
  let points = baseLetterPoints * 100;

  // Category word bonus: 1.5x points multiplier (rounded)
  let categoryBonus = 0;
  if (isCategory) {
    categoryBonus = Math.round(points * 0.5);
    points += categoryBonus;
  }

  // Word Length bonus for longer words
  let lengthBonus = 0;
  if (cleanWord.length >= 6) {
    lengthBonus = 500; // Big 6+ letter blast
    points += lengthBonus;
  } else if (cleanWord.length === 5) {
    lengthBonus = 200;
  }

  return {
    word: cleanWord,
    baseLetterPoints,
    points,
    isCategory,
    categoryBonus,
    lengthBonus,
    letterPoints,
  };
}

export function calculateSpecialReactionPoints(letters: (string | undefined | null)[]): number {
  let total = 0;
  for (const l of letters) {
    if (l && typeof l === 'string' && l.trim().length > 0) {
      const char = l.trim().toUpperCase()[0];
      const letterVal = getLetterPoints(char);
      total += letterVal * 50;
    }
  }
  return total;
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat('en-US').format(Math.max(0, points));
}
