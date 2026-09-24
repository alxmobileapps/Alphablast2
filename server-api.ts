import express from 'express';
import type { GoogleGenAI } from '@google/genai';
import {
  matchSmartTheme,
  buildThemeWordList,
  filterAndSortShortestFirst,
} from './src/data/themeDictionaries.js';

function generateFallbackTheme(prompt: string, targetCount: number = 8) {
  const matched = matchSmartTheme(prompt);

  if (matched) {
    return {
      name: matched.name,
      icon: matched.icon,
      targetCount: Math.max(5, Math.min(12, targetCount)),
      description: `Explore themed words for ${matched.name}!`,
      words: buildThemeWordList(prompt, [], 50),
    };
  }

  // Generic procedural synthesis from prompt keywords -- shuffled per-theme
  const capitalized = prompt
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .substring(0, 24);

  return {
    name: capitalized || 'Custom Theme',
    icon: '✨',
    targetCount: Math.max(5, Math.min(12, targetCount)),
    description: `Special custom puzzle category for ${capitalized}`,
    words: buildThemeWordList(prompt, [], 50),
  };
}

/**
 * Builds the Express app that serves every /api/* route (health check, AI
 * category generation, word validation, trivia, word suggestions).
 *
 * WHY THIS IS ITS OWN FILE: this used to live directly inside server.ts's
 * startServer() function, which also handles local dev (Vite middleware)
 * and the local-preview production server (static file serving + app.listen).
 * That's fine for `bun run dev` / `node dist/server.cjs`, but it does NOT
 * work on Vercel, which is how the app is actually deployed at alphablast.site.
 *
 * Vercel does not run server.ts's app.listen() at all -- it has its own
 * serverless-function model where any file under api/ that default-exports
 * a (req, res) handler becomes its own callable endpoint. Before this fix,
 * there was no such file, so EVERY /api/* request on alphablast.site (from
 * the website itself, and from the Android app, which is configured to load
 * its whole UI live from alphablast.site) fell through Vercel's catch-all
 * rewrite straight to index.html -- the app always got an HTML page back
 * instead of a JSON answer, silently failed, and fell back to the offline
 * word lists.
 *
 * By extracting the API logic into this reusable createApiApp() function,
 * BOTH server.ts (local dev / local preview server) and api/index.ts
 * (the Vercel catch-all function, see that file) can mount the exact same
 * routes without duplicating them.
 */
export function createApiApp() {
  const app = express();

  // CORS middleware for external frontend deployments (Firebase Hosting / Vercel / Capacitor)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());

  // Lazy Gemini Client Initialization.
  //
  // IMPORTANT: '@google/genai' is imported with a dynamic import() INSIDE
  // this function, not as a top-level `import` at the top of the file. On
  // Vercel, the very first deploy of this /api/* function crashed on every
  // request (500 FUNCTION_INVOCATION_FAILED) -- including /api/health,
  // which doesn't touch Gemini at all -- with no error details surfaced in
  // the dashboard's Runtime Logs (a Hobby-plan visibility limit). The
  // prime suspect is '@google/genai' (a heavy Google Cloud client library
  // with several sub-dependencies) not bundling/loading cleanly inside
  // Vercel's Node function bundler, which would take the ENTIRE module
  // down at import time -- before any of this file's own try/catch blocks
  // ever get a chance to run.
  //
  // Deferring the import to only happen when a request actually needs
  // Gemini (and only once, cached in aiClient) means: (a) /api/health and
  // every fallback path work regardless of whether that package loads
  // cleanly in this environment, and (b) if it still fails, it fails
  // inside the try/catch each route already has around its AI attempt,
  // which cleanly falls back to the offline word banks instead of
  // crashing the whole function.
  let aiClient: GoogleGenAI | null = null;
  async function getGenAI(): Promise<GoogleGenAI> {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      const { GoogleGenAI: GoogleGenAICtor } = await import('@google/genai');
      aiClient = new GoogleGenAICtor({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Multi-model resilience pool to handle high-demand spikes (503 / 429) automatically
  // Prioritizing gemini-3.1-flash-lite and gemini-flash-latest for high-throughput / low-concurrency spikes
  const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'];

  async function generateWithResilience(
    ai: GoogleGenAI,
    params: {
      contents: string;
      config?: any;
    }
  ) {
    let lastError: any = null;
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        // Quietly failover to next model in pool without cluttering warnings
      }
    }
    throw lastError || new Error('All candidate models in resilience pool failed');
  }

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // 2. AI Category & Word List Generator with resilient fallback
  app.post('/api/gemini/generate-category', async (req, res) => {
    const { prompt, targetCount = 8 } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A theme prompt is required.' });
    }

    const minWords = 50;

    // Try Gemini API first
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = await getGenAI();
        const response = await generateWithResilience(ai, {
          contents: `Create a custom word puzzle category based on the player's theme: "${prompt}".
Generate at least 50 distinct, genuine English words (3 to 8 uppercase letters each, no spaces, no punctuation, real standard spelling).
Do NOT generate fake synthetic plurals or abbreviations.
Include a catchy Category Name (up to 25 chars), an appropriate single Emoji icon, and a short 1-sentence description.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING', description: 'Category title, max 25 chars' },
                icon: { type: 'STRING', description: 'Single emoji icon for the category' },
                targetCount: { type: 'INTEGER', description: 'Target word count to clear, between 6 and 12' },
                description: { type: 'STRING', description: 'Brief exciting 1-sentence description of the theme' },
                words: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  minItems: minWords,
                  description: `List of at least 50 valid uppercase English words (3-8 letters) strictly related to the theme`,
                },
              },
              required: ['name', 'icon', 'targetCount', 'words', 'description'],
            },
          },
        });

        const text = response.text?.trim();
        if (text) {
          const data = JSON.parse(text);
          const rawWords = (data.words || [])
            .map((w: string) => w.toUpperCase().replace(/[^A-Z]/g, ''));
          const cleanedWords = filterAndSortShortestFirst(rawWords);

          if (cleanedWords.length >= 8) {
            return res.json({
              name: (data.name || prompt).substring(0, 30),
              icon: data.icon || '✨',
              targetCount: Math.max(5, Math.min(15, data.targetCount || targetCount)),
              description: data.description || `Explore words related to ${prompt}`,
              words: cleanedWords,
            });
          }
        }
      } catch (geminiError: any) {
        console.warn('Gemini API resilient pool notice:', geminiError?.message || geminiError);
      }
    }

    // Fallback: Smart Instant Word Bank Generator
    const fallback = generateFallbackTheme(prompt, targetCount);
    res.json(fallback);
  });

  // 3. AI Word Referee / Smart Validation
  app.post('/api/gemini/validate-word', async (req, res) => {
    try {
      const { word, categoryName } = req.body;
      if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: 'Word is required.' });
      }

      const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '');
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = await getGenAI();
          const response = await generateWithResilience(ai, {
            contents: `Evaluate candidate word "${cleanWord}" in English context (and category "${categoryName || 'General'}"). Is it a valid real word?`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  isValidWord: { type: 'BOOLEAN' },
                  isCategoryMatch: { type: 'BOOLEAN' },
                  definition: { type: 'STRING' },
                  reason: { type: 'STRING' },
                },
                required: ['isValidWord', 'isCategoryMatch', 'definition'],
              },
            },
          });

          const text = response.text?.trim();
          if (text) {
            return res.json(JSON.parse(text));
          }
        } catch (e) {
          console.warn('AI word referee fallback active:', e);
        }
      }

      // Offline referee fallback
      res.json({
        isValidWord: cleanWord.length >= 3,
        isCategoryMatch: true,
        definition: `A valid English word formed during gameplay.`,
        reason: 'Accepted vocabulary term',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Validation failed.' });
    }
  });

  // 4. AI Word Trivia & Fun Fact
  app.post('/api/gemini/word-trivia', async (req, res) => {
    try {
      const { word, categoryName } = req.body;
      if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: 'Word is required.' });
      }

      const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '');
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = await getGenAI();
          const response = await generateWithResilience(ai, {
            contents: `Provide 1-sentence definition and 1 interesting fun fact about "${cleanWord}"${
              categoryName ? ` in "${categoryName}"` : ''
            }.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  definition: { type: 'STRING' },
                  funFact: { type: 'STRING' },
                },
                required: ['definition', 'funFact'],
              },
            },
          });

          const text = response.text?.trim();
          if (text) {
            return res.json(JSON.parse(text));
          }
        } catch (e) {
          console.warn('Trivia AI fallback active:', e);
        }
      }

      res.json({
        definition: `${cleanWord} is a recognized vocabulary term.`,
        funFact: `Scored in WordBlast with high letter multipliers!`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch trivia.' });
    }
  });

  // 5. AI Word Suggestion
  app.post('/api/gemini/suggest-words', async (req, res) => {
    try {
      const { categoryName = 'General', existingWords = [], count = 50 } = req.body;
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = await getGenAI();
          const response = await generateWithResilience(ai, {
            contents: `Suggest ${count} new, creative, valid English words (3-8 letters each) strictly relevant to category "${categoryName}". Exclude these already existing words: ${existingWords.slice(0, 60).join(', ')}.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  suggestions: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                    minItems: count,
                    description: `Array of at least ${count} uppercase valid English words related to ${categoryName}`,
                  },
                },
                required: ['suggestions'],
              },
            },
          });

          const text = response.text?.trim();
          if (text) {
            const data = JSON.parse(text);
            const rawSuggestions = (data.suggestions || [])
              .map((w: string) => w.toUpperCase().replace(/[^A-Z]/g, ''));
            const cleaned = filterAndSortShortestFirst(rawSuggestions);
            if (cleaned.length > 0) {
              return res.json({ suggestions: cleaned });
            }
          }
        } catch (e) {
          console.warn('Word suggestion fallback active:', e);
        }
      }

      // Procedural suggestions fallback -- theme-matched word bank, topped up
      // with generic words only if the theme doesn't match one of the ~30
      // built-in dictionaries. See buildThemeWordList in themeDictionaries.ts.
      const fallbackSuggestions = buildThemeWordList(categoryName, existingWords, count);
      res.json({ suggestions: fallbackSuggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to suggest words.' });
    }
  });

  return app;
}
