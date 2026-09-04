import React, { useState, useEffect, useRef } from 'react';
import { Shield, Star, Play } from 'lucide-react';
import { setUniversalBannerVisible } from '../utils/universalAds';
import { haptics } from '../utils/haptics';
import { ADS_CONFIG } from '../config/adsConfig';

interface BottomBannerAdProps {
  hasRemovedAds?: boolean;
  onOpenShop?: () => void;
}

interface BannerCampaign {
  id: string;
  title: string;
  subtitle: string;
  iconEmoji: string;
  iconBg: string;
  badgeText: string;
  rating: string;
  ctaText: string;
  category: string;
}

const CAMPAIGNS: BannerCampaign[] = [
  {
    id: 'c1',
    title: 'Royal Kingdom RPG',
    subtitle: 'Solve puzzles & rule the realm!',
    iconEmoji: '👑',
    iconBg: 'from-amber-400 to-yellow-600',
    badgeText: '#1 Top Free',
    rating: '4.9 ★',
    ctaText: 'PLAY NOW',
    category: 'Puzzle',
  },
  {
    id: 'c2',
    title: 'Word Galaxy 3D',
    subtitle: '10,000+ mind-bending levels!',
    iconEmoji: '🚀',
    iconBg: 'from-cyan-400 to-blue-600',
    badgeText: 'Trending',
    rating: '4.8 ★',
    ctaText: 'INSTALL',
    category: 'Word',
  },
  {
    id: 'c3',
    title: 'Gem Blitz Arena',
    subtitle: 'Explosive combos & live battles!',
    iconEmoji: '💎',
    iconBg: 'from-purple-400 to-indigo-600',
    badgeText: 'Editor Choice',
    rating: '4.9 ★',
    ctaText: 'GET APP',
    category: 'Casual',
  },
  {
    id: 'c4',
    title: 'Dragon Quest Legends',
    subtitle: 'Hatch legendary dragons & fight!',
    iconEmoji: '🐉',
    iconBg: 'from-emerald-400 to-teal-700',
    badgeText: 'Top Rated',
    rating: '4.7 ★',
    ctaText: 'PLAY FREE',
    category: 'Adventure',
  },
];

export const BottomBannerAd: React.FC<BottomBannerAdProps> = ({
  hasRemovedAds = false,
  onOpenShop,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [clickedEffect, setClickedEffect] = useState(false);
  const [adSenseLoaded, setAdSenseLoaded] = useState(false);
  const adPushedRef = useRef(false);

  // Sync native / universal banner visibility
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

  // Push Google AdSense ad slot when mounted
  useEffect(() => {
    if (hasRemovedAds) return;

    const timer = setTimeout(() => {
      if (adPushedRef.current) return;
      try {
        const win = window as unknown as { adsbygoogle?: unknown[] };
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
        adPushedRef.current = true;
        setAdSenseLoaded(true);
      } catch (e) {
        console.debug('AdSense ins push error or blocked:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [hasRemovedAds]);

  // Rotate fallback campaigns every 12 seconds
  useEffect(() => {
    if (hasRemovedAds) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAMPAIGNS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [hasRemovedAds]);

  if (hasRemovedAds) {
    return null;
  }

  const campaign = CAMPAIGNS[currentIdx];

  const handleCtaClick = () => {
    haptics.tap();
    setClickedEffect(true);
    setTimeout(() => setClickedEffect(false), 800);
  };

  return (
    <div
      id="bottom-banner-ad-container"
      className="w-full bg-slate-900 border-t border-slate-700/80 shadow-lg px-2 sm:px-4 pb-[max(0.125rem,env(safe-area-inset-bottom))] z-30 select-none shrink-0 min-h-[50px] max-h-[90px] overflow-hidden flex flex-col justify-center items-center relative"
    >
      {/* Real Google AdSense Display Unit: ca-pub-2452250229562082 / slot: 2174440998 */}
      <div className="w-full max-w-[728px] mx-auto flex justify-center items-center overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', minWidth: '320px', width: '100%', height: '50px' }}
          data-ad-client={ADS_CONFIG.H5_GAMES.CLIENT_ID || 'ca-pub-2452250229562082'}
          data-ad-slot="2174440998"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        />
      </div>

      {/* Fallback visual banner preview shown when AdSense is filling or loading */}
      <div 
        className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4 h-[46px]"
        style={{ display: adSenseLoaded ? 'none' : 'flex' }}
      >
        {/* Left Side: AD badge & App Icon + Details */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Official Google/AdMob Style "Ad" Tag */}
          <div className="shrink-0 flex flex-col items-center">
            <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded leading-none shadow-xs tracking-wider">
              AD
            </span>
          </div>

          {/* App Icon */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-xl bg-gradient-to-br ${campaign.iconBg} flex items-center justify-center text-sm sm:text-base shadow-md border border-white/20 transform transition-transform hover:scale-105`}
          >
            {campaign.iconEmoji}
          </div>

          {/* App Text Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white text-xs sm:text-sm font-bold truncate leading-tight">
                {campaign.title}
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-1 rounded">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5 inline" />
                {campaign.rating}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-300/80 truncate leading-tight">
              {campaign.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button & Remove Ads Shop shortcut */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleCtaClick}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition-all duration-200 active:scale-95 ${
              clickedEffect
                ? 'bg-emerald-500 text-white scale-105'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="truncate">{campaign.ctaText}</span>
          </button>

          {onOpenShop && (
            <button
              onClick={() => {
                haptics.tap();
                onOpenShop();
              }}
              title="Remove Ads"
              className="p-1 text-slate-400 hover:text-cyan-400 rounded-md transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
