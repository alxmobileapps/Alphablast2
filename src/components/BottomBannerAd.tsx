import React, { useEffect } from 'react';
import { setUniversalBannerVisible } from '../utils/universalAds';

interface BottomBannerAdProps {
  hasRemovedAds?: boolean;
}

/**
 * Bottom banner ad slot.
 *
 * This used to ALSO render two things that had nothing to do with the real
 * native AdMob banner:
 *  1. A Google AdSense <ins> unit — AdSense refuses to serve ads inside a
 *     native WebView (Google policy), so `data-ad-status` never became
 *     "filled" here and this never actually worked in the Android app.
 *  2. A permanent hardcoded fallback UI (rotating "Royal Kingdom RPG" /
 *     "Word Galaxy 3D" / etc. cards) shown whenever that AdSense unit
 *     wasn't filled — which, per #1, was always, on every device, in every
 *     build. That fake UI is what was actually being seen at the bottom of
 *     the screen this whole time, regardless of whether the real native
 *     AdMob banner succeeded or failed.
 *
 * Both are removed. This component now only tells the real native AdMob
 * banner to show/hide (see setUniversalBannerVisible in universalAds.ts).
 * The native banner is an Android view drawn outside the WebView — it is
 * not HTML, so there is nothing to render here for it. If it fails to
 * fill, nothing shows at the bottom — no fake content standing in for it.
 */
export const BottomBannerAd: React.FC<BottomBannerAdProps> = ({ hasRemovedAds = false }) => {
  useEffect(() => {
    if (!hasRemovedAds) {
      setUniversalBannerVisible(true, 'bottom');
    } else {
      setUniversalBannerVisible(false, 'bottom');
    }
    return () => {
      setUniversalBannerVisible(false, 'bottom');
    };
  }, [hasRemovedAds]);

  return null;
};
