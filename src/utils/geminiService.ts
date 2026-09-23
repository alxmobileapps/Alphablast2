import {
  SMART_THEME_DICTIONARIES,
  matchSmartTheme,
  buildThemeWordList,
} from '../data/themeDictionaries';

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

function getLocalFallbackCategory(prompt: string, targetCount: number = 8): AiCategoryResponse {
  const matched = matchSmartTheme(prompt);
  if (matched) {
    return {
      name: matched.name,
      icon: matched.icon,
      targetCount: Math.max(5, Math.min(12, targetCount)),
      description: `Explore curated puzzle words for ${matched.name}!`,
      words: buildThemeWordList(prompt, [], 50),
    };
  }

  const name = prompt
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .substring(0, 24) || 'Custom Theme';

  return {
    name,
    icon: '✨',
    targetCount: Math.max(5, Math.min(12, targetCount)),
    description: `Special custom puzzle category for ${name}`,
    words: buildThemeWordList(prompt, [], 50),
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
    if (data.suggestions && data.suggestions.length > 0) {
      return data.suggestions;
    }
  } catch (err) {
    console.warn('[GeminiService] Suggest words API error, using smart fallback pool:', err);
  }

  // Guaranteed smart semantic fallback with 30 themes & seeded procedural variation
  return buildThemeWordList(categoryName, existingWords, count);
}
