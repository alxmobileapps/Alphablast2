import React from 'react';
import { Coins, Gem, X, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { playTileSelect } from '../utils/audio';

export type CurrencyPromptType = 'buy_coins_with_diamonds' | 'buy_more_diamonds' | null;

interface CurrencyPromptModalProps {
  isOpen: boolean;
  type: CurrencyPromptType;
  coins?: number;
  diamonds?: number;
  onConfirm: () => void;
  onClose: () => void;
}

export const CurrencyPromptModal: React.FC<CurrencyPromptModalProps> = ({
  isOpen,
  type,
  coins = 0,
  diamonds = 0,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !type) return null;

  const isBuyCoins = type === 'buy_coins_with_diamonds';

  const handleConfirm = () => {
    haptics.specialCreated();
    playTileSelect();
    onConfirm();
  };

  const handleCancel = () => {
    haptics.tap();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-[#0B1E52] border-3 border-[#1E3A8A] rounded-3xl max-w-sm w-full shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col text-white animate-scale-in">
        {/* Decorative Top Accent Glow */}
        <div
          className={`absolute -top-12 -left-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-40 ${
            isBuyCoins ? 'bg-amber-400' : 'bg-cyan-400'
          }`}
        />
        <div
          className={`absolute -bottom-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-30 ${
            isBuyCoins ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
        />

        {/* Close Icon */}
        <button
          onClick={handleCancel}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-xl bg-[#081844] hover:bg-[#122b75] border border-[#204090] text-blue-200 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Body */}
        <div className="p-6 text-center flex flex-col items-center relative z-10">
          {/* Icon Badge */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4 border-2 ${
              isBuyCoins
                ? 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 border-yellow-200 text-amber-950 shadow-amber-500/30 animate-bounce'
                : 'bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-600 border-cyan-200 text-slate-950 shadow-cyan-500/30 animate-bounce'
            }`}
          >
            {isBuyCoins ? '🪙' : '💎'}
          </div>

          {/* Currency Balance Badge */}
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-[#081844] border border-[#1E3A8A] text-xs font-mono mb-3">
            <span className="text-amber-300 flex items-center gap-1 font-black">
              <span>🪙</span>
              <span>{coins}</span>
            </span>
            <span className="text-blue-300/40">•</span>
            <span className="text-cyan-300 flex items-center gap-1 font-black">
              <span>💎</span>
              <span>{diamonds}</span>
            </span>
          </div>

          {/* Main Question (Strictly per user requirement) */}
          <h3 className="text-lg sm:text-xl font-black text-white leading-snug mb-2">
            {isBuyCoins
              ? 'Do you want to buy coins using diamonds?'
              : 'Do you want to buy more diamonds?'}
          </h3>

          {/* Subtext explanation */}
          <p className="text-xs text-blue-200/90 leading-relaxed mb-6 px-2">
            {isBuyCoins
              ? 'Your coin balance is insufficient. You can convert your diamonds into coins at the Store.'
              : 'Your diamond balance is insufficient. Top up with diamond packs in the Store.'}
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleCancel}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#0F2868] hover:bg-[#16388F] text-blue-200 hover:text-white font-bold text-xs border border-[#23469E] transition-all active:scale-95 cursor-pointer order-2 sm:order-1"
            >
              No, Cancel
            </button>

            <button
              onClick={handleConfirm}
              className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer order-1 sm:order-2 ${
                isBuyCoins
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-amber-950 border-2 border-yellow-200 shadow-amber-500/40'
                  : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-sky-300 text-slate-950 border-2 border-cyan-200 shadow-cyan-500/40'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Yes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
