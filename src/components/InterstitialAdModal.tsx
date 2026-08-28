import React, { useState, useEffect } from 'react';
import { Play, Sparkles, X, Star, Shield, Zap, Flame, Crown, Volume2, VolumeX } from 'lucide-react';
import { showUniversalInterstitialAd } from '../utils/universalAds';
import { haptics } from '../utils/haptics';

interface InterstitialAdModalProps {
  isOpen: boolean;
  targetCategoryName?: string;
  hasRemovedAds?: boolean;
  onAdCompleted: () => void;
  onOpenShop?: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  targetCategoryName,
  hasRemovedAds = false,
  onAdCompleted,
  onOpenShop,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isInteractivePlayed, setIsInteractivePlayed] = useState(false);
  const [comboScore, setComboScore] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (hasRemovedAds) {
        onAdCompleted();
        return;
      }

      // Trigger Universal Interstitial (H5 Game Ads, Native AdMob, etc.)
      showUniversalInterstitialAd({
        name: 'round_transition',
      });

      setSecondsRemaining(5);
      setCanSkip(false);
      setIsInteractivePlayed(false);
      setComboScore(0);
    }
  }, [isOpen, hasRemovedAds, onAdCompleted]);

  // 5-second countdown
  useEffect(() => {
    if (!isOpen || hasRemovedAds) return;

    let timer: NodeJS.Timeout;
    if (secondsRemaining > 0) {
      timer = setTimeout(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else {
      setCanSkip(true);
    }

    return () => clearTimeout(timer);
  }, [isOpen, secondsRemaining, hasRemovedAds]);

  if (!isOpen || hasRemovedAds) return null;

  const handleClose = () => {
    if (!canSkip) return;
    haptics.tap();
    onAdCompleted();
  };

  const handleInteractiveTap = () => {
    haptics.fireCrackle();
    setComboScore((prev) => prev + 100);
    setIsInteractivePlayed(true);
  };

  return (
    <div
      id="interstitial-ad-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none animate-fade-in text-white"
    >
      {/* Top Bar: AD Tag, Category Next Preview & Countdown / Close */}
      <div className="w-full max-w-lg flex items-center justify-between gap-3 mb-2 sm:mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-black text-[11px] font-black px-2 py-0.5 rounded shadow-sm">
            AD
          </span>
          <span className="text-xs text-slate-300 font-semibold truncate">
            {targetCategoryName ? `Next: "${targetCategoryName}"` : 'Sponsored Interstitial'}
          </span>
        </div>

        {/* Skip / Close Countdown Button */}
        <div>
          {canSkip ? (
            <button
              id="interstitial-close-btn"
              onClick={handleClose}
              className="bg-white text-slate-900 hover:bg-amber-400 font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
            >
              <span>Continue to Game</span>
              <X className="w-4 h-4 text-slate-900 font-bold" />
            </button>
          ) : (
            <div className="bg-slate-800/90 text-slate-300 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Skip in {secondsRemaining}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Main High-Energy Ad Container */}
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#0d1c3a] to-slate-950 border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Glowing Background FX */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Game Promotion Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Featured Game Showcase
          </div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-1 shadow-xl mb-3 flex items-center justify-center transform hover:rotate-3 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
              ⚔️
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
            Kingdom Clash: Battle Quest
          </h2>

          <div className="flex items-center gap-2 mt-1 mb-2">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-amber-300">4.9 (2.4M Reviews)</span>
            <span className="text-xs text-slate-400">• Strategy RPG</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-4">
            Build your empire, forge alliances, and dominate real-time multiplayer kingdom battles!
          </p>
        </div>

        {/* Interactive Mini-Demo Teaser */}
        <div className="relative z-10 w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 mb-5 shadow-inner">
          <div className="text-[11px] font-bold text-cyan-300 flex items-center justify-between mb-2">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Mini Playable Demo
            </span>
            <span className="text-amber-400 font-black">Score: {comboScore}</span>
          </div>

          <div className="flex justify-center gap-3">
            {['💥 BLAST', '⚡ STRIKE', '🔥 INFERNO'].map((action, i) => (
              <button
                key={i}
                onClick={handleInteractiveTap}
                className="bg-gradient-to-b from-slate-700 to-slate-800 hover:from-cyan-600 hover:to-blue-700 active:scale-95 border border-slate-600 rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition-all flex items-center gap-1"
              >
                {action}
              </button>
            ))}
          </div>
          {isInteractivePlayed && (
            <p className="text-[10px] text-emerald-400 font-bold mt-2 animate-pulse">
              ✨ Great Move! +100 Points! Install full game for 500+ battles!
            </p>
          )}
        </div>

        {/* Bottom CTA Action Bar */}
        <div className="relative z-10 w-full flex flex-col gap-2">
          <button
            onClick={() => {
              haptics.tap();
              handleInteractiveTap();
            }}
            className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-sm sm:text-base py-3 rounded-2xl shadow-xl transform active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>INSTALL & PLAY FOR FREE</span>
          </button>

          {/* Remove Ads Shortcut */}
          {onOpenShop && (
            <button
              onClick={() => {
                onOpenShop();
                onAdCompleted();
              }}
              className="text-[11px] text-slate-400 hover:text-cyan-300 font-semibold flex items-center justify-center gap-1 mt-1 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Remove all ads permanently in Shop</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
