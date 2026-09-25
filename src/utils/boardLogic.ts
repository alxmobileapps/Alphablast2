import { Tile, SpecialTileType, WordMatch, ClueInfo, Category, WordDirection } from '../types';
import {
  isValidWord,
  isCategoryWord,
  getCategoryById,
  getPluralForms,
  getSingularForms,
  getCategoryWordRegionMismatch,
} from '../data/dictionary';

export const BOARD_SIZE = 8;

// Letter frequencies designed for balanced and fun English word generation
const LETTER_POOL = [
  'E','E','E','E','E','E','E','E','E','E','E','E',
  'A','A','A','A','A','A','A','A','A',
  'I','I','I','I','I','I','I','I','I',
  'O','O','O','O','O','O','O','O',
  'N','N','N','N','N','N',
  'R','R','R','R','R','R',
  'T','T','T','T','T','T',
  'L','L','L','L',
  'S','S','S','S','S','S',
  'U','U','U','U',
  'D','D','D','D',
  'G','G','G',
  'B','B',
  'C','C','C',
  'M','M','M',
  'P','P','P',
  'F','F',
  'H','H','H',
  'V','V',
  'W','W',
  'Y','Y','Y',
  'K','K',
  'J',
  'X',
  'Z'
];

let tileIdCounter = 1;

export function getRandomLetter(): string {
  const index = Math.floor(Math.random() * LETTER_POOL.length);
  return LETTER_POOL[index];
}

export function createNewTile(row: number, col: number, letter?: string, special: SpecialTileType = 'none'): Tile {
  return {
    id: `tile-${tileIdCounter++}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    row,
    col,
    letter: (letter || getRandomLetter()).toUpperCase(),
    special,
    isMatched: false,
    isClearing: false,
  };
}

// Standard Letter Point Values
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 4, C: 4, D: 2, E: 1, F: 4, G: 3, H: 4, I: 1, J: 8, K: 5,
  L: 2, M: 4, N: 2, O: 1, P: 4, Q: 10, R: 1, S: 1, T: 1, U: 2, V: 5,
  W: 4, X: 8, Y: 4, Z: 10
};

export function getLetterValue(letter: string): number {
  return LETTER_VALUES[letter.toUpperCase()] || 1;
}

// All 8 search directions: horizontal forward/backward, vertical downward/upward, and all diagonals
const SEARCH_DIRECTIONS: { dr: number; dc: number; dir: WordDirection }[] = [
  { dr: 0, dc: 1, dir: 'horizontal' }, // left-to-right
  { dr: 0, dc: -1, dir: 'backwards-horizontal' }, // right-to-left (backwards)
  { dr: 1, dc: 0, dir: 'vertical' }, // top-to-bottom (downwards)
  { dr: -1, dc: 0, dir: 'upwards-vertical' }, // bottom-to-top (upwards)
  { dr: 1, dc: 1, dir: 'diagonal-down-right' }, // diagonal down-right
  { dr: 1, dc: -1, dir: 'diagonal-down-left' }, // diagonal down-left
  { dr: -1, dc: 1, dir: 'diagonal-up-right' }, // diagonal up-right
  { dr: -1, dc: -1, dir: 'diagonal-up-left' }, // diagonal up-left
];

export function isPluralWord(word: string): boolean {
  if (!word) return false;
  const upper = word.trim().toUpperCase();
  if (upper.length < 3) return false;

  // Irregular plurals
  const irregulars = new Set([
    'FEET', 'TEETH', 'MICE', 'GEESE', 'OXEN', 'WOLVES', 'CALVES', 'LEAVES',
    'HALVES', 'LIVES', 'KNIVES', 'DICES', 'MEN', 'WOMEN', 'CHILDREN', 'PEOPLE',
    'FUNGI', 'CACTI', 'LARVAE', 'PUPAE', 'ALUMNI'
  ]);
  if (irregulars.has(upper)) return true;

  // Words ending in SS are singular (e.g. GRASS, BASS, CHESS, DRESS, MOSS, CROSS, GLASS, BRASS, PASS, KISS, BLISS, PRESS)
  if (upper.endsWith('SS')) {
    return false;
  }

  // Common singular words ending in S
  const singularEndingInS = new Set([
    'BUS', 'GAS', 'PLUS', 'THIS', 'THUS', 'YES', 'CHESS', 'MOSS', 'BASS', 'MASS', 'PASS', 'LESS',
    'LENS', 'NEWS', 'SERIES', 'SPECIES', 'GENUS', 'CHAOS', 'STATUS', 'FOCUS', 'RADIUS',
    'HIPPOPOTAMUS', 'RHINOCEROS', 'PLATYPUS', 'WALRUS', 'OCTOPUS', 'IBEX', 'BURRO', 'ASS', 'MOUFLON',
    'ASPARAGUS', 'HUMMUS', 'COUSCOUS', 'DRESS', 'BRASS', 'GLASS', 'LOSS', 'BOSS', 'CROSS', 'KISS',
    'BLISS', 'PRESS', 'IRIS', 'PELVIS', 'CLITORIS', 'EPIDERMIS', 'MENISCUS', 'HUMERUS', 'MANDRILL',
    'TIGRESS', 'LIONESS', 'PRINCESS', 'GODDESS', 'WAITRESS', 'ACTRESS', 'DUCHESS', 'HOSTESS', 'MATTRESS',
    'COMPASS', 'CANVAS', 'ATLAS', 'CACTUS', 'FUNGUS', 'NUCLEUS', 'SYLLABUS', 'VIRUS', 'CIRCUS', 'CAMPUS',
    'BONUS', 'MINUS', 'CHORUS', 'LOTUS', 'PAPYRUS', 'MALLARD', 'MACAQUE', 'RHINO', 'HIPPO', 'IBIS',
    'CHASSIS', 'PROBOSCIS', 'SCISSORS', 'PLIERS', 'TWEEZERS', 'TONGS'
  ]);
  if (singularEndingInS.has(upper)) {
    return false;
  }

  // Ends in IES (length >= 5, e.g. BERRIES -> BERRY, PUPPIES -> PUPPY)
  if (upper.endsWith('IES') && upper.length >= 5) {
    const singular = upper.slice(0, -3) + 'Y';
    if (isValidWord(singular)) return true;
  }

  // Ends in VES (length >= 5, e.g. WOLVES -> WOLF, KNIVES -> KNIFE)
  if (upper.endsWith('VES') && upper.length >= 5) {
    const singularF = upper.slice(0, -3) + 'F';
    const singularFE = upper.slice(0, -3) + 'FE';
    if (isValidWord(singularF) || isValidWord(singularFE)) return true;
  }

  // Ends in ES (e.g. FOXES -> FOX, BOXES -> BOX, TOMATOES -> TOMATO, PEACHES -> PEACH, BONES -> BONE)
  if (upper.endsWith('ES') && upper.length >= 4) {
    const stem1 = upper.slice(0, -2);
    const stem2 = upper.slice(0, -1);
    if (isValidWord(stem1) || isValidWord(stem2)) {
      return true;
    }
  }

  // Ends in S (length >= 4) where singular form is an actual valid word in our dictionary
  if (upper.endsWith('S') && upper.length >= 4) {
    const singular = upper.slice(0, -1);
    if (isValidWord(singular)) {
      return true;
    }
  }

  return false;
}

export function isWordOrPluralFormed(
  word: string,
  formedWords?: Set<string>
): { isDuplicate: boolean; matchedForm?: string } {
  if (!formedWords || formedWords.size === 0) {
    return { isDuplicate: false };
  }

  const upper = word.trim().toUpperCase();
  if (formedWords.has(upper)) {
    return { isDuplicate: true, matchedForm: upper };
  }

  const upperSingulars = new Set(getSingularForms(upper));
  const upperPlurals = new Set(getPluralForms(upper));

  for (const existing of formedWords) {
    const ex = existing.trim().toUpperCase();
    if (ex === upper) {
      return { isDuplicate: true, matchedForm: ex };
    }

    // Direct check if existing is in singular or plural forms of upper
    if (upperSingulars.has(ex) || upperPlurals.has(ex)) {
      return { isDuplicate: true, matchedForm: ex };
    }

    // Check if upper is in singular or plural forms of existing
    const exSingulars = getSingularForms(ex);
    const exPlurals = getPluralForms(ex);
    if (exSingulars.includes(upper) || exPlurals.includes(upper)) {
      return { isDuplicate: true, matchedForm: ex };
    }
  }

  return { isDuplicate: false };
}

export interface DuplicateWordMatch {
  word: string;
  matchedForm: string;
  tiles: { row: number; col: number; id: string; letter: string; special: SpecialTileType }[];
}

// A word formed on the board that WOULD be a category word, except its
// spelling belongs to the other US/UK region from the player's current
// preference (e.g. "COLOUR" formed while set to US) -- see
// getCategoryWordRegionMismatch. `region` is which region that spelling
// belongs to, not the player's current preference.
export interface RegionMismatchMatch {
  word: string;
  region: 'US' | 'UK';
  tiles: { row: number; col: number; id: string; letter: string; special: SpecialTileType }[];
}

export interface BoardWordScanResult {
  matches: WordMatch[];
  duplicates: DuplicateWordMatch[];
  regionMismatches: RegionMismatchMatch[];
}

// Find all valid 3+ letter words belonging STRICTLY to the active category in ANY direction
// REQUIREMENT: A word can only be formed once per round (including its plural or root forms).
export function findCategoryWordsWithDuplicateCheck(
  board: Tile[][],
  categoryId: number,
  formedWords?: Set<string>
): BoardWordScanResult {
  const matches: WordMatch[] = [];
  const duplicates: DuplicateWordMatch[] = [];
  const regionMismatches: RegionMismatchMatch[] = [];
  const matchedPositions = new Set<string>();
  const matchedLineKeys = new Set<string>();

  // Check from longest length (8) down to 3 letters so longer words take precedence
  for (let len = BOARD_SIZE; len >= 3; len--) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        for (const { dr, dc, dir } of SEARCH_DIRECTIONS) {
          const endR = r + dr * (len - 1);
          const endC = c + dc * (len - 1);

          // Boundary check
          if (endR < 0 || endR >= BOARD_SIZE || endC < 0 || endC >= BOARD_SIZE) {
            continue;
          }

          let word = '';
          const tiles: { row: number; col: number; id: string; letter: string; special: SpecialTileType }[] = [];
          const linePosKeys: string[] = [];

          for (let i = 0; i < len; i++) {
            const currR = r + dr * i;
            const currC = c + dc * i;
            const t = board[currR][currC];
            if (!t) break;
            // Bombs and Electrocute (card) tiles have NO letter equivalents and cannot form words
            if (t.special === 'bomb' || t.special === 'card') {
              break;
            }
            word += t.letter;
            tiles.push({ row: currR, col: currC, id: t.id, letter: t.letter, special: t.special });
            linePosKeys.push(`${currR},${currC}`);
          }

          if (tiles.length !== len) continue;

          const upperWord = word.toUpperCase();

          // Prevent exact duplicate line reverse-matching
          const forwardKey = linePosKeys.join('|');
          const reverseKey = [...linePosKeys].reverse().join('|');
          if (matchedLineKeys.has(forwardKey) || matchedLineKeys.has(reverseKey)) {
            continue;
          }

          // STRICT REQUIREMENT: Only words belonging to the given category are accepted!
          if (isCategoryWord(word, categoryId)) {
            // Check if word or its plural has already been formed!
            const dupCheck = isWordOrPluralFormed(upperWord, formedWords);
            if (dupCheck.isDuplicate) {
              duplicates.push({
                word: upperWord,
                matchedForm: dupCheck.matchedForm || upperWord,
                tiles,
              });
              matchedLineKeys.add(forwardKey);
              matchedLineKeys.add(reverseKey);
              continue;
            }

            // Check if all positions are already completely covered by an equal or larger word
            const allCovered = linePosKeys.every((pos) => matchedPositions.has(pos));
            if (allCovered) {
              continue;
            }

            let specialGenerated: SpecialTileType | 'board_clear' | undefined = undefined;

            if (len === 4) {
              specialGenerated = 'bomb';
            } else if (len === 5) {
              specialGenerated = 'card';
            } else if (len >= 6) {
              specialGenerated = 'board_clear';
            }

            const midIndex = Math.floor(len / 2);
            matches.push({
              word: upperWord,
              tiles,
              direction: dir,
              isCategory: true,
              specialGenerated,
              specialLocation: { row: tiles[midIndex].row, col: tiles[midIndex].col }
            });

            matchedLineKeys.add(forwardKey);
            matchedLineKeys.add(reverseKey);
            for (const pos of linePosKeys) {
              matchedPositions.add(pos);
            }
          } else {
            // Not accepted as-is -- but would it be a category word in the
            // OTHER US/UK spelling? If so, surface it as a region mismatch
            // instead of silently doing nothing (see getCategoryWordRegionMismatch).
            const mismatchRegion = getCategoryWordRegionMismatch(word, categoryId);
            if (mismatchRegion) {
              regionMismatches.push({ word: upperWord, region: mismatchRegion, tiles });
            }
          }
        }
      }
    }
  }

  return { matches, duplicates, regionMismatches };
}

// Legacy helper wrapping the new duplicate-aware scanner
export function findValidWordsOnBoard(
  board: Tile[][],
  categoryId: number,
  formedWords?: Set<string>
): WordMatch[] {
  return findCategoryWordsWithDuplicateCheck(board, categoryId, formedWords).matches;
}

// Fast targeted ray scanner checking only rays passing through specific modified tiles
export function findCategoryWordsCrossingTiles(
  board: Tile[][],
  categoryId: number,
  targetCoords: { row: number; col: number }[],
  formedWords?: Set<string>
): WordMatch[] {
  const matches: WordMatch[] = [];
  const matchedLineKeys = new Set<string>();

  for (const { row: targetR, col: targetC } of targetCoords) {
    for (const { dr, dc, dir } of SEARCH_DIRECTIONS) {
      for (let len = BOARD_SIZE; len >= 3; len--) {
        for (let k = 0; k < len; k++) {
          const startR = targetR - dr * k;
          const startC = targetC - dc * k;
          const endR = startR + dr * (len - 1);
          const endC = startC + dc * (len - 1);

          if (startR < 0 || startR >= BOARD_SIZE || startC < 0 || startC >= BOARD_SIZE) continue;
          if (endR < 0 || endR >= BOARD_SIZE || endC < 0 || endC >= BOARD_SIZE) continue;

          const lineKey = `${startR},${startC}-${endR},${endC}-${dir}`;
          if (matchedLineKeys.has(lineKey)) continue;
          matchedLineKeys.add(lineKey);

          let word = '';
          const tiles: { row: number; col: number; id: string; letter: string; special: SpecialTileType }[] = [];
          let valid = true;

          for (let i = 0; i < len; i++) {
            const currR = startR + dr * i;
            const currC = startC + dc * i;
            const t = board[currR][currC];
            if (!t || t.special === 'bomb' || t.special === 'card') {
              valid = false;
              break;
            }
            word += t.letter;
            tiles.push({ row: currR, col: currC, id: t.id, letter: t.letter, special: t.special });
          }

          if (!valid || tiles.length !== len) continue;

          const upperWord = word.toUpperCase();
          if (isCategoryWord(word, categoryId)) {
            const dupCheck = isWordOrPluralFormed(upperWord, formedWords);
            if (dupCheck.isDuplicate) continue;

            let specialGenerated: SpecialTileType | 'board_clear' | undefined = undefined;
            if (len === 4) specialGenerated = 'bomb';
            else if (len === 5) specialGenerated = 'card';
            else if (len >= 6) specialGenerated = 'board_clear';

            const midIndex = Math.floor(len / 2);
            matches.push({
              word: upperWord,
              tiles,
              direction: dir,
              isCategory: true,
              specialGenerated,
              specialLocation: { row: tiles[midIndex].row, col: tiles[midIndex].col },
            });
          }
        }
      }
    }
  }

  return matches;
}

// Find all 1-move category word opportunities on the board (supports any direction and excludes already formed words)
// REQUIREMENT: Clues & formed word opportunities must be minimum 3 letters and non-plural.
export function countOneMoveCategoryOpportunities(
  board: Tile[][],
  categoryId: number,
  formedWords?: Set<string>
): Array<{ from: { row: number; col: number }; to: { row: number; col: number }; word: string; direction: WordDirection }> {
  const opportunities: Array<{ from: { row: number; col: number }; to: { row: number; col: number }; word: string; direction: WordDirection }> = [];
  const foundWords = new Set<string>();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const deltas = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 }
      ];

      for (const { dr, dc } of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < BOARD_SIZE && nc < BOARD_SIZE) {
          if (board[r][c].letter === board[nr][nc].letter) continue;

          // In-place swap check for ultra-fast performance
          const t1 = board[r][c];
          const t2 = board[nr][nc];
          const origL1 = t1.letter;
          const origL2 = t2.letter;

          t1.letter = origL2;
          t2.letter = origL1;

          // Fast targeted ray scan on only the 2 modified cells
          const matches = findCategoryWordsCrossingTiles(
            board,
            categoryId,
            [{ row: r, col: c }, { row: nr, col: nc }],
            formedWords
          );

          // Restore letters immediately
          t1.letter = origL1;
          t2.letter = origL2;

          if (matches.length > 0) {
            for (const match of matches) {
              const wordUpper = match.word.toUpperCase();
              if (wordUpper.length >= 3) {
                const opKey = `${r},${c}->${nr},${nc}-${wordUpper}`;
                if (!foundWords.has(opKey)) {
                  foundWords.add(opKey);
                  opportunities.push({
                    from: { row: r, col: c },
                    to: { row: nr, col: nc },
                    word: wordUpper,
                    direction: match.direction,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return opportunities;
}

// Plant a word on the board with exactly 1 letter displaced to an adjacent cell.
// Returns every board position this call actually wrote a new letter into
// (so the caller can re-check for accidental matches by scanning only those
// tiles instead of the whole board), plus the exact (gap, swapTarget) pair
// that completes the word -- so the caller can verify the guaranteed 1-move
// opportunity by checking that ONE known pair instead of re-scanning the
// whole board for any opportunity, anywhere -- or null if the word doesn't fit.
function plantOneMoveWord(
  board: Tile[][],
  word: string,
  startRow: number,
  startCol: number,
  dr: number,
  dc: number
): { modified: { row: number; col: number }[]; gap: { row: number; col: number }; swapTarget: { row: number; col: number } } | null {
  const len = word.length;
  const endR = startRow + dr * (len - 1);
  const endC = startCol + dc * (len - 1);

  if (endR < 0 || endR >= BOARD_SIZE || endC < 0 || endC >= BOARD_SIZE) {
    return null;
  }

  const displaceIdx = Math.floor(Math.random() * len);
  const r = startRow + dr * displaceIdx;
  const c = startCol + dc * displaceIdx;

  const neighbors: { r: number; c: number }[] = [];
  if (r > 0) neighbors.push({ r: r - 1, c });
  if (r < BOARD_SIZE - 1) neighbors.push({ r: r + 1, c });
  if (c > 0) neighbors.push({ r, c: c - 1 });
  if (c < BOARD_SIZE - 1) neighbors.push({ r, c: c + 1 });

  if (neighbors.length === 0) return null;
  const swapTarget = neighbors[Math.floor(Math.random() * neighbors.length)];

  const modified: { row: number; col: number }[] = [];

  // Place non-displaced letters
  for (let i = 0; i < len; i++) {
    if (i !== displaceIdx) {
      const rr = startRow + dr * i;
      const cc = startCol + dc * i;
      board[rr][cc].letter = word[i];
      modified.push({ row: rr, col: cc });
    }
  }

  // Place displaced letter in neighbor
  board[swapTarget.r][swapTarget.c].letter = word[displaceIdx];
  modified.push({ row: swapTarget.r, col: swapTarget.c });
  // Put a non-matching letter in the gap
  let dummyLetter = getRandomLetter();
  while (dummyLetter === word[displaceIdx]) {
    dummyLetter = getRandomLetter();
  }
  board[r][c].letter = dummyLetter;
  modified.push({ row: r, col: c });
  return { modified, gap: { row: r, col: c }, swapTarget: { row: swapTarget.r, col: swapTarget.c } };
}

// Hard ceiling on how long ensureOneMoveOpportunity may search. It runs on the
// UI thread after every refill, so an unbounded search freezes the whole game
// (timer, board, animations) until it finishes.
const ENSURE_OPPORTUNITY_BUDGET_MS = 200;

// Ensure the board has at least 1 valid category word formable in 1 move (length >= 3, non-plural, unformed)
export function ensureOneMoveOpportunity(
  board: Tile[][],
  categoryId: number = 1,
  formedWords?: Set<string>
): Tile[][] {
  // getCategoryById (not INITIAL_CATEGORIES.find) so custom / community
  // categories plant their OWN words. Previously a custom category fell back
  // to INITIAL_CATEGORIES[0] ("Land Animals"), whose words never count as
  // matches for the custom category -- so planting attempts kept failing
  // verification and the loop ran through slot x animal-word combinations
  // (up to 11 x 253 full-board scans), freezing the game for seconds after
  // a word was cleared in a custom game.
  const currentCat = getCategoryById(categoryId);
  // Only words that can actually COUNT when completed: 3-6 letters (what
  // the planting slots fit reliably) and not already formed -- including
  // plural/singular forms of a formed word, which the matcher also treats
  // as already formed (isWordOrPluralFormed).
  //
  // There used to be two fallbacks here when that list came up empty: plant
  // ALREADY-FORMED words, and failing that a hardcoded animal list (CAT,
  // DOG, ...). Neither can ever pass the verification below (formed words
  // are excluded from matches, and the animal words aren't category words
  // in a custom game), so every plant attempt failed and the loop always
  // burned its full 200ms time budget -- on EVERY refill -- while also
  // rewriting letters on tiles that weren't even moving. That's the
  // routine state of a small custom word list late in a round (all its
  // short words formed), and it's why custom games stuttered/flickered
  // after each word while campaign rounds (hundreds of words) didn't.
  // Now: if there's nothing left that could count, leave the board alone.
  const candidateWords = (currentCat?.words || [])
    .map((w) => w.toUpperCase())
    .filter(
      (w) =>
        w.length >= 3 &&
        w.length <= 6 &&
        !isWordOrPluralFormed(w, formedWords).isDuplicate
    );

  if (candidateWords.length === 0) {
    return board;
  }

  // Check if at least 1 move opportunity already exists (done after the
  // candidate check above, so a board with nothing left to plant skips
  // this full-board scan entirely -- it returned the board unchanged
  // either way).
  const existingOpps = countOneMoveCategoryOpportunities(board, categoryId, formedWords);
  if (existingOpps.length >= 1) {
    return board;
  }

  const deadline = Date.now() + ENSURE_OPPORTUNITY_BUDGET_MS;

  // Anchor slots to attempt planting
  const anchorSlots = [
    { r: 0, c: 0, dr: 0, dc: 1 },
    { r: 1, c: 1, dr: 0, dc: 1 },
    { r: 2, c: 1, dr: 0, dc: 1 },
    { r: 3, c: 0, dr: 0, dc: 1 },
    { r: 4, c: 1, dr: 0, dc: 1 },
    { r: 5, c: 2, dr: 0, dc: 1 },
    { r: 6, c: 0, dr: 0, dc: 1 },
    { r: 1, c: 3, dr: 1, dc: 0 },
    { r: 2, c: 5, dr: 1, dc: 0 },
    { r: 0, c: 2, dr: 1, dc: 0 },
    { r: 1, c: 6, dr: 1, dc: 0 },
  ].sort(() => Math.random() - 0.5);

  const shuffledWords = [...candidateWords].sort(() => Math.random() - 0.5);

  for (const slot of anchorSlots) {
    for (const word of shuffledWords) {
      // Out of time: keep the board as-is rather than freeze the game. The
      // player still has Clue / Rearrange, and the next refill tries again.
      if (Date.now() > deadline) {
        return board;
      }
      const cloned = cloneBoard(board);
      const planted = plantOneMoveWord(cloned, word, slot.r, slot.c, slot.dr, slot.dc);
      if (planted) {
        // Ensure no pre-existing match was created accidentally. The board
        // we started from is guaranteed match-free (matches are always
        // cleared immediately during play), so a NEW match can only run
        // through a tile we just wrote to -- scanning just the rays
        // through those tiles (instead of every length/position/direction
        // combo on the whole 8x8 board, ~3000+ checks) finds the exact
        // same accidental matches at a fraction of the cost.
        let dirty = [...planted.modified];
        let preMatches = findCategoryWordsCrossingTiles(cloned, categoryId, dirty, formedWords);
        let fixCycles = 0;
        while (preMatches.length > 0 && fixCycles < 6) {
          fixCycles++;
          for (const m of preMatches) {
            const midTile = m.tiles[Math.floor(m.tiles.length / 2)];
            // Don't modify the planted slot if possible
            if (midTile.row !== slot.r || midTile.col !== slot.c) {
              cloned[midTile.row][midTile.col].letter = getRandomLetter();
              dirty.push({ row: midTile.row, col: midTile.col });
            }
          }
          preMatches = findCategoryWordsCrossingTiles(cloned, categoryId, dirty, formedWords);
        }

        if (preMatches.length === 0) {
          // Verify the guaranteed opportunity by checking ONLY the exact
          // (gap, swapTarget) pair we just engineered -- swapping those two
          // specific tiles is what's supposed to complete the planted word
          // in one move. This is what was actually keeping custom games
          // laggy even after the 200ms budget and the pre-match fix above:
          // this verify step used to re-scan the WHOLE board (all 64 tiles
          // x both directions, ~128 targeted scans) after every single
          // plant attempt, and small creator-typed word lists (a custom
          // game) essentially always need several plant attempts before
          // one sticks -- while campaign categories, having far more
          // words, usually already have an opportunity and skip this
          // entire search via the early return above. Checking just the
          // one pair we engineered (instead of every pair on the board)
          // turns this from an O(board) re-scan into an O(1) check.
          const { gap, swapTarget } = planted;
          const gapTile = cloned[gap.row][gap.col];
          const targetTile = cloned[swapTarget.row][swapTarget.col];
          const origGap = gapTile.letter;
          const origTarget = targetTile.letter;
          gapTile.letter = origTarget;
          targetTile.letter = origGap;
          const verifiedOpps = findCategoryWordsCrossingTiles(cloned, categoryId, [gap, swapTarget], formedWords);
          gapTile.letter = origGap;
          targetTile.letter = origTarget;

          if (verifiedOpps.length >= 1) {
            for (let r = 0; r < BOARD_SIZE; r++) {
              for (let c = 0; c < BOARD_SIZE; c++) {
                board[r][c].letter = cloned[r][c].letter;
              }
            }
            return board;
          }
        }
      }
    }
  }

  return board;
}

// Generate an 8x8 board that GUARANTEES at least 3 ready category words in 1 move available and 0 pre-matches
export function generateInitialBoard(categoryId: number = 1, formedWords?: Set<string>): Tile[][] {
  const currentCat = getCategoryById(categoryId);
  // Only plant words that can still COUNT this round (not formed, and not a
  // plural/singular of a formed word -- the matcher treats those as formed
  // too). This used to fall back to the full list, formed words included,
  // whenever fewer than 3 unformed words remained -- but formed words never
  // register as ready moves, so the `readyMoves >= 3` check below could
  // never pass and all 25 attempts (each a full one-move board scan) ran,
  // plus a 200ms fallback search: a 1-3 second main-thread freeze. With a
  // small custom word list that's the normal state late in a round, and it
  // runs during a Fire Wipeout while the whole board is mid-animation --
  // the white-screen flash. Campaign lists (hundreds of words) never got
  // anywhere near it.
  const candidateWords = (currentCat?.words || [])
    .map((w) => w.toUpperCase())
    .filter(
      (w) =>
        w.length >= 3 &&
        w.length <= 6 &&
        !isWordOrPluralFormed(w, formedWords).isDuplicate
    );

  // Ask for as many ready moves as there are words left to give (at most
  // 3), so the success check below is actually achievable.
  const requiredReadyMoves = Math.min(3, candidateWords.length);

  for (let attempt = 0; attempt < 25; attempt++) {
    // 1. Build blank 8x8 board
    const board: Tile[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        row.push(createNewTile(r, c));
      }
      board.push(row);
    }

    // 2. Plant up to 4 distinct category words with 1-move displacement across diverse directions
    // (previously required at least 3 candidates, so a custom list with only
    // 1-2 words left planted nothing at all)
    if (candidateWords.length >= 1) {
      const shuffledWords = [...candidateWords].sort(() => Math.random() - 0.5);
      
      const anchorSlots = [
        { r: 1, c: 1, dr: 0, dc: 1 }, // horizontal
        { r: 3, c: 2, dr: 0, dc: 1 }, // horizontal
        { r: 5, c: 1, dr: 0, dc: 1 }, // horizontal
        { r: 1, c: 6, dr: 1, dc: 0 }, // vertical
        { r: 2, c: 2, dr: 1, dc: 1 }, // diagonal down-right
        { r: 4, c: 6, dr: 1, dc: 0 }, // vertical
      ].sort(() => Math.random() - 0.5);

      let plantedCount = 0;
      const maxPlants = Math.min(4, shuffledWords.length);
      for (let i = 0; i < anchorSlots.length && plantedCount < maxPlants; i++) {
        const word = shuffledWords[plantedCount % shuffledWords.length];
        const slot = anchorSlots[i];
        if (plantOneMoveWord(board, word, slot.r, slot.c, slot.dr, slot.dc)) {
          plantedCount++;
        }
      }
    }

    // 3. Eliminate any accidental pre-existing category matches
    let preMatches = findValidWordsOnBoard(board, categoryId, formedWords);
    let fixCycles = 0;
    while (preMatches.length > 0 && fixCycles < 10) {
      fixCycles++;
      for (const m of preMatches) {
        const midTile = m.tiles[Math.floor(m.tiles.length / 2)];
        board[midTile.row][midTile.col].letter = getRandomLetter();
      }
      preMatches = findValidWordsOnBoard(board, categoryId, formedWords);
    }

    // 4. Verify no pre-matches and enough one-move category words available
    // (3, or however many words are left if fewer -- see requiredReadyMoves)
    if (preMatches.length === 0 && requiredReadyMoves === 0) {
      // Nothing left in this category that could count -- no point scanning
      // for ready moves that can't exist.
      return board;
    }
    const readyMoves = countOneMoveCategoryOpportunities(board, categoryId, formedWords);
    if (preMatches.length === 0 && readyMoves.length >= requiredReadyMoves) {
      return board;
    }
  }

  // Fallback: build a fresh board and explicitly plant 3 single-move words
  const fallbackBoard: Tile[][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push(createNewTile(r, c));
    }
    fallbackBoard.push(row);
  }

  if (candidateWords.length >= 1) plantOneMoveWord(fallbackBoard, candidateWords[0], 1, 1, 0, 1);
  if (candidateWords.length >= 2) plantOneMoveWord(fallbackBoard, candidateWords[1], 3, 2, 0, 1);
  if (candidateWords.length >= 3) plantOneMoveWord(fallbackBoard, candidateWords[2], 5, 1, 1, 0);

  ensureOneMoveOpportunity(fallbackBoard, categoryId, formedWords);
  return fallbackBoard;
}

// Check for 3 identical letters in a line on the board that create a Shining Tile
export function findThreeIdenticalLetters(board: Tile[][]): { row: number; col: number; letter: string }[] {
  const results: { row: number; col: number; letter: string }[] = [];
  const found = new Set<string>();

  // Horizontal 3 identical
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c <= BOARD_SIZE - 3; c++) {
      const t1 = board[r][c];
      const t2 = board[r][c + 1];
      const t3 = board[r][c + 2];
      if (
        t1 && t2 && t3 &&
        t1.letter === t2.letter &&
        t2.letter === t3.letter &&
        t2.special === 'none'
      ) {
        const key = `${r},${c + 1}`;
        if (!found.has(key)) {
          found.add(key);
          results.push({ row: r, col: c + 1, letter: t2.letter });
        }
      }
    }
  }

  // Vertical 3 identical
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r <= BOARD_SIZE - 3; r++) {
      const t1 = board[r][c];
      const t2 = board[r + 1][c];
      const t3 = board[r + 2][c];
      if (
        t1 && t2 && t3 &&
        t1.letter === t2.letter &&
        t2.letter === t3.letter &&
        t2.special === 'none'
      ) {
        const key = `${r + 1},${c}`;
        if (!found.has(key)) {
          found.add(key);
          results.push({ row: r + 1, col: c, letter: t2.letter });
        }
      }
    }
  }

  return results;
}

// Clone board helper
export function cloneBoard(board: Tile[][]): Tile[][] {
  return board.map((row) =>
    row.map((t) => ({
      ...t,
    }))
  );
}

// Apply gravity & cascade: empty positions are filled by falling tiles and new top tiles
// REQUIREMENT: When replacing disappeared letters, make sure that the replacement will give the player a formed word in at least 1 move.
export function applyGravityAndRefill(
  board: Tile[][],
  clearedPositions: Set<string>,
  spawnSpecials: { row: number; col: number; special: SpecialTileType; letter?: string }[] = [],
  categoryId: number = 1,
  formedWords?: Set<string>
): { newBoard: Tile[][]; fallenCount: number } {
  const newBoard: Tile[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE));
  let fallenCount = 0;

  // Process column by column
  for (let c = 0; c < BOARD_SIZE; c++) {
    const survivingTiles: Tile[] = [];

    // Check for special tile creations placed in this column
    const columnSpawns = spawnSpecials.filter((s) => s.col === c);

    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      const key = `${r},${c}`;
      const spawn = columnSpawns.find((s) => s.row === r);

      if (spawn) {
        // Replace or leave special tile at this position
        const oldTile = board[r][c];
        const newSpecialTile = createNewTile(r, c, spawn.letter || oldTile?.letter, spawn.special);
        newSpecialTile.isMerged = true;
        survivingTiles.unshift(newSpecialTile);
      } else if (!clearedPositions.has(key)) {
        const tile = board[r][c];
        if (tile) {
          survivingTiles.unshift(tile);
        }
      }
    }

    const missingCount = BOARD_SIZE - survivingTiles.length;
    fallenCount += missingCount;

    // Fill missing tiles at top (newly generated falling in)
    for (let r = 0; r < missingCount; r++) {
      const newTile = createNewTile(r, c);
      newTile.isFalling = true;
      newBoard[r][c] = newTile;
    }

    // Place surviving tiles at bottom (mark if they dropped down from previous row)
    for (let i = 0; i < survivingTiles.length; i++) {
      const r = missingCount + i;
      const originalRow = survivingTiles[i].row;
      const hasDropped = originalRow !== r;

      newBoard[r][c] = {
        ...survivingTiles[i],
        row: r,
        col: c,
        isMatched: false,
        isClearing: false,
        isWordHighlighted: false,
        isFalling: hasDropped || survivingTiles[i].isFalling,
      };
    }
  }

  // REQUIREMENT: When replacing disappeared letters, guarantee that the new replacement gives a formed word in at least 1 move!
  if (fallenCount > 0) {
    ensureOneMoveOpportunity(newBoard, categoryId, formedWords);
  }

  return { newBoard, fallenCount };
}

// Find Strategic Clue (Section 10)
// REQUIREMENT: Minimum 3 letters, non-plural form, and prioritize words with least number of letters in clue.
export function findStrategicClue(
  board: Tile[][],
  categoryId: number,
  formedWords?: Set<string>
): ClueInfo | null {
  // PRIORITY 1: Check all possible adjacent swaps that create a valid category word (length >= 3, non-plural, unformed, least letters first)
  let bestWordClue: ClueInfo | null = null;
  let minWordLength = Infinity;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      // Directions: right and down to check all adjacent pairs
      const deltas = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 }
      ];

      for (const { dr, dc } of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < BOARD_SIZE && nc < BOARD_SIZE) {
          if (board[r][c].letter === board[nr][nc].letter) continue;

          // In-place swap simulation for speed
          const t1 = board[r][c];
          const t2 = board[nr][nc];
          const origL1 = t1.letter;
          const origL2 = t2.letter;

          t1.letter = origL2;
          t2.letter = origL1;

          const matches = findValidWordsOnBoard(board, categoryId, formedWords);

          // Restore letters immediately
          t1.letter = origL1;
          t2.letter = origL2;

          if (matches.length > 0) {
            for (const match of matches) {
              const wordUpper = match.word.toUpperCase();
              // REQUIREMENT: Do not give clue in plural form; minimum 3 letters
              if (
                wordUpper.length >= 3 &&
                !isPluralWord(wordUpper) &&
                (!formedWords || !formedWords.has(wordUpper))
              ) {
                // REQUIREMENT: Prioritize words with least number of letters in clue
                if (wordUpper.length < minWordLength) {
                  minWordLength = wordUpper.length;
                  bestWordClue = {
                    from: { row: r, col: c },
                    to: { row: nr, col: nc },
                    type: 'word',
                    reason: `Swap to form category word "${wordUpper}"!`
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  if (bestWordClue) {
    return bestWordClue;
  }

  // PRIORITY 2: If no 1-move word is possible, check for adjacent identical letters (Creates Special Highlighted/Shining Tile)
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const current = board[r][c];
      if (!current) continue;

      // Horizontal neighbor
      if (c + 1 < BOARD_SIZE) {
        const right = board[r][c + 1];
        if (right && current.letter === right.letter) {
          return {
            from: { row: r, col: c },
            to: { row: r, col: c + 1 },
            type: 'identical',
            reason: `Combine two '${current.letter}' tiles to generate a special laser tile!`
          };
        }
      }

      // Vertical neighbor
      if (r + 1 < BOARD_SIZE) {
        const down = board[r + 1][c];
        if (down && current.letter === down.letter) {
          return {
            from: { row: r, col: c },
            to: { row: r + 1, col: c },
            type: 'identical',
            reason: `Combine two '${current.letter}' tiles to generate a special laser tile!`
          };
        }
      }
    }
  }

  return null;
}

// Find 3 possible answers using current letters on the board for the idle robot hint
// REQUIREMENT: Minimum 3 letters, STRICTLY NON-PLURAL form, and prioritize words with least number of letters.
export function findThreePossibleAnswers(
  board: Tile[][],
  categoryId: number,
  formedWords?: Set<string>
): string[] {
  const answers: string[] = [];
  const seen = new Set<string>();

  // 1. First get all 1-move category opportunities (filtered for >= 3 letters, strictly non-plural, sorted with least letters first)
  const opportunities = countOneMoveCategoryOpportunities(board, categoryId, formedWords);
  opportunities.sort((a, b) => a.word.length - b.word.length);
  for (const opp of opportunities) {
    const w = opp.word.toUpperCase();
    if (
      w.length >= 3 &&
      !isPluralWord(w) &&
      !seen.has(w) &&
      (!formedWords || !formedWords.has(w))
    ) {
      seen.add(w);
      answers.push(w);
      if (answers.length >= 3) return answers;
    }
  }

  // 2. Check unformed words from the category that can be formed using letter pool on board (strictly non-plural, least letters first)
  const currentCat = getCategoryById(categoryId);
  const boardLetters: Record<string, number> = {};
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const char = board[r][c].letter;
      boardLetters[char] = (boardLetters[char] || 0) + 1;
    }
  }

  if (currentCat) {
    const validCatWords = currentCat.words
      .map((w) => w.toUpperCase())
      .filter((w) => w.length >= 3 && !isPluralWord(w))
      .sort((a, b) => a.length - b.length);

    for (const w of validCatWords) {
      if (!seen.has(w) && (!formedWords || !formedWords.has(w))) {
        // Check if board contains enough letters for this word
        const needed: Record<string, number> = {};
        for (const ch of w) {
          needed[ch] = (needed[ch] || 0) + 1;
        }
        const canSpell = Object.keys(needed).every((ch) => (boardLetters[ch] || 0) >= needed[ch]);
        if (canSpell) {
          seen.add(w);
          answers.push(w);
          if (answers.length >= 3) return answers;
        }
      }
    }

    // 3. Fallback: add remaining valid unformed category words (strictly non-plural, already sorted by length ascending)
    for (const w of validCatWords) {
      if (!seen.has(w) && (!formedWords || !formedWords.has(w))) {
        seen.add(w);
        answers.push(w);
        if (answers.length >= 3) return answers;
      }
    }
  }

  return answers;
}

// Find ONLY the 2 tile coordinates to be swapped for the best 1-move category word opportunity (non-plural, prioritizing least letters first)
export function findOneMoveSwapPair(
  board: Tile[][],
  categoryId: number = 1,
  formedWords?: Set<string>
): [{ row: number; col: number }, { row: number; col: number }] | null {
  let bestPair: [{ row: number; col: number }, { row: number; col: number }] | null = null;
  let minLength = Infinity;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const neighbors = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
      ];

      for (const { dr, dc } of neighbors) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < BOARD_SIZE && nc < BOARD_SIZE) {
          if (board[r][c].letter === board[nr][nc].letter) continue;

          // Swap letters temporarily
          const t1 = board[r][c];
          const t2 = board[nr][nc];
          const orig1 = t1.letter;
          const orig2 = t2.letter;

          t1.letter = orig2;
          t2.letter = orig1;

          const matches = findCategoryWordsCrossingTiles(
            board,
            categoryId,
            [{ row: r, col: c }, { row: nr, col: nc }],
            formedWords
          );

          // Restore letters immediately
          t1.letter = orig1;
          t2.letter = orig2;

          if (matches.length > 0) {
            for (const match of matches) {
              const upper = match.word.toUpperCase();
              if (
                upper.length >= 3 &&
                !isPluralWord(upper) &&
                (!formedWords || !formedWords.has(upper))
              ) {
                // Prioritize words with least number of letters
                if (upper.length < minLength) {
                  minLength = upper.length;
                  bestPair = [
                    { row: r, col: c },
                    { row: nr, col: nc },
                  ];
                }
              }
            }
          }
        }
      }
    }
  }

  return bestPair;
}

// Find all tile coordinates involved in the best 1-move new category word opportunity (non-plural, least letters first)
export function findOneMoveWordTiles(
  board: Tile[][],
  categoryId: number = 1,
  formedWords?: Set<string>
): { row: number; col: number }[] {
  let bestTiles: { row: number; col: number }[] = [];
  let minLength = Infinity;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const neighbors = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
      ];

      for (const { dr, dc } of neighbors) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < BOARD_SIZE && nc < BOARD_SIZE) {
          if (board[r][c].letter === board[nr][nc].letter) continue;

          // Swap letters temporarily
          const t1 = board[r][c];
          const t2 = board[nr][nc];
          const orig1 = t1.letter;
          const orig2 = t2.letter;

          t1.letter = orig2;
          t2.letter = orig1;

          const matches = findCategoryWordsCrossingTiles(
            board,
            categoryId,
            [{ row: r, col: c }, { row: nr, col: nc }],
            formedWords
          );

          // Restore letters immediately
          t1.letter = orig1;
          t2.letter = orig2;

          if (matches.length > 0) {
            for (const match of matches) {
              const upper = match.word.toUpperCase();
              if (
                upper.length >= 3 &&
                !isPluralWord(upper) &&
                (!formedWords || !formedWords.has(upper))
              ) {
                // REQUIREMENT: Prioritize words with least number of letters
                if (upper.length < minLength) {
                  minLength = upper.length;
                  const coordsMap = new Map<string, { row: number; col: number }>();
                  coordsMap.set(`${r},${c}`, { row: r, col: c });
                  coordsMap.set(`${nr},${nc}`, { row: nr, col: nc });
                  for (const t of match.tiles) {
                    coordsMap.set(`${t.row},${t.col}`, { row: t.row, col: t.col });
                  }
                  bestTiles = Array.from(coordsMap.values());
                }
              }
            }
          }
        }
      }
    }
  }

  return bestTiles;
}

// Rearrange all tiles on the board randomly (Section 10)
export function shuffleBoard(board: Tile[][], categoryId?: number): Tile[][] {
  const flatTiles = board.flat();

  for (let attempt = 0; attempt < 30; attempt++) {
    // Shuffle array
    for (let i = flatTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flatTiles[i], flatTiles[j]] = [flatTiles[j], flatTiles[i]];
    }

    const newBoard: Tile[][] = [];
    let idx = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        row.push({
          ...flatTiles[idx],
          row: r,
          col: c,
          isMatched: false,
          isWordHighlighted: false,
          isClearing: false,
        });
        idx++;
      }
      newBoard.push(row);
    }

    if (!categoryId) return newBoard;

    // Check if at least 1 move opportunity exists
    const opps = countOneMoveCategoryOpportunities(newBoard, categoryId);
    if (opps.length >= 1) {
      return newBoard;
    }
  }

  // Fallback to fresh board if needed
  return categoryId ? generateInitialBoard(categoryId) : board;
}
