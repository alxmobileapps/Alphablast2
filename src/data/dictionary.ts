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

/**
 * Rewrites any US/UK spelling-variant words found in a piece of display
 * text (a category name, etc.) to the given preference, preserving each
 * matched word's original casing style (ALLCAPS / Titlecase / lowercase).
 * Word VALIDATION during gameplay already accepts both spellings no
 * matter what (see getSpellingVariants below) -- this is purely cosmetic,
 * for players who set a US/UK display preference in Settings.
 */
export function toPreferredSpelling(text: string, pref: 'US' | 'UK'): string {
  const table = pref === 'UK' ? US_UK_SPELLING_VARIANTS : UK_US_SPELLING_VARIANTS;
  return text.replace(/[A-Za-z]+/g, (token) => {
    const upper = token.toUpperCase();
    const replacement = table[upper];
    if (!replacement) return token;
    if (token === upper) return replacement; // ALLCAPS
    if (token[0] === token[0].toUpperCase()) {
      return replacement[0] + replacement.slice(1).toLowerCase(); // Titlecase
    }
    return replacement.toLowerCase();
  });
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
  ['LOAF', 'LOAVES'],
  ['SHELF', 'SHELVES'],
  ['SELF', 'SELVES'],
  ['BOOKSHELF', 'BOOKSHELVES'],
  ['MEATLOAF', 'MEATLOAVES'],
  ['BAYLEAF', 'BAYLEAVES'],
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
 *
 * A word on the irregular-noun list above gets its irregular plural
 * PLUS whatever the sibilant/Y/O rules below would separately add (e.g.
 * CACTUS -> CACTI and, via the sibilant rule, the also-standard
 * "CACTUSES") — those rules are safe to keep running because none of
 * them just tack a bare "+S" onto the word. What's suppressed is only
 * the final catch-all "+S" rule at the bottom: without that suppression,
 * an irregular word like FOOT or WOMAN ALSO got the bare "+S" form
 * pushed on top of its real plural, producing fake words like "FOOTS"
 * and "WOMANS" that then got indexed as valid, playable dictionary
 * entries via indexCategoryWords() below.
 */
export function getPluralForms(word: string): string[] {
  const upper = word.toUpperCase().trim();
  if (upper.length < 3) return [];

  const results: string[] = [];
  const isIrregular = singularToIrregularPlural.has(upper);
  if (isIrregular) {
    results.push(singularToIrregularPlural.get(upper)!);
  }

  // Sibilants / Box / Dish / Watch -> +ES (e.g. BUS -> BUSES, FOX -> FOXES;
  // also correctly fires for an irregular -US noun like CACTUS, adding the
  // standard alternate "CACTUSES" alongside "CACTI")
  if (
    upper.endsWith('S') ||
    upper.endsWith('SH') ||
    upper.endsWith('CH') ||
    upper.endsWith('X') ||
    upper.endsWith('Z')
  ) {
    results.push(upper + 'ES');
  }

  // Consonant + Y -> -Y + IES (e.g. BERRY -> BERRIES, FRY -> FRIES);
  // Vowel + Y -> +S (e.g. MONKEY -> MONKEYS, DAY -> DAYS). This is the
  // ONLY plural for a Y-ending word — it must not also fall through to
  // the generic "+S" rule below (that's what used to produce "FRYS"
  // alongside the correct "FRIES").
  let endsInY = false;
  if (upper.endsWith('Y') && upper.length >= 3) {
    endsInY = true;
    const prevChar = upper[upper.length - 2];
    if (!VOWELS.has(prevChar)) {
      results.push(upper.slice(0, -1) + 'IES');
    } else {
      results.push(upper + 'S');
    }
  }

  // NOTE: there is deliberately no generic "-F/-FE -> -VES" rule here.
  // Which -F/-FE nouns take -VES (WOLF -> WOLVES) versus a plain -S
  // (CHIEF -> CHIEFS, GIRAFFE -> GIRAFFES) is genuinely irregular, not
  // predictable from spelling — a blanket suffix rule can't tell them
  // apart and was generating non-words like "CHIEVES" and "GIRAFVES".
  // Every real -F/-FE -> -VES noun is listed explicitly above instead.

  // -O preceded by consonant -> +ES and +S (e.g. HERO -> HEROES, TOMATO -> TOMATOES).
  // Some -O nouns only take -OS in standard English (PIANO -> PIANOS, not
  // "PIANOES") — both forms are generated here and left for gameplay
  // leniency rather than trying to hard-code every exception.
  if (upper.endsWith('O') && upper.length >= 3) {
    const prevChar = upper[upper.length - 2];
    if (!VOWELS.has(prevChar)) {
      results.push(upper + 'ES');
    }
    results.push(upper + 'S');
  }

  // Standard +S for everything else (e.g. CAT -> CATS, APPLE -> APPLES).
  // Skipped for irregular nouns — a bare "+S" is never correct for one
  // (FOOTS, WOMANS, CHILDS, LARVAS, CRITERIONS, WOLFS, LEAFS... are none
  // of them real words), and any of those that separately need an
  // alternate form take it via the sibilant/Y/O rules above instead.
  if (
    !isIrregular &&
    !endsInY &&
    !upper.endsWith('S') &&
    !upper.endsWith('Z') &&
    !upper.endsWith('X') &&
    !upper.endsWith('CH') &&
    !upper.endsWith('SH')
  ) {
    results.push(upper + 'S');
  }

  return Array.from(new Set(results.filter((w) => w.length >= 3)));
}

/**
 * Generate standard English singular forms for a given plural word.
 *
 * Like getPluralForms above, an irregular-plural match returns
 * immediately instead of also falling through to the pattern rules.
 * The rules below are also now mutually exclusive (else-if, not
 * independent ifs) — every plural ending in "-IES" or "-VES" also ends
 * in the more generic "-ES", so without that the old code additionally
 * ran the generic -ES branch's unconditional "remove one letter" step on
 * top of the correct -IES/-VES result, producing garbage stems (e.g.
 * BERRIES, having already correctly produced "BERRY", would also
 * produce "BERRIE"; WOLVES would also produce "WOLVE").
 */
export function getSingularForms(word: string): string[] {
  const upper = word.toUpperCase().trim();
  if (upper.length < 3) return [];

  if (irregularPluralToSingular.has(upper)) {
    // Filtered the same as the pattern-rule path below — OXEN -> OX would
    // otherwise slip through unfiltered here (OX is only 2 letters).
    return [irregularPluralToSingular.get(upper)!].filter((w) => w.length >= 3);
  }

  const results: string[] = [];

  // -IES -> -Y (e.g. BERRIES -> BERRY, FRIES -> FRY)
  if (upper.endsWith('IES') && upper.length >= 5) {
    results.push(upper.slice(0, -3) + 'Y');
  } else if (upper.endsWith('VES') && upper.length >= 5) {
    // -VES -> -F or -FE (e.g. WOLVES -> WOLF, KNIVES -> KNIFE) — both are
    // left as candidates for the caller to validate; which one is real
    // is irregular, same reasoning as getPluralForms above.
    results.push(upper.slice(0, -3) + 'F');
    results.push(upper.slice(0, -3) + 'FE');
  } else if (upper.endsWith('ES') && upper.length >= 4) {
    // -ES -> remove ES (e.g. FOXES -> FOX, TOMATOES -> TOMATO) when the
    // root plausibly takes -ES (S/X/Z/CH/SH/O) — genuinely ambiguous with
    // "remove just the -S" (e.g. BONES -> BONE, TOES -> TOE), so both are
    // left as candidates for the caller to validate, same as the -VES
    // branch above.
    const base = upper.slice(0, -2);
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
    results.push(upper.slice(0, -1));
  } else if (upper.endsWith('S') && !upper.endsWith('SS') && upper.length >= 4) {
    // Standard -S -> remove S (e.g. DOGS -> DOG, CATS -> CAT)
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
