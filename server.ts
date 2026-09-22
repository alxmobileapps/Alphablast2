import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Built-in curated theme dictionaries with 50+ words for instant resilient generation if AI is offline or rate-limited
const SMART_THEME_FALLBACKS: Record<string, { icon: string; name: string; words: string[] }> = {
  beast: {
    icon: '🐉',
    name: 'Mythical Beasts',
    words: [
      'DRAGON', 'PHOENIX', 'GRIFFIN', 'KRAKEN', 'HYDRA', 'SPHINX', 'GOLEM', 'PEGASUS',
      'CHIMERA', 'BASILISK', 'MINOTAUR', 'CYCLOPS', 'GHOUL', 'SIREN', 'YETI', 'WEREWOLF',
      'VAMPIRE', 'CERBERUS', 'VALKYRIE', 'GOBLIN', 'PIXIE', 'SPRITE', 'BANSHEE', 'CENTAUR',
      'GARGOYLE', 'MANTICORE', 'UNICORN', 'WYRM', 'LEVIATHAN', 'HARPY', 'BEHEMOTH', 'SPECTER',
      'WRAITH', 'SHADOW', 'TITAN', 'KOBOLD', 'ORC', 'OGRE', 'TROLL', 'DRAKE',
      'DEMON', 'BEAST', 'MONSTER', 'CHIMERA', 'SELKIE', 'DJINN', 'GENIE', 'FAIRY',
      'GHOST', 'ZOMBIE', 'IMP', 'SALAMANDER'
    ],
  },
  myth: {
    icon: '⚡',
    name: 'Myth & Legends',
    words: [
      'ZEUS', 'THOR', 'ODIN', 'ATHENA', 'ARES', 'HERMES', 'APOLLO', 'ANUBIS',
      'OSIRIS', 'RA', 'LOKI', 'FREYA', 'HADES', 'POSEIDON', 'TITAN', 'HERO',
      'LEGEND', 'ORACLE', 'TEMPLE', 'MYTH', 'SPARTAN', 'OLYMPUS', 'ASGARD', 'VALHALLA',
      'SHIELD', 'SPEAR', 'EXCALIBUR', 'AVALON', 'HECTOR', 'ACHILLES', 'HERCULES', 'PERSEUS',
      'MEDUSA', 'MIDAS', 'ICARUS', 'DAEDALUS', 'ATLAS', 'CRONUS', 'CHIRON', 'NARCISSUS',
      'PEGASUS', 'EROS', 'PSYCHE', 'HESTIA', 'DEMETER', 'DIONYSUS', 'HELIOS', 'SELENE',
      'HORUS', 'SET', 'THOTH', 'BASTET'
    ],
  },
  coffee: {
    icon: '☕',
    name: 'Coffee & Cafe',
    words: [
      'ESPRESSO', 'LATTE', 'MOCHA', 'BREW', 'ROAST', 'BARISTA', 'CAFE', 'BEANS',
      'AROMA', 'CREMA', 'CAPPUCCINO', 'MACCHIATO', 'FRAPPE', 'POUROVER', 'FILTER', 'MUG',
      'STEAM', 'DRIP', 'GRIND', 'SIP', 'CARAMEL', 'VANILLA', 'ICED', 'DECAF',
      'AMERICANO', 'FROTH', 'CUP', 'WARMTH', 'ARABICA', 'ROBUSTA', 'COLD', 'PRESS',
      'AEROPRESS', 'CHEMEX', 'SYRUP', 'CINNAMON', 'HAZELNUT', 'NUTMEG', 'CREAM', 'SUGAR',
      'COFFEE', 'JAVA', 'CHAI', 'MATCHA', 'FLATWHITE', 'AFFOGATO', 'RISTRETTO', 'LUNGO',
      'COCOA', 'CAFFEINE', 'CUPPING', 'THERMOS'
    ],
  },
  cafe: {
    icon: '🥐',
    name: 'Bakery & Cafe',
    words: [
      'CROISSANT', 'BAGUETTE', 'PASTRY', 'MUFFIN', 'SCONE', 'BAGEL', 'TOAST', 'DANISH',
      'ECLAIR', 'BRIOCHE', 'BREAD', 'DONUT', 'CAKE', 'COOKIE', 'TART', 'PIE',
      'ROLL', 'SUGAR', 'BUTTER', 'CINNAMON', 'JAM', 'CRUMB', 'BAKER', 'OVEN',
      'FLOUR', 'YEAST', 'BUN', 'WAFFLE', 'PANCAKE', 'MACARON', 'SOUFFLE', 'CUPCAKE',
      'BROWNIE', 'SCONE', 'PRETZEL', 'FOCACCIA', 'CIABATTA', 'CHALLAH', 'PUDDING', 'CUSTARD',
      'MERINGUE', 'TIRAMISU', 'CANNOLE', 'CREPE', 'GALETTE', 'STRUDEL', 'LOAF', 'DOUGH',
      'CRUST', 'ICING', 'GLAZE', 'GANACHE'
    ],
  },
  racing: {
    icon: '🏎️',
    name: 'Formula 1 Racing',
    words: [
      'SPEED', 'RACE', 'TURBO', 'ENGINE', 'CHICANE', 'PITSTOP', 'LAP', 'CIRCUIT',
      'DRIVER', 'HELMET', 'TRACK', 'APEX', 'GRID', 'POLE', 'PODIUM', 'TROPHY',
      'DRIFT', 'TIRES', 'STEER', 'CLUTCH', 'BRAKE', 'OVERTAKE', 'SPRINT', 'VICTORY',
      'CHECKERED', 'AERO', 'BOOST', 'FLAG', 'PADDOCK', 'TELEMETRY', 'CORNER', 'SECTOR',
      'CHAMPION', 'SLICK', 'WING', 'SUSPENSION', 'EXHAUST', 'GEARBOX', 'DRS', 'SAFETY',
      'QUALIFY', 'RIVAL', 'TEAM', 'CHASSIS', 'HEADER', 'MONOCOQUE', 'SPEEDWAY', 'RADAR',
      'ASPHALT', 'RACING', 'MOTOR', 'GAUGE'
    ],
  },
  music: {
    icon: '🎸',
    name: 'Rock Music',
    words: [
      'GUITAR', 'DRUMS', 'BASS', 'VOCALS', 'AMPLIFIER', 'STAGE', 'CONCERT', 'SOLO',
      'RIFF', 'TEMPO', 'RHYTHM', 'CHORD', 'ALBUM', 'VINYL', 'PEDAL', 'BAND',
      'CHORUS', 'TREBLE', 'SOUND', 'TRACK', 'BEAT', 'HARMONY', 'VOLUME', 'CYMBAL',
      'STRINGS', 'PICK', 'STUDIO', 'ENCORE', 'ACOUSTIC', 'ELECTRIC', 'FUZZ', 'OVERDRIVE',
      'MELODY', 'BRIDGE', 'VERSES', 'OCTAVE', 'TUNER', 'SNARE', 'HIHAT', 'ORGAN',
      'SYNTH', 'GROOVE', 'JAM', 'ROCKER', 'SINGER', 'KEYBOARD', 'SPEAKER', 'MIC',
      'AUDIENCE', 'HEADPHONES', 'REVERB', 'DISTORTION'
    ],
  },
  space: {
    icon: '🚀',
    name: 'Deep Space',
    words: [
      'GALAXY', 'NEBULA', 'PLANET', 'ROCKET', 'COMET', 'ASTEROID', 'METEOR', 'ORBIT',
      'STAR', 'COSMOS', 'PULSAR', 'QUASAR', 'ECLIPSE', 'SOLAR', 'LUNAR', 'ASTRONAUT',
      'GRAVITY', 'APOLLO', 'VOYAGER', 'HUBBLE', 'SPACE', 'SHUTTLE', 'MARTIAN', 'CRATER',
      'ALIEN', 'COSMIC', 'STARDUST', 'HORIZON', 'BLACKHOLE', 'SUPERNOVA', 'SATELLITE', 'TELESCOPE',
      'SPACESHIP', 'VENUS', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO',
      'MERCURY', 'SUN', 'MOON', 'VOID', 'ZENITH', 'NADIR', 'CLUSTER', 'ORBITER',
      'LANDER', 'PROBE', 'ASTRONOMY', 'SPACETIME'
    ],
  },
  ocean: {
    icon: '🌊',
    name: 'Ocean Depths',
    words: [
      'DOLPHIN', 'WHALE', 'SHARK', 'CORAL', 'OCTOPUS', 'JELLYFISH', 'LOBSTER', 'MANTA',
      'SEAHORSE', 'STARFISH', 'TURTLE', 'ANEMONE', 'PLANKTON', 'REEF', 'TRENCH', 'ABYSS',
      'CURRENT', 'WAVE', 'TIDE', 'SEASHELL', 'PEARL', 'SQUID', 'CLAM', 'CRAB',
      'OTTER', 'PENGUIN', 'SPONGE', 'SURF', 'MARLIN', 'BARRACUDA', 'STINGRAY', 'SEAL',
      'WALRUS', 'ALGAE', 'KELP', 'BARNACLE', 'SUBMARINE', 'NAUTILUS', 'TIDAL', 'OCEAN',
      'PELICAN', 'SEAGULL', 'ATOLL', 'LAGOON', 'ISLAND', 'COAST', 'BEACH', 'DUNE',
      'ANCHOR', 'HARBOR', 'VOYAGE', 'MARINER'
    ],
  },
  dessert: {
    icon: '🧁',
    name: 'Sweet Treats',
    words: [
      'CUPCAKE', 'CHOCOLATE', 'BROWNIE', 'CARAMEL', 'SUNDAE', 'PUDDING', 'GELATO', 'TRUFFLE',
      'FUDGE', 'CANDY', 'WAFFLE', 'PANCAKE', 'CREPE', 'MOUSSE', 'PARFAIT', 'SORBET',
      'MACARON', 'FROSTING', 'SPRINKLES', 'SYRUP', 'HONEY', 'TOFFEE', 'TARTLET', 'PASTRY',
      'COOKIE', 'VANILLA', 'CREAM', 'CHERRY', 'DONUT', 'MARSHMALLOW', 'NOUGAT', 'PRALINE',
      'BONBON', 'LOLLIPOP', 'JELLY', 'CUSTARD', 'ECLAIR', 'PIE', 'TART', 'CHEESECAKE',
      'TIRAMISU', 'SHORTBREAD', 'CRUMBLE', 'COBLER', 'SUGAR', 'ICING', 'SWEET', 'BERRY',
      'BUTTERSCOTCH', 'FONDANT', 'GANACHE', 'TREAT'
    ],
  },
  nature: {
    icon: '🌲',
    name: 'Wild Nature',
    words: [
      'FOREST', 'MOUNTAIN', 'RIVER', 'VALLEY', 'CANYON', 'GLACIER', 'WATERFALL', 'VOLCANO',
      'MEADOW', 'JUNGLE', 'DESERT', 'STREAM', 'ISLAND', 'CLIFF', 'TIMBER', 'BLOSSOM',
      'FOLIAGE', 'TRAIL', 'SUMMIT', 'BREEZE', 'SUNSHINE', 'WILDERNESS', 'CAVERN', 'GEYSER',
      'SAVANNA', 'TUNDRA', 'HORIZON', 'GROVE', 'SUNSET', 'SUNRISE', 'RIDGE', 'PEAK',
      'PLATEAU', 'OASIS', 'PRAIRIE', 'RAINBOW', 'THUNDER', 'LIGHTNING', 'STORM', 'AURORA',
      'AUTUMN', 'SPRING', 'SUMMER', 'WINTER', 'FLORA', 'FAUNA', 'WOODLAND', 'CANOPY',
      'LAKE', 'POND', 'DELTA', 'BROOK'
    ],
  },
};

const EXPANDED_GENERIC_WORDS = [
  'BLAST', 'SPARK', 'FLASH', 'CRYSTAL', 'SHINE', 'POWER', 'ENERGY', 'CHAMP',
  'MASTER', 'QUEST', 'LEGEND', 'PUZZLE', 'VICTORY', 'GOLDEN', 'SILVER', 'ROYAL',
  'KNIGHT', 'MAGIC', 'WONDER', 'BRAVE', 'DREAM', 'FLIGHT', 'STRIKE', 'SHIELD',
  'VALOR', 'HEROIC', 'TRIUMPH', 'SPIRIT', 'FORCE', 'RADIANT', 'FOCUS', 'SWIFT',
  'SHADOW', 'FLAME', 'FROST', 'STORM', 'THUNDER', 'SOLAR', 'LUNAR', 'COSMIC',
  'MYSTIC', 'PRIME', 'STEEL', 'BLADE', 'TEMPLE', 'CASTLE', 'GLORY', 'DESTINY',
  'BEACON', 'CROWN', 'THRONE', 'HORIZON',
  // Extra padding words (see buildFallbackWordList below) -- these exist so
  // there's still a large enough pool left to reach the requested count
  // after existing/duplicate words get filtered out, and so the per-theme
  // shuffle has enough material to make different themes look genuinely
  // different instead of just re-ordering the same ~50 words.
  'ARCADE', 'COMBO', 'LEVEL', 'BONUS', 'TROPHY', 'MEDAL', 'RIBBON', 'BANNER',
  'PENNANT', 'ARENA', 'STADIUM', 'CHALLENGE', 'MISSION', 'JOURNEY', 'ADVENTURE', 'EXPLORE',
  'DISCOVER', 'TREASURE', 'VAULT', 'CHEST', 'RELIC', 'ARTIFACT', 'RUNE', 'SIGIL',
  'EMBLEM', 'INSIGNIA', 'MEDALLION', 'AMULET', 'TALISMAN', 'CHARM', 'GEM', 'JEWEL',
  'DIAMOND', 'EMERALD', 'SAPPHIRE', 'RUBY', 'OPAL', 'PEARL', 'IVORY', 'MARBLE'
];

/**
 * Simple deterministic string hash (djb2-ish) used only to seed the shuffle
 * below -- NOT for anything security-sensitive. Same theme text always maps
 * to the same seed, so results are stable per theme, but different theme
 * text maps to a different seed.
 */
function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

/** Deterministic, seedable shuffle (mulberry32 PRNG). Same seed -> same
 * order every time; different seed -> a different order/selection. */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = array.slice();
  let state = seed;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Finds a curated SMART_THEME_FALLBACKS bucket matching free-text theme
 * input. Checks both the short bucket key ("space") and its full display
 * name ("Deep Space") against the player's text, in both directions -- the
 * two previous call sites (this file's generate-category fallback, and the
 * suggest-words fallback below) each only checked ONE of those, so a theme
 * could match under one but not the other depending on which endpoint was
 * called, and most free-typed themes matched neither at all.
 */
function matchSmartTheme(themeText: string): { icon: string; name: string; words: string[] } | null {
  const clean = (themeText || '').toLowerCase().trim();
  if (!clean) return null;
  for (const bucket of Object.values(SMART_THEME_FALLBACKS)) {
    const bucketName = bucket.name.toLowerCase();
    if (clean.includes(bucketName) || bucketName.includes(clean)) {
      return bucket;
    }
  }
  for (const [key, bucket] of Object.entries(SMART_THEME_FALLBACKS)) {
    if (clean.includes(key)) {
      return bucket;
    }
  }
  return null;
}

/**
 * Builds a fallback word list that actually varies with the player's theme
 * text even when it doesn't match one of the curated SMART_THEME_FALLBACKS
 * buckets -- this is the fix for "suggested words don't change when I
 * change the theme": the old code fell back to the exact same static
 * EXPANDED_GENERIC_WORDS list, in the exact same order, for every theme
 * that didn't hit one of the ~10 curated buckets (which is most free-typed
 * themes). Here the generic pool is shuffled with a seed derived from the
 * theme text itself, so different themes reliably produce a different
 * selection and order, then tops up from the rest of the shuffled pool if
 * filtering out words the player already has would otherwise drop the
 * count below what was requested.
 */
function buildFallbackWordList(themeText: string, existingWords: string[], count: number): string[] {
  const matched = matchSmartTheme(themeText);
  const existingSet = new Set((existingWords || []).map((w) => w.toUpperCase()));

  const primaryPool = matched ? matched.words : [];
  const shuffledGeneric = seededShuffle(EXPANDED_GENERIC_WORDS, hashStringToSeed(themeText || 'default'));

  const combinedPool = Array.from(new Set([...primaryPool, ...shuffledGeneric]));
  const available = combinedPool.filter((w) => !existingSet.has(w));
  return available.slice(0, count);
}

function generateFallbackTheme(prompt: string, targetCount: number = 8) {
  const matched = matchSmartTheme(prompt);

  if (matched) {
    return {
      name: matched.name,
      icon: matched.icon,
      targetCount: Math.max(5, Math.min(12, targetCount)),
      description: `Explore themed words for ${matched.name}!`,
      words: matched.words,
    };
  }

  // Generic procedural synthesis from prompt keywords -- shuffled per-theme
  // (see buildFallbackWordList above) instead of a fixed static list.
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
    words: seededShuffle(EXPANDED_GENERIC_WORDS, hashStringToSeed(prompt || 'default')),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Lazy Gemini Client Initialization
  let aiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      aiClient = new GoogleGenAI({
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
        const ai = getGenAI();
        const response = await generateWithResilience(ai, {
          contents: `Create a custom word puzzle category based on the player's theme: "${prompt}".
Generate at least 50 distinct, genuine English words (3 to 8 uppercase letters each, no spaces, no punctuation, real standard spelling).
Do NOT generate fake synthetic plurals or abbreviations.
Include a catchy Category Name (up to 25 chars), an appropriate single Emoji icon, and a short 1-sentence description.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Category title, max 25 chars' },
                icon: { type: Type.STRING, description: 'Single emoji icon for the category' },
                targetCount: { type: Type.INTEGER, description: 'Target word count to clear, between 6 and 12' },
                description: { type: Type.STRING, description: 'Brief exciting 1-sentence description of the theme' },
                words: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
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
          const cleanedWords = Array.from(
            new Set(
              (data.words || [])
                .map((w: string) => w.toUpperCase().replace(/[^A-Z]/g, ''))
                .filter((w: string) => w.length >= 3 && w.length <= 8)
            )
          );

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
          const ai = getGenAI();
          const response = await generateWithResilience(ai, {
            contents: `Evaluate candidate word "${cleanWord}" in English context (and category "${categoryName || 'General'}"). Is it a valid real word?`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isValidWord: { type: Type.BOOLEAN },
                  isCategoryMatch: { type: Type.BOOLEAN },
                  definition: { type: Type.STRING },
                  reason: { type: Type.STRING },
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
          const ai = getGenAI();
          const response = await generateWithResilience(ai, {
            contents: `Provide 1-sentence definition and 1 interesting fun fact about "${cleanWord}"${
              categoryName ? ` in "${categoryName}"` : ''
            }.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  definition: { type: Type.STRING },
                  funFact: { type: Type.STRING },
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
          const ai = getGenAI();
          const response = await generateWithResilience(ai, {
            contents: `Suggest ${count} new, creative, valid English words (3-8 letters each) strictly relevant to category "${categoryName}". Exclude these already existing words: ${existingWords.slice(0, 60).join(', ')}.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
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
            const cleaned = (data.suggestions || [])
              .map((w: string) => w.toUpperCase().replace(/[^A-Z]/g, ''))
              .filter((w: string) => w.length >= 3 && w.length <= 8);
            if (cleaned.length > 0) {
              return res.json({ suggestions: cleaned });
            }
          }
        } catch (e) {
          console.warn('Word suggestion fallback active:', e);
        }
      }

      // Procedural suggestions fallback -- see buildFallbackWordList's doc
      // comment above: this is what fixes suggestions never changing when
      // the theme changes (the old version here matched only against each
      // bucket's display NAME, never its short key, and fell back to the
      // exact same static EXPANDED_GENERIC_WORDS list/order for anything
      // that didn't match).
      const fallbackSuggestions = buildFallbackWordList(categoryName, existingWords, count);
      res.json({ suggestions: fallbackSuggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to suggest words.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
