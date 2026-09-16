/**
 * Location-based English Variant (US vs UK) Detection and Word Localization Service
 * Automatically detects player's locale/timezone and provides US/UK clue variations
 */

export type EnglishVariant = 'us' | 'uk';
export type EnglishSettingMode = 'auto' | 'us' | 'uk';

const ENGLISH_SETTING_KEY = 'alphablast_english_variant_mode';
const LOCALE_CHANGE_EVENT = 'alphablast_locale_changed';

/**
 * Comprehensive US <-> UK Word Equivalence Mapping
 * Covers spellings with -or/-our, -er/-re, -ize/-ise, -yze/-yse, -se/-ce, double consonants, etc.
 */
export const US_TO_UK_WORDS: Record<string, string> = {
  // -or vs -our
  COLOR: 'COLOUR',
  COLORS: 'COLOURS',
  COLORED: 'COLOURED',
  COLORFUL: 'COLOURFUL',
  COLORING: 'COLOURING',
  WATERCOLOR: 'WATERCOLOUR',
  WATERCOLORS: 'WATERCOLOURS',
  FAVOR: 'FAVOUR',
  FAVORS: 'FAVOURS',
  FAVORITE: 'FAVOURITE',
  FAVORITES: 'FAVOURITES',
  FAVORABLE: 'FAVOURABLE',
  FAVORED: 'FAVOURED',
  FLAVOR: 'FLAVOUR',
  FLAVORS: 'FLAVOURS',
  FLAVORED: 'FLAVOURED',
  FLAVORING: 'FLAVOURING',
  FLAVORFUL: 'FLAVOURFUL',
  HONOR: 'HONOUR',
  HONORS: 'HONOURS',
  HONORED: 'HONOURED',
  HONORABLE: 'HONOURABLE',
  ARMOR: 'ARMOUR',
  ARMORS: 'ARMOURS',
  ARMORED: 'ARMOURED',
  HUMOR: 'HUMOUR',
  HUMORS: 'HUMOURS',
  HUMOROUS: 'HUMOUROUS',
  RUMOR: 'RUMOUR',
  RUMORS: 'RUMOURS',
  HARBOR: 'HARBOUR',
  HARBORS: 'HARBOURS',
  NEIGHBOR: 'NEIGHBOUR',
  NEIGHBORS: 'NEIGHBOURS',
  NEIGHBORHOOD: 'NEIGHBOURHOOD',
  GLAMOR: 'GLAMOUR',
  ODOR: 'ODOUR',
  ODORS: 'ODOURS',
  VIGOR: 'VIGOUR',
  VALOR: 'VALOUR',
  SPLENDOR: 'SPLENDOUR',
  BEHAVIOR: 'BEHAVIOUR',
  BEHAVIORS: 'BEHAVIOURS',
  LABOR: 'LABOUR',
  LABORS: 'LABOURS',
  LABORED: 'LABOURED',
  SAVIOR: 'SAVIOUR',
  SAVIORS: 'SAVIOURS',
  FERVOR: 'FERVOUR',
  CANDOR: 'CANDOUR',
  CLAMOR: 'CLAMOUR',
  ARBOR: 'ARBOUR',
  PARLOR: 'PARLOUR',
  TUMOR: 'TUMOUR',
  TUMORS: 'TUMOURS',

  // -er vs -re
  CENTER: 'CENTRE',
  CENTERS: 'CENTRES',
  CENTERED: 'CENTRED',
  EPICENTER: 'EPICENTRE',
  EPICENTERS: 'EPICENTRES',
  THEATER: 'THEATRE',
  THEATERS: 'THEATRES',
  METER: 'METRE',
  METERS: 'METRES',
  THERMOMETER: 'THERMOMETRE',
  THERMOMETERS: 'THERMOMETRES',
  DIAMETER: 'DIAMETRE',
  DIAMETERS: 'DIAMETRES',
  PERIMETER: 'PERIMETRE',
  PERIMETERS: 'PERIMETRES',
  KILOMETER: 'KILOMETRE',
  KILOMETERS: 'KILOMETRES',
  MILLIMETER: 'MILLIMETRE',
  MILLIMETERS: 'MILLIMETRES',
  CENTIMETER: 'CENTIMETRE',
  CENTIMETERS: 'CENTIMETRES',
  BAROMETER: 'BAROMETRE',
  SPEEDOMETER: 'SPEEDOMETRE',
  FIBER: 'FIBRE',
  FIBERS: 'FIBRES',
  CALIBER: 'CALIBRE',
  LUSTER: 'LUSTRE',
  SOMBER: 'SOMBRE',
  MEAGER: 'MEAGRE',
  SABER: 'SABRE',
  SPECTER: 'SPECTRE',
  SPECTERS: 'SPECTRES',
  LITRE: 'LITER', // reverse handle
  LITER: 'LITRE',
  LITERS: 'LITRES',

  // -ize vs -ise
  ORGANIZE: 'ORGANISE',
  ORGANIZES: 'ORGANISES',
  ORGANIZED: 'ORGANISED',
  ORGANIZING: 'ORGANISING',
  ORGANIZATION: 'ORGANISATION',
  ORGANIZATIONS: 'ORGANISATIONS',
  RECOGNIZE: 'RECOGNISE',
  RECOGNIZES: 'RECOGNISES',
  RECOGNIZED: 'RECOGNISED',
  RECOGNIZING: 'RECOGNISING',
  REALIZE: 'REALISE',
  REALIZES: 'REALISES',
  REALIZED: 'REALISED',
  REALIZING: 'REALISING',
  APOLOGIZE: 'APOLOGISE',
  CRITICIZE: 'CRITICISE',
  MEMORIZE: 'MEMORISE',
  PRIORITIZE: 'PRIORITISE',
  EMPHASIZE: 'EMPHASISE',
  MAXIMIZE: 'MAXIMISE',
  MINIMIZE: 'MINIMISE',
  OPTIMIZE: 'OPTIMISE',
  UTILIZE: 'UTILISE',

  // -yze vs -yse
  ANALYZE: 'ANALYSE',
  ANALYZES: 'ANALYSES',
  ANALYZED: 'ANALYSED',
  ANALYZING: 'ANALYSING',
  PARALYZE: 'PARALYSE',

  // -se vs -ce
  DEFENSE: 'DEFENCE',
  DEFENSES: 'DEFENCES',
  OFFENSE: 'OFFENCE',
  OFFENSES: 'OFFENCES',
  LICENSE: 'LICENCE', // noun form in UK
  PRETENSE: 'PRETENCE',

  // Double L
  TRAVELING: 'TRAVELLING',
  TRAVELER: 'TRAVELLER',
  TRAVELERS: 'TRAVELLERS',
  CANCELED: 'CANCELLED',
  CANCELING: 'CANCELLING',
  MODELING: 'MODELLING',
  JEWELRY: 'JEWELLERY',
  FUELED: 'FUELLED',
  LABELING: 'LABELLING',

  // Vocabulary & specific spelling variations
  TIRE: 'TYRE',
  TIRES: 'TYRES',
  DONUT: 'DOUGHNUT',
  DONUTS: 'DOUGHNUTS',
  ALUMINUM: 'ALUMINIUM',
  SULFUR: 'SULPHUR',
  MOLD: 'MOULD',
  MOLDS: 'MOULDS',
  MOLDY: 'MOULDY',
  MUSTACHE: 'MOUSTACHE',
  PAJAMA: 'PYJAMA',
  PAJAMAS: 'PYJAMAS',
  PLOW: 'PLOUGH',
  PLOWS: 'PLOUGHS',
  COZY: 'COSY',
  PROGRAM: 'PROGRAMME',
  PROGRAMS: 'PROGRAMMES',
  CHECK: 'CHEQUE', // financial
  CHECKS: 'CHEQUES',
  GRAY: 'GREY',
  GRAYS: 'GREYS',
  MATH: 'MATHS',
  MOM: 'MUM',
  MOMS: 'MUMS',
  MOMMY: 'MUMMY',
};

// Build the inverted UK -> US dictionary
export const UK_TO_US_WORDS: Record<string, string> = {};
for (const [us, uk] of Object.entries(US_TO_UK_WORDS)) {
  UK_TO_US_WORDS[uk] = us;
}

/**
 * Detects whether the player's device/browser location defaults to UK English
 * Based on time zone, languages list, and primary locale
 */
export function detectDeviceEnglishVariant(): EnglishVariant {
  if (typeof window === 'undefined') return 'us';

  try {
    // 1. Check navigator language and languages array
    const navLangs: string[] = [];
    if (navigator.language) navLangs.push(navigator.language);
    if (Array.isArray(navigator.languages)) navLangs.push(...navigator.languages);

    for (const lang of navLangs) {
      const lower = lang.toLowerCase();
      // British / Commonwealth English codes
      if (
        lower === 'en-gb' ||
        lower === 'en-uk' ||
        lower === 'en-au' ||
        lower === 'en-nz' ||
        lower === 'en-za' ||
        lower === 'en-ie' ||
        lower === 'en-ca'
      ) {
        return 'uk';
      }
      if (lower === 'en-us' || lower === 'en-ph') {
        return 'us';
      }
    }

    // 2. Check Timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzLower = timeZone.toLowerCase();

    // United Kingdom, Ireland
    if (
      tzLower.includes('london') ||
      tzLower.includes('belfast') ||
      tzLower.includes('dublin') ||
      tzLower.includes('jersey') ||
      tzLower.includes('guernsey') ||
      tzLower.includes('isle_of_man') ||
      tzLower.startsWith('europe/london')
    ) {
      return 'uk';
    }

    // Australia & New Zealand (Commonwealth English)
    if (
      tzLower.startsWith('australia/') ||
      tzLower.includes('sydney') ||
      tzLower.includes('melbourne') ||
      tzLower.includes('brisbane') ||
      tzLower.includes('perth') ||
      tzLower.includes('adelaide') ||
      tzLower.includes('auckland') ||
      tzLower.startsWith('pacific/auckland')
    ) {
      return 'uk';
    }

    // South Africa (Commonwealth English)
    if (tzLower.includes('johannesburg') || tzLower.startsWith('africa/johannesburg')) {
      return 'uk';
    }
  } catch (err) {
    console.debug('Error detecting locale/timezone:', err);
  }

  // Default to US English for Americas, Philippines, international defaults
  return 'us';
}

/**
 * Gets the user's configured English setting ('auto' | 'us' | 'uk')
 */
export function getEnglishSettingMode(): EnglishSettingMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const saved = localStorage.getItem(ENGLISH_SETTING_KEY);
    if (saved === 'us' || saved === 'uk' || saved === 'auto') {
      return saved;
    }
  } catch {}
  return 'auto';
}

/**
 * Sets the user's English setting preference and fires a change event
 */
export function setEnglishSettingMode(mode: EnglishSettingMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENGLISH_SETTING_KEY, mode);
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { mode } }));
  } catch (err) {
    console.warn('Failed to save English setting preference:', err);
  }
}

/**
 * Gets the current effective active English variant ('us' | 'uk')
 */
export function getActiveEnglishVariant(): EnglishVariant {
  const mode = getEnglishSettingMode();
  if (mode === 'us') return 'us';
  if (mode === 'uk') return 'uk';
  return detectDeviceEnglishVariant();
}

/**
 * Localizes a single word to the player's active English variant
 */
export function localizeWord(word: string, targetVariant?: EnglishVariant): string {
  if (!word) return '';
  const variant = targetVariant || getActiveEnglishVariant();
  const upper = word.toUpperCase().trim();

  if (variant === 'uk') {
    return US_TO_UK_WORDS[upper] || upper;
  } else {
    return UK_TO_US_WORDS[upper] || upper;
  }
}

/**
 * Localizes a list of clue/category words for display in the UI and clues
 */
export function localizeWordList(words: string[], targetVariant?: EnglishVariant): string[] {
  if (!words || words.length === 0) return [];
  const variant = targetVariant || getActiveEnglishVariant();
  return words.map((w) => localizeWord(w, variant));
}

/**
 * Returns all recognized spelling variants (both US & UK) for a given word
 */
export function getAllWordVariants(word: string): string[] {
  if (!word) return [];
  const upper = word.toUpperCase().trim();
  const variants = new Set<string>([upper]);

  const ukForm = US_TO_UK_WORDS[upper];
  if (ukForm) variants.add(ukForm);

  const usForm = UK_TO_US_WORDS[upper];
  if (usForm) variants.add(usForm);

  return Array.from(variants);
}
