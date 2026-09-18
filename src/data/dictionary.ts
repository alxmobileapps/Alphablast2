import { INITIAL_CATEGORIES } from './categories';
import { COMMON_WORDS } from './commonWords';
import { Category } from '../types';

/**
 * US <-> UK spelling variants. Both spellings are accepted as valid words
 * everywhere a word is checked (general dictionary AND category words) —
 * this only affects word VALIDATION, not what's displayed in clues/category
 * lists (those still show whatever spelling the category data was authored
 * with). Purely additive, one-time indexing at module load below, next to
 * the existing plural-form indexing — no per-render or per-move cost, and
 * no changes anywhere outside this file.
 */
const US_UK_SPELLING_VARIANTS: Record<string, string> = {
  COLOR: 'COLOUR', COLORS: 'COLOURS', COLORED: 'COLOURED', COLORFUL: 'COLOURFUL',
  FAVOR: 'FAVOUR', FAVORS: 'FAVOURS', FAVORITE: 'FAVOURITE', FAVORITES: 'FAVOURITES',
  FLAVOR: 'FLAVOUR', FLAVORS: 'FLAVOURS', FLAVORED: 'FLAVOURED',
  HONOR: 'HONOUR', HONORS: 'HONOURS', HONORED: 'HONOURED', HONORABLE: 'HONOURABLE',
  ARMOR: 'ARMOUR', ARMORS: 'ARMOURS', ARMORED: 'ARMOURED',
  HUMOR: 'HUMOUR', RUMOR: 'RUMOUR', RUMORS: 'RUMOURS',
  HARBOR: 'HARBOUR', HARBORS: 'HARBOURS',
  NEIGHBOR: 'NEIGHBOUR', NEIGHBORS: 'NEIGHBOURS', NEIGHBORHOOD: 'NEIGHBOURHOOD',
  ODOR: 'ODOUR', ODORS: 'ODOURS', VIGOR: 'VIGOUR', VALOR: 'VALOUR', LABOR: 'LABOUR', LABORS: 'LABOURS',
  BEHAVIOR: 'BEHAVIOUR', BEHAVIORS: 'BEHAVIOURS', SAVIOR: 'SAVIOUR', TUMOR: 'TUMOUR', TUMORS: 'TUMOURS',
  CENTER: 'CENTRE', CENTERS: 'CENTRES', CENTERED: 'CENTRED',
  THEATER: 'THEATRE', THEATERS: 'THEATRES', METER: 'METRE', METERS: 'METRES',
  KILOMETER: 'KILOMETRE', KILOMETERS: 'KILOMETRES', MILLIMETER: 'MILLIMETRE', MILLIMETERS: 'MILLIMETRES',
  CENTIMETER: 'CENTIMETRE', CENTIMETERS: 'CENTIMETRES', DIAMETER: 'DIAMETRE', FIBER: 'FIBRE', FIBERS: 'FIBRES',
  LITER: 'LITRE', LITERS: 'LITRES',
  ORGANIZE: 'ORGANISE', ORGANIZES: 'ORGANISES', ORGANIZED: 'ORGANISED', ORGANIZING: 'ORGANISING',
  ORGANIZATION: 'ORGANISATION', RECOGNIZE: 'RECOGNISE', RECOGNIZED: 'RECOGNISED',
  REALIZE: 'REALISE', REALIZED: 'REALISED', APOLOGIZE: 'APOLOGISE', CRITICIZE: 'CRITICISE',
  MEMORIZE: 'MEMORISE', PRIORITIZE: 'PRIORITISE', EMPHASIZE: 'EMPHASISE',
  MAXIMIZE: 'MAXIMISE', MINIMIZE: 'MINIMISE', OPTIMIZE: 'OPTIMISE', UTILIZE: 'UTILISE',
  ANALYZE: 'ANALYSE', ANALYZED: 'ANALYSED', PARALYZE: 'PARALYSE',
  DEFENSE: 'DEFENCE', DEFENSES: 'DEFENCES', OFFENSE: 'OFFENCE', OFFENSES: 'OFFENCES',
  LICENSE: 'LICENCE', PRETENSE: 'PRETENCE',
  TRAVELING: 'TRAVELLING', TRAVELER: 'TRAVELLER', TRAVELERS: 'TRAVELLERS',
  CANCELED: 'CANCELLED', CANCELING: 'CANCELLING', MODELING: 'MODELLING', JEWELRY: 'JEWELLERY',
  TIRE: 'TYRE', TIRES: 'TYRES', DONUT: 'DOUGHNUT', DONUTS: 'DOUGHNUTS',
  ALUMINUM: 'ALUMINIUM', SULFUR: 'SULPHUR', MOLD: 'MOULD', MOLDY: 'MOULDY',
  MUSTACHE: 'MOUSTACHE', PAJAMA: 'PYJAMA', PAJAMAS: 'PYJAMAS', PLOW: 'PLOUGH', PLOWS: 'PLOUGHS',
  COZY: 'COSY', PROGRAM: 'PROGRAMME', PROGRAMS: 'PROGRAMMES', CHECK: 'CHEQUE', CHECKS: 'CHEQUES',
  GRAY: 'GREY', GRAYS: 'GREYS', MATH: 'MATHS', MOM: 'MUM', MOMS: 'MUMS', MOMMY: 'MUMMY',
};

const UK_US_SPELLING_VARIANTS: Record<string, string> = {};
for (const [us, uk] of Object.entries(US_UK_SPELLING_VARIANTS)) {
  UK_US_SPELLING_VARIANTS[uk] = us;
}

/** Returns every recognized US/UK spelling of a word (including itself). */
function getSpellingVariants(word: string): string[] {
  const variants = [word];
  const uk = US_UK_SPELLING_VARIANTS[word];
  if (uk) variants.push(uk);
  const us = UK_US_SPELLING_VARIANTS[word];
  if (us) variants.push(us);
  return variants;
}

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
  ['WIFE', 'WIVES'],
  ['THIEF', 'THIEVES'],
  ['ELF', 'ELVES'],
  ['SCARF', 'SCARVES'],
  ['SHEAF', 'SHEAVES'],
  ['DIE', 'DICE'],
  ['MAN', 'MEN'],
  ['WOMAN', 'WOMEN'],
  ['CHILD', 'CHILDREN'],
  ['PERSON', 'PEOPLE'],
  ['CACTUS', 'CACTI'],
  ['FUNGUS', 'FUNGI'],
  ['NUCLEUS', 'NUCLEI'],
  ['RADIUS', 'RADII'],
  ['SYLLABUS', 'SYLLABI'],
  ['LARVA', 'LARVAE'],
  ['PUPA', 'PUPAE'],
  ['ALUMNUS', 'ALUMNI'],
  ['CRITERION', 'CRITERIA'],
  ['PHENOMENON', 'PHENOMENA'],
];

const singularToIrregularPlural = new Map<string, string>();
const irregularPluralToSingular = new Map<string, string>();
for (const [sing, plur] of IRREGULAR_NOUN_PAIRS) {
  singularToIrregularPlural.set(sing, plur);
  irregularPluralToSingular.set(plur, sing);
}

// 1. Index Common English words (both US and UK spellings accepted)
for (const word of COMMON_WORDS) {
  const upper = word.toUpperCase().trim();
  if (upper.length >= 3) {
    for (const variant of getSpellingVariants(upper)) {
      globalWordSet.add(variant);
    }
  }
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Generate standard English plural forms for a given root word.
 */
export function getPluralForms(word: string): string[] {
  const upper = word.toUpperCase().trim();
  if (upper.length < 3) return [];

  const results: string[] = [];

  // Check irregular plurals
  if (singularToIrregularPlural.has(upper)) {
    results.push(singularToIrregularPlural.get(upper)!);
  }

  // Sibilants / Box / Dish / Watch -> +ES
  if (
    upper.endsWith('S') ||
    upper.endsWith('SH') ||
    upper.endsWith('CH') ||
    upper.endsWith('X') ||
    upper.endsWith('Z')
  ) {
    results.push(upper + 'ES');
  }

  // Consonant + Y -> -Y + IES (e.g. BERRY -> BERRIES, PUPPY -> PUPPIES)
  if (upper.endsWith('Y') && upper.length >= 3) {
    const prevChar = upper[upper.length - 2];
    if (!VOWELS.has(prevChar)) {
      results.push(upper.slice(0, -1) + 'IES');
    } else {
      results.push(upper + 'S'); // MONKEY -> MONKEYS, DAY -> DAYS
    }
  }

  // -F or -FE -> -VES (e.g. WOLF -> WOLVES, KNIFE -> KNIVES)
  if (upper.endsWith('FE') && upper.length >= 4) {
    results.push(upper.slice(0, -2) + 'VES');
  } else if (upper.endsWith('F') && upper.length >= 3) {
    results.push(upper.slice(0, -1) + 'VES');
    results.push(upper + 'S'); // e.g. CHIEF -> CHIEFS
  }

  // -O preceded by consonant -> +ES and +S (e.g. HERO -> HEROES, TOMATO -> TOMATOES)
  if (upper.endsWith('O') && upper.length >= 3) {
    const prevChar = upper[upper.length - 2];
    if (!VOWELS.has(prevChar)) {
      results.push(upper + 'ES');
    }
    results.push(upper + 'S');
  }

  // Standard +S for general words (e.g. CAT -> CATS, DOG -> DOGS, APPLE -> APPLES)
  if (!upper.endsWith('S') && !upper.endsWith('Z') && !upper.endsWith('X') && !upper.endsWith('CH') && !upper.endsWith('SH')) {
    results.push(upper + 'S');
  }

  return Array.from(new Set(results.filter((w) => w.length >= 3)));
}

/**
 * Generate standard English singular forms for a given plural word.
 */
export function getSingularForms(word: string): string[] {
  const upper = word.toUpperCase().trim();
  if (upper.length < 3) return [];

  const results: string[] = [];

  // Check irregular plurals to singular
  if (irregularPluralToSingular.has(upper)) {
    results.push(irregularPluralToSingular.get(upper)!);
  }

  // -IES -> -Y (e.g. BERRIES -> BERRY, PUPPIES -> PUPPY, FLIES -> FLY)
  if (upper.endsWith('IES') && upper.length >= 5) {
    results.push(upper.slice(0, -3) + 'Y');
  }

  // Special 4-letter -IES -> -Y (e.g. FLIES is 5 letters, but just in case, ensure -IES -> -Y)
  if (upper.endsWith('IES') && upper.length === 4) {
    results.push(upper.slice(0, -3) + 'Y');
  }

  // -VES -> -F or -FE (e.g. WOLVES -> WOLF, KNIVES -> KNIFE, LIVES -> LIFE)
  if (upper.endsWith('VES') && upper.length >= 5) {
    results.push(upper.slice(0, -3) + 'F');
    results.push(upper.slice(0, -3) + 'FE');
  }

  // -ES -> remove ES (e.g. FOXES -> FOX, PEACHES -> PEACH, HEROES -> HERO, BOXES -> BOX, BUSHES -> BUSH)
  if (upper.endsWith('ES') && upper.length >= 4) {
    const base = upper.slice(0, -2);
    // Plural -ES is only added to roots ending in S, X, Z, CH, SH, or O (e.g. FOX -> FOXES, TOMATO -> TOMATOES)
    if (
      base.endsWith('S') ||
      base.endsWith('X') ||
      base.endsWith('Z') ||
      base.endsWith('CH') ||
      base.endsWith('SH') ||
      base.endsWith('O')
    ) {
      results.push(base);
    }
    // Or for words ending in -E that just take -S (e.g. BONES -> BONE, CAKES -> CAKE)
    results.push(upper.slice(0, -1));
  }

  // Standard -S -> remove S (e.g. DOGS -> DOG, CATS -> CAT, APPLES -> APPLE)
  // Must NOT end in SS, and the remaining root must NOT end in a vowel followed by nothing (e.g. FLIS is not a word)
  if (upper.endsWith('S') && !upper.endsWith('SS') && upper.length >= 4) {
    results.push(upper.slice(0, -1));
  }

  return Array.from(new Set(results.filter((w) => w.length >= 3)));
}

// Helper to index a category's word list with full singular, plural, AND
// US/UK spelling variant recognition
function indexCategoryWords(catId: number, words: string[]): Set<string> {
  const catSet = new Set<string>();

  for (const rawWord of words) {
    const clean = rawWord.toUpperCase().replace(/[\s\-_']/g, '');
    if (clean.length >= 3) {
      // 1. Index base word and its US/UK spelling variant(s), e.g. COLOR <-> COLOUR
      for (const spellingVariant of getSpellingVariants(clean)) {
        catSet.add(spellingVariant);
        globalWordSet.add(spellingVariant);

        // 2. Generate and index all plural variations for each spelling
        // variant (e.g. DOG -> DOGS, BERRY -> BERRIES, FOX -> FOXES, FLY -> FLIES)
        const plurals = getPluralForms(spellingVariant);
        for (const p of plurals) {
          catSet.add(p);
          globalWordSet.add(p);
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
  // Exact match in master dictionary or verified category words
  if (globalWordSet.has(upper)) return true;

  return false;
}

export function isCategoryWord(word: string, categoryId: number): boolean {
  if (!word || word.length < 3) return false;
  const upper = word.toUpperCase().trim();
  const catSet = categoryWordSets.get(categoryId);
  if (!catSet) return false;

  // Exact match in verified category set
  if (catSet.has(upper)) return true;

  return false;
}

export function registerDynamicWord(word: string, categoryId?: number) {
  if (!word || word.length < 3) return;
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length >= 3) {
    globalWordSet.add(clean);
    
    // Add plurals & singulars
    const plurals = getPluralForms(clean);
    const singulars = getSingularForms(clean);
    for (const p of plurals) globalWordSet.add(p);
    for (const s of singulars) globalWordSet.add(s);

    if (categoryId !== undefined) {
      let catSet = categoryWordSets.get(categoryId);
      if (!catSet) {
        catSet = new Set<string>();
        categoryWordSets.set(categoryId, catSet);
      }
      catSet.add(clean);
      for (const p of plurals) catSet.add(p);
      for (const s of singulars) catSet.add(s);
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
