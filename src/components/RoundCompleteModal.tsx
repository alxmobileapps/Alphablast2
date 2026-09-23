import React, { useEffect, useLayoutEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, RotateCcw, Sparkles, Lock, Unlock, Clock, Home, Star } from 'lucide-react';
import { Category, WordHistoryItem } from '../types';
import { playWin } from '../utils/audio';
import { formatPoints } from '../utils/scoring';
import { perfMark } from '../utils/perfDebug';

/**
 * DIAGNOSTIC CONTEXT for the animationIterationCount overrides below:
 *
 * A video showed this exact modal render correctly (perfMark log fully
 * legible, right content, right score), then the ENTIRE screen go blank
 * white for ~10s while the app was just sitting idle on this modal (no
 * game logic running, nothing for the player to wait on), then the SAME
 * modal — same score, same log entries, nothing lost — reappear exactly
 * as it was. Crucially, none of main.tsx's lifecycle listeners
 * (visibilitychange/pagehide/freeze/resume) fired, and its rAF heartbeat
 * never logged a gap either — meaning the WebView was never backgrounded
 * or reloaded, AND the browser's own render loop never actually stalled.
 * JS was fine the whole time; the screen just didn't get painted.
 *
 * That points at the ANDROID WEBVIEW COMPOSITOR, not JS — and the one
 * thing still running the entire time this modal sits open and idle
 * (which a rAF-based JS stall check can't see, since CSS animations run
 * on their own compositor thread) is these three infinite CSS
 * animations: the trophy's animate-bounce and the earned stars' /
 * diamond banner's animate-pulse. Tailwind's animate-bounce/animate-pulse
 * repeat forever for as long as the modal is mounted, which on this
 * screen can be however long the player takes to look at it and decide
 * to tap Next Round. Capping them to a handful of repeats (then holding
 * the final frame) keeps the celebratory effect on open but removes the
 * sustained concurrent-animation compositing load for the rest of the
 * time the modal sits idle — the first concrete, testable lever this
 * investigation has found for a freeze that isn't a JS-level bug at all.
 */

interface RoundCompleteModalProps {
  isOpen: boolean;
  category: Category;
  history: WordHistoryItem[];
  movesRemaining: number;
  score?: number;
  earnedStars?: number;
  timeConsumed?: number; // Time consumed in seconds
  newlyUnlockedCategory?: Category | null;
  convertedCoins?: { coloredTiles: number; powerups: number; total: number } | null;
  diamondMilestoneAwarded?: { count: number; milestoneName: string } | null;
  diamond10kAwarded?: boolean;
  coins?: number;
  diamonds?: number;
  onNextRound: () => void;
  onReplayRound: () => void;
  onGoHome?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenShop?: () => void;
  hasNextRound: boolean;
}

export const RoundCompleteModal: React.FC<RoundCompleteModalProps> = ({
  isOpen,
  category,
  history,
  movesRemaining,
  score = 0,
  earnedStars = 3,
  timeConsumed,
  newlyUnlockedCategory,
  convertedCoins,
  diamondMilestoneAwarded,
  diamond10kAwarded = false,
  coins = 0,
  diamonds = 0,
  onNextRound,
  onReplayRound,
  onGoHome,
  onOpenLeaderboard,
  onOpenShop,
  hasNextRound,
}) => {
  // DIAGNOSTIC: useLayoutEffect fires synchronously right after React
  // commits this component's DOM, BEFORE the browser paints it — unlike
  // useEffect below, which only runs AFTER the browser has painted. A video
  // showed a 7+ second blank-white gap starting the instant this modal was
  // supposed to open, with the perf overlay itself frozen mid-buffer (no
  // new marks at all for the whole gap) — meaning either React never
  // committed this tree, or it committed fine but the BROWSER never got
  // around to painting it (a rendering-pipeline stall, not a JS one).
  // Comparing this mark's timing against the ones in the effect below
  // tells us which: if this fires promptly but the effect below is still
  // delayed by seconds, the DOM committed fine and the stall is in actual
  // paint/rasterization (most likely this card's large static box-shadow +
  // several gradient-background panels all appearing in one big first
  // paint) — not something further JS instrumentation can localize further.
  useLayoutEffect(() => {
    if (isOpen) {
      perfMark('RoundCompleteModal: useLayoutEffect fired (DOM committed, pre-paint)');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      perfMark('RoundCompleteModal: useEffect fired (after browser paint)');
      playWin();
      perfMark('RoundCompleteModal: playWin() returned');
      // Defer confetti to AFTER this modal has actually painted, instead of
      // firing it synchronously in the same commit that mounts the modal.
      // canvas-confetti draws every one of its particles on every frame via
      // requestAnimationFrame, on the same main thread the WebView uses to
      // paint/composite everything else. A screen recording of the freeze
      // showed a 7+ second blank white gap starting at the exact moment a
      // round-completing event fires (right before this modal would show),
      // with the app's own JS otherwise idle — i.e. something was
      // saturating the render pipeline right as this modal tried to mount.
      // Letting the browser paint the card FIRST (two rAFs — same pattern
      // already used to defer board generation for the round-transition
      // fix) means the worst case is "confetti starts a frame late", not
      // "the modal is invisible while confetti's canvas redraws pile up".
      requestAnimationFrame(() => {
        perfMark('RoundCompleteModal: 1st rAF fired');
        requestAnimationFrame(() => {
          perfMark('RoundCompleteModal: 2nd rAF fired, calling confetti()');
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {
            // Confetti fallback
          }
          perfMark('RoundCompleteModal: confetti() returned');
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categoryWords = history.filter((h) => h.isCategory);

  const formatTime = (secs?: number) => {
    if (secs === undefined || secs === null) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="round-complete-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      <div
        id="round-complete-card"
        className="bg-white border-2 sm:border-3 border-[#7DD3FC] rounded-3xl max-w-sm sm:max-w-md w-full shadow-[0_20px_50px_rgba(2,132,199,0.4)] relative flex flex-col max-h-[90vh] overflow-hidden text-center text-[#2D3748] animate-scale-up"
      >
        {/* Scrollable Content Container */}
        <div className="overflow-y-auto custom-scrollbar p-4 sm:p-5 flex-1 space-y-2.5">
          {/* Trophy Header */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#F59E0B] via-[#FBBF24] to-[#FDE047] border-2 border-amber-200 flex items-center justify-center text-amber-950 shadow-md animate-bounce mb-1.5"
              style={{ animationIterationCount: 4 }}
            >
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
              {category.gameMode === 'timer' ? "TIME'S UP! RUSH CLEARED!" : 'ROUND CLEARED!'}
            </h2>
            <div className="inline-flex items-center gap-1 text-[#059669] font-black text-xs sm:text-sm mt-0.5">
              <span>{category.icon}</span>
              {category.gameMode === 'timer' ? (
                <span>{category.name} ({history.length} words found in {formatTime(timeConsumed)})</span>
              ) : (
                <span>{category.name} ({category.targetCount}/{category.targetCount} words)</span>
              )}
            </div>

            {/* Earned Stars Rating */}
            <div className="flex items-center justify-center gap-1.5 mt-2 bg-amber-50 border border-amber-300/80 px-3 py-1 rounded-full shadow-inner">
              {Array.from({ length: 3 }).map((_, i) => {
                const isEarned = i < earnedStars;
                return (
                  <Star
                    key={i}
                    className={`w-6 h-6 transition-all transform ${
                      isEarned
                        ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)] animate-pulse'
                        : 'text-gray-300 fill-gray-100'
                    }`}
                    style={isEarned ? { animationIterationCount: 3 } : undefined}
                  />
                );
              })}
              <span className="font-futuristic text-xs font-black text-amber-900 ml-1 tracking-wider">
                {earnedStars} / 3 STARS
              </span>
            </div>
          </div>

          {/* Newly Unlocked Category Banner if any */}
          {newlyUnlockedCategory && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2 sm:p-2.5 text-emerald-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-left min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-xs shrink-0">
                  <Unlock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 block leading-none mb-0.5">
                    NEW ROUND UNLOCKED!
                  </span>
                  <span className="font-black text-xs text-emerald-950 truncate flex items-center gap-1 leading-tight">
                    <span>{newlyUnlockedCategory.icon}</span>
                    <span className="truncate">#{newlyUnlockedCategory.id}: {newlyUnlockedCategory.name}</span>
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md shrink-0">
                OPEN
              </span>
            </div>
          )}

          {/* Points Pill Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl p-2 sm:p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div className="text-left">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800/80 block leading-none">
                  ROUND SCORE
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-amber-900 leading-tight">
                  {formatPoints(score)} <span className="text-[10px] font-bold text-amber-700">PTS</span>
                </span>
              </div>
            </div>
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-black shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Trophy className="w-3 h-3" />
                <span>Ranks</span>
              </button>
            )}
          </div>

          {/* Score Diamond Milestone Celebration Banner if achieved */}
          {(diamondMilestoneAwarded || diamond10kAwarded) && (
            <div
              className="bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-300 rounded-xl p-2 sm:p-2.5 text-cyan-900 flex items-center justify-between shadow-xs animate-pulse"
              style={{ animationIterationCount: 3 }}
            >
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 text-white flex items-center justify-center text-sm font-black shadow-xs shrink-0">
                  💎
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-700 block leading-none mb-0.5">
                    ROUND REWARD
                  </span>
                  <span className="font-black text-xs text-cyan-950 block leading-tight">
                    +{diamondMilestoneAwarded ? diamondMilestoneAwarded.count : 1} {diamondMilestoneAwarded && diamondMilestoneAwarded.count > 1 ? 'Diamonds' : 'Diamond'} Awarded!
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-cyan-200 text-cyan-950 px-2 py-0.5 rounded-lg shadow-xs">
                +{diamondMilestoneAwarded ? diamondMilestoneAwarded.count : 1} 💎
              </span>
            </div>
          )}

          {/* Converted Leftover Assets to Coins */}
          {convertedCoins && convertedCoins.total > 0 && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-2 sm:p-2.5 text-amber-950 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center text-sm font-black shadow-xs shrink-0">
                  🪙
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block leading-none mb-0.5">
                    ROUND BONUS COINS
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-900 leading-tight">
                    {convertedCoins.coloredTiles} colored + {convertedCoins.powerups} power-up ➔{' '}
                    <strong className="font-black text-amber-950">+{convertedCoins.total} 🪙</strong>
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-amber-300 text-amber-950 px-2 py-0.5 rounded-lg shadow-xs">
                +{convertedCoins.total} 🪙
              </span>
            </div>
          )}

          {/* Currency summary strip */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-800">
                <span>🪙</span>
                <span>{coins}</span>
              </div>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 font-mono text-xs font-black text-cyan-800">
                <span>💎</span>
                <span>{diamonds}</span>
              </div>
            </div>
            {onOpenShop && (
              <button
                onClick={onOpenShop}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Store</span>
                <span>➔</span>
              </button>
            )}
          </div>

          {/* Stats card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 grid grid-cols-4 gap-1 text-center">
            <div>
              <span className="text-[9px] text-gray-500 font-bold block uppercase truncate">Target</span>
              <span className="font-mono text-sm sm:text-base font-black text-[#38A169]">
                {categoryWords.length}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-bold block uppercase truncate">Words</span>
              <span className="font-mono text-sm sm:text-base font-black text-[#FF6B35]">
                {history.length}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-bold block uppercase truncate">Time</span>
              <span className="font-mono text-sm sm:text-base font-black text-indigo-600 flex items-center justify-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span>{formatTime(timeConsumed)}</span>
              </span>
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-bold block uppercase truncate">
                {category.gameMode === 'timer' ? 'Mode' : 'Moves'}
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-[#3182CE] truncate flex items-center justify-center">
                {category.gameMode === 'timer' ? '⏱ Timer' : movesRemaining}
              </span>
            </div>
          </div>

          {/* Category Words List Pills */}
          <div className="text-left">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">
              Target Words Formed:
            </span>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar p-0.5">
              {categoryWords.map((w) => (
                <span
                  key={w.id}
                  className="px-1.5 py-0.5 rounded-md bg-green-100 border border-green-300 text-green-900 font-mono text-[11px] font-black flex items-center gap-1"
                >
                  <span>{w.word}</span>
                  {w.points ? <span className="text-[8px] text-green-700 font-bold">+{formatPoints(w.points)}</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex gap-2 shrink-0">
          {category.id >= 1000 || category.isCustom ? (
            <>
              <button
                id="custom-round-home-btn"
                onClick={onGoHome || onNextRound}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-[#2D3748] font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Home className="w-4 h-4 text-blue-600" />
                <span>Home</span>
              </button>

              <button
                id="custom-round-play-again-btn"
                onClick={onReplayRound}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReplayRound}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-[#2D3748] font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              {hasNextRound ? (
                <button
                  id="next-round-btn"
                  onClick={onNextRound}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#48BB78] to-[#38A169] hover:from-[#38A169] hover:to-[#2F855A] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Next Round</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onReplayRound}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D2A] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>All Clear! Replay</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
