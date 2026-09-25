import React from 'react';
import { Shuffle, Lightbulb, ArrowLeftRight, Edit3, XCircle, Gift } from 'lucide-react';
import { PowerUpInventory, PowerUpType } from '../types';
import { HammerIcon } from './HammerIcon';
import { haptics } from '../utils/haptics';
import { useTickingRefValue } from '../hooks/useTickingRefValue';

interface PowerUpBarProps {
  inventory: PowerUpInventory;
  activePowerUp: PowerUpType | null;
  movesRemaining: number;
  movesGainedBonus?: number | null;
  isTimerMode?: boolean;
  // A ref (not a plain number) so App.tsx's per-second countdown tick
  // doesn't have to re-render App, GameBoard, TopInfoBar, Header, or the
  // rest of PowerUpBar's own siblings -- see useTickingRefValue.ts. Only
  // the small timer badge below re-renders every second, by reading the
  // ref directly through that hook.
  timerSecondsRemainingRef?: { current: number };
  isLifelineShining?: boolean;
  onSelectPowerUp: (type: PowerUpType) => void;
  onCancelPowerUp: () => void;
  onOpenPowerUpAd?: (type?: PowerUpType) => void;
  disabled: boolean;
}

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  inventory,
  activePowerUp,
  movesRemaining,
  movesGainedBonus,
  isTimerMode = false,
  timerSecondsRemainingRef,
  isLifelineShining = false,
  onSelectPowerUp,
  onCancelPowerUp,
  onOpenPowerUpAd,
  disabled,
}) => {
  const handleClick = (type: PowerUpType) => {
    if (disabled) return;
    haptics.tap();
    if (inventory[type] <= 0) {
      if (onOpenPowerUpAd) {
        onOpenPowerUpAd(type);
      }
      return;
    }

    if (activePowerUp === type) {
      onCancelPowerUp();
    } else {
      haptics.powerUp();
      onSelectPowerUp(type);
    }
  };

  return (
    <div
      id="power-up-bar-container"
      className={`w-full max-w-2xl mx-auto bg-[#0B1E52]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2.5 relative select-none box-border transition-all duration-300 ${
        isLifelineShining
          ? 'animate-lifeline-zoom-shine border-2 border-yellow-300 ring-4 ring-yellow-400/90 shadow-[0_0_35px_rgba(250,204,21,0.95)]'
          : 'border-2 border-[#193B8A] shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
      }`}
    >
      {/* Light Beam Sweep Over the Lifelines Bar */}
      {isLifelineShining && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-3xl z-30">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] animate-light-beam-sweep" />
        </div>
      )}

      {/* Active Powerup Cancel Banner */}
      {activePowerUp && (
        <button
          onClick={onCancelPowerUp}
          className="absolute -top-3.5 right-3 px-2.5 py-0.5 bg-red-600 border border-white text-white rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-lg hover:bg-red-700 transition-transform active:scale-95 animate-bounce z-20 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel {activePowerUp}</span>
        </button>
      )}

      {/* 1. DOMINANT HERO ELEMENT: Moves / Timer Badge */}
      <div className="relative shrink-0 flex items-center">
        {/* Floating bonus gained animation */}
        {movesGainedBonus && movesGainedBonus > 0 && !isTimerMode ? (
          <div
            key={`bonus-powerup-${movesGainedBonus}`}
            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-emerald-200 pointer-events-none animate-moves-pop whitespace-nowrap z-30"
          >
            +{movesGainedBonus}!
          </div>
        ) : null}

        {isTimerMode ? (
          <PowerUpTimerBadge secondsRef={timerSecondsRemainingRef} isActive={isTimerMode} />
        ) : (
          <div
            id="powerup-moves-badge"
            className="min-w-[58px] xs:min-w-[66px] sm:min-w-[78px] h-10 xs:h-11 sm:h-12 px-2 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center bg-gradient-to-b from-[#FBBF24] via-[#F59E0B] to-[#B45309] border-2 border-[#FEF08A] shadow-[0_4px_16px_rgba(245,158,11,0.5)] cursor-default select-none"
            title={`Moves remaining: ${movesRemaining}`}
          >
            <span className="text-base xs:text-lg sm:text-xl font-black text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-mono">
              {movesRemaining}
            </span>
            <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider text-amber-950/90 mt-0.5 leading-none">
              MOVES
            </span>
          </div>
        )}
      </div>

      {/* Subtle Vertical Divider separating Dominant Moves from Action Tools */}
      <div className="h-8 sm:h-9 w-px bg-blue-400/25 shrink-0" />

      {/* 2. COMPACT SECONDARY TOOLS: Power-ups */}
      <div className="flex-1 flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
        {/* Hammer (Sky Blue) */}
        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
          <button
            id="powerup-hammer-btn"
            onClick={() => handleClick('hammer')}
            disabled={disabled}
            className={`relative w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white border-1.5 transition-all shadow-md ${
              activePowerUp === 'hammer'
                ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] border-white ring-2 ring-cyan-300 scale-105'
                : isLifelineShining
                ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] border-yellow-200 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)] animate-bounce cursor-pointer'
                : inventory.hammer > 0
                ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] border-[#BAE6FD] hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-700/80 text-slate-400 border-slate-600 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title={inventory.hammer > 0 ? 'Giant Hammer: Smash 3×3 blocks' : 'Refill Hammer'}
          >
            <HammerIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5" showBurst={activePowerUp === 'hammer'} />
            {inventory.hammer <= 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-white text-[7px] font-black flex items-center justify-center border border-white shadow-xs">
                +
              </span>
            )}
          </button>
          <div
            className={`text-[6.5px] xs:text-[7.5px] sm:text-[8px] font-black px-1 py-0.5 rounded-full whitespace-nowrap shadow-xs leading-none ${
              inventory.hammer > 0 ? 'bg-[#0369A1] text-white' : 'bg-amber-500 text-amber-950'
            }`}
          >
            {inventory.hammer > 0 ? `${inventory.hammer}` : '+'}
          </div>
        </div>

        {/* Swap (Emerald Green) */}
        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
          <button
            id="powerup-swap-btn"
            onClick={() => handleClick('swap')}
            disabled={disabled}
            className={`relative w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white border-1.5 transition-all shadow-md ${
              activePowerUp === 'swap'
                ? 'bg-gradient-to-b from-[#34D399] to-[#059669] border-white ring-2 ring-emerald-300 scale-105'
                : isLifelineShining
                ? 'bg-gradient-to-b from-[#34D399] to-[#059669] border-yellow-200 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)] animate-bounce cursor-pointer'
                : inventory.swap > 0
                ? 'bg-gradient-to-b from-[#34D399] to-[#059669] border-[#A7F3D0] hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-700/80 text-slate-400 border-slate-600 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title={inventory.swap > 0 ? 'Swap: Swap ANY 2 tiles on board' : 'Refill Swap'}
          >
            <ArrowLeftRight className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 drop-shadow" />
            {inventory.swap <= 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-white text-[7px] font-black flex items-center justify-center border border-white shadow-xs">
                +
              </span>
            )}
          </button>
          <div
            className={`text-[6.5px] xs:text-[7.5px] sm:text-[8px] font-black px-1 py-0.5 rounded-full whitespace-nowrap shadow-xs leading-none ${
              inventory.swap > 0 ? 'bg-[#047857] text-white' : 'bg-amber-500 text-amber-950'
            }`}
          >
            {inventory.swap > 0 ? `${inventory.swap}` : '+'}
          </div>
        </div>

        {/* Replace / Pencil (Purple) */}
        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
          <button
            id="powerup-replace-btn"
            onClick={() => handleClick('replace')}
            disabled={disabled}
            className={`relative w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white border-1.5 transition-all shadow-md ${
              activePowerUp === 'replace'
                ? 'bg-gradient-to-b from-[#A78BFA] to-[#7C3AED] border-white ring-2 ring-purple-300 scale-105'
                : isLifelineShining
                ? 'bg-gradient-to-b from-[#A78BFA] to-[#7C3AED] border-yellow-200 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)] animate-bounce cursor-pointer'
                : inventory.replace > 0
                ? 'bg-gradient-to-b from-[#A78BFA] to-[#7C3AED] border-[#DDD6FE] hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-700/80 text-slate-400 border-slate-600 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title={inventory.replace > 0 ? 'Replace: Change any tile into any letter' : 'Refill Replace'}
          >
            <Edit3 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 drop-shadow" />
            {inventory.replace <= 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-white text-[7px] font-black flex items-center justify-center border border-white shadow-xs">
                +
              </span>
            )}
          </button>
          <div
            className={`text-[6.5px] xs:text-[7.5px] sm:text-[8px] font-black px-1 py-0.5 rounded-full whitespace-nowrap shadow-xs leading-none ${
              inventory.replace > 0 ? 'bg-[#6D28D9] text-white' : 'bg-amber-500 text-amber-950'
            }`}
          >
            {inventory.replace > 0 ? `${inventory.replace}` : '+'}
          </div>
        </div>

        {/* Shuffle (Turquoise) */}
        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
          <button
            id="powerup-rearrange-btn"
            onClick={() => handleClick('rearrange')}
            disabled={disabled}
            className={`relative w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white border-1.5 transition-all shadow-md ${
              isLifelineShining
                ? 'bg-gradient-to-b from-[#2DD4BF] to-[#0D9488] border-yellow-200 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)] animate-bounce cursor-pointer'
                : inventory.rearrange > 0
                ? 'bg-gradient-to-b from-[#2DD4BF] to-[#0D9488] border-[#99F6E4] hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-700/80 text-slate-400 border-slate-600 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title={inventory.rearrange > 0 ? 'Rearrange: Shuffle board tiles' : 'Refill Rearrange'}
          >
            <Shuffle className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 drop-shadow" />
            {inventory.rearrange <= 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-white text-[7px] font-black flex items-center justify-center border border-white shadow-xs">
                +
              </span>
            )}
          </button>
          <div
            className={`text-[6.5px] xs:text-[7.5px] sm:text-[8px] font-black px-1 py-0.5 rounded-full whitespace-nowrap shadow-xs leading-none ${
              inventory.rearrange > 0 ? 'bg-[#0F766E] text-white' : 'bg-amber-500 text-amber-950'
            }`}
          >
            {inventory.rearrange > 0 ? `${inventory.rearrange}` : '+'}
          </div>
        </div>

        {/* Hint / Clue (Magenta) */}
        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
          <button
            id="powerup-clue-btn"
            onClick={() => handleClick('clue')}
            disabled={disabled}
            className={`relative w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white border-1.5 transition-all shadow-md ${
              activePowerUp === 'clue'
                ? 'bg-gradient-to-b from-[#F472B6] to-[#DB2777] border-white ring-2 ring-pink-300 scale-105'
                : isLifelineShining
                ? 'bg-gradient-to-b from-[#F472B6] to-[#DB2777] border-yellow-200 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)] animate-bounce cursor-pointer'
                : inventory.clue > 0
                ? 'bg-gradient-to-b from-[#F472B6] to-[#DB2777] border-[#FBCFE8] hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-700/80 text-slate-400 border-slate-600 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title={inventory.clue > 0 ? 'Clue: Highlights best 1-move valid word' : 'Refill Clue'}
          >
            <Lightbulb className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 drop-shadow" />
            {inventory.clue <= 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-white text-[7px] font-black flex items-center justify-center border border-white shadow-xs">
                +
              </span>
            )}
          </button>
          <div
            className={`text-[6.5px] xs:text-[7.5px] sm:text-[8px] font-black px-1 py-0.5 rounded-full whitespace-nowrap shadow-xs leading-none ${
              inventory.clue > 0 ? 'bg-[#BE185D] text-white' : 'bg-amber-500 text-amber-950'
            }`}
          >
            {inventory.clue > 0 ? `${inventory.clue}` : '+'}
          </div>
        </div>

        {/* Refill Gift Box */}
        {onOpenPowerUpAd && (
          <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <button
              id="watch-ad-powerups-direct-btn"
              onClick={() => onOpenPowerUpAd()}
              disabled={disabled}
              className="w-7.5 h-7.5 xs:w-8.5 xs:h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 rounded-xl bg-gradient-to-b from-[#FBBF24] via-[#F59E0B] to-[#D97706] border-1.5 border-[#FEF08A] hover:from-amber-400 hover:to-orange-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Watch short ad to refill any power-up"
            >
              <Gift className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 drop-shadow" />
            </button>
            <div className="text-[6.5px] xs:text-[7.5px] sm:text-[8px] font-black px-1 py-0.5 rounded-full whitespace-nowrap shadow-xs bg-amber-500 text-amber-950 leading-none">
              Refill
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatTimerShort(seconds?: number): string {
  if (seconds === undefined) return '2:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Isolated so ONLY this small badge re-renders once a second in timer mode
 * -- not the rest of PowerUpBar (5 power-up buttons, lifeline shine sweep,
 * moves badge, etc.). See useTickingRefValue.ts for why this matters: a
 * naive `useTickingRefValue` call at the top of PowerUpBar would tick the
 * WHOLE component every second, which is exactly the per-second
 * re-render/repaint cost this refactor exists to eliminate.
 */
const PowerUpTimerBadge: React.FC<{ secondsRef?: { current: number }; isActive: boolean }> = ({
  secondsRef,
  isActive,
}) => {
  const timerSecondsRemaining = useTickingRefValue(secondsRef || { current: 120 }, isActive);
  return (
    <div
      id="powerup-timer-badge"
      className={`min-w-[62px] xs:min-w-[70px] sm:min-w-[82px] h-10 xs:h-11 sm:h-12 px-2 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border-2 shadow-[0_4px_14px_rgba(0,0,0,0.5)] cursor-default select-none transition-all ${
        (timerSecondsRemaining || 0) <= 20
          ? 'bg-gradient-to-b from-rose-600 via-red-600 to-rose-950 border-rose-300 animate-pulse'
          : 'bg-gradient-to-b from-[#F59E0B] via-[#D97706] to-[#92400E] border-[#FDE68A]'
      }`}
      title={`Time remaining: ${formatTimerShort(timerSecondsRemaining)}`}
    >
      <span className="text-sm xs:text-base sm:text-lg font-black text-white leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] font-mono">
        {formatTimerShort(timerSecondsRemaining)}
      </span>
      <span className="text-[7.5px] xs:text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-amber-100/90 mt-0.5 leading-none">
        TIME
      </span>
    </div>
  );
};


