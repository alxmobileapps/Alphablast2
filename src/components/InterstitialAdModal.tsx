import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { showUniversalInterstitialAd } from '../utils/universalAds';
import { haptics } from '../utils/haptics';

interface InterstitialAdModalProps {
  isOpen: boolean;
  targetCategoryName?: string;
  hasRemovedAds?: boolean;
  onAdCompleted: () => void;
  onOpenShop?: () => void;
}

/**
 * Round-transition placeholder shown while a real ad (native AdMob / H5
 * Game Ads — see showUniversalInterstitialAd) is requested.
 *
 * This used to render a hardcoded fake game promo ("Kingdom Clash: Battle
 * Quest" with a fake mini-demo, fake reviews, fake install button) on a
 * full-screen overlay using `backdrop-blur-md` PLUS two `blur-3xl` glow
 * blobs. That fake creative is removed per the user's request. The blur
 * filters are also removed on purpose, not just for looks: `backdrop-blur`
 * forces the WebView to resample everything behind this modal every frame
 * it's on screen, which is expensive on Android — and this modal opens on
 * EVERY round transition (`isInterstitialOpen` is set purely from the
 * completed-round counter in App.tsx, independent of whether any native ad
 * flag is on or off). Every previous diagnostic build that toggled native
 * AdMob banner/interstitial/rewarded on and off left this modal's blur
 * fully active either way — so it was never actually isolated as a
 * candidate for the round-completion freeze until now.
 */
export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  targetCategoryName,
  hasRemovedAds = false,
  onAdCompleted,
  onOpenShop,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (hasRemovedAds) {
        onAdCompleted();
        return;
      }

      // Trigger the real ad (native AdMob, H5 Game Ads, etc.) as a
      // fire-and-forget side effect — see universalAds.ts.
      showUniversalInterstitialAd({
        name: 'round_transition',
      });

      setSecondsRemaining(5);
      setCanSkip(false);
    }
  }, [isOpen, hasRemovedAds, onAdCompleted]);

  // 5-second countdown before the player can skip past this screen.
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

  return (
    <div
      id="interstitial-ad-modal"
      className="fixed inset-0 z-50 bg-[#050b1a] flex flex-col items-center justify-center p-3 sm:p-6 select-none text-white"
    >
      {/* Top Bar: AD Tag, Category Next Preview & Countdown / Close */}
      <div className="w-full max-w-lg flex items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-black text-[11px] font-black px-2 py-0.5 rounded shadow-sm">
            AD
          </span>
          <span className="text-xs text-slate-300 font-semibold truncate">
            {targetCategoryName ? `Next: "${targetCategoryName}"` : 'Loading ad...'}
          </span>
        </div>

        {/* Skip / Close Countdown Button */}
        <div>
          {canSkip ? (
            <button
              id="interstitial-close-btn"
              onClick={handleClose}
              className="bg-white text-slate-900 hover:bg-amber-400 font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-colors active:scale-95"
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

      {/* Simple loading panel — no fake creative, no blur filters */}
      <div className="w-full max-w-lg bg-[#0d1c3a] border border-slate-700/60 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Loading next round...</p>
      </div>

      {onOpenShop && (
        <button
          onClick={() => {
            haptics.tap();
            onOpenShop();
          }}
          className="mt-5 text-[11px] text-slate-400 hover:text-cyan-300 font-semibold underline transition-colors"
        >
          Remove ads permanently in Shop
        </button>
      )}
    </div>
  );
};
