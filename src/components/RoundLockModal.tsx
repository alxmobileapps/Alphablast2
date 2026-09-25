import React, { useState, useEffect } from 'react';
import { Play, Lock, CheckCircle, ShieldCheck } from 'lucide-react';
import { showUniversalRewardedAd } from '../utils/universalAds';
import { haptics } from '../utils/haptics';

interface RoundLockModalProps {
  isOpen: boolean;
  roundsPerCycle: number;
  // Set when the lock is for a custom (community) game rather than the next
  // campaign rounds — the ad then unlocks only that custom game.
  customGameName?: string;
  onUnlocked: () => void;
  onClose: () => void;
  onOpenShop?: () => void;
}

/**
 * Shown once every `roundsPerCycle` completed rounds (see requestOpenCategory
 * in App.tsx) — replaces the old interstitial-every-3-rounds gate. Instead of
 * an automatic interstitial, the player watches ONE rewarded ad to unlock the
 * next `roundsPerCycle` rounds. Players who bought "Remove All Ads" never see
 * this at all (that check happens before this modal is ever opened).
 */
export const RoundLockModal: React.FC<RoundLockModalProps> = ({
  isOpen,
  roundsPerCycle,
  customGameName,
  onUnlocked,
  onClose,
  onOpenShop,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setTimeLeft(5);
      setCompleted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (isPlaying && timeLeft === 0) {
      setCompleted(true);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, timeLeft]);

  if (!isOpen) return null;

  const handleStartWatch = () => {
    haptics.tap();
    showUniversalRewardedAd({
      name: customGameName ? 'unlock_custom_game' : 'unlock_next_rounds',
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
    onUnlocked();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-white border-4 border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-[#2D3748] animate-scale-in">
        {/* STATE A: LOCKED OFFER */}
        {!isPlaying && !completed && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center mx-auto mb-4 text-indigo-500 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-[#2D3748] mb-1">
              {customGameName ? 'Custom Game Locked!' : 'Rounds Locked!'}
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mb-5 leading-relaxed">
              {customGameName ? (
                <>
                  Watch a short ad to unlock <strong className="text-indigo-600 font-black">{customGameName}</strong>.
                </>
              ) : (
                <>
                  Watch a short ad to unlock the next <strong className="text-indigo-600 font-black">{roundsPerCycle} rounds</strong>.
                </>
              )}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                id="watch-unlock-ad-btn"
                onClick={handleStartWatch}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#38A169] hover:bg-[#2F855A] text-white font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Ad to Unlock</span>
              </button>

              {onOpenShop && (
                <button
                  id="unlock-remove-ads-btn"
                  onClick={onOpenShop}
                  className="w-full py-3 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm border-2 border-gray-200 flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Or Remove Ads to Unlock Everything</span>
                </button>
              )}

              <button
                id="unlock-close-btn"
                onClick={onClose}
                className="w-full py-2 px-6 text-gray-400 font-bold text-xs cursor-pointer"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {/* STATE B: SIMULATED AD IN PROGRESS (fallback only) */}
        {isPlaying && !completed && (
          <div className="text-center py-4">
            <div className="relative w-full aspect-video bg-[#1E293B] rounded-2xl border-4 border-[#334155] flex flex-col items-center justify-center p-6 mb-4 text-white overflow-hidden shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-white text-[#FF6B35] flex items-center justify-center font-black text-xl mb-2 shadow-md">
                ⚡
              </div>
              <p className="text-sm font-black text-white">Sponsor Spotlight</p>
              <div className="absolute top-3 right-3 bg-white/90 text-[#2D3748] px-2.5 py-1 rounded-full text-xs font-mono font-black shadow-xs">
                Reward in {timeLeft}s
              </div>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2 border border-gray-200">
              <div
                className="h-full bg-[#38A169] transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs font-bold text-gray-500">Watching rewarded video...</p>
          </div>
        )}

        {/* STATE C: AD COMPLETED -> CLAIM UNLOCK */}
        {completed && (
          <div className="text-center py-2">
            <div
              className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-4 text-[#38A169] animate-bounce"
              style={{ animationIterationCount: 4 }}
            >
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-[#2D3748] mb-1">Unlocked!</h2>
            <p className="text-gray-600 text-sm mb-6">
              {customGameName
                ? `${customGameName} is open. Have fun!`
                : `The next ${roundsPerCycle} rounds are open. Have fun!`}
            </p>

            <button
              id="claim-unlock-btn"
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <span>Continue Playing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
