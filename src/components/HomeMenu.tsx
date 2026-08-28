import React, { useState } from 'react';
import {
  Play,
  User,
  Trophy,
  HelpCircle,
  Settings,
  Sparkles,
  ChevronRight,
  Layers,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { Category } from '../types';
import { GameProgress } from '../utils/gameProgress';
import { getUserProfile } from '../utils/leaderboard';
import { haptics } from '../utils/haptics';
import alphablastLogoImage from '../assets/logo.png';

interface HomeMenuProps {
  currentCategory: Category;
  gameProgress: GameProgress;
  score: number;
  onPlayGame: () => void;
  onOpenCategories: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenShop?: () => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({
  currentCategory,
  gameProgress,
  score,
  onPlayGame,
  onOpenCategories,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenHelp,
  onOpenSettings,
  onOpenShop,
}) => {
  const profile = getUserProfile();

  const completedCount = gameProgress.completedCategoryIds.length;
  const totalStars = Object.values(gameProgress.categoryStars || {}).reduce<number>(
    (acc, curr) => acc + (typeof curr === 'number' ? curr : Number(curr) || 0),
    0
  );

  const handleAction = (action: () => void) => {
    haptics.tap();
    action();
  };

  return (
    <div
      id="game-home-menu"
      className="h-full flex-1 w-full bg-[#050D24] text-white flex flex-col items-center justify-between p-2.5 sm:p-4 select-none overflow-y-auto sm:overflow-hidden relative max-w-lg mx-auto"
    >
      {/* Background Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-b from-[#0EA5E9]/25 via-[#1E3A8A]/15 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-purple-900/20 pointer-events-none blur-3xl" />

      {/* Top Profile & Currency Bar */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 z-10 pt-1 sm:pt-2 shrink-0">
        {/* Profile Pill */}
        <button
          onClick={() => handleAction(onOpenProfile)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#0C2158]/95 to-[#162E6C]/95 hover:from-[#132E75] hover:to-[#1E3A8A] border-2 border-[#38BDF8]/60 hover:border-[#38BDF8] rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_4px_14px_rgba(14,165,233,0.3)] backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
          title="View & Edit Player Profile"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] flex items-center justify-center text-sm sm:text-base shadow-inner border border-white/40 group-hover:scale-105 transition-transform shrink-0">
            {profile.avatar || '👑'}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-cyan-300/90 leading-none">
              PLAYER
            </span>
            <span className="text-xs sm:text-sm font-black text-white truncate max-w-[100px] sm:max-w-[130px] leading-tight mt-0.5 drop-shadow">
              {profile.name || 'Player 1'}
            </span>
          </div>
        </button>

        {/* Currency Widget */}
        <button
          onClick={() => onOpenShop && handleAction(onOpenShop)}
          className="flex items-center gap-1.5 sm:gap-2.5 bg-gradient-to-r from-[#0C2158]/95 to-[#162E6C]/95 hover:from-[#132E75] hover:to-[#1E3A8A] border-2 border-amber-400/70 hover:border-amber-400 rounded-2xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_4px_16px_rgba(245,158,11,0.25)] backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
          title="Shop & Bank: Add Coins & Diamonds"
        >
          <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-amber-300 drop-shadow">
            <span className="text-sm sm:text-base group-hover:scale-110 transition-transform">🪙</span>
            <span>{gameProgress.coins || 0}</span>
          </div>
          <div className="h-4 sm:h-5 w-[1.5px] bg-blue-400/40 rounded-full" />
          <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-cyan-300 drop-shadow">
            <span className="text-sm sm:text-base group-hover:scale-110 transition-transform">💎</span>
            <span>{gameProgress.diamonds || 0}</span>
          </div>
          {/* Prominent Plus Button Indicator */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-[0_2px_8px_rgba(245,158,11,0.5)] border border-white/80 ml-0.5 group-hover:scale-110 transition-transform shrink-0">
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
          </div>
        </button>
      </div>

      {/* Center Container: Official AlphaBlast Logo & Main Game Menu Card */}
      <div className="w-full max-w-md my-auto flex flex-col items-center z-10 py-1 sm:py-2">
        {/* AlphaBlast Logo - Full Width Matching Board */}
        <div className="flex flex-col items-center mb-1.5 sm:mb-2 relative w-full px-0 sm:px-1">
          <div className="relative group w-full flex justify-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-amber-400/30 to-sky-500/30 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition duration-300" />
            <img
              src={alphablastLogoImage}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + '/logo.png') {
                  target.src = '/logo.png';
                }
              }}
              alt="AlphaBlast Official Logo"
              referrerPolicy="no-referrer"
              className="relative w-full max-h-[80px] sm:max-h-[105px] h-auto object-contain drop-shadow-[0_8px_24px_rgba(14,165,233,0.6)] transform transition duration-300 hover:scale-[1.01]"
            />
          </div>
        </div>

        {/* Outer Frame Matching the Game Board Theme */}
        <div
          id="menu-outer-frame"
          className="w-full relative p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_16px_40px_rgba(2,132,199,0.4),inset_0_2px_4px_rgba(255,255,255,0.7)]"
        >
          {/* Corner Stud Accents */}
          <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
          <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
          <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />

          {/* Inner Midnight Navy Container */}
          <div
            id="menu-inner-card"
            className="bg-[#071330] rounded-xl sm:rounded-[18px] p-2.5 sm:p-3 border border-[#0F2864] shadow-[inset_0_3px_12px_rgba(0,0,0,0.8)] space-y-1.5 sm:space-y-2 relative"
          >
            {/* 1. PRIMARY PLAY / GAME BOARD BUTTON */}
            <button
              id="menu-btn-play"
              onClick={() => handleAction(onPlayGame)}
              className="w-full group relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] hover:from-[#7DD3FC] hover:via-[#38BDF8] hover:to-[#0EA5E9] border-t-2 border-white/90 border-b-4 border-b-[#034C70] active:border-b-2 active:translate-y-[2px] shadow-[0_6px_16px_rgba(14,165,233,0.5)] transition-all cursor-pointer flex items-center justify-between text-left overflow-hidden"
            >
              {/* Highlight Shimmer */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

              <div className="flex items-center gap-2.5 relative z-10 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                  <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
                </div>
                <div className="text-base sm:text-lg font-black text-white leading-tight truncate drop-shadow">
                  Game Board
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 2. DEDICATED CATEGORIES BUTTON */}
            <button
              id="menu-btn-categories"
              onClick={() => handleAction(onOpenCategories)}
              className="w-full group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] hover:border-[#38BDF8] active:translate-y-[1px] shadow-inner transition-all cursor-pointer flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#071330] border border-[#38BDF8]/40 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="text-xs sm:text-sm font-black text-white leading-tight">
                  Categories
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 3. DEDICATED STORE & BANK BUTTON */}
            <button
              id="menu-btn-store"
              onClick={() => onOpenShop && handleAction(onOpenShop)}
              className="w-full group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] hover:border-amber-400 active:translate-y-[1px] shadow-inner transition-all cursor-pointer flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#071330] border border-amber-400/40 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight flex items-center gap-1.5">
                    <span>Store & Bank</span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 px-1.5 py-0.2 rounded-md shadow-xs">
                      STORE
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-amber-200/70 font-semibold truncate">
                    Power-ups, coins, diamonds & packs
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 4. PROFILE BUTTON (Username & Category Stats) */}
            <button
              id="menu-btn-profile"
              onClick={() => handleAction(onOpenProfile)}
              className="w-full group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] hover:border-[#38BDF8] active:translate-y-[1px] shadow-inner transition-all cursor-pointer flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#071330] border border-[#38BDF8]/40 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight">
                    Profile & Stats
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-cyan-200/70 font-semibold truncate">
                    {profile.name || 'Player 1'} • ★ {totalStars} Total Stars
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 5. LEADERBOARD BUTTON */}
            <button
              id="menu-btn-leaderboard"
              onClick={() => handleAction(onOpenLeaderboard)}
              className="w-full group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] hover:border-amber-400 active:translate-y-[1px] shadow-inner transition-all cursor-pointer flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#071330] border border-amber-400/40 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  <Trophy className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight">
                    Leaderboard
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-amber-200/70 font-semibold truncate">
                    Global rankings & high scores
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 6. HOW TO PLAY BUTTON */}
            <button
              id="menu-btn-how-to-play"
              onClick={() => handleAction(onOpenHelp)}
              className="w-full group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] hover:border-emerald-400 active:translate-y-[1px] shadow-inner transition-all cursor-pointer flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#071330] border border-emerald-400/40 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight">
                    How To Play
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-200/70 font-semibold truncate">
                    Rules, swaps, bombs & specials
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400/60 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 7. SETTINGS BUTTON */}
            <button
              id="menu-btn-settings"
              onClick={() => handleAction(onOpenSettings)}
              className="w-full group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] hover:border-indigo-400 active:translate-y-[1px] shadow-inner transition-all cursor-pointer flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#071330] border border-indigo-400/40 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  <Settings className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight">
                    Settings
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-indigo-200/70 font-semibold truncate">
                    Audio FX, music, haptics & data
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-400/60 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="text-center text-[9px] sm:text-[10px] text-cyan-300/40 font-medium z-10 pb-0.5 shrink-0">
        AlphaBlast • Matching & Word Play
      </div>
    </div>
  );
};
