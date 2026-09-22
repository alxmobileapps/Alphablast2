import React, { useState, useEffect, useRef } from 'react';
import { Menu, Plus, Home } from 'lucide-react';
import { Category } from '../types';
import { formatPoints } from '../utils/scoring';
import { SpellingPreference } from '../utils/settings';

interface HeaderProps {
  category: Category;
  categoryProgress: number;
  movesRemaining: number;
  movesGainedBonus?: number;
  score?: number;
  coins?: number;
  diamonds?: number;
  spellingPreference?: SpellingPreference;
  onOpenCategories: () => void;
  onOpenHome?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenShop?: () => void;
}

const getCategoryNameFontSize = (name: string) => {
  const len = name.length;
  if (len > 24) return 'text-xs sm:text-sm tracking-tight';
  if (len > 18) return 'text-sm sm:text-base tracking-tight';
  if (len > 13) return 'text-base sm:text-lg tracking-normal';
  if (len > 9) return 'text-base sm:text-xl tracking-wide';
  return 'text-lg sm:text-2xl tracking-wide';
};

const HeaderImpl: React.FC<HeaderProps> = ({
  category,
  categoryProgress,
  movesRemaining,
  movesGainedBonus,
  score = 0,
  coins = 0,
  diamonds = 0,
  spellingPreference,
  onOpenCategories,
  onOpenHome,
  onOpenShop,
}) => {
  const categoryFontSize = getCategoryNameFontSize(category.name);
  const prevScoreRef = useRef<number>(score);
  const [scoreGain, setScoreGain] = useState<{ id: number; diff: number } | null>(null);
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      const diff = score - prevScoreRef.current;
      setScoreGain({ id: Date.now(), diff });
      setIsGlowing(true);
      const timer = setTimeout(() => {
        setIsGlowing(false);
      }, 750);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = score;
  }, [score]);

  return (
    <header className="w-full bg-[#071330] border-b-2 border-[#1E3A8A] text-white px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] select-none box-border">
      <div className="max-w-4xl mx-auto flex flex-col gap-1.5 sm:gap-2">
        {/* ROW 1: Category Name & Round Tag */}
        <div
          id="main-category-top-banner"
          onClick={onOpenCategories}
          className="w-full min-h-[44px] xs:min-h-[48px] sm:min-h-[54px] bg-[#0C2158] hover:bg-[#102A6B] border-2 border-[#1E3A8A] rounded-xl sm:rounded-2xl px-3 sm:px-4.5 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3 shadow-[0_3px_12px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.1)] cursor-pointer transition-all overflow-hidden"
          title="Tap to view category details or switch categories"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            <span className="text-xl xs:text-2xl sm:text-3xl drop-shadow-md shrink-0">{category.icon}</span>
            <div className="flex flex-col text-left min-w-0 flex-1 overflow-hidden">
              <span
                className={`text-[8px] sm:text-[10px] font-extrabold uppercase tracking-widest leading-none truncate ${
                  category.isCustom ? 'text-purple-300' : 'text-blue-300/90'
                }`}
              >
                {category.isCustom ? 'COMMUNITY 1-HR SPOTLIGHT' : 'CURRENT CATEGORY'}
              </span>
              <span
                className={`font-black text-white uppercase truncate leading-tight mt-0.5 sm:mt-1 ${categoryFontSize}`}
              >
                {category.name}
              </span>
            </div>
          </div>

          <div
            className={`border-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-sm ${
              category.isCustom
                ? 'bg-purple-900/70 border-purple-400/60 text-purple-200'
                : 'bg-[#081844] border-[#1E3A8A] text-blue-200'
            }`}
          >
            <span className={`${category.isCustom ? 'text-purple-300' : 'text-blue-300/80'} font-bold text-[8.5px] sm:text-[10.5px] uppercase`}>
              {category.isCustom ? 'LIVE' : 'Round'}
            </span>
            <span className="text-amber-300 font-mono font-black text-[11px] sm:text-sm">
              {category.isCustom ? '1-HR' : `#${category.id}`}
            </span>
            <span className="text-[8px] sm:text-[10px] text-blue-300/70">▼</span>
          </div>
        </div>

        {/* ROW 2: Balanced 3-Column Navigation, Prominent Points, & Currencies */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
          {/* Left: Home & Menu Navigation */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {onOpenHome && (
              <button
                id="header-home-btn"
                onClick={onOpenHome}
                className="h-8 w-8 xs:h-8.5 xs:w-8.5 sm:h-9.5 sm:w-9.5 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                title="Return to Main Game Menu"
              >
                <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300" />
              </button>
            )}

            <button
              id="main-menu-btn"
              onClick={onOpenCategories}
              className="h-8 w-8 xs:h-8.5 xs:w-8.5 sm:h-9.5 sm:w-9.5 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              title="Menu & Categories"
            >
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-200" />
            </button>
          </div>

          {/* Center: Prominent Animated POINTS Card */}
          <div
            id="points-score-card"
            className={`relative flex-1 max-w-[200px] sm:max-w-[240px] bg-gradient-to-b from-[#0F286E] to-[#091B4C] border-2 ${
              isGlowing ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-[#244CB2] shadow-md'
            } rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1 flex items-center justify-between gap-1.5 text-left transition-all duration-300`}
          >
            {/* Small US/UK spelling-preference badge pinned to the points
                card's corner -- lets the player see at a glance which
                word spelling the game is currently validating against
                (Settings > Spelling controls this). */}
            {spellingPreference && (
              <div
                className="absolute -top-1.5 -right-1.5 bg-[#050D24] border border-[#244CB2] rounded-full px-1.5 py-0.5 text-[7.5px] sm:text-[8.5px] font-black text-blue-200 shadow-md flex items-center gap-0.5 z-10"
                title={`Word spelling set to ${spellingPreference} -- change in Settings`}
              >
                <span>{spellingPreference === 'UK' ? '🇬🇧' : '🇺🇸'}</span>
                <span>{spellingPreference}</span>
              </div>
            )}

            {/* Floating +Points animation positioned directly below points section */}
            {scoreGain && (
              <div
                key={scoreGain.id}
                className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black text-[9px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-lg border border-white animate-score-gain whitespace-nowrap z-30"
              >
                +{scoreGain.diff}
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-wider text-amber-300/90 leading-tight">
                POINTS
              </span>
              <span
                className={`font-mono font-black text-sm xs:text-base sm:text-lg text-white tracking-tight leading-tight transition-transform ${
                  isGlowing ? 'scale-110 text-amber-300 animate-score-glow' : ''
                }`}
              >
                {formatPoints(score)}
              </span>
            </div>

            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner font-black text-xs sm:text-sm">
              ★
            </div>
          </div>

          {/* Right: Clean Currency Section */}
          {onOpenShop && (
            <button
              id="shop-store-btn"
              onClick={onOpenShop}
              className="h-8 xs:h-8.5 sm:h-9.5 bg-gradient-to-r from-[#0C2158] to-[#122A6B] hover:from-[#132E75] hover:to-[#193A8E] border border-[#244CB2] rounded-xl sm:rounded-2xl px-1.5 sm:px-2.5 flex items-center gap-1 sm:gap-2 shadow-md transition-all active:scale-95 shrink-0"
              title="Shop & Bank: Power-ups, Coins, and Diamonds"
            >
              <div className="flex items-center gap-0.5 font-mono text-[10px] xs:text-[11px] sm:text-xs font-black text-amber-300">
                <span className="text-xs sm:text-sm">🪙</span>
                <span>{coins}</span>
              </div>
              <div className="h-3 sm:h-3.5 w-px bg-blue-400/40" />
              <div className="flex items-center gap-0.5 font-mono text-[10px] xs:text-[11px] sm:text-xs font-black text-cyan-300">
                <span className="text-xs sm:text-sm">💎</span>
                <span>{diamonds}</span>
              </div>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[8px] sm:text-[9px] font-black shadow-xs ml-0.5">
                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * Same reasoning as GameBoard's memo (see that file): Header doesn't need
 * the once-a-second timer-mode tick either, but was still re-rendering
 * every second along with everything else in App.tsx. Custom comparator
 * because onOpenCategories/onOpenHome/onOpenShop are passed as inline
 * arrow functions in App.tsx (new reference every render) — a plain
 * React.memo would never actually skip a render because of that. Safe to
 * ignore their identity here: none of them close over any game state,
 * they just call a plain setState (open a modal / switch screens).
 */
function headerPropsAreEqual(prev: HeaderProps, next: HeaderProps): boolean {
  return (
    prev.category === next.category &&
    prev.categoryProgress === next.categoryProgress &&
    prev.movesRemaining === next.movesRemaining &&
    prev.movesGainedBonus === next.movesGainedBonus &&
    prev.score === next.score &&
    prev.coins === next.coins &&
    prev.diamonds === next.diamonds &&
    prev.spellingPreference === next.spellingPreference
  );
}

export const Header = React.memo(HeaderImpl, headerPropsAreEqual);
