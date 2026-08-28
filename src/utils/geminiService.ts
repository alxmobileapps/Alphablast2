export interface AiCategoryResponse {
  name: string;
  icon: string;
  targetCount: number;
  description: string;
  words: string[];
}

export interface AiWordValidationResponse {
  isValidWord: boolean;
  isCategoryMatch: boolean;
  definition: string;
  reason?: string;
}

export interface AiWordTriviaResponse {
  definition: string;
  funFact: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Smart client-side fallbacks if static CDN returns HTML or server is unreachable
const LOCAL_FALLBACKS: Record<string, { icon: string; name: string; words: string[] }> = {
  beast: {
    icon: '🐉',
    name: 'Mythical Beasts',
    words: ['DRAGON', 'PHOENIX', 'GRIFFIN', 'KRAKEN', 'HYDRA', 'SPHINX', 'GOLEM', 'PEGASUS', 'CHIMERA', 'BASILISK', 'MINOTAUR', 'CYCLOPS', 'GHOUL', 'SIREN', 'YETI', 'WEREWOLF', 'VAMPIRE', 'CERBERUS', 'VALKYRIE', 'GOBLIN', 'PIXIE', 'SPRITE', 'BANSHEE', 'CENTAUR'],
  },
  space: {
    icon: '🚀',
    name: 'Deep Space',
    words: ['GALAXY', 'NEBULA', 'PLANET', 'ROCKET', 'COMET', 'ASTEROID', 'METEOR', 'ORBIT', 'STAR', 'COSMOS', 'PULSAR', 'QUASAR', 'ECLIPSE', 'SOLAR', 'LUNAR', 'ASTRONAUT', 'GRAVITY', 'APOLLO', 'VOYAGER', 'HUBBLE'],
  },
  ocean: {
    icon: '🌊',
    name: 'Ocean Depths',
    words: ['DOLPHIN', 'WHALE', 'SHARK', 'CORAL', 'OCTOPUS', 'JELLYFISH', 'LOBSTER', 'MANTA', 'SEAHORSE', 'STARFISH', 'TURTLE', 'ANEMONE', 'PLANKTON', 'REEF', 'TRENCH', 'ABYSS', 'CURRENT', 'WAVE', 'TIDE', 'SEASHELL'],
  },
  coffee: {
    icon: '☕',
    name: 'Coffee & Cafe',
    words: ['ESPRESSO', 'LATTE', 'MOCHA', 'BREW', 'ROAST', 'BARISTA', 'CAFE', 'BEANS', 'AROMA', 'CREMA', 'CAPPUCCINO', 'MACCHIATO', 'FRAPPE', 'POUROVER', 'FILTER', 'MUG', 'STEAM', 'DRIP', 'GRIND', 'SIP'],
  },
};

function getLocalFallbackCategory(prompt: string, targetCount: number = 8): AiCategoryResponse {
  const p = prompt.toLowerCase();
  const key = Object.keys(LOCAL_FALLBACKS).find((k) => p.includes(k));
  if (key) {
    const fb = LOCAL_FALLBACKS[key];
    return {
      name: fb.name,
      icon: fb.icon,
      targetCount: Math.max(5, Math.min(12, targetCount)),
      description: `Explore themed words for ${fb.name}!`,
      words: fb.words,
    };
  }

  const name = prompt
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .substring(0, 24) || 'Custom Theme';

  const defaultPool = [
    'BLAST', 'SPARK', 'FLASH', 'CRYSTAL', 'SHINE', 'POWER', 'ENERGY', 'CHAMP',
    'MASTER', 'QUEST', 'LEGEND', 'PUZZLE', 'VICTORY', 'GOLDEN', 'SILVER', 'ROYAL',
    'KNIGHT', 'MAGIC', 'WONDER', 'BRAVE', 'DREAM', 'FLIGHT', 'STRIKE', 'SHIELD'
  ];

  return {
    name,
    icon: '✨',
    targetCount: Math.max(5, Math.min(12, targetCount)),
    description: `Special custom puzzle category for ${name}`,
    words: defaultPool,
  };
}

async function safeFetchJson(endpoint: string, options: RequestInit): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Invalid response from API (${res.status}): ${text.substring(0, 100)}`);
  }

  return await res.json();
}

/**
 * Check if the Gemini backend is reachable and configured
 */
export async function checkAiHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const res = await safeFetchJson('/api/health', { method: 'GET' });
    return res;
  } catch (err) {
    return { status: 'offline-fallback', hasGeminiKey: false };
  }
}

/**
 * Generate a complete custom category with verified words using Gemini AI
 */
export async function generateAiCategory(
  prompt: string,
  targetCount: number = 8
): Promise<AiCategoryResponse> {
  try {
    const data = await safeFetchJson('/api/gemini/generate-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, targetCount }),
    });
    return data;
  } catch (err) {
    console.warn('[GeminiService] Remote API unreachable or returned static fallback, using local smart generator:', err);
    return getLocalFallbackCategory(prompt, targetCount);
  }
}

/**
 * Validate a candidate word against English vocabulary and category relevance using Gemini AI
 */
export async function validateWordWithAi(
  word: string,
  categoryName?: string
): Promise<AiWordValidationResponse> {
  try {
    const data = await safeFetchJson('/api/gemini/validate-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, categoryName }),
    });
    return data;
  } catch (err) {
    return {
      isValidWord: word.length >= 3,
      isCategoryMatch: true,
      definition: `${word} is a valid puzzle word!`,
    };
  }
}

/**
 * Fetch a 1-sentence definition and interesting fun fact for a formed word
 */
export async function fetchWordTrivia(
  word: string,
  categoryName?: string
): Promise<AiWordTriviaResponse> {
  try {
    const data = await safeFetchJson('/api/gemini/word-trivia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, categoryName }),
    });
    return data;
  } catch (err) {
    return {
      definition: `A classic English word consisting of ${word.length} letters.`,
      funFact: `Finding words like "${word}" earns combo multipliers in AlphaBlast!`,
    };
  }
}

/**
 * Suggest words for a category using Gemini AI
 */
export async function suggestWordsWithAi(
  categoryName: string,
  existingWords: string[] = [],
  count: number = 50
): Promise<string[]> {
  try {
    const data = await safeFetchJson('/api/gemini/suggest-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryName, existingWords, count }),
    });
    return data.suggestions || [];
  } catch (err) {
    return [];
  }
}
