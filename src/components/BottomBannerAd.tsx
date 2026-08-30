import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ExternalLink, X, Shield, Star, Play } from 'lucide-react';
import { setUniversalBannerVisible } from '../utils/universalAds';
import { haptics } from '../utils/haptics';

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
  const adRef = useRef<HTMLModElement | null>(null);

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

  // Try pushing to Google AdSense adsbygoogle queue once mounted
  useEffect(() => {
    if (hasRemovedAds) return;
    try {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('AdSense push notice:', e);
    }
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
      className="w-full bg-slate-900 border-t border-slate-700/80 shadow-lg py-1 px-2 sm:px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] z-30 select-none shrink-0 transition-all duration-300 flex flex-col items-center justify-center min-h-[52px]"
    >
      {/* Official Google AdSense ad slot */}
      <div className="w-full max-w-[728px] mx-auto overflow-hidden text-center flex flex-col items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '50px', width: '100%', maxHeight: '65px' }}
          data-ad-client="ca-pub-2452250229562082"
          data-ad-slot="2174440998"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      </div>

      {/* Fallback Display Bar in case live network ad is filling / loading */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4 py-0.5">
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
            className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-br ${campaign.iconBg} flex items-center justify-center text-base sm:text-lg shadow-md border border-white/20 transform transition-transform hover:scale-105`}
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
            id="banner-ad-cta-btn"
            onClick={handleCtaClick}
            className={`relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1 ${
              clickedEffect ? 'ring-2 ring-emerald-300 scale-105' : ''
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{campaign.ctaText}</span>
          </button>

          {/* Remove Ads button */}
          {onOpenShop && (
            <button
              id="banner-remove-ads-btn"
              onClick={onOpenShop}
              title="Remove all ads in Shop"
              className="text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-1.5 py-1.5 rounded-md border border-slate-700 transition-colors flex items-center gap-0.5"
            >
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline text-[9px] font-semibold">No Ads</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

