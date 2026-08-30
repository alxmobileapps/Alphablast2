import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Gift, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { playRewardRefill } from '../utils/audio';
import { showUniversalRewardedAd } from '../utils/universalAds';
import { haptics } from '../utils/haptics';
import { CurrencyPromptModal, CurrencyPromptType } from './CurrencyPromptModal';

interface AdModalProps {
  isOpen: boolean;
  adRefillsUsed: number;
  maxRefills: number;
  hasRemovedAds?: boolean;
  coins?: number;
  diamonds?: number;
  onUseCoinsForMoves?: (coinsCost: number) => boolean;
  onClaimReward: () => void;
  onResetGame: () => void;
  onOpenShop?: (tab?: 'powerups' | 'coins' | 'diamonds') => void;
}

export const AdModal: React.FC<AdModalProps> = ({
  isOpen,
  adRefillsUsed,
  maxRefills = 3,
  hasRemovedAds = false,
  coins = 0,
  diamonds = 0,
  onUseCoinsForMoves,
  onClaimReward,
  onResetGame,
  onOpenShop,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [completed, setCompleted] = useState(false);
  const [currencyPrompt, setCurrencyPrompt] = useState<CurrencyPromptType>(null);

  const isExhausted = adRefillsUsed >= maxRefills;
  const refillsRemaining = Math.max(0, maxRefills - adRefillsUsed);

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setTimeLeft(5);
      setCompleted(false);
      setCurrencyPrompt(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      setCompleted(true);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, timeLeft]);

  if (!isOpen) return null;

  const handleStartWatch = () => {
    if (isExhausted) return;
    haptics.tap();

    // Universal Rewarded Ad trigger (H5 Game Ads, Native AdMob, or interactive fallback)
    showUniversalRewardedAd({
      name: 'refill_5_moves',
      onReward: () => {
        setCompleted(true);
        setIsPlaying(false);
      },
      onDismiss: () => {
        setIsPlaying(false);
      },
      fallbackToInteractiveModal: () => {
        setIsPlaying(true);
        setTimeLeft(5);
        setCompleted(false);
      },
    });
  };

  const handleClaim = () => {
    haptics.specialCreated();
    playRewardRefill();
    onClaimReward();
  };

  const handleCoinsPurchase = () => {
    if (isExhausted) return;
    if (coins >= 50 && onUseCoinsForMoves) {
      haptics.specialCreated();
      onUseCoinsForMoves(50);
    } else {
      haptics.invalid();
      setCurrencyPrompt('buy_coins_with_diamonds');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-white border-4 border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-[#2D3748] animate-scale-in">
        {/* ======================================================= */}
        {/* STATE A: EXHAUSTED (All 3 Refills Used -> Forced Restart) */}
        {/* ======================================================= */}
        {isExhausted && (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-red-100 border-2 border-red-200 flex items-center justify-center mx-auto mb-4 text-red-500 shadow-xs">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-black text-[#2D3748] mb-1">Game Over!</h2>
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-3.5 mb-4 text-left">
              <div className="text-xs font-black text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>Refill Limit Reached</span>
                <span className="font-mono text-[10px] bg-rose-200 px-1.5 py-0.2 rounded font-bold">
                  {adRefillsUsed}/{maxRefills}
                </span>
              </div>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">
                You have used all <strong>3 extra moves refills</strong> for this round. To continue playing, please restart this category from the beginning.
              </p>
            </div>

            <button
              id="exhausted-restart-btn"
              onClick={onResetGame}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Category</span>
            </button>
          </div>
        )}

        {/* ======================================================= */}
        {/* STATE B: ACTIVE REFILL OFFER (Refills < 3) */}
        {/* ======================================================= */}
        {!isExhausted && !isPlaying && !completed && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 border-2 border-orange-200 flex items-center justify-center mx-auto mb-4 text-[#FF6B35] shadow-xs">
              <Gift className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-[#2D3748] mb-1">Out of Moves!</h2>
            
            {/* Refill limit badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-black text-amber-800 mb-3 shadow-xs">
              <span>Refills Remaining:</span>
              <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded-md">
                {refillsRemaining} of {maxRefills} max
              </span>
            </div>

            <p className="text-gray-600 text-xs sm:text-sm mb-5 leading-relaxed">
              {hasRemovedAds ? (
                <>
                  Ads are removed! Refill <strong className="text-[#38A169] font-black">+5 moves</strong> using coins (subject to availability) or restart this round.
                </>
              ) : (
                <>
                  Would you like to get <strong className="text-[#38A169] font-black">+5 extra moves</strong>, or restart this round?
                </>
              )}
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Option 1: Buy with Coins (Always available if IAP removed ads or standard play) */}
              {onUseCoinsForMoves && (
                <button
                  id="buy-moves-coins-btn"
                  onClick={handleCoinsPurchase}
                  className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm shadow-md flex items-center justify-between transition-transform active:scale-95 cursor-pointer ${
                    coins >= 50
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 border-2 border-yellow-200'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🪙</span>
                    <span>Use 50 Coins for +5 Moves</span>
                  </div>
                  <span className="text-xs bg-amber-950/10 px-2 py-0.5 rounded-full font-mono font-bold">
                    {coins >= 50 ? 'INSTANT' : `Have ${coins} 🪙 (Get More)`}
                  </span>
                </button>
              )}

              {/* Option 2: Watch Ad for +5 moves (ONLY shown if ads are NOT removed) */}
              {!hasRemovedAds && (
                <button
                  id="watch-reward-ad-btn"
                  onClick={handleStartWatch}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#38A169] hover:bg-[#2F855A] text-white font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Ad for +5 Moves</span>
                </button>
              )}

              {/* Option 3: Reset / Restart game */}
              <button
                id="reset-game-btn"
                onClick={onResetGame}
                className="w-full py-2.5 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm border-2 border-gray-200 flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer mt-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Restart Round</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STATE C: SIMULATED AD IN PROGRESS */}
        {/* ======================================================= */}
        {!isExhausted && isPlaying && !completed && (
          <div className="text-center py-4">
            <div className="relative w-full aspect-video bg-[#1E293B] rounded-2xl border-4 border-[#334155] flex flex-col items-center justify-center p-6 mb-4 text-white overflow-hidden shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-white text-[#FF6B35] flex items-center justify-center font-black text-xl mb-2 shadow-md">
                ⚡
              </div>
              <p className="text-sm font-black text-white">Sponsor Spotlight</p>
              <p className="text-xs text-slate-300 mt-1">Forming longer words generates explosive lasers & bombs!</p>

              {/* Countdown badge */}
              <div className="absolute top-3 right-3 bg-white/90 text-[#2D3748] px-2.5 py-1 rounded-full text-xs font-mono font-black shadow-xs">
                Reward in {timeLeft}s
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2 border border-gray-200">
              <div
                className="h-full bg-[#38A169] transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs font-bold text-gray-500">Watching rewarded video...</p>
          </div>
        )}

        {/* ======================================================= */}
        {/* STATE D: AD COMPLETED -> CLAIM REWARD */}
        {/* ======================================================= */}
        {!isExhausted && completed && (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-4 text-[#38A169] animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-[#2D3748] mb-1">Reward Ready!</h2>
            <p className="text-gray-600 text-sm mb-4">
              Thank you for watching. You have earned:
            </p>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 mb-6">
              <span className="font-mono text-3xl font-black text-[#38A169]">
                +5 MOVES
              </span>
              <p className="text-[11px] font-bold text-emerald-800 mt-1">
                Refills used: {adRefillsUsed + 1} of {maxRefills}
              </p>
            </div>

            <button
              id="claim-moves-reward-btn"
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span>Claim +5 Moves & Resume</span>
            </button>
          </div>
        )}

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
