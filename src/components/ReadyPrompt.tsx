import React, { useEffect } from 'react';
import { Play, Home, Sparkles } from 'lucide-react';
import { Category } from '../types';
import { playPowerUp, playTileSelect } from '../utils/audio';

interface ReadyPromptProps {
  isOpen: boolean;
  category: Category;
  onStart: () => void;
  onHome?: () => void;
}

export const ReadyPrompt: React.FC<ReadyPromptProps> = ({
  isOpen,
  category,
  onStart,
  onHome,
}) => {
  // Listen for Enter / Space key to quick-start
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleGo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGo = () => {
    try {
      playPowerUp();
    } catch {
      // Audio context might be waiting for interaction
    }
    onStart();
  };

  const handleHomeClick = () => {
    try {
      playTileSelect();
    } catch {
      // Audio fallback
    }
    if (onHome) {
      onHome();
    }
  };

  return (
    <div
      id="ready-prompt-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/20 backdrop-blur-[2px] flex items-center justify-center p-4 select-none animate-fade-in"
    >
      {/* Outer Sky Blue Frame Matching the Game Board Container */}
      <div
        id="ready-prompt-outer-frame"
        className="w-full max-w-xs sm:max-w-sm relative p-2 sm:p-2.5 rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_20px_50px_rgba(2,132,199,0.5),inset_0_2px_4px_rgba(255,255,255,0.7)] transform animate-in fade-in zoom-in duration-200"
      >
        {/* Subtle Corner Accents matching the board */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />

        {/* Inner Midnight Navy Board Canvas */}
        <div
          id="ready-prompt-card"
          className="bg-[#071330] rounded-2xl sm:rounded-[20px] p-6 sm:p-7 border border-[#0F2864] shadow-[inset_0_3px_12px_rgba(0,0,0,0.8)] relative overflow-hidden text-center"
        >
          {/* Subtle Ambient Electric Glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

          {/* Category Preview Pill with 2-second Zoom In + Shining Emphasis */}
          <div className="relative inline-flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#0C2158] border-2 border-sky-400/80 mb-4 shadow-inner overflow-hidden animate-category-zoom-shine select-none max-w-full">
            {/* Shining light beam traversing across */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none animate-shine-beam" />

            {/* Sparkle Gleam Icon Left */}
            <Sparkles className="w-4 h-4 text-amber-300 animate-sparkle-gleam pointer-events-none shrink-0" />

            <span className="text-xl sm:text-2xl leading-none drop-shadow relative z-10">{category.icon || '🎯'}</span>
            <span className="text-sm sm:text-base font-black text-white tracking-wide text-center relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] uppercase">
              {category.name}
            </span>

            {/* Sparkle Gleam Icon Right */}
            <Sparkles className="w-4 h-4 text-sky-300 animate-sparkle-gleam pointer-events-none shrink-0" style={{ animationDelay: '0.2s' }} />
          </div>

          {/* Display Text: "Ready?" matching board tile letter styling */}
          <h2 className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(56,189,248,0.7)] tracking-tight mb-2 flex items-center justify-center gap-2">
            <span>Ready?</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-cyan-200/80 mb-6 max-w-[240px] mx-auto leading-relaxed">
            Form words in any of 8 directions. The timer starts when you press GO!
          </p>

          {/* Action Row: Small Home Button + "GO!" Button with 3D tactile finish */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full">
            {onHome && (
              <button
                id="ready-prompt-home-button"
                onClick={handleHomeClick}
                title="Return to Home Menu"
                className="h-[54px] sm:h-[60px] w-[54px] sm:w-[60px] shrink-0 rounded-2xl bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] hover:from-[#334155] hover:to-[#0F172A] border-t-2 border-l border-slate-500/70 border-r border-slate-800 border-b-[5px] border-b-black active:border-b-[2px] active:translate-y-[3px] text-slate-200 hover:text-white shadow-lg transition-all duration-150 flex items-center justify-center cursor-pointer group"
              >
                <Home className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300 group-hover:scale-110 drop-shadow transition-transform" />
              </button>
            )}

            <button
              id="ready-prompt-go-button"
              onClick={handleGo}
              autoFocus
              className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] hover:from-[#7DD3FC] hover:to-[#0EA5E9] border-t-2 border-l border-white/80 border-r border-[#075985] border-b-[5px] border-b-[#034C70] active:border-b-[2px] active:translate-y-[3px] text-white font-black text-2xl sm:text-3xl tracking-wider shadow-[0_8px_25px_rgba(2,132,199,0.6)] transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white transition-transform group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
              <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">GO!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
