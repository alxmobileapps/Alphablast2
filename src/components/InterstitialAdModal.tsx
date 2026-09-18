import { useEffect } from 'react';
import { showUniversalInterstitialAd } from '../utils/universalAds';

interface InterstitialAdModalProps {
  isOpen: boolean;
  hasRemovedAds?: boolean;
  onAdCompleted: () => void;
}

/**
 * Headless interstitial trigger — renders NOTHING of its own.
 *
 * This used to draw its own full-screen HTML overlay on every round
 * transition: first a fake "Kingdom Clash: Battle Quest" game-promo card,
 * then (after that was removed) a generic "AD" tag + "Skip in Ns" +
 * loading spinner panel. Both still read as a fake ad slot even with no
 * fake game content in it, which isn't what was asked for.
 *
 * A REAL native AdMob interstitial doesn't need any HTML from us to
 * display — when it successfully loads, AdMob opens its own native
 * Android Activity (with Google's own close/skip controls) on top of
 * everything, independent of this component. So this component's only
 * job now is to kick off that real ad request and move on:
 *  - If ads are removed (purchased), skip straight to the next round.
 *  - Otherwise, request the real ad (showUniversalInterstitialAd) and
 *    move to the next round exactly when that call reports done — whether
 *    that's because a real ad was shown and dismissed, or because no real
 *    ad was available. Either way, nothing fake is ever drawn on screen.
 */
export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  hasRemovedAds = false,
  onAdCompleted,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    if (hasRemovedAds) {
      onAdCompleted();
      return;
    }

    showUniversalInterstitialAd({
      name: 'round_transition',
      onAdCompleted,
    });
  }, [isOpen, hasRemovedAds, onAdCompleted]);

  return null;
};
