import React, { useState, useEffect } from 'react';
import { Play, Sparkles, X, CheckCircle, Hammer, ArrowLeftRight, Shuffle, Lightbulb, Edit3 } from 'lucide-react';
import { playRewardRefill, playTileSelect } from '../utils/audio';
import { PowerUpType } from '../types';
import { HammerIcon } from './HammerIcon';
import { showUniversalRewardedAd } from '../utils/universalAds';
import { haptics } from '../utils/haptics';

interface PowerUpAdModalProps {
  isOpen: boolean;
  selectedPowerUpType?: PowerUpType | null;
  coins?: number;
  onBuyWithCoins?: (type: PowerUpType, cost: number) => boolean;
  onClaimReward: (type: PowerUpType) => void;
  onOpenShop?: () => void;
  onClose: () => void;
}

interface PowerUpOption {
  type: PowerUpType;
  name: string;
  desc: string;
  coinCost: number;
  icon: React.ReactNode;
  colorClass: string;
  borderClass: string;
  bgClass: string;
}

const POWERUP_OPTIONS: PowerUpOption[] = [
  {
    type: 'hammer',
    name: 'Hammer',
    desc: 'Smash 3×3 blocks',
    coinCost: 50,
    icon: <HammerIcon className="w-5 h-5" showBurst={false} />,
    colorClass: 'text-blue-600',
    borderClass: 'border-blue-300 ring-blue-200',
    bgClass: 'bg-blue-50',
  },
  {
    type: 'swap',
    name: 'Swap',
    desc: 'Swap any 2 tiles',
    coinCost: 50,
    icon: <ArrowLeftRight className="w-5 h-5 text-teal-500" />,
    colorClass: 'text-teal-600',
    borderClass: 'border-teal-300 ring-teal-200',
    bgClass: 'bg-teal-50',
  },
  {
    type: 'replace',
    name: 'Replace',
    desc: 'Pick any letter',
    coinCost: 50,
    icon: <Edit3 className="w-5 h-5 text-violet-500" />,
    colorClass: 'text-violet-600',
    borderClass: 'border-violet-300 ring-violet-200',
    bgClass: 'bg-violet-50',
  },
  {
    type: 'rearrange',
    name: 'Rearrange',
    desc: 'Shuffle the board',
    coinCost: 50,
    icon: <Shuffle className="w-5 h-5 text-emerald-500" />,
    colorClass: 'text-emerald-600',
    borderClass: 'border-emerald-300 ring-emerald-200',
    bgClass: 'bg-emerald-50',
  },
  {
    type: 'clue',
    name: 'Clue',
    desc: 'Highlight a move',
    coinCost: 50,
    icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
    colorClass: 'text-amber-600',
    borderClass: 'border-amber-300 ring-amber-200',
    bgClass: 'bg-amber-50',
  },
];

export const PowerUpAdModal: React.FC<PowerUpAdModalProps> = ({
  isOpen,
  selectedPowerUpType,
  coins = 0,
  onBuyWithCoins,
  onClaimReward,
  onOpenShop,
  onClose,
}) => {
  const [chosenPowerUp, setChosenPowerUp] = useState<PowerUpType>('hammer');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setChosenPowerUp(selectedPowerUpType || 'hammer');
      setIsPlaying(false);
      setTimeLeft(5);
      setCompleted(false);
    }
  }, [isOpen, selectedPowerUpType]);

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
    haptics.tap();
    showUniversalRewardedAd({
      name: `powerup_${chosenPowerUp}`,
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
    onClaimReward(chosenPowerUp);
  };

  const selectedOption = POWERUP_OPTIONS.find((p) => p.type === chosenPowerUp) || POWERUP_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-4 border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-[#2D3748] animate-scale-in">
        {/* Close button if not actively playing */}
        {!isPlaying && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* View 1: Choose 1 Power-Up & Prompt to watch */}
        {!isPlaying && !completed && (
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#2D3748] mb-1">Refill Power-Up</h2>
            <p className="text-gray-500 text-xs sm:text-sm mb-4">
              Choose <strong>1 power-up</strong> to add +1 to your inventory by watching a quick sponsor video:
            </p>

            {/* Selection Grid: 1 Power-Up only */}
            <div className="grid grid-cols-5 gap-1.5 mb-5">
              {POWERUP_OPTIONS.map((opt) => {
                const isSelected = opt.type === chosenPowerUp;
                return (
                  <button
                    key={opt.type}
                    onClick={() => {
                      playTileSelect();
                      setChosenPowerUp(opt.type);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-150 ${
                      isSelected
                        ? `${opt.bgClass} ${opt.borderClass} ring-2 scale-105 shadow-sm font-black`
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <div className="mb-1">{opt.icon}</div>
                    <span className="text-[10px] font-black leading-tight text-gray-800">{opt.name}</span>
                    <span className="text-[8px] font-bold text-gray-400 mt-0.5">+1</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Power-up Info Banner */}
            <div className={`p-3 rounded-2xl border-2 mb-5 flex items-center justify-between text-left ${selectedOption.bgClass} ${selectedOption.borderClass}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-gray-200 shadow-2xs">
                  {selectedOption.icon}
                </div>
                <div>
                  <div className="text-xs font-black text-gray-800">
                    Selected: +1 {selectedOption.name}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    {selectedOption.desc}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-gray-700 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-2xs">
                +1 Charge
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Option 1: Buy with coins */}
              {onBuyWithCoins && (
                <button
                  id="buy-powerup-coins-btn"
                  onClick={() => {
                    if (coins >= selectedOption.coinCost) {
                      onBuyWithCoins(chosenPowerUp, selectedOption.coinCost);
                      onClose();
                    } else if (onOpenShop) {
                      onOpenShop();
                    }
                  }}
                  className={`w-full py-3 px-5 rounded-2xl font-black text-sm shadow-md flex items-center justify-between transition-transform active:scale-95 ${
                    coins >= selectedOption.coinCost
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 border-2 border-yellow-200'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🪙</span>
                    <span>Buy with {selectedOption.coinCost} Coins</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-amber-950/10 px-2 py-0.5 rounded-full">
                    {coins >= selectedOption.coinCost ? 'INSTANT' : `Have ${coins} 🪙`}
                  </span>
                </button>
              )}

              {/* Option 2: Watch Video */}
              <button
                id="watch-powerup-ad-btn"
                onClick={handleStartWatch}
                className="w-full py-3 px-5 rounded-2xl bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Video for +1 {selectedOption.name}</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition-colors border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* View 2: Simulated Video */}
        {isPlaying && !completed && (
          <div className="text-center py-4">
            <div className="relative w-full aspect-video bg-[#1E293B] rounded-2xl border-4 border-[#334155] flex flex-col items-center justify-center p-6 mb-4 text-white overflow-hidden shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-white text-[#FF6B35] flex items-center justify-center font-black text-xl mb-2 shadow-md">
                ⚡
              </div>
              <p className="text-sm font-black text-white">Sponsor Spotlight</p>
              <p className="text-xs text-slate-300 mt-1">Unlocking +1 {selectedOption.name} for your game</p>

              {/* Countdown badge */}
              <div className="absolute top-3 right-3 bg-white/90 text-[#2D3748] px-2.5 py-1 rounded-full text-xs font-mono font-black shadow-xs">
                Reward in {timeLeft}s
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2 border border-gray-200">
              <div
                className="h-full bg-[#FF6B35] transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs font-bold text-gray-500">Watching sponsor video...</p>
          </div>
        )}

        {/* View 3: Ad completed -> Claim reward */}
        {completed && (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-4 text-[#38A169] animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-[#2D3748] mb-1">Power-Up Ready!</h2>
            <p className="text-gray-600 text-sm mb-4">
              Thank you for watching. Your reward is unlocked:
            </p>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-emerald-200 shadow-xs">
                {selectedOption.icon}
              </div>
              <span className="font-mono text-xl font-black text-[#38A169]">
                +1 {selectedOption.name.toUpperCase()}
              </span>
            </div>

            <button
              id="claim-powerup-reward-btn"
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span>Claim +1 {selectedOption.name} & Continue</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
