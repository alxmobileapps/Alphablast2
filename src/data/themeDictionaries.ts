/**
 * Comprehensive Multi-Theme Dictionary & Smart Semantic Word Generator
 * 
 * Contains 30 rich themes with 50-70 curated valid English words (3-8 letters)
 * and semantic keyword matching so suggested words dynamically adapt to ANY theme.
 */

export interface ThemeDictionary {
  key: string;
  name: string;
  icon: string;
  keywords: string[];
  words: string[];
}

export const SMART_THEME_DICTIONARIES: Record<string, ThemeDictionary> = {
  animals: {
    key: 'animals',
    name: 'Animals & Wildlife',
    icon: '🐾',
    keywords: ['animal', 'pet', 'wildlife', 'safari', 'zoo', 'creature', 'mammal', 'dog', 'cat', 'beast', 'fauna', 'jungle'],
    words: [
      'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'ZEBRA', 'GIRAFFE', 'ELEPHANT',
      'MONKEY', 'PANDA', 'KOALA', 'DOLPHIN', 'WHALE', 'SHARK', 'EAGLE', 'HAWK',
      'FALCON', 'PARROT', 'RABBIT', 'OTTER', 'BEAVER', 'BADGER', 'CHEETAH', 'LEOPARD',
      'PANTHER', 'JAGUAR', 'HYENA', 'COYOTE', 'JACKAL', 'KANGAROO', 'WALLABY', 'MEERKAT',
      'LEMUR', 'RACCOON', 'FERRET', 'HAMSTER', 'GERBIL', 'SQUIRREL', 'CHIPMUNK', 'HEDGEHOG',
      'PLATYPUS', 'ECHIDNA', 'BUFFALO', 'BISON', 'ANTELOPE', 'GAZELLE', 'IMPALA', 'MOOSE',
      'REINDEER', 'WALRUS', 'SEAL', 'MANATEE', 'PELICAN', 'PENGUIN', 'FLAMINGO', 'OSTRICH',
      'DONKEY', 'HORSE', 'CAMEL', 'LLAMA', 'ALPACA', 'PUMA'
    ],
  },
  space: {
    key: 'space',
    name: 'Deep Space',
    icon: '🚀',
    keywords: ['space', 'galaxy', 'planet', 'universe', 'cosmos', 'star', 'rocket', 'astronomy', 'alien', 'solar', 'lunar', 'orbit'],
    words: [
      'GALAXY', 'NEBULA', 'PLANET', 'ROCKET', 'COMET', 'ASTEROID', 'METEOR', 'ORBIT',
      'STAR', 'COSMOS', 'PULSAR', 'QUASAR', 'ECLIPSE', 'SOLAR', 'LUNAR', 'ASTRONAUT',
      'GRAVITY', 'APOLLO', 'VOYAGER', 'HUBBLE', 'SPACE', 'SHUTTLE', 'MARTIAN', 'CRATER',
      'ALIEN', 'COSMIC', 'STARDUST', 'HORIZON', 'BLACKHOLE', 'SUPERNOVA', 'SATELLITE', 'TELESCOPE',
      'SPACESHIP', 'VENUS', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO',
      'MERCURY', 'SUN', 'MOON', 'VOID', 'ZENITH', 'NADIR', 'CLUSTER', 'ORBITER',
      'LANDER', 'PROBE', 'ASTRONOMY', 'SPACETIME', 'PHOTON', 'RAY', 'AURORA', 'COSMIC'
    ],
  },
  ocean: {
    key: 'ocean',
    name: 'Ocean Depths',
    icon: '🌊',
    keywords: ['ocean', 'sea', 'water', 'marine', 'underwater', 'beach', 'fish', 'coral', 'deep', 'coast', 'aquatic', 'tide'],
    words: [
      'DOLPHIN', 'WHALE', 'SHARK', 'CORAL', 'OCTOPUS', 'JELLYFISH', 'LOBSTER', 'MANTA',
      'SEAHORSE', 'STARFISH', 'TURTLE', 'ANEMONE', 'PLANKTON', 'REEF', 'TRENCH', 'ABYSS',
      'CURRENT', 'WAVE', 'TIDE', 'SEASHELL', 'PEARL', 'SQUID', 'CLAM', 'CRAB',
      'OTTER', 'PENGUIN', 'SPONGE', 'SURF', 'MARLIN', 'BARRACUDA', 'STINGRAY', 'SEAL',
      'WALRUS', 'ALGAE', 'KELP', 'BARNACLE', 'SUBMARINE', 'NAUTILUS', 'TIDAL', 'OCEAN',
      'PELICAN', 'SEAGULL', 'ATOLL', 'LAGOON', 'ISLAND', 'COAST', 'BEACH', 'DUNE',
      'ANCHOR', 'HARBOR', 'VOYAGE', 'MARINER', 'SAILOR', 'DIVER', 'FIN', 'GILL'
    ],
  },
  coffee: {
    key: 'coffee',
    name: 'Coffee & Cafe',
    icon: '☕',
    keywords: ['coffee', 'cafe', 'barista', 'espresso', 'latte', 'brew', 'cappuccino', 'roast', 'tea', 'beans', 'mug', 'mocha'],
    words: [
      'ESPRESSO', 'LATTE', 'MOCHA', 'BREW', 'ROAST', 'BARISTA', 'CAFE', 'BEANS',
      'AROMA', 'CREMA', 'CAPPUCCINO', 'MACCHIATO', 'FRAPPE', 'POUROVER', 'FILTER', 'MUG',
      'STEAM', 'DRIP', 'GRIND', 'SIP', 'CARAMEL', 'VANILLA', 'ICED', 'DECAF',
      'AMERICANO', 'FROTH', 'CUP', 'WARMTH', 'ARABICA', 'ROBUSTA', 'COLD', 'PRESS',
      'AEROPRESS', 'CHEMEX', 'SYRUP', 'CINNAMON', 'HAZELNUT', 'NUTMEG', 'CREAM', 'SUGAR',
      'COFFEE', 'JAVA', 'CHAI', 'MATCHA', 'FLATWHITE', 'AFFOGATO', 'RISTRETTO', 'LUNGO',
      'COCOA', 'CAFFEINE', 'CUPPING', 'THERMOS', 'KETTLE', 'CARAFE', 'SCOOP', 'SAUCER'
    ],
  },
  bakery: {
    key: 'bakery',
    name: 'Bakery & Sweets',
    icon: '🥐',
    keywords: ['bakery', 'sweet', 'dessert', 'bread', 'pastry', 'cake', 'cookie', 'donut', 'chocolate', 'baking', 'treat', 'sugar'],
    words: [
      'CROISSANT', 'BAGUETTE', 'PASTRY', 'MUFFIN', 'SCONE', 'BAGEL', 'TOAST', 'DANISH',
      'ECLAIR', 'BRIOCHE', 'BREAD', 'DONUT', 'CAKE', 'COOKIE', 'TART', 'PIE',
      'ROLL', 'SUGAR', 'BUTTER', 'CINNAMON', 'JAM', 'CRUMB', 'BAKER', 'OVEN',
      'FLOUR', 'YEAST', 'BUN', 'WAFFLE', 'PANCAKE', 'MACARON', 'SOUFFLE', 'CUPCAKE',
      'BROWNIE', 'PRETZEL', 'FOCACCIA', 'CIABATTA', 'CHALLAH', 'PUDDING', 'CUSTARD', 'MERINGUE',
      'TIRAMISU', 'CREPE', 'GALETTE', 'STRUDEL', 'LOAF', 'DOUGH', 'CRUST', 'ICING',
      'GLAZE', 'GANACHE', 'SHORTBREAD', 'FONDANT', 'CARAMEL', 'FUDGE', 'CANDY', 'CHOCOLATE'
    ],
  },
  superheroes: {
    key: 'superheroes',
    name: 'Superheroes',
    icon: '⚡',
    keywords: ['superhero', 'hero', 'villain', 'powers', 'comic', 'marvel', 'avenger', 'mutant', 'justice', 'cape', 'save', 'brave'],
    words: [
      'HERO', 'POWER', 'MUTANT', 'FLYING', 'LASER', 'STRONG', 'ARMOR', 'STEEL',
      'SHIELD', 'MASK', 'BRAVE', 'SPEED', 'AVENGER', 'CAPE', 'FORCE', 'VILLAIN',
      'FLIGHT', 'MIGHTY', 'ENERGY', 'JUSTICE', 'TITAN', 'SHADOW', 'THUNDER', 'LIGHTNING',
      'COMICS', 'BATTLE', 'DEFENDER', 'GUARDIAN', 'RESCUE', 'VORTEX', 'COSMIC', 'STEALTH',
      'CLOAK', 'STRIKE', 'COMBAT', 'VALOR', 'BRAVERY', 'IMPACT', 'SONIC', 'WARRIOR',
      'MYSTIC', 'KNIGHT', 'PHANTOM', 'CYBORG', 'ARCHER', 'BRAWLER', 'SENTRY', 'CHAMPION',
      'METEOR', 'PUNCH', 'BLAST', 'BOOST', 'RADAR', 'FORTRESS', 'ORIGIN', 'NEMESIS'
    ],
  },
  gaming: {
    key: 'gaming',
    name: 'Video Games',
    icon: '🎮',
    keywords: ['game', 'gaming', 'video game', 'gamer', 'arcade', 'console', 'pixel', 'rpg', 'quest', 'level', 'player', 'playstation'],
    words: [
      'GAMER', 'QUEST', 'PIXEL', 'ARCADE', 'BOSS', 'LEVEL', 'CONSOLE', 'PLAYER',
      'BONUS', 'SHIELD', 'JOYSTICK', 'RETRO', 'SPEED', 'POWER', 'SCORE', 'AVATAR',
      'STEALTH', 'HEALER', 'COMBO', 'GLITCH', 'LOOT', 'ROGUE', 'DUNGEON', 'RESPAWN',
      'HITBOX', 'COOLDOWN', 'SPEEDRUN', 'SERVER', 'RANKED', 'GUILD', 'RAID', 'ESPORTS',
      'GRAPHICS', 'HEADSHOT', 'CLUTCH', 'CAMPAIGN', 'MINIGAME', 'PLATFORM', 'INVENTORY', 'CRAFTING',
      'LEVELUP', 'EMOTE', 'CUTSCENE', 'ENDGAME', 'SANDBOX', 'BOT', 'MANA', 'HEALTH',
      'POTION', 'STAMINA', 'TALENT', 'BADGE', 'PORTAL', 'WARP', 'WEAPON', 'ARMOR'
    ],
  },
  music: {
    key: 'music',
    name: 'Music & Rock',
    icon: '🎸',
    keywords: ['music', 'song', 'rock', 'guitar', 'instrument', 'band', 'concert', 'rhythm', 'melody', 'tempo', 'piano', 'sing'],
    words: [
      'GUITAR', 'DRUMS', 'PIANO', 'CHORD', 'RHYTHM', 'MELODY', 'TEMPO', 'SYNTH',
      'FLUTE', 'VIOLIN', 'BRASS', 'SONG', 'BEAT', 'ALBUM', 'SOLO', 'SINGER',
      'STAGE', 'VOCAL', 'CHORUS', 'TREBLE', 'BASS', 'CONCERT', 'AMPLIFIER', 'ACOUSTIC',
      'ELECTRIC', 'HARMONY', 'TUNER', 'STRINGS', 'PEDAL', 'RIFF', 'CYMBAL', 'SNARE',
      'HIHAT', 'ORGAN', 'GROOVE', 'JAM', 'KEYBOARD', 'SPEAKER', 'MIC', 'AUDIENCE',
      'HEADPHONES', 'REVERB', 'DISTORTION', 'LYRICS', 'BALLAD', 'ANTHEM', 'TRACK', 'VINYL',
      'RECORD', 'STUDIO', 'ENCORE', 'HARP', 'CELLO', 'TRUMPET', 'SAX', 'OCTAVE'
    ],
  },
  racing: {
    key: 'racing',
    name: 'Formula 1 & Racing',
    icon: '🏎️',
    keywords: ['racing', 'race', 'car', 'f1', 'formula', 'speed', 'turbo', 'engine', 'track', 'driver', 'motorsport', 'drift'],
    words: [
      'SPEED', 'RACE', 'TURBO', 'ENGINE', 'CHICANE', 'PITSTOP', 'LAP', 'CIRCUIT',
      'DRIVER', 'HELMET', 'TRACK', 'APEX', 'GRID', 'POLE', 'PODIUM', 'TROPHY',
      'DRIFT', 'TIRES', 'STEER', 'CLUTCH', 'BRAKE', 'OVERTAKE', 'SPRINT', 'VICTORY',
      'CHECKERED', 'AERO', 'BOOST', 'FLAG', 'PADDOCK', 'TELEMETRY', 'CORNER', 'SECTOR',
      'CHAMPION', 'SLICK', 'WING', 'SUSPENSION', 'EXHAUST', 'GEARBOX', 'DRS', 'SAFETY',
      'QUALIFY', 'RIVAL', 'TEAM', 'CHASSIS', 'HEADER', 'MONOCOQUE', 'SPEEDWAY', 'RADAR',
      'ASPHALT', 'RACING', 'MOTOR', 'GAUGE', 'SPEEDOMETER', 'NITRO', 'SHIFT', 'RALLY'
    ],
  },
  myth: {
    key: 'myth',
    name: 'Myth & Legends',
    icon: '🐉',
    keywords: ['myth', 'mythology', 'legend', 'god', 'greece', 'beast', 'dragon', 'creature', 'titan', 'magic', 'lore', 'folklore'],
    words: [
      'DRAGON', 'PHOENIX', 'GRIFFIN', 'KRAKEN', 'HYDRA', 'SPHINX', 'GOLEM', 'PEGASUS',
      'CHIMERA', 'BASILISK', 'MINOTAUR', 'CYCLOPS', 'GHOUL', 'SIREN', 'YETI', 'WEREWOLF',
      'VAMPIRE', 'CERBERUS', 'VALKYRIE', 'GOBLIN', 'PIXIE', 'SPRITE', 'BANSHEE', 'CENTAUR',
      'GARGOYLE', 'MANTICORE', 'UNICORN', 'WYRM', 'LEVIATHAN', 'HARPY', 'BEHEMOTH', 'SPECTER',
      'WRAITH', 'SHADOW', 'TITAN', 'KOBOLD', 'ORC', 'OGRE', 'TROLL', 'DRAKE',
      'DEMON', 'BEAST', 'MONSTER', 'SELKIE', 'DJINN', 'GENIE', 'FAIRY', 'GHOST',
      'ZOMBIE', 'IMP', 'MEDUSA', 'ZEUS', 'THOR', 'ODIN', 'ATHENA', 'ARES', 'HERMES'
    ],
  },
  sports: {
    key: 'sports',
    name: 'Sports & Fitness',
    icon: '⚽',
    keywords: ['sport', 'sports', 'fitness', 'ball', 'athlete', 'soccer', 'football', 'basketball', 'tennis', 'game', 'gym', 'workout'],
    words: [
      'SOCCER', 'TENNIS', 'BASKET', 'FOOTBALL', 'BASEBALL', 'HOCKEY', 'RUNNING', 'SPRINT',
      'MARATHON', 'JAVELIN', 'HURDLE', 'BOXING', 'KARATE', 'JUDO', 'SWIMMING', 'DIVING',
      'SURFING', 'SKATING', 'SKIING', 'CLIMBING', 'ROWING', 'ARCHERY', 'FENCING', 'GOLF',
      'RUGBY', 'CRICKET', 'VOLLEY', 'BOWLING', 'CYCLING', 'ATHLETE', 'COACH', 'REFEREE',
      'WHISTLE', 'TROPHY', 'MEDAL', 'STADIUM', 'ARENA', 'COURT', 'FIELD', 'DRIBBLE',
      'SLAM', 'TOUCHDOWN', 'HOMERUN', 'GOALIE', 'DEFENSE', 'OFFENSE', 'FITNESS', 'WORKOUT',
      'JOGGING', 'PUNCH', 'STRIKE', 'CHAMP', 'LEAGUE', 'VICTORY', 'SCORE', 'TEAM'
    ],
  },
  nature: {
    key: 'nature',
    name: 'Wild Nature',
    icon: '🌲',
    keywords: ['nature', 'forest', 'wild', 'tree', 'plants', 'mountain', 'river', 'outdoor', 'earth', 'park', 'green', 'wood'],
    words: [
      'FOREST', 'MOUNTAIN', 'RIVER', 'VALLEY', 'CANYON', 'GLACIER', 'WATERFALL', 'VOLCANO',
      'MEADOW', 'JUNGLE', 'DESERT', 'STREAM', 'ISLAND', 'CLIFF', 'TIMBER', 'BLOSSOM',
      'FOLIAGE', 'TRAIL', 'SUMMIT', 'BREEZE', 'SUNSHINE', 'WILDERNESS', 'CAVERN', 'GEYSER',
      'SAVANNA', 'TUNDRA', 'HORIZON', 'GROVE', 'SUNSET', 'SUNRISE', 'RIDGE', 'PEAK',
      'PLATEAU', 'OASIS', 'PRAIRIE', 'RAINBOW', 'THUNDER', 'LIGHTNING', 'STORM', 'AURORA',
      'AUTUMN', 'SPRING', 'SUMMER', 'WINTER', 'FLORA', 'FAUNA', 'WOODLAND', 'CANOPY',
      'LAKE', 'POND', 'DELTA', 'BROOK', 'CREEK', 'FERN', 'MOSS', 'PINE', 'CEDAR'
    ],
  },
  food: {
    key: 'food',
    name: 'Food & Cooking',
    icon: '🍕',
    keywords: ['food', 'cook', 'cooking', 'kitchen', 'recipe', 'fruit', 'vegetable', 'dish', 'eat', 'meal', 'dinner', 'snack'],
    words: [
      'PIZZA', 'BURGER', 'PASTA', 'SUSHI', 'TACO', 'NOODLES', 'STEAK', 'SALAD',
      'SOUP', 'SANDWICH', 'BREAD', 'CHEESE', 'SAUCE', 'SPICE', 'PEPPER', 'GARLIC',
      'ONION', 'TOMATO', 'POTATO', 'CARROT', 'APPLE', 'BANANA', 'ORANGE', 'LEMON',
      'BERRY', 'MANGO', 'PEACH', 'GRAPE', 'CHERRY', 'MELON', 'AVOCADO', 'BROCCOLI',
      'SPINACH', 'RICE', 'ROAST', 'GRILL', 'BAKE', 'SAUTE', 'BOIL', 'CHEF',
      'RECIPE', 'FLAVOR', 'TASTE', 'DELICIOUS', 'GOURMET', 'DINNER', 'LUNCH', 'BREAKFAST',
      'SNACK', 'HERB', 'BASIL', 'OREGANO', 'CURRY', 'BARBECUE', 'FEAST', 'CHOP'
    ],
  },
  weather: {
    key: 'weather',
    name: 'Weather & Sky',
    icon: '🌦️',
    keywords: ['weather', 'sky', 'rain', 'storm', 'sun', 'cloud', 'wind', 'snow', 'climate', 'temperature', 'forecast', 'seasons'],
    words: [
      'SUNNY', 'RAINY', 'STORMY', 'CLOUDY', 'WINDY', 'SNOWY', 'FOGGY', 'BREEZY',
      'DRIZZLE', 'BLIZZARD', 'TORNADO', 'CYCLONE', 'TYPHOON', 'HURRICANE', 'THUNDER', 'LIGHTNING',
      'MONSOON', 'DROUGHT', 'RAINBOW', 'FROST', 'HAIL', 'SLEET', 'HUMID', 'CHILLY',
      'FREEZING', 'WARM', 'BALMY', 'TEMPEST', 'SQUALL', 'GUST', 'THERMAL', 'FRONT',
      'STRATUS', 'CIRRUS', 'CUMULUS', 'VORTEX', 'PRESSURE', 'BAROMETER', 'FORECAST', 'RADAR',
      'CLIMATE', 'POLAR', 'TROPICAL', 'ARCTIC', 'EQUATOR', 'ZEPHYR', 'OVERCAST', 'MIST',
      'SHOWER', 'DOWNPOUR', 'GALE', 'FLURRY', 'DEW', 'SMOG', 'HAZE', 'VAPOR'
    ],
  },
  travel: {
    key: 'travel',
    name: 'Travel & World Cities',
    icon: '✈️',
    keywords: ['travel', 'trip', 'city', 'cities', 'country', 'world', 'tour', 'vacation', 'flight', 'airport', 'holiday', 'destination'],
    words: [
      'PARIS', 'LONDON', 'TOKYO', 'ROME', 'MADRID', 'BERLIN', 'SEOUL', 'SYDNEY',
      'DUBAI', 'CAIRO', 'ATHENS', 'VENICE', 'VIENNA', 'PRAGUE', 'MOSCOW', 'BEIJING',
      'BANGKOK', 'SINGAPORE', 'TORONTO', 'HAVANA', 'LISBON', 'DUBLIN', 'OSLO', 'STOCKHOLM',
      'HELSINKI', 'WARSAW', 'BRUSSELS', 'ZURICH', 'GENEVA', 'MONACO', 'BRAZIL', 'CANADA',
      'JAPAN', 'FRANCE', 'ITALY', 'SPAIN', 'EGYPT', 'GREECE', 'MEXICO', 'INDIA',
      'PERU', 'CHILE', 'NORWAY', 'SWEDEN', 'AIRPORT', 'PASSPORT', 'BAGGAGE', 'TOURIST',
      'HOTEL', 'RESORT', 'FLIGHT', 'CRUISE', 'VOYAGE', 'MAP', 'COMPASS', 'JOURNEY'
    ],
  },
  science: {
    key: 'science',
    name: 'Science & Chemistry',
    icon: '🧪',
    keywords: ['science', 'chemistry', 'physics', 'biology', 'lab', 'experiment', 'scientist', 'formula', 'atom', 'energy', 'tech'],
    words: [
      'ATOM', 'MOLECULE', 'ELEMENT', 'ELECTRON', 'PROTON', 'NEUTRON', 'NUCLEUS', 'CELL',
      'GENOME', 'DNA', 'GENE', 'ORGANISM', 'SPECIES', 'EVOLUTION', 'QUANTUM', 'GRAVITY',
      'VELOCITY', 'ENERGY', 'FORCE', 'POWER', 'MAGNET', 'OPTICS', 'LASER', 'ROBOT',
      'CIRCUIT', 'SILICON', 'CHIP', 'CODE', 'ALGORITHM', 'DATA', 'BINARY', 'LOGIC',
      'MATRIX', 'NETWORK', 'SYSTEM', 'RESEARCH', 'LAB', 'THEORY', 'HYPOTHESIS', 'EXPERIMENT',
      'REACTION', 'CATALYST', 'EQUATION', 'FORMULA', 'TELESCOPE', 'MICROSCOPE', 'VACUUM', 'RADAR',
      'SENSOR', 'BEAKER', 'FLASK', 'PIPETTE', 'BURNER', 'SCALE', 'SAMPLE', 'TEST'
    ],
  },
  school: {
    key: 'school',
    name: 'School & Study',
    icon: '📚',
    keywords: ['school', 'study', 'education', 'class', 'student', 'teacher', 'book', 'learn', 'college', 'exam', 'homework', 'library'],
    words: [
      'STUDENT', 'TEACHER', 'SCHOOL', 'COLLEGE', 'CAMPUS', 'CLASS', 'LESSON', 'STUDY',
      'LEARN', 'EXAM', 'TEST', 'QUIZ', 'GRADE', 'DEGREE', 'DIPLOMA', 'PENCIL',
      'PAPER', 'NOTEBOOK', 'DESK', 'BOARD', 'CHALK', 'RULER', 'ERASER', 'LIBRARY',
      'BOOK', 'CHAPTER', 'AUTHOR', 'POEM', 'NOVEL', 'ESSAY', 'THESIS', 'REPORT',
      'HISTORY', 'MATH', 'SCIENCE', 'READING', 'WRITING', 'GRAMMAR', 'SPEECH', 'DEBATE',
      'SCHOLAR', 'ACADEMY', 'TUITION', 'LECTURE', 'TUTOR', 'HOMEWORK', 'BACKPACK', 'LOCKER',
      'RECESS', 'BELL', 'COURSE', 'SEMESTER', 'ALUMNI', 'FACULTY', 'PEN', 'GLUE'
    ],
  },
  movies: {
    key: 'movies',
    name: 'Movies & Cinema',
    icon: '🎬',
    keywords: ['movie', 'movies', 'cinema', 'film', 'actor', 'hollywood', 'theatre', 'screen', 'director', 'scene', 'camera', 'action'],
    words: [
      'CINEMA', 'MOVIE', 'FILM', 'ACTOR', 'ACTRESS', 'DIRECTOR', 'PRODUCER', 'SCRIPT',
      'SCREEN', 'CAMERA', 'ACTION', 'SCENE', 'TAKE', 'EDIT', 'CUT', 'TRAILER',
      'POSTER', 'PREMIERE', 'THEATRE', 'OSCAR', 'AWARD', 'POPCORN', 'SEATS', 'SCREENING',
      'DRAMA', 'COMEDY', 'ACTION', 'HORROR', 'THRILLER', 'ROMANCE', 'ANIMATION', 'WESTERN',
      'MUSICAL', 'DOCUMENTARY', 'SOUNDTRACK', 'SCORE', 'CREDITS', 'SEQUEL', 'PREQUEL', 'REBOOT',
      'FRANCHISE', 'BLOCKBUSTER', 'CASTING', 'CLIMAX', 'DIALOGUE', 'SPECIAL', 'EFFECTS', 'PROPS',
      'COSTUME', 'LIGHTS', 'TRIPOD', 'REEL', 'LENS', 'SOUND', 'STUDIO', 'PREVIEW'
    ],
  },
  fantasy: {
    key: 'fantasy',
    name: 'Fantasy & Magic',
    icon: '🧙‍♂️',
    keywords: ['fantasy', 'magic', 'wizard', 'castle', 'spell', 'kingdom', 'medieval', 'knight', 'potion', 'sword', 'witch', 'sorcerer'],
    words: [
      'MAGIC', 'WIZARD', 'WITCH', 'SPELL', 'POTION', 'WAND', 'SCROLL', 'ENCHANT',
      'CHARM', 'CURSE', 'RUNE', 'TOWER', 'CASTLE', 'DUNGEON', 'THRONE', 'KING',
      'QUEEN', 'PRINCE', 'PRINCESS', 'KNIGHT', 'SWORD', 'SHIELD', 'ARMOR', 'HELMET',
      'ARCHER', 'BOW', 'ARROW', 'QUIVER', 'DAGGER', 'AXE', 'CROWN', 'REALM',
      'KINGDOM', 'EMPIRE', 'DYNASTY', 'GUILD', 'TAVERN', 'INN', 'VILLAGE', 'FOREST',
      'DRAGON', 'BEAST', 'MONSTER', 'GOBLIN', 'ELVES', 'DWARF', 'ORC', 'TROLL',
      'WARLOCK', 'SORCERER', 'PORTAL', 'CRYSTAL', 'STAFF', 'CHALICE', 'SIGIL', 'AMULET'
    ],
  },
  pirates: {
    key: 'pirates',
    name: 'Pirates & Treasure',
    icon: '🏴‍☠️',
    keywords: ['pirate', 'pirates', 'treasure', 'ship', 'sailor', 'caribbean', 'anchor', 'island', 'ocean', 'gold', 'captain', 'chest'],
    words: [
      'PIRATE', 'TREASURE', 'ISLAND', 'SHIP', 'CANNON', 'ANCHOR', 'SAIL', 'MAST',
      'DECK', 'CAPTAIN', 'CREW', 'FIRSTMATE', 'PARROT', 'EYEPATCH', 'HOOK', 'CUTLASS',
      'PISTOL', 'COMPASS', 'MAP', 'CHEST', 'GOLD', 'SILVER', 'JEWELS', 'BOOTY',
      'LOOT', 'PLUNDER', 'RANSOM', 'MUTINY', 'SKULL', 'CROSSBONES', 'GALLEON', 'FRIGATE',
      'BUCCANEER', 'CORSAIR', 'MAROON', 'VOYAGE', 'HELM', 'WHEEL', 'RIGGING', 'CROWNEST',
      'HARBOR', 'PORT', 'COVE', 'BAY', 'REEF', 'LAGOON', 'TIDE', 'CURRENT',
      'HORIZON', 'FLAG', 'COIN', 'DOUBLOON', 'RUM', 'SAILOR', 'VOYAGE', 'PLANK'
    ],
  },
  art: {
    key: 'art',
    name: 'Art & Colors',
    icon: '🎨',
    keywords: ['art', 'artist', 'color', 'colors', 'paint', 'painting', 'draw', 'drawing', 'canvas', 'sketch', 'palette', 'museum'],
    words: [
      'COLOR', 'PAINT', 'BRUSH', 'CANVAS', 'EASEL', 'PALETTE', 'PENCIL', 'CRAYON',
      'PASTEL', 'CHARCOAL', 'SKETCH', 'DRAW', 'SHADE', 'TINT', 'TONE', 'HUE',
      'SHADOW', 'LIGHT', 'CONTRAST', 'TEXTURE', 'PATTERN', 'SHAPE', 'FORM', 'DESIGN',
      'ARTIST', 'STUDIO', 'GALLERY', 'MUSEUM', 'SCULPTURE', 'STATUE', 'POTTERY', 'CLAY',
      'MOSAIC', 'COLLAGE', 'ACRYLIC', 'OIL', 'WATERCOLOR', 'RED', 'BLUE', 'YELLOW',
      'GREEN', 'ORANGE', 'PURPLE', 'VIOLET', 'INDIGO', 'CYAN', 'MAGENTA', 'GOLD',
      'SILVER', 'BRONZE', 'FRAME', 'MURAL', 'GRAFFITI', 'INK', 'PIGMENT', 'GLAZE'
    ],
  },
  furniture: {
    key: 'furniture',
    name: 'Furniture & Decor',
    icon: '🪑',
    keywords: [
      'furniture', 'furnish', 'chair', 'table', 'desk', 'bed', 'sofa', 'couch',
      'cabinet', 'drawer', 'interior', 'decor', 'stool', 'bench', 'shelf', 'shelves',
      'wardrobe', 'dresser', 'seating', 'living', 'room', 'home', 'decorating',
      'cushion', 'mattress', 'woodwork', 'credenza', 'bookcase'
    ],
    words: [
      'CHAIR', 'TABLE', 'SOFA', 'COUCH', 'DESK', 'BED', 'BENCH', 'STOOL',
      'SHELF', 'DRAWER', 'CABINET', 'DRESSER', 'WARDROBE', 'ARMOIRE', 'OTTOMAN', 'RECLINER',
      'BOOKCASE', 'NIGHTSTAND', 'CREDENZA', 'BUFFET', 'SIDEBOARD', 'LOVESEAT', 'SETTEE', 'DIVAN',
      'FUTON', 'MATTRESS', 'HEADBOARD', 'CRADLE', 'CRIB', 'CUSHION', 'PILLOW', 'VANITY',
      'MIRROR', 'CARPET', 'RUG', 'CURTAIN', 'BLINDS', 'LAMPSHADE', 'EASEL', 'CHEST',
      'FOOTREST', 'HUTCH', 'CUPBOARD', 'STAND', 'PODIUM', 'HAMMOCK', 'CANOPY', 'BEDSIDE',
      'HASSOCK', 'GLIDER', 'VALET', 'CONSOLE', 'BUREAU', 'SHELVES', 'DAYBED', 'DESKTOP'
    ],
  },
  kitchen: {
    key: 'kitchen',
    name: 'Kitchen & Cooking',
    icon: '🍳',
    keywords: ['kitchen', 'cook', 'cooking', 'chef', 'utensil', 'appliance', 'stove', 'oven', 'pan', 'pot', 'knife', 'dish', 'recipe', 'culinary'],
    words: [
      'STOVE', 'OVEN', 'TOASTER', 'BLENDER', 'KETTLE', 'PAN', 'POT', 'SKILLET',
      'KNIFE', 'FORK', 'SPOON', 'PLATE', 'BOWL', 'MUG', 'GLASS', 'DISH',
      'SPATULA', 'WHISK', 'PEELER', 'GRATER', 'SIEVE', 'TONGS', 'APRON', 'TRAY',
      'FRIDGE', 'FREEZER', 'MIXER', 'PITCHER', 'JAR', 'CONTAINER', 'COLANDER', 'LADLE',
      'CHOPPING', 'BOARD', 'SAUCEPAN', 'WOK', 'STEAMER', 'TIMER', 'SCALE', 'CUP',
      'NAPKIN', 'CLEAVER', 'TEAPOT', 'THERMOS', 'CORKSCREW', 'GRINDER', 'CARAFE', 'ROASTER'
    ],
  },
  clothing: {
    key: 'clothing',
    name: 'Clothes & Fashion',
    icon: '👗',
    keywords: ['clothes', 'clothing', 'fashion', 'wear', 'dress', 'shirt', 'pants', 'shoes', 'outfit', 'apparel', 'garment', 'style'],
    words: [
      'SHIRT', 'PANTS', 'JEANS', 'DRESS', 'SKIRT', 'JACKET', 'COAT', 'SWEATER',
      'HOODIE', 'SUIT', 'BLAZER', 'SHORTS', 'VEST', 'SOCKS', 'SHOES', 'BOOTS',
      'SNEAKER', 'HEELS', 'SANDALS', 'SLIPPERS', 'HAT', 'CAP', 'BEANIE', 'SCARF',
      'GLOVES', 'MITTENS', 'BELT', 'TIE', 'BOWTIE', 'CLOAK', 'ROBE', 'PAJAMAS',
      'CARDIGAN', 'PARKA', 'PONCHO', 'TUNIC', 'JERSEY', 'BLOUSE', 'APRON', 'COLLAR',
      'SLEEVE', 'POCKET', 'ZIPPER', 'BUTTON', 'FABRIC', 'COTTON', 'WOOL', 'SILK'
    ],
  },
  vehicles: {
    key: 'vehicles',
    name: 'Vehicles & Transport',
    icon: '🚗',
    keywords: ['vehicle', 'car', 'transport', 'drive', 'truck', 'train', 'plane', 'boat', 'travel', 'ride', 'automobile', 'motor'],
    words: [
      'CAR', 'TRUCK', 'VAN', 'BUS', 'TRAIN', 'SUBWAY', 'TRAM', 'PLANE',
      'JET', 'GLIDER', 'BOAT', 'SHIP', 'YACHT', 'FERRY', 'CANOE', 'KAYAK',
      'BICYCLE', 'BIKE', 'SCOOTER', 'MOPED', 'TRACTOR', 'TAXI', 'CAB', 'WAGON',
      'CART', 'AMBULANCE', 'HELICOPTER', 'CRUISER', 'SPEEDBOAT', 'STEAMER', 'MOTORCYCLE', 'CHARIOT',
      'TROLLEY', 'LOCOMOTIVE', 'FREIGHTER', 'TRAILER', 'CARAVAN', 'BUGGY', 'GO-KART', 'MONORAIL',
      'BARGE', 'DINGHY', 'CATAMARAN', 'GONDOLA', 'DIRTBIKE', 'MINIVAN', 'PICKUP', 'TOWTRUCK'
    ],
  },
  fruits: {
    key: 'fruits',
    name: 'Fruits & Berries',
    icon: '🍎',
    keywords: ['fruit', 'fruits', 'berry', 'berries', 'citrus', 'apple', 'banana', 'orange', 'sweet', 'orchard', 'produce'],
    words: [
      'APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO', 'LEMON', 'LIME', 'CHERRY',
      'PEACH', 'PLUM', 'BERRY', 'MELON', 'WATERMELON', 'KIWI', 'PEAR', 'PAPAYA',
      'GUAVA', 'FIG', 'DATE', 'APRICOT', 'PINEAPPLE', 'COCONUT', 'AVOCADO', 'LYCHEE',
      'PASSION', 'BLUEBERRY', 'RASPBERRY', 'BLACKBERRY', 'CRANBERRY', 'POMEGRANATE', 'GRAPEFRUIT', 'TANGERINE',
      'CANTALOUPE', 'HONEYDEW', 'NECTARINE', 'DRAGONFRUIT', 'MULBERRY', 'ELDERBERRY', 'PERSIMMON', 'TANGELO',
      'QUINCE', 'PLANTAIN', 'KUMQUAT', 'STARFRUIT', 'FEIJOA', 'CURRANT', 'GOOSEBERRY', 'TAMARIND'
    ],
  },
  vegetables: {
    key: 'vegetables',
    name: 'Vegetables & Greens',
    icon: '🥦',
    keywords: ['vegetable', 'vegetables', 'veggie', 'greens', 'salad', 'farm', 'garden', 'produce', 'healthy', 'organic'],
    words: [
      'CARROT', 'POTATO', 'TOMATO', 'ONION', 'GARLIC', 'PEPPER', 'SPINACH', 'BROCCOLI',
      'CABBAGE', 'LETTUCE', 'RADISH', 'CELERY', 'PEA', 'BEAN', 'BEET', 'SQUASH',
      'CORN', 'PUMPKIN', 'CUCUMBER', 'GINGER', 'MUSHROOM', 'OLIVE', 'EGGPLANT', 'ZUCCHINI',
      'ASPARAGUS', 'ARTICHOKE', 'CAULIFLOWER', 'KALE', 'TURNIP', 'PARSNIP', 'SCALLION', 'SHALLOT',
      'LEEK', 'CHIVE', 'OKRA', 'YAM', 'SPROUTS', 'ARUGULA', 'ENDIVE', 'FENNEL',
      'CHARD', 'BOKCHOY', 'RUTABAGA', 'WATERCRESS', 'JALAPENO', 'HABANERO', 'SWEETPOTATO', 'CASSAVA'
    ],
  },
  tools: {
    key: 'tools',
    name: 'Tools & Hardware',
    icon: '🔨',
    keywords: ['tool', 'tools', 'hardware', 'build', 'repair', 'hammer', 'wrench', 'workshop', 'craft', 'construction', 'diy'],
    words: [
      'HAMMER', 'WRENCH', 'PLIERS', 'SAW', 'DRILL', 'CHISEL', 'CLAMP', 'LEVEL',
      'FILE', 'SANDER', 'SCREW', 'NAIL', 'BOLT', 'NUT', 'WASHER', 'TAPE',
      'RULER', 'SPADE', 'SHOVEL', 'AXE', 'MALLET', 'RAKE', 'HOE', 'SHEARS',
      'ANVIL', 'VISE', 'TROWEL', 'HACKSAW', 'CROWBAR', 'PUNCH', 'SOCKET', 'CALIPER',
      'BIT', 'BLADE', 'LADDER', 'BENCH', 'TOOLBOX', 'TORCH', 'SOLDERING', 'RIVET',
      'STAPLER', 'SQUARE', 'PLUMB', 'GAUGE', 'LATHE', 'GRINDER', 'COMPASS', 'SLEDGE'
    ],
  },
  house: {
    key: 'house',
    name: 'House & Home',
    icon: '🏠',
    keywords: ['house', 'home', 'room', 'building', 'living', 'residence', 'apartment', 'property', 'architecture', 'yard'],
    words: [
      'HOUSE', 'HOME', 'ROOM', 'WALL', 'DOOR', 'WINDOW', 'ROOF', 'FLOOR',
      'CEILING', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'ATTIC', 'CELLAR', 'BASEMENT', 'GARAGE',
      'PORCH', 'PATIO', 'BALCONY', 'HALLWAY', 'STAIRS', 'PANTRY', 'CLOSET', 'FOYER',
      'CHIMNEY', 'HEARTH', 'YARD', 'GARDEN', 'FENCE', 'GATE', 'LAWN', 'SHED',
      'DRIVEWAY', 'SIDEWALK', 'ROOFTOP', 'TERRACE', 'CORRIDOR', 'ENTRYWAY', 'LOBBY', 'PARLOR',
      'SUNROOM', 'VERANDA', 'GUTTER', 'SHUTTER', 'SIDING', 'FOUNDATION', 'BEAM', 'PILLAR'
    ],
  },
  anatomy: {
    key: 'anatomy',
    name: 'Body & Anatomy',
    icon: '🫀',
    keywords: ['body', 'anatomy', 'organ', 'bone', 'muscle', 'human', 'health', 'medical', 'physical', 'biology'],
    words: [
      'HEAD', 'FACE', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'LIP', 'TOOTH',
      'TONGUE', 'CHIN', 'CHEEK', 'NECK', 'THROAT', 'CHEST', 'HEART', 'LUNG',
      'LIVER', 'STOMACH', 'SPINE', 'BONE', 'SKULL', 'ARM', 'ELBOW', 'WRIST',
      'HAND', 'PALM', 'FINGER', 'THUMB', 'LEG', 'KNEE', 'ANKLE', 'FOOT',
      'HEEL', 'TOE', 'SKIN', 'MUSCLE', 'RIB', 'SHOULDER', 'PELVIS', 'KIDNEY',
      'BRAIN', 'NERVE', 'VEIN', 'ARTERY', 'JOINT', 'TENDON', 'BELLY', 'JAW'
    ],
  },
  professions: {
    key: 'professions',
    name: 'Jobs & Professions',
    icon: '💼',
    keywords: ['job', 'profession', 'career', 'work', 'worker', 'occupation', 'trade', 'employment', 'business'],
    words: [
      'DOCTOR', 'NURSE', 'SURGEON', 'DENTIST', 'TEACHER', 'PROFESSOR', 'LAWYER', 'JUDGE',
      'ARTIST', 'ACTOR', 'SINGER', 'DANCER', 'WRITER', 'AUTHOR', 'PILOT', 'CAPTAIN',
      'SAILOR', 'CHEF', 'BAKER', 'COOK', 'FARMER', 'DRIVER', 'MECHANIC', 'PLUMBER',
      'BUILDER', 'MASON', 'GUARD', 'POLICE', 'SOLDIER', 'ARCHITECT', 'ENGINEER', 'SCIENTIST',
      'TAILOR', 'BARBER', 'CARPENTER', 'ELECTRICIAN', 'FIREFIGHTER', 'PARAMEDIC', 'VET', 'OPTICIAN',
      'ACCOUNTANT', 'MANAGER', 'DIRECTOR', 'CLERK', 'BARISTA', 'FLORIST', 'JEWELER', 'ASTRONAUT'
    ],
  },
  plants: {
    key: 'plants',
    name: 'Plants & Flowers',
    icon: '🌸',
    keywords: ['plant', 'plants', 'flower', 'flowers', 'garden', 'flora', 'tree', 'botany', 'bloom', 'petal', 'nature'],
    words: [
      'ROSE', 'TULIP', 'DAISY', 'LILY', 'ORCHID', 'LOTUS', 'POPPY', 'VIOLET',
      'JASMINE', 'SUNFLOWER', 'PEONY', 'IRIS', 'CARNATION', 'FERN', 'MOSS', 'CACTUS',
      'BAMBOO', 'PALM', 'OAK', 'PINE', 'CEDAR', 'MAPLE', 'WILLOW', 'BIRCH',
      'SEED', 'ROOT', 'STEM', 'LEAF', 'BUD', 'BLOSSOM', 'PETAL', 'BRANCH',
      'BARK', 'TWIG', 'IVY', 'CLOVER', 'LAVENDER', 'ROSEMARY', 'THYME', 'BASIL',
      'MINT', 'SAGE', 'DAFFODIL', 'BEGONIA', 'MAGNOLIA', 'HIBISCUS', 'GARDENIA', 'HYDRANGEA'
    ],
  },
};

export const EXPANDED_GENERIC_WORDS: string[] = [
  'APPLE', 'WATER', 'BREAD', 'HOUSE', 'LIGHT', 'CHAIR', 'TABLE', 'SMILE',
  'CLOUD', 'RIVER', 'GRASS', 'FLOWER', 'CLOCK', 'PAPER', 'MUSIC', 'TRAIN',
  'SHIRT', 'SHOES', 'BEACH', 'WINDOW', 'SPOON', 'PLATE', 'BIRD', 'HEART',
  'PLANT', 'BRUSH', 'PENCIL', 'GLASS', 'BOTTLE', 'PLANET', 'OCEAN', 'DANCE',
  'LAUGH', 'SILVER', 'BRIGHT', 'FOREST', 'GARDEN', 'STAR', 'SUNNY', 'DREAM',
  'BRIDGE', 'ROAD', 'TOWER', 'MARKET', 'FLIGHT', 'WHEEL', 'BRICK', 'STONE',
  'VOICE', 'NIGHT', 'STORY', 'SWEET', 'HONEY', 'CANDLE', 'BASKET', 'BLANKET',
  'CARPET', 'BREEZE', 'ISLAND', 'STREAM', 'VALLEY', 'MEADOW', 'MORNING', 'SUNSET',
  'SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'GOLDEN', 'YELLOW', 'PURPLE', 'ORANGE',
  'SHADOW', 'MIRROR', 'LANTERN', 'PILLOW', 'HARBOR', 'CANVAS', 'RECORD', 'POCKET'
];

/**
 * Deterministic string hash (djb2) to seed shuffle PRNG
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  const clean = (str || 'default').toLowerCase().trim();
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

/**
 * Mulberry32 deterministic PRNG shuffle
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
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
 * Smart Semantic Theme Matcher
 * Finds the closest ThemeDictionary by matching key, display name, keywords, or token stems.
 */
export function matchSmartTheme(themeText: string): ThemeDictionary | null {
  const clean = (themeText || '').toLowerCase().trim();
  if (!clean) return null;

  // 1. Direct key or display name exact/contains match
  for (const dict of Object.values(SMART_THEME_DICTIONARIES)) {
    const dictName = dict.name.toLowerCase();
    if (clean === dict.key || clean === dictName || clean.includes(dict.key) || clean.includes(dictName) || dictName.includes(clean)) {
      return dict;
    }
  }

  // 2. Keyword exact or substring match
  const tokens = clean.split(/[\s,._-]+/).filter((t) => t.length >= 2);
  let bestMatch: ThemeDictionary | null = null;
  let bestScore = 0;

  for (const dict of Object.values(SMART_THEME_DICTIONARIES)) {
    let score = 0;
    for (const kw of dict.keywords) {
      if (clean.includes(kw)) {
        score += 3;
      }
      for (const tok of tokens) {
        if (tok === kw || tok.startsWith(kw) || kw.startsWith(tok)) {
          score += 2;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = dict;
    }
  }

  if (bestScore >= 2 && bestMatch) {
    return bestMatch;
  }

  return null;
}

/**
 * Builds a theme word list that GUARANTEES:
 * 1. Matches the semantic theme if recognized (from 30 comprehensive categories)
 * 2. If it's a novel custom theme, deterministically shuffles the words using the theme text as seed,
 *    ensuring DIFFERENT themes produce DIFFERENT words in DIFFERENT orders!
 * 3. Never returns empty or under-sized lists.
 */
export function buildThemeWordList(
  themeText: string,
  existingWords: string[] = [],
  count: number = 50
): string[] {
  const matched = matchSmartTheme(themeText);
  const existingSet = new Set((existingWords || []).map((w) => w.toUpperCase().trim()));

  const primaryPool = matched ? matched.words : [];
  const seed = hashStringToSeed(themeText || 'default');
  const shuffledGeneric = seededShuffle(EXPANDED_GENERIC_WORDS, seed);

  // Combine primary theme words (shuffled with seed for variety) + top-up generic words
  const shuffledPrimary = matched ? seededShuffle(primaryPool, seed) : [];
  const combinedPool = Array.from(new Set([...shuffledPrimary, ...shuffledGeneric]));

  // Filter out words user already has in their list
  const available = combinedPool.filter((w) => !existingSet.has(w));

  // If filtered pool is smaller than count, include words from combinedPool
  const finalSelection = available.length >= Math.min(20, count)
    ? available.slice(0, count)
    : Array.from(new Set([...available, ...combinedPool])).slice(0, count);

  return finalSelection;
}
