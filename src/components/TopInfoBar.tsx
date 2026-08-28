import React from 'react';
import { X, Sparkles, Hammer, Edit3, ArrowLeftRight, Lightbulb, Target } from 'lucide-react';
import { BoardBanner, PowerUpType, Category } from '../types';

export interface SpecialTileInfo {
  title: string;
  icon: string;
  desc: string;
  accentColor: string;
  badgeBg: string;
}

interface TopInfoBarProps {
  specialTileInfo?: SpecialTileInfo | null;
  activePowerUp?: PowerUpType | null;
  pendingReplaceLetter?: string | null;
  selectedTileForSwap?: { row: number; col: number } | null;
  banner?: BoardBanner | null;
  tutorialTip?: string | null;
  category?: Category | null;
  onDismissTutorialTip?: () => void;
  onDismissBanner?: () => void;
}

export const TopInfoBar: React.FC<TopInfoBarProps> = ({
  specialTileInfo,
  activePowerUp,
  pendingReplaceLetter,
  selectedTileForSwap,
  banner,
  tutorialTip,
  category,
  onDismissTutorialTip,
  onDismissBanner,
}) => {
  // Determine what to display based on hierarchy of urgency
  let content: React.ReactNode = null;

  if (specialTileInfo) {
    // 1. Special Tile Touched / Selected (e.g. Bomb, Laser Card, Shining Star, Electrified)
    content = (
      <div className={`w-full max-w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border ${specialTileInfo.accentColor} backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex items-center justify-between gap-2 text-white animate-scale-in`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg sm:text-xl shrink-0 drop-shadow animate-bounce">{specialTileInfo.icon}</span>
          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-wider text-amber-300 shrink-0">
                {specialTileInfo.title}
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-white/20 text-white/90 shrink-0 border border-white/20">
                Active Info
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/95 truncate">
              {specialTileInfo.desc}
            </span>
          </div>
        </div>
      </div>
    );
  } else if (activePowerUp) {
    // 2. Active Power-up Instruction Mode
    if (activePowerUp === 'hammer') {
      content = (
        <div className="w-full max-w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border-2 border-amber-400 bg-amber-950/90 text-amber-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 animate-scale-in">
          <Hammer className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
          <span className="text-[11px] sm:text-xs font-black truncate">
            Giant Hammer Active: Tap any tile on the board to smash a 3×3 block!
          </span>
        </div>
      );
    } else if (activePowerUp === 'replace') {
      content = (
        <div className="w-full max-w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border-2 border-purple-400 bg-purple-950/90 text-purple-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 animate-scale-in">
          <Edit3 className="w-4 h-4 text-purple-300 shrink-0 animate-bounce" />
          <span className="text-[11px] sm:text-xs font-black truncate">
            {pendingReplaceLetter
              ? `Replace Active: Tap any tile to transform it into "${pendingReplaceLetter}"`
              : 'Replace Active: Tap any tile to choose a new letter'}
          </span>
        </div>
      );
    } else if (activePowerUp === 'swap') {
      content = (
        <div className="w-full max-w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border-2 border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 animate-scale-in">
          <ArrowLeftRight className="w-4 h-4 text-cyan-300 shrink-0 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-black truncate">
            {selectedTileForSwap
              ? 'Swap Active: Select 2nd tile to swap positions'
              : 'Swap Active: Tap any 1st tile on board'}
          </span>
        </div>
      );
    }
  } else if (banner) {
    // 3. Action / Story Banner Notification (Points, Word creations, Special tile spawns)
    content = (
      <div
        key={banner.id}
        className="w-full max-w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border-2 border-amber-300/90 bg-gradient-to-r from-[#0C2158]/95 via-[#1E3A8A]/95 to-[#0C2158]/95 backdrop-blur-md text-white shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_15px_rgba(251,191,36,0.3)] flex items-center justify-between gap-2 animate-scale-in"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg shrink-0 animate-bounce">{banner.icon || '✨'}</span>
          <div className="flex flex-col text-left min-w-0">
            <span className="font-black text-[11px] sm:text-xs text-amber-300 truncate">
              {banner.text}
            </span>
          </div>
        </div>
        {banner.subtext && (
          <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 shrink-0 tracking-wider">
            {banner.subtext}
          </span>
        )}
      </div>
    );
  } else if (tutorialTip) {
    // 4. Beginner Tutorial Tip
    content = (
      <div className="w-full max-w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-between gap-2 animate-scale-in">
        <div className="flex items-center gap-1.5 min-w-0">
          <Lightbulb className="w-4 h-4 text-slate-900 shrink-0 fill-amber-400" />
          <span className="font-black text-[11px] sm:text-xs truncate tracking-tight text-slate-950">
            {tutorialTip}
          </span>
        </div>
        {onDismissTutorialTip && (
          <button
            type="button"
            onClick={onDismissTutorialTip}
            className="p-1 rounded-full hover:bg-black/15 active:scale-90 text-slate-950 transition-colors shrink-0 cursor-pointer"
            title="Dismiss Tip"
            aria-label="Dismiss Tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  } else {
    // 5. First Round Tip: Dynamic Category Goal Tip
    const targetCount = category?.targetCount || 5;
    const catName = category?.name || 'Theme';
    const catIcon = category?.icon || '🎯';
    const isTimerMode = category?.gameMode === 'timer';

    content = (
      <div className="w-full max-w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border border-[#38BDF8]/40 bg-gradient-to-r from-[#071948]/95 via-[#0C276D]/95 to-[#071948]/95 backdrop-blur-md text-white shadow-[0_3px_12px_rgba(14,165,233,0.2)] flex items-center justify-between gap-2 text-xs animate-fade-in">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0 drop-shadow animate-pulse">{catIcon}</span>
          <span className="text-[11px] sm:text-xs font-black text-slate-100 truncate">
            {isTimerMode ? (
              <>Find as many words related to <span className="text-amber-300 font-black uppercase tracking-wide">"{catName}"</span> as you can!</>
            ) : (
              <>Find {targetCount} words related to <span className="text-amber-300 font-black uppercase tracking-wide">"{catName}"</span>!</>
            )}
          </span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 shrink-0 shadow-inner">
          TIP
        </span>
      </div>
    );
  }

  return (
    <div
      id="top-informational-popups-bar"
      className="w-full min-h-[38px] sm:min-h-[42px] flex items-center justify-center shrink-0 px-1 transition-all duration-300"
    >
      {content}
    </div>
  );
};
