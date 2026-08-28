import React from 'react';
import { X, Bomb, CreditCard, Sparkles, Zap, Flame, Hammer, Shuffle, Lightbulb, ArrowLeftRight, Edit3, CheckCircle2, Trophy, HelpCircle } from 'lucide-react';
import { HammerIcon } from './HammerIcon';
import { haptics } from '../utils/haptics';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    haptics.tap();
    onClose();
  };

  return (
    <div
      id="help-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      {/* Outer Sky Blue Frame Matching the Board Theme */}
      <div
        id="help-modal-outer-frame"
        className="w-full max-w-2xl relative p-2 sm:p-2.5 rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_20px_50px_rgba(2,132,199,0.5),inset_0_2px_4px_rgba(255,255,255,0.7)] max-h-[92vh] flex flex-col"
      >
        {/* Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />

        {/* Inner Midnight Navy Container */}
        <div
          id="help-modal-card"
          className="bg-[#071330] rounded-2xl sm:rounded-[20px] p-4 sm:p-6 border border-[#0F2864] shadow-[inset_0_3px_12px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-white flex-1 max-h-[calc(92vh-20px)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white flex items-center justify-center font-black shadow-md border border-[#7DD3FC]">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)]">
                  How to Play AlphaBlast
                </h2>
                <p className="text-xs font-semibold text-cyan-200/70">
                  Rules, Special Tiles & Power-Ups
                </p>
              </div>
            </div>

            <button
              id="help-modal-close-btn"
              onClick={handleClose}
              className="p-2 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content sections */}
          <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-3.5 text-xs sm:text-sm">
            {/* Section 1: Core Mechanics */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner">
              <h3 className="font-black text-cyan-300 text-xs sm:text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                1. Gameplay & Objectives
              </h3>
              <ul className="space-y-1.5 text-blue-100/90 list-disc list-inside font-medium leading-relaxed">
                <li>
                  <strong className="text-white">Tap to Select, Then Swap:</strong> Tap a letter to pop it out and select it, then tap any adjacent letter to swap them.
                </li>
                <li>
                  <strong className="text-white">Words in All 8 Directions:</strong> Valid words are recognized horizontally, vertically, diagonally, upwards, downwards, or backwards!
                </li>
                <li>
                  <strong className="text-white">Single-Use Constraint:</strong> Each word can only be formed <strong className="text-cyan-300">once</strong> per round.
                </li>
                <li>
                  <strong className="text-white">Moves & Bonus Moves:</strong> Each round starts with <strong className="text-cyan-300">7 moves</strong> (capped at 7 max). Every valid formed word grants <strong className="text-emerald-400">+5 bonus moves</strong> (not to exceed 7 max)!
                </li>
                <li>
                  <strong className="text-white">Special Power Tiles:</strong> 4-letter words leave a <strong className="text-rose-400">Bomb (Red)</strong>, 5-letter words create an <strong className="text-purple-400">Electrocute Tile (Violet)</strong>, and 6+ letters trigger a full <strong className="text-amber-400">Fiery Inferno Board Wipe</strong>!
                </li>
              </ul>
            </div>

            {/* Section 2: Word Length Power-ups */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner">
              <h3 className="font-black text-cyan-300 text-xs sm:text-sm mb-2.5">
                2. Word Length Power-Ups
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 4-Letter Bomb */}
                <div className="bg-[#071330] border border-rose-500/40 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-rose-300 font-black mb-1">
                    <Bomb className="w-4 h-4 text-rose-400" />
                    <span>4-Letter: Bomb (Red)</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 font-medium leading-normal">
                    Leaves a Red Bomb tile (no letter text). When swapped with any adjacent tile, it <strong className="text-white">destroys a 3 × 3 area</strong> centered on that tile!
                  </p>
                </div>

                {/* 5-Letter Special Card */}
                <div className="bg-[#071330] border border-purple-500/40 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-purple-300 font-black mb-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>5-Letter: Electrocute (Violet)</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 font-medium leading-normal">
                    Leaves a Violet Electrocute tile (no letter text). Swapping it with any letter <strong className="text-white">destroys all occurrences of that letter</strong> across the board with electric discharge!
                  </p>
                </div>

                {/* 6+ Letter Board Wipe */}
                <div className="bg-[#071330] border border-amber-500/40 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-amber-300 font-black mb-1">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>6+ Letter: Fire Wipe</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 font-medium leading-normal">
                    Ignites the entire board in flames — <strong className="text-white">each letter catches fire and burns away</strong> before refilling the board!
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Identical Letter Specials */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner">
              <h3 className="font-black text-cyan-300 text-xs sm:text-sm mb-2.5">
                3. Identical Letter Systems (Retain Letters)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Highlighted Tile */}
                <div className="bg-[#071330] border border-sky-500/40 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-sky-300 font-black mb-1">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>Swap 2 Same Letters (Blue Laser)</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 font-medium leading-normal">
                    Creates a <strong className="text-sky-300">Blue Laser Tile</strong> (retains its letter). When matched in a word, it destroys the <strong className="text-white">perpendicular line</strong> (horizontal word clears column; vertical clears row).
                  </p>
                </div>

                {/* Shining Tile */}
                <div className="bg-[#071330] border border-yellow-500/40 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-yellow-300 font-black mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Form 3 Same Letters (Orange Star)</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 font-medium leading-normal">
                    Creates an <strong className="text-amber-300">Orange Shining Star Tile</strong> (retains its letter). When matched in a word, triggers a <strong className="text-white">3 × 3 supernova blast</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Power-Up Inventory & Refills */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner">
              <h3 className="font-black text-cyan-300 text-xs sm:text-sm mb-2">
                4. Power-Up Inventory & Rewarded Refills
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs mb-3">
                <div className="bg-[#071330] p-2 rounded-xl border border-sky-500/40 flex flex-col items-center justify-center">
                  <div className="w-6 h-6 mb-1">
                    <HammerIcon className="w-6 h-6" showBurst={false} />
                  </div>
                  <span className="font-black block text-white">Hammer</span>
                  <span className="text-[10px] text-cyan-200/70">Smash 3×3</span>
                </div>
                <div className="bg-[#071330] p-2 rounded-xl border border-cyan-500/40">
                  <ArrowLeftRight className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <span className="font-black block text-white">Swap</span>
                  <span className="text-[10px] text-cyan-200/70">Swap any 2</span>
                </div>
                <div className="bg-[#071330] p-2 rounded-xl border border-violet-500/40">
                  <Edit3 className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                  <span className="font-black block text-white">Replace</span>
                  <span className="text-[10px] text-cyan-200/70">Pick letter</span>
                </div>
                <div className="bg-[#071330] p-2 rounded-xl border border-emerald-500/40">
                  <Shuffle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="font-black block text-white">Rearrange</span>
                  <span className="text-[10px] text-cyan-200/70">Shuffles all</span>
                </div>
                <div className="bg-[#071330] p-2 rounded-xl border border-rose-500/40 col-span-2 sm:col-span-1">
                  <Lightbulb className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                  <span className="font-black block text-white">Clue</span>
                  <span className="text-[10px] text-cyan-200/70">Hints move</span>
                </div>
              </div>
              <p className="text-blue-100/80 text-xs font-medium">
                Need more power-ups or moves? Tap <strong className="text-amber-300">Refill</strong> or visit the <strong className="text-cyan-300">Shop</strong> to acquire extra power-ups and diamond packs!
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-3 mt-2 border-t border-[#1E3A8A] shrink-0 text-center">
            <button
              onClick={handleClose}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] hover:from-[#7DD3FC] hover:to-[#0EA5E9] border-t border-white/80 border-b-4 border-b-[#034C70] active:border-b active:translate-y-[3px] text-white font-black text-sm tracking-wider shadow-md transition-all cursor-pointer"
            >
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

