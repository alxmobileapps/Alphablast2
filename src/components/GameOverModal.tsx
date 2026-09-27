import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Trophy, Home } from 'lucide-react';
import { Category, WordHistoryItem } from '../types';
import { formatPoints } from '../utils/scoring';
import { CurrencyPromptModal, CurrencyPromptType } from './CurrencyPromptModal';
import { haptics } from '../utils/haptics';

interface GameOverModalProps {
  isOpen: boolean;
  category: Category;
  categoryProgress: number;
  history: WordHistoryItem[];
  score?: number;
  coins?: number;
  diamonds?: number;
  diamondMilestoneAwarded?: { count: number; milestoneName: string } | null;
  adRefillsUsed?: number;
  maxRefills?: number;
  onUseCoinsForMoves?: (coinsCost: number) => boolean;
  onOpenShop?: (tab?: 'powerups' | 'coins' | 'diamonds') => void;
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
  diamonds = 0,
  diamondMilestoneAwarded,
  adRefillsUsed = 0,
  maxRefills = 3,
  onUseCoinsForMoves,
  onOpenShop,
  onRetry,
  onGoHome,
  onOpenLeaderboard,
}) => {
  const [currencyPrompt, setCurrencyPrompt] = useState<CurrencyPromptType>(null);
  if (!isOpen) return null;

  const isExhausted = adRefillsUsed >= maxRefills;
  const refillsRemaining = Math.max(0, maxRefills - adRefillsUsed);

  return (
    <div
      id="game-over-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/90 flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      <div
        id="game-over-card"
        className="bg-[#0C2158] border-2 sm:border-3 border-rose-300 rounded-3xl max-w-sm sm:max-w-md w-full shadow-[0_20px_50px_rgba(225,29,72,0.3)] relative flex flex-col max-h-[90vh] overflow-hidden text-center text-white animate-scale-in"
      >
        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar p-4 sm:p-5 flex-1 space-y-2.5">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-900/40 border-2 border-rose-400/50 flex items-center justify-center text-rose-300 shadow-xs mb-1.5">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {isExhausted ? 'GAME OVER' : 'OUT OF MOVES'}
            </h2>
            <p className="text-blue-200 text-xs sm:text-xs mt-0.5 max-w-xs">
              {isExhausted
                ? 'All 3 move refills have been exhausted for this round.'
                : 'Add +5 moves with coins to continue playing, or restart.'}
            </p>
          </div>

          {/* Refills Counter Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-900/30 border border-amber-400/40 rounded-full text-[10px] font-black text-amber-200 shadow-xs">
            <span>Refills Used:</span>
            <span className="font-mono font-black text-amber-100 bg-amber-500/20 px-1.5 py-0.2 rounded-md">
              {adRefillsUsed} of {maxRefills} max
            </span>
          </div>

          {/* Points Pill Banner */}
          <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/30 border border-amber-400/40 rounded-xl p-2 sm:p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div className="text-left">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300/90 block leading-none">
                  ROUND SCORE
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-amber-100 leading-tight">
                  {formatPoints(score)} <span className="text-[10px] font-bold text-amber-300">PTS</span>
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
            <div className="bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-indigo-900/30 border border-cyan-400/40 rounded-xl p-2 sm:p-2.5 text-cyan-100 flex items-center justify-between shadow-md animate-pulse">
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 text-white flex items-center justify-center text-sm font-black shadow-md shrink-0">
                  💎
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300 block leading-none mb-0.5">
                    {diamondMilestoneAwarded.milestoneName}
                  </span>
                  <span className="font-black text-xs text-cyan-50 block leading-tight">
                    +{diamondMilestoneAwarded.count} {diamondMilestoneAwarded.count > 1 ? 'Diamonds' : 'Diamond'} Awarded!
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-cyan-500/30 text-cyan-100 px-2 py-0.5 rounded-lg shadow-xs">
                +{diamondMilestoneAwarded.count} 💎
              </span>
            </div>
          )}

          {/* Progress summary */}
          <div className="bg-[#071330] border border-[#1E3A8A] rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-blue-100 font-black flex items-center gap-1">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
              <span className="font-mono text-xs font-black text-orange-400">
                {categoryProgress} / {category.targetCount} words
              </span>
            </div>

            <div className="w-full h-2 bg-[#1E3A8A] rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-[#FF6B35] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (categoryProgress / category.targetCount) * 100)}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-400 font-bold text-left">
              Total words formed this round: <strong className="text-blue-100 font-black">{history.length}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-3 sm:p-4 bg-[#071330] border-t border-[#1E3A8A] flex flex-col gap-2 shrink-0">
          {/* Option 1: Buy +5 Moves with Coins (ONLY available if refills < 3) */}
          {!isExhausted && onUseCoinsForMoves && (
            <button
              id="gameover-buy-moves-btn"
              onClick={() => {
                if (coins >= 50) {
                  onUseCoinsForMoves(50);
                } else {
                  haptics.invalid();
                  setCurrencyPrompt('buy_coins_with_diamonds');
                }
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-sm flex items-center justify-between transition-transform active:scale-95 cursor-pointer ${
                coins >= 50
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 border border-yellow-300'
                  : 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-400/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">🪙</span>
                <span>Continue: +5 Moves (50 Coins)</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-black/20 px-2 py-0.5 rounded-full">
                {coins >= 50 ? 'INSTANT' : `Have ${coins} 🪙`}
              </span>
            </button>
          )}

          <div className="flex gap-2">
            {onGoHome && (
              <button
                id="gameover-home-btn"
                onClick={onGoHome}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Home className="w-4 h-4 text-cyan-300" />
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

        {/* Currency Insufficient Confirmation Prompt */}
        <CurrencyPromptModal
          isOpen={!!currencyPrompt}
          type={currencyPrompt}
          coins={coins}
          diamonds={diamonds}
          onConfirm={() => {
            if (currencyPrompt === 'buy_coins_with_diamonds') {
              if (onOpenShop) onOpenShop('coins');
            } else if (currencyPrompt === 'buy_more_diamonds') {
              if (onOpenShop) onOpenShop('diamonds');
            }
            setCurrencyPrompt(null);
          }}
          onClose={() => setCurrencyPrompt(null)}
        />
      </div>
    </div>
  );
};
