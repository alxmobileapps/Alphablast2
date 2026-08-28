import React from 'react';
import { X, Sparkles, Edit3 } from 'lucide-react';
import { playTileSelect } from '../utils/audio';
import { haptics } from '../utils/haptics';

interface LetterPickerModalProps {
  isOpen: boolean;
  targetTile: { row: number; col: number; currentLetter: string } | null;
  onSelectLetter: (letter: string) => void;
  onClose: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const LetterPickerModal: React.FC<LetterPickerModalProps> = ({
  isOpen,
  targetTile,
  onSelectLetter,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePick = (letter: string) => {
    playTileSelect();
    haptics.tap();
    onSelectLetter(letter);
  };

  return (
    <div
      id="letter-picker-modal-backdrop"
      className="fixed inset-0 z-[100] bg-[#071330]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
    >
      <div
        id="letter-picker-card"
        className="bg-[#0B1E52] border-2 sm:border-3 border-purple-400/80 rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-[0_25px_60px_rgba(124,58,237,0.4)] relative text-white animate-scale-in flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Close Button */}
        <button
          id="letter-picker-close-btn"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          title="Cancel"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/25 border border-purple-400/50 text-purple-300 flex items-center justify-center font-black shadow-inner shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div className="pr-6">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5 leading-tight">
              <span>Choose New Letter</span>
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            </h2>
            <p className="text-xs text-purple-200 font-normal leading-snug mt-0.5">
              {targetTile
                ? `Transform Tile at (${targetTile.row + 1}, ${targetTile.col + 1})`
                : 'Select which letter (A-Z) you want to place on the board'}
            </p>
          </div>
        </div>

        {/* Current vs Replacement Indicator Banner */}
        <div className="bg-[#071330]/90 border border-purple-400/30 rounded-2xl p-2.5 sm:p-3 mb-3 flex items-center justify-between shadow-inner shrink-0">
          {targetTile ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-200">Current Tile:</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-white via-slate-100 to-slate-200 border border-white text-[#0F172A] font-black text-xl flex items-center justify-center shadow-md">
                {targetTile.currentLetter || '?'}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg">✏️</span>
              <span className="text-xs font-bold text-purple-200">
                Pick a letter to transform any tile:
              </span>
            </div>
          )}
          <div className="text-[10px] sm:text-xs font-black text-purple-300 uppercase tracking-wide bg-purple-900/50 px-2 py-1 rounded-lg border border-purple-500/30">
            Tap Letter ↴
          </div>
        </div>

        {/* A-Z Letter Grid (3D tactile blocks) */}
        <div className="overflow-y-auto custom-scrollbar flex-1 pr-0.5 mb-3">
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {ALPHABET.map((letter) => {
              const isCurrent = targetTile?.currentLetter === letter;
              const isVowel = ['A', 'E', 'I', 'O', 'U'].includes(letter);

              return (
                <button
                  key={letter}
                  id={`letter-pick-${letter}`}
                  onClick={() => handlePick(letter)}
                  className={`h-11 sm:h-12 rounded-xl font-black text-base sm:text-lg transition-all duration-150 flex items-center justify-center shadow-md border-b-[3px] active:translate-y-0.5 active:border-b-[1px] cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600 text-white border-purple-800 ring-2 ring-purple-400'
                      : isVowel
                      ? 'bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950 border-amber-400 hover:brightness-110'
                      : 'bg-gradient-to-b from-white to-slate-200 text-slate-900 border-slate-400 hover:brightness-110'
                  }`}
                  title={`Select ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Cancel */}
        <button
          id="letter-picker-cancel-footer-btn"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white font-semibold text-xs transition-colors border border-white/15 cursor-pointer shrink-0"
        >
          Cancel Replace
        </button>
      </div>
    </div>
  );
};
