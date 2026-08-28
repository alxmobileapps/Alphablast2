import { INITIAL_CATEGORIES } from './categories';
import { COMMON_WORDS } from './commonWords';
import { Category } from '../types';

// Pre-computed normalized sets for fast O(1) lookup
const globalWordSet = new Set<string>();
const categoryWordSets = new Map<number, Set<string>>();
const customCategoryMap = new Map<number, Category>();

// Irregular noun singular <-> plural bidirectional pairs
const IRREGULAR_NOUN_PAIRS: [string, string][] = [
  ['FOOT', 'FEET'],
  ['TOOTH', 'TEETH'],
  ['MOUSE', 'MICE'],
  ['GOOSE', 'GEESE'],
  ['OX', 'OXEN'],
  ['WOLF', 'WOLVES'],
  ['CALF', 'CALVES'],
  ['LEAF', 'LEAVES'],
  ['HALF', 'HALVES'],
  ['LIFE', 'LIVES'],
  ['KNIFE', 'KNIVES'],
  ['DIE', 'DICE'],
  ['MAN', 'MEN'],
  ['WOMAN', 'WOMEN'],
  ['CHILD', 'CHILDREN'],
  ['PERSON', 'PEOPLE'],
  ['CACTUS', 'CACTI'],
  ['FUNGUS', 'FUNGI'],
  ['LARVA', 'LARVAE'],
  ['PUPA', 'PUPAE'],
];

const singularToIrregularPlural = new Map<string, string>();
const irregularPluralToSingular = new Map<string, string>();
for (const [sing, plur] of IRREGULAR_NOUN_PAIRS) {
  singularToIrregularPlural.set(sing, plur);
  irregularPluralToSingular.set(plur, sing);
}

// 1. Index Common English words
for (const word of COMMON_WORDS) {
  const upper = word.toUpperCase().trim();
  if (upper.length >= 3) {
    globalWordSet.add(upper);
  }
}

// Helper to index a category's word list cleanly without generating fake synthetic plurals
function indexCategoryWords(catId: number, words: string[]): Set<string> {
  const catSet = new Set<string>();

  for (const rawWord of words) {
    const clean = rawWord.toUpperCase().replace(/[\s\-_']/g, '');
    if (clean.length >= 3) {
      catSet.add(clean);
      globalWordSet.add(clean);

      // Link irregular plurals/singulars if recognized (e.g. FOOT <-> FEET, TOOTH <-> TEETH)
      if (singularToIrregularPlural.has(clean)) {
        const plur = singularToIrregularPlural.get(clean)!;
        if (plur.length >= 3) {
          catSet.add(plur);
          globalWordSet.add(plur);
        }
      }
      if (irregularPluralToSingular.has(clean)) {
        const sing = irregularPluralToSingular.get(clean)!;
        if (sing.length >= 3) {
          catSet.add(sing);
          globalWordSet.add(sing);
        }
      }
    }
  }

  return catSet;
}

// 2. Index all Initial Categories
for (const cat of INITIAL_CATEGORIES) {
  const catSet = indexCategoryWords(cat.id, cat.words);
  categoryWordSets.set(cat.id, catSet);
}

export function isValidWord(word: string): boolean {
  if (!word || word.length < 3) return false;
  const upper = word.toUpperCase().trim();
  return globalWordSet.has(upper);
}

export function isCategoryWord(word: string, categoryId: number): boolean {
  if (!word || word.length < 3) return false;
  const upper = word.toUpperCase().trim();
  const catSet = categoryWordSets.get(categoryId);
  if (!catSet) return false;
  return catSet.has(upper);
}

export function registerDynamicWord(word: string, categoryId?: number) {
  if (!word || word.length < 3) return;
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length >= 3) {
    globalWordSet.add(clean);
    if (categoryId !== undefined) {
      let catSet = categoryWordSets.get(categoryId);
      if (!catSet) {
        catSet = new Set<string>();
        categoryWordSets.set(categoryId, catSet);
      }
      catSet.add(clean);
    }
  }
}

export function registerCustomCategory(cat: Category) {
  customCategoryMap.set(cat.id, cat);
  const catSet = indexCategoryWords(cat.id, cat.words);
  categoryWordSets.set(cat.id, catSet);
}

export function unregisterCustomCategory(categoryId: number) {
  customCategoryMap.delete(categoryId);
  categoryWordSets.delete(categoryId);
}

export function getCategoryById(categoryId: number): Category {
  if (customCategoryMap.has(categoryId)) {
    return customCategoryMap.get(categoryId)!;
  }
  return INITIAL_CATEGORIES.find((c) => c.id === categoryId) || INITIAL_CATEGORIES[0];
}


