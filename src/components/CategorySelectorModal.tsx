import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Clock,
  Plus,
  Flame,
  Layers,
  Star,
  Users,
  Search,
  PlayCircle,
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '../data/categories';
import { Category } from '../types';
import { GameProgress, isCategoryUnlocked, isCategoryCompleted, isRoundBlockUnlocked } from '../utils/gameProgress';
import { formatPoints } from '../utils/scoring';
import { isSoundEnabled, toggleSound } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { toPreferredSpelling } from '../data/dictionary';
import { SpellingPreference } from '../utils/settings';
import { canEditCustomCategory } from '../utils/customCategoriesService';

interface CategorySelectorModalProps {
  isOpen: boolean;
  currentCategory: Category;
  gameProgress: GameProgress;
  customCategories?: Category[];
  diamonds?: number;
  spellingPreference?: SpellingPreference;
  onSelectCategory: (category: Category) => void;
  onOpenLeaderboard?: () => void;
  onOpenHelp?: () => void;
  onRestartRound?: () => void;
  onOpenCreateCategory?: () => void;
  onEditCustomCategory?: (category: Category) => void;
  onClose: () => void;
}

function formatRemainingTime(expiresAt?: number, now: number = Date.now()): string {
  if (!expiresAt) return '1h left';
  const diff = Math.max(0, expiresAt - now);
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h left`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s left`;
}

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
  isOpen,
  currentCategory,
  gameProgress,
  customCategories = [],
  diamonds = 0,
  spellingPreference = 'US',
  onSelectCategory,
  onOpenLeaderboard,
  onOpenHelp,
  onRestartRound,
  onOpenCreateCategory,
  onEditCustomCategory,
  onClose,
}) => {
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [sound, setSound] = useState(isSoundEnabled());
  const [now, setNow] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unlocked' | 'completed'>('all');

  // Tick clock every second for live 1-hour expiration countdowns
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    haptics.tap();
    const next = toggleSound();
    setSound(next);
  };

  const handleClose = () => {
    haptics.tap();
    onClose();
  };

  const totalCategories = INITIAL_CATEGORIES.length;
  const completedCount = gameProgress.completedCategoryIds.length;
  const progressPercent = Math.round((completedCount / totalCategories) * 100);

  // Filter out any custom category that has expired
  const activeCustomCategories = customCategories.filter(
    (c) => (c.expiresAt || 0) > now
  );

  const handleCategoryClick = (cat: Category, unlocked: boolean) => {
    haptics.tap();
    if (!unlocked) {
      const prevCat = INITIAL_CATEGORIES.find((c) => c.id === cat.id - 1);
      const prevName = prevCat ? `"${prevCat.name}"` : `Category #${cat.id - 1}`;
      setLockedNotice(`🔒 Category #${cat.id} is locked! Complete ${prevName} first to unlock.`);
      setTimeout(() => {
        setLockedNotice(null);
      }, 3200);
      return;
    }

    onSelectCategory(cat);
    onClose();
  };

  return (
    <div
      id="categories-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      {/* Outer Sky Blue Frame Matching the Board Theme */}
      <div
        id="categories-modal-outer-frame"
        className="w-full max-w-2xl relative p-2 sm:p-2.5 rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_20px_50px_rgba(2,132,199,0.5),inset_0_2px_4px_rgba(255,255,255,0.7)] max-h-[92vh] flex flex-col"
      >
        {/* Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />

        {/* Inner Midnight Navy Container */}
        <div
          id="categories-modal-card"
          className="bg-[#071330] rounded-2xl sm:rounded-[20px] p-4 sm:p-5 border border-[#0F2864] shadow-[inset_0_3px_12px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-white flex-1 max-h-[calc(92vh-20px)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white flex items-center justify-center font-black shadow-md border border-[#7DD3FC]">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)]">
                    Categories
                  </h2>
                </div>
                <p className="text-xs font-semibold text-cyan-200/70">
                  Custom games & standard campaign categories
                </p>
              </div>
            </div>

            <button
              id="categories-modal-close-btn"
              onClick={handleClose}
              className="p-2 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-blue-200 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5 shrink-0">
            {/* Leaderboards */}
            <button
              onClick={() => {
                haptics.tap();
                onClose();
                if (onOpenLeaderboard) onOpenLeaderboard();
              }}
              className="bg-[#0C2158] hover:bg-[#132E75] border border-amber-400/40 rounded-xl p-2 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-amber-300 font-black text-xs cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Leaderboard</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`border rounded-xl p-2 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all font-black text-xs cursor-pointer ${
                sound
                  ? 'bg-[#0C2158] hover:bg-[#132E75] border-emerald-400/40 text-emerald-300'
                  : 'bg-[#0C2158] hover:bg-[#132E75] border-gray-600 text-gray-400'
              }`}
            >
              {sound ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Sound ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <span>Sound OFF</span>
                </>
              )}
            </button>

            {/* How to Play */}
            <button
              onClick={() => {
                haptics.tap();
                onClose();
                if (onOpenHelp) onOpenHelp();
              }}
              className="bg-[#0C2158] hover:bg-[#132E75] border border-cyan-400/40 rounded-xl p-2 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-cyan-300 font-black text-xs cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>How to Play</span>
            </button>

            {/* Restart Round */}
            <button
              onClick={() => {
                haptics.tap();
                onClose();
                if (onRestartRound) onRestartRound();
              }}
              className="bg-[#0C2158] hover:bg-[#132E75] border border-rose-400/40 rounded-xl p-2 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-rose-300 font-black text-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Restart</span>
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-3.5">
            {/* ======================================================== */}
            {/* 1. TOP SECTION: CUSTOM GAME OPTION */}
            {/* ======================================================== */}
            <div
              id="custom-game-section"
              className="bg-gradient-to-br from-[#1E1B4B] via-[#0C2158] to-[#172554] border-2 border-[#818CF8]/60 rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(99,102,241,0.25)] relative overflow-hidden"
            >
              {/* Background ambient badge glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 relative z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#6366F1] flex items-center justify-center text-xl shadow-md border border-white/30 shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                        <span>Custom Games</span>
                        <span className="text-sm">🔥</span>
                      </h3>
                      <span className="bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 font-mono text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeCustomCategories.length} Live
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-indigo-200/80 mt-0.5">
                      Play player-made 1-hour games or publish your own custom category!
                    </p>
                  </div>
                </div>

                {onOpenCreateCategory && (
                  <button
                    id="btn-create-custom-category"
                    onClick={() => {
                      haptics.tap();
                      onClose();
                      onOpenCreateCategory();
                    }}
                    className="bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#3B82F6] hover:from-[#A78BFA] hover:to-[#60A5FA] border-t border-white/80 border-b-2 border-indigo-900 active:translate-y-[1px] text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Create Custom Game (💎 10)</span>
                  </button>
                )}
              </div>

              {/* Active Custom Categories Grid or Empty State */}
              {activeCustomCategories.length === 0 ? (
                <div className="bg-[#071330]/90 border border-indigo-500/30 rounded-xl p-3.5 text-center flex flex-col items-center justify-center gap-1">
                  <div className="text-cyan-200 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>No active custom games right now</span>
                  </div>
                  <p className="text-[11px] text-blue-200/70 font-medium max-w-md">
                    Publish a custom puzzle category for <strong className="text-cyan-300">10 Diamonds</strong> and share your theme worldwide for 1 hour!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCustomCategories.map((cat) => {
                    const isSelected = currentCategory.id === cat.id;
                    const timeLeft = formatRemainingTime(cat.expiresAt, now);
                    const isTimerRush = cat.gameMode === 'timer' || (cat.timerSeconds && cat.timerSeconds > 0);

                    return (
                      <div
                        key={`custom-${cat.id}-${cat.firestoreDocId || ''}`}
                        className={`relative flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-[#1E1B4B] border-[#A855F7] text-white ring-2 ring-[#818CF8]/50 shadow-md'
                            : 'bg-[#071330]/90 hover:bg-[#0C2158] border-[#3730A3] text-white hover:border-[#818CF8]'
                        }`}
                      >
                        <div
                          onClick={() => {
                            haptics.tap();
                            onSelectCategory(cat);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="text-2xl shrink-0">{cat.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs sm:text-sm truncate text-white">
                                {toPreferredSpelling(cat.name, spellingPreference)}
                              </span>
                              {isTimerRush ? (
                                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                                  ⏱ {Math.floor((cat.timerSeconds || 120) / 60)}m Rush
                                </span>
                              ) : (
                                <span className="bg-purple-400/20 text-purple-300 border border-purple-400/40 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                                  🎯 {cat.targetCount} Words
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-indigo-200/80 font-semibold mt-0.5">
                              <span className="truncate">By {cat.creatorName || 'Player'}</span>
                              <span>•</span>
                              <span className="font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {timeLeft}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2 flex items-center gap-1">
                          {/* Only the player who published this category can edit it --
                              canEditCustomCategory checks the stable per-device uid
                              stamped at publish time, not the free-typed creatorName
                              (anyone could type anyone else's name). Every other
                              player simply doesn't see this button at all. */}
                          {onEditCustomCategory && canEditCustomCategory(cat) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                haptics.tap();
                                onClose();
                                onEditCustomCategory(cat);
                              }}
                              className="p-1.5 bg-[#0C2158] hover:bg-[#193B8A] border border-indigo-400/40 text-cyan-300 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Edit custom game settings (Timer duration, words, title)"
                            >
                              ⚙️
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              haptics.tap();
                              onSelectCategory(cat);
                              onClose();
                            }}
                            className="cursor-pointer"
                          >
                            {isSelected ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-purple-200 bg-purple-900/60 px-2 py-1 rounded-lg border border-purple-400">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Playing
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded-lg border border-indigo-400 active:scale-95 transition-transform">
                                <Sparkles className="w-3 h-3 text-amber-300" /> Play
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campaign Categories Header & Search Filter */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-cyan-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>100 Campaign Categories</span>
                </span>
                <span className="text-emerald-400 font-mono text-xs font-bold">
                  {completedCount}/{totalCategories} Cleared ({progressPercent}%)
                </span>
              </div>

              {/* Search Bar & Filter Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-cyan-300/60 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 100 categories (e.g. Birds, Gems, #42)..."
                    className="w-full bg-[#071330] border border-[#1E3A8A] focus:border-[#38BDF8] rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder:text-blue-300/50 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-cyan-500 text-blue-950 shadow-xs'
                        : 'bg-[#071330] text-blue-200 hover:text-white border border-[#1E3A8A]'
                    }`}
                  >
                    All ({totalCategories})
                  </button>
                  <button
                    onClick={() => setFilterType('unlocked')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      filterType === 'unlocked'
                        ? 'bg-emerald-500 text-emerald-950 shadow-xs'
                        : 'bg-[#071330] text-blue-200 hover:text-white border border-[#1E3A8A]'
                    }`}
                  >
                    Unlocked
                  </button>
                  <button
                    onClick={() => setFilterType('completed')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      filterType === 'completed'
                        ? 'bg-amber-500 text-amber-950 shadow-xs'
                        : 'bg-[#071330] text-blue-200 hover:text-white border border-[#1E3A8A]'
                    }`}
                  >
                    Cleared
                  </button>
                </div>
              </div>
            </div>

            {/* Locked Notice Notification */}
            {lockedNotice && (
              <div className="bg-rose-950/80 border-2 border-rose-500 text-rose-200 px-3.5 py-2 rounded-2xl text-xs font-black flex items-center justify-between shadow-md animate-shake">
                <span>{lockedNotice}</span>
                <button
                  onClick={() => setLockedNotice(null)}
                  className="text-rose-400 hover:text-white text-xs ml-2 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Campaign Category List Grid */}
            {(() => {
              const query = searchQuery.trim().toLowerCase();
              const filtered = INITIAL_CATEGORIES.filter((cat) => {
                const unlocked = isCategoryUnlocked(cat.id, gameProgress);
                const completed = isCategoryCompleted(cat.id, gameProgress);

                if (filterType === 'unlocked' && !unlocked) return false;
                if (filterType === 'completed' && !completed) return false;

                if (!query) return true;
                const matchName = cat.name.toLowerCase().includes(query);
                const matchId = String(cat.id).includes(query.replace('#', ''));
                const matchIcon = cat.icon.includes(query);
                return matchName || matchId || matchIcon;
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-[#0C2158]/60 border border-[#1E3A8A] rounded-2xl p-6 text-center text-blue-200/70 text-xs font-semibold">
                    No categories found matching "{searchQuery}". Try another search!
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filtered.map((cat) => {
                    const isSelected = !currentCategory.isCustom && currentCategory.id === cat.id;
                    const unlocked = isCategoryUnlocked(cat.id, gameProgress);
                    const completed = isCategoryCompleted(cat.id, gameProgress);
                    // Sequentially reachable (previous round cleared) but still
                    // gated behind the every-5-rounds rewarded-ad unlock — tapping
                    // it still works (requestOpenCategory in App.tsx shows the ad
                    // prompt), this is just so the list doesn't claim it's fully
                    // open when picking it will interrupt with an ad first.
                    const needsAdUnlock =
                      unlocked && !completed && !gameProgress.hasRemovedAds &&
                      !isRoundBlockUnlocked(cat.id, gameProgress);
                    const highScore = gameProgress.categoryHighScores[cat.id] || 0;
                    const stars = gameProgress.categoryStars?.[cat.id] || (completed ? 3 : 0);

                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat, unlocked)}
                        className={`relative flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          !unlocked
                            ? 'bg-[#071330]/50 border-gray-800 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#0C2158] border-[#38BDF8] text-white shadow-md ring-2 ring-[#0EA5E9]/50'
                            : completed
                            ? 'bg-[#071F42] hover:bg-[#0C2954] border-emerald-500/40 text-white'
                            : 'bg-[#0C2158] hover:bg-[#132E75] border-[#1E3A8A] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <span className={`text-2xl ${!unlocked ? 'grayscale opacity-40' : ''}`}>
                              {cat.icon}
                            </span>
                            {!unlocked && (
                              <div className="absolute -top-1 -right-1 bg-gray-900 text-gray-400 rounded-full p-0.5 shadow-xs border border-gray-700">
                                <Lock className="w-2.5 h-2.5" />
                              </div>
                            )}
                            {needsAdUnlock && (
                              <div className="absolute -top-1 -right-1 bg-amber-900 text-amber-300 rounded-full p-0.5 shadow-xs border border-amber-600">
                                <PlayCircle className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-black text-cyan-300/60">
                                #{cat.id}
                              </span>
                              <span
                                className={`font-black text-xs sm:text-sm truncate ${
                                  !unlocked
                                    ? 'text-gray-400'
                                    : isSelected
                                    ? 'text-cyan-200'
                                    : 'text-white'
                                }`}
                              >
                                {toPreferredSpelling(cat.name, spellingPreference)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-cyan-200/70 font-semibold block">
                                Goal: {cat.targetCount} words
                              </span>
                              {highScore > 0 && (
                                <span className="text-[10px] text-amber-300 font-black bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/40">
                                  Best: {formatPoints(highScore)}
                                </span>
                              )}
                              {(gameProgress.awarded20kMilestones || []).includes(cat.id) ? (
                                <span className="text-[10px] text-cyan-200 font-black bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-400/50 flex items-center gap-0.5 shadow-xs">
                                  <span>💎</span> 20k (2 💎)
                                </span>
                              ) : (gameProgress.awarded15kMilestones || []).includes(cat.id) ? (
                                <span className="text-[10px] text-cyan-200 font-black bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-400/50 flex items-center gap-0.5 shadow-xs">
                                  <span>💎</span> 15k (1 💎)
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Status & Stars */}
                        <div className="shrink-0 flex flex-col items-end gap-1 ml-2">
                          {!unlocked ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 bg-gray-900/80 px-2 py-0.5 rounded-lg border border-gray-700">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          ) : needsAdUnlock ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/40">
                              <PlayCircle className="w-3 h-3" /> Watch Ad
                            </span>
                          ) : isSelected ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-cyan-100 bg-[#0284C7] px-2 py-0.5 rounded-lg border border-[#38BDF8]">
                              <CheckCircle2 className="w-3 h-3" /> Current
                            </span>
                          ) : completed ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cleared
                              </span>
                              <div className="flex items-center text-amber-400 text-[10px]">
                                {Array.from({ length: 3 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-2.5 h-2.5 ${
                                      i < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-black text-cyan-300 bg-[#0C2158] px-2 py-0.5 rounded-lg border border-cyan-500/40">
                              <Sparkles className="w-3 h-3 text-yellow-300" /> Open
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Close Footer */}
          <div className="pt-2.5 mt-2 border-t border-[#1E3A8A] shrink-0 text-center">
            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-cyan-200 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close Categories Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
