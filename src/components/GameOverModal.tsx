import React from 'react';
import { AlertTriangle, RotateCcw, Trophy, Home } from 'lucide-react';
import { Category, WordHistoryItem } from '../types';
import { formatPoints } from '../utils/scoring';

interface GameOverModalProps {
  isOpen: boolean;
  category: Category;
  categoryProgress: number;
  history: WordHistoryItem[];
  score?: number;
  coins?: number;
  diamondMilestoneAwarded?: { count: number; milestoneName: string } | null;
  adRefillsUsed?: number;
  maxRefills?: number;
  onUseCoinsForMoves?: (coinsCost: number) => boolean;
  onOpenShop?: () => void;
  onRetry: () => void;
  onGoHome?: () => void;
  onOpenLeaderboard?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  category,
  categoryProgress,
  history,
  score = 0,
  coins = 0,
  diamondMilestoneAwarded,
  adRefillsUsed = 0,
  maxRefills = 3,
  onUseCoinsForMoves,
  onOpenShop,
  onRetry,
  onGoHome,
  onOpenLeaderboard,
}) => {
  if (!isOpen) return null;

  const isExhausted = adRefillsUsed >= maxRefills;
  const refillsRemaining = Math.max(0, maxRefills - adRefillsUsed);

  return (
    <div
      id="game-over-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      <div
        id="game-over-card"
        className="bg-white border-2 sm:border-3 border-rose-300 rounded-3xl max-w-sm sm:max-w-md w-full shadow-[0_20px_50px_rgba(225,29,72,0.3)] relative flex flex-col max-h-[90vh] overflow-hidden text-center text-[#2D3748] animate-scale-in"
      >
        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar p-4 sm:p-5 flex-1 space-y-2.5">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-100 border-2 border-rose-200 flex items-center justify-center text-rose-500 shadow-xs mb-1.5">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
              {isExhausted ? 'GAME OVER' : 'OUT OF MOVES'}
            </h2>
            <p className="text-gray-500 text-xs sm:text-xs mt-0.5 max-w-xs">
              {isExhausted
                ? 'All 3 move refills have been exhausted for this round.'
                : 'Add +5 moves with coins to continue playing, or restart.'}
            </p>
          </div>

          {/* Refills Counter Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-black text-amber-800 shadow-xs">
            <span>Refills Used:</span>
            <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded-md">
              {adRefillsUsed} of {maxRefills} max
            </span>
          </div>

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

          {/* Score Diamond Milestone Celebration Banner if achieved during round */}
          {diamondMilestoneAwarded && (
            <div className="bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-300 rounded-xl p-2 sm:p-2.5 text-cyan-900 flex items-center justify-between shadow-md animate-pulse">
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 text-white flex items-center justify-center text-sm font-black shadow-md shrink-0">
                  💎
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-700 block leading-none mb-0.5">
                    {diamondMilestoneAwarded.milestoneName}
                  </span>
                  <span className="font-black text-xs text-cyan-950 block leading-tight">
                    +{diamondMilestoneAwarded.count} {diamondMilestoneAwarded.count > 1 ? 'Diamonds' : 'Diamond'} Awarded!
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-cyan-200 text-cyan-950 px-2 py-0.5 rounded-lg shadow-xs">
                +{diamondMilestoneAwarded.count} 💎
              </span>
            </div>
          )}

          {/* Progress summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-700 font-black flex items-center gap-1">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
              <span className="font-mono text-xs font-black text-[#FF6B35]">
                {categoryProgress} / {category.targetCount} words
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-[#FF6B35] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (categoryProgress / category.targetCount) * 100)}%` }}
              />
            </div>

            <p className="text-[10px] text-gray-500 font-bold text-left">
              Total words formed this round: <strong className="text-gray-800 font-black">{history.length}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-2 shrink-0">
          {/* Option 1: Buy +5 Moves with Coins (ONLY available if refills < 3) */}
          {!isExhausted && onUseCoinsForMoves && (
            <button
              id="gameover-buy-moves-btn"
              onClick={() => {
                if (coins >= 50) {
                  onUseCoinsForMoves(50);
                } else if (onOpenShop) {
                  onOpenShop();
                }
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-sm flex items-center justify-between transition-transform active:scale-95 cursor-pointer ${
                coins >= 50
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 border border-yellow-300'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">🪙</span>
                <span>Continue: +5 Moves (50 Coins)</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-950/10 px-2 py-0.5 rounded-full">
                {coins >= 50 ? 'INSTANT' : `Have ${coins} 🪙`}
              </span>
            </button>
          )}

          <div className="flex gap-2">
            {onGoHome && (
              <button
                id="gameover-home-btn"
                onClick={onGoHome}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Home className="w-4 h-4 text-blue-600" />
                <span>Home</span>
              </button>
            )}

            <button
              id="retry-round-btn"
              onClick={onRetry}
              className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm border flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                isExhausted
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-red-700 shadow-md'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-amber-950 border-amber-400 shadow-sm'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{category.isCustom ? 'Play Again' : 'Restart Round'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
