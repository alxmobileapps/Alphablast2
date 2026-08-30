import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Coins,
  Gem,
  Hammer,
  ArrowLeftRight,
  Shuffle,
  Lightbulb,
  Edit3,
  Sparkles,
  Gift,
  Tv,
  CheckCircle2,
  X,
  Plus,
  Ban,
  ShieldCheck,
  Play,
  Volume2,
} from 'lucide-react';
import { PowerUpInventory, PowerUpType } from '../types';
import { HammerIcon } from './HammerIcon';
import { CurrencyPromptModal, CurrencyPromptType } from './CurrencyPromptModal';
import { playRewardRefill, playSpecialCard, playWin } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { purchaseIAP, purchaseMedianIAP, restoreMedianPurchases } from '../utils/medianBridge';
import { showUniversalRewardedAd } from '../utils/universalAds';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  diamonds: number;
  inventory: PowerUpInventory;
  hasRemovedAds?: boolean;
  initialTab?: 'powerups' | 'coins' | 'diamonds';
  onBuyPowerUp: (type: PowerUpType, costInCoins: number, count?: number) => boolean;
  onBuyMegaBundle: (costInCoins: number) => boolean;
  onExchangeDiamonds: (diamonds: number, coins: number) => boolean;
  onAddDiamonds: (amount: number) => void;
  onPurchaseRemoveAds?: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  diamonds,
  inventory,
  hasRemovedAds = false,
  initialTab = 'powerups',
  onBuyPowerUp,
  onBuyMegaBundle,
  onExchangeDiamonds,
  onAddDiamonds,
  onPurchaseRemoveAds,
}) => {
  const [activeTab, setActiveTab] = useState<'powerups' | 'coins' | 'diamonds'>(initialTab);
  const [currencyPrompt, setCurrencyPrompt] = useState<CurrencyPromptType>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [hasClaimedDaily, setHasClaimedDaily] = useState<boolean>(() => {
    try {
      const last = localStorage.getItem('word_blast_daily_diamond_claim');
      if (!last) return false;
      const date = new Date(Number(last)).toDateString();
      return date === new Date().toDateString();
    } catch {
      return false;
    }
  });

  // Sponsored Video Ad Player State
  const [isVideoAdModalOpen, setIsVideoAdModalOpen] = useState<boolean>(false);
  const [videoAdTimeLeft, setVideoAdTimeLeft] = useState<number>(5);
  const [videoAdCompleted, setVideoAdCompleted] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVideoAdModalOpen && videoAdTimeLeft > 0) {
      timer = setTimeout(() => {
        setVideoAdTimeLeft((t) => t - 1);
      }, 1000);
    } else if (isVideoAdModalOpen && videoAdTimeLeft === 0 && !videoAdCompleted) {
      setVideoAdCompleted(true);
      haptics.specialCreated();
      playRewardRefill();
    }
    return () => clearTimeout(timer);
  }, [isVideoAdModalOpen, videoAdTimeLeft, videoAdCompleted]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleRemoveAdsPurchase = () => {
    if (hasRemovedAds) {
      showNotification('Ads are already removed!');
      return;
    }
    haptics.tap();
    purchaseIAP('com.wordblast.removeads', (success, res) => {
      if (success) {
        if (onPurchaseRemoveAds) {
          onPurchaseRemoveAds();
          haptics.specialCreated();
          playWin();
          showNotification('All Ads Removed! +100 Diamonds & Power-ups Set to 2!');
        }
      } else {
        if (res?.error && res.error !== 'Cancelled') {
          showNotification(`Notice: ${res.error}`);
        } else {
          showNotification('Purchase cancelled.');
        }
      }
    });
  };

  const handleRestorePurchases = () => {
    haptics.tap();
    restoreMedianPurchases((purchasedIds) => {
      if (purchasedIds.includes('com.wordblast.removeads')) {
        if (onPurchaseRemoveAds) {
          onPurchaseRemoveAds();
          showNotification('Purchases Restored: Remove Ads Active!');
        }
      } else {
        showNotification('No prior purchases found.');
      }
    });
  };

  const handlePurchasePowerUp = (type: PowerUpType, cost: number, count: number = 1, name: string) => {
    if (coins < cost) {
      haptics.invalid();
      setCurrencyPrompt('buy_coins_with_diamonds');
      return;
    }

    const ok = onBuyPowerUp(type, cost, count);
    if (ok) {
      haptics.specialCreated();
      playRewardRefill();
      showNotification(`Purchased ${count}× ${name}!`);
    }
  };

  const handlePurchaseMegaBundle = () => {
    const cost = 225; // 50 * 5 = 250 - 10% discount = 225 coins
    if (coins < cost) {
      haptics.invalid();
      setCurrencyPrompt('buy_coins_with_diamonds');
      return;
    }

    const ok = onBuyMegaBundle(cost);
    if (ok) {
      haptics.specialCreated();
      playWin();
      showNotification('Mega Bundle Acquired! +1 to All 5 Power-ups!');
    }
  };

  const handleExchange = (gemCost: number, coinGain: number, label: string) => {
    if (diamonds < gemCost) {
      haptics.invalid();
      setCurrencyPrompt('buy_more_diamonds');
      return;
    }

    const ok = onExchangeDiamonds(gemCost, coinGain);
    if (ok) {
      haptics.specialCreated();
      playSpecialCard();
      showNotification(`Exchanged ${gemCost} 💎 for +${coinGain} 🪙 Coins!`);
    }
  };

  const handleClaimDailyDiamond = () => {
    if (hasClaimedDaily) return;
    onAddDiamonds(1);
    try {
      localStorage.setItem('word_blast_daily_diamond_claim', Date.now().toString());
    } catch {}
    setHasClaimedDaily(true);
    haptics.specialCreated();
    playWin();
    showNotification('Daily Bonus Claimed: +1 💎 Diamond Added!');
  };

  const handleWatchAdReward = () => {
    haptics.tap();
    showUniversalRewardedAd({
      name: 'shop_diamond_reward',
      onReward: () => {
        onAddDiamonds(2);
        haptics.specialCreated();
        playWin();
        showNotification('Sponsored Ad Reward: +2 💎 Diamonds Added!');
      },
      onDismiss: () => {},
      fallbackToInteractiveModal: () => {
        setIsVideoAdModalOpen(true);
        setVideoAdTimeLeft(5);
        setVideoAdCompleted(false);
      },
    });
  };

  const handleClaimVideoAdReward = () => {
    setIsVideoAdModalOpen(false);
    onAddDiamonds(2);
    haptics.specialCreated();
    playWin();
    showNotification('Sponsored Ad Reward: +2 💎 Diamonds Added!');
  };

  const handleDiamondPackPurchase = (amount: number, label: string, productId?: string) => {
    haptics.tap();
    const pid = productId || `com.wordblast.diamonds_${amount}`;
    purchaseIAP(pid, (success, res) => {
      if (success) {
        onAddDiamonds(amount);
        haptics.specialCreated();
        playWin();
        showNotification(`Purchased ${label}! +${amount} 💎 Diamonds Added!`);
      } else {
        if (res?.error && res.error !== 'Cancelled') {
          showNotification(`Purchase notice: ${res.error}`);
        } else {
          showNotification('Purchase cancelled.');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="bg-[#0B1E52] border-2 border-[#1E3A8A] rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] text-white animate-scale-in">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E3A8A] bg-[#071330] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 flex items-center justify-center shadow-md font-black">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Shop & Bank</span>
                <span className="text-[10px] uppercase font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                  STORE
                </span>
              </h2>
              <p className="text-[11px] text-blue-200/80">Get power-ups, coins & diamonds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#0F2868] hover:bg-[#153488] border border-[#23469E] text-blue-200 hover:text-white flex items-center justify-center transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Status Pills */}
        <div className="bg-[#081844] px-4 py-2.5 border-b border-[#1E3A8A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 bg-[#0D2460] border border-[#204090] rounded-2xl px-3 py-1.5 shadow-inner">
            <span className="text-xl">🪙</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-bold text-amber-300/80 leading-none">Coins</span>
              <span className="font-mono font-black text-sm sm:text-base text-amber-200 leading-tight">
                {coins}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 bg-[#0D2460] border border-[#204090] rounded-2xl px-3 py-1.5 shadow-inner">
            <span className="text-xl">💎</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-bold text-cyan-300/80 leading-none">Diamonds</span>
              <span className="font-mono font-black text-sm sm:text-base text-cyan-200 leading-tight">
                {diamonds}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-2 bg-[#091D50] border-b border-[#1E3A8A] gap-1.5">
          <button
            onClick={() => setActiveTab('powerups')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'powerups'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400'
                : 'text-blue-200 hover:bg-[#0E286C]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Power-Ups</span>
          </button>

          <button
            onClick={() => setActiveTab('coins')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'coins'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md border border-yellow-300'
                : 'text-blue-200 hover:bg-[#0E286C]'
            }`}
          >
            <span>🪙</span>
            <span>Get Coins</span>
          </button>

          <button
            onClick={() => setActiveTab('diamonds')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'diamonds'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md border border-cyan-300'
                : 'text-blue-200 hover:bg-[#0E286C]'
            }`}
          >
            <span>💎</span>
            <span>Diamonds</span>
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-xs sm:text-sm font-black px-4 py-2 rounded-full shadow-2xl border-2 border-emerald-200 flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Tab Content Area */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3">
          {/* REMOVE ALL ADS HERO PROMO CARD (Always visible or in powerups tab) */}
          <div className={`border-2 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg relative overflow-hidden transition-all ${
            hasRemovedAds
              ? 'bg-gradient-to-r from-emerald-950/60 via-teal-950/60 to-slate-900/60 border-emerald-400/40 text-emerald-100'
              : 'bg-gradient-to-r from-rose-900/70 via-indigo-950/70 to-blue-950/70 border-rose-400/60 shadow-rose-900/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0 ${
                hasRemovedAds
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                  : 'bg-gradient-to-br from-rose-500 to-indigo-600 text-white animate-pulse'
              }`}>
                {hasRemovedAds ? <ShieldCheck className="w-7 h-7" /> : <Ban className="w-7 h-7" />}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-sm text-white">Remove All Ads</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                    hasRemovedAds
                      ? 'bg-emerald-400 text-emerald-950'
                      : 'bg-amber-400 text-amber-950'
                  }`}>
                    {hasRemovedAds ? 'ACTIVE' : '$6.99 • VIP PACK'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  {hasRemovedAds
                    ? 'All Ads Removed! Enjoy uninterrupted play.'
                    : 'Permanently removes all ads + Instantly get 100 💎 Diamonds + Power-ups balance set to 2 each!'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={handleRemoveAdsPurchase}
                disabled={hasRemovedAds}
                className={`px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm shadow-md shrink-0 flex items-center justify-center gap-1.5 transition-transform ${
                  hasRemovedAds
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 cursor-default'
                    : 'bg-gradient-to-r from-rose-500 to-indigo-500 hover:from-rose-400 hover:to-indigo-400 text-white active:scale-95 border border-rose-300/40 cursor-pointer'
                }`}
              >
                {hasRemovedAds ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Purchased</span>
                  </>
                ) : (
                  <>
                    <span>$6.99 Buy</span>
                    <span>🚀</span>
                  </>
                )}
              </button>
              {!hasRemovedAds && (
                <button
                  onClick={handleRestorePurchases}
                  className="text-[10px] text-blue-300 hover:text-white underline font-semibold text-center py-0.5 cursor-pointer"
                >
                  Restore IAP
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: POWER-UPS ARMORY */}
          {activeTab === 'powerups' && (
            <div className="space-y-2.5">
              {/* Mega Bundle Featured Banner */}
              <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-blue-900/60 border-2 border-purple-400/50 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center text-2xl shadow-md shrink-0">
                    🎁
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-white">Mega 5-in-1 Bundle</span>
                      <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                        10% OFF • Save 25 🪙
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200">
                      Get +1 of every power-up: Hammer, Swap, Replace, Shuffle, Clue!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePurchaseMegaBundle}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                >
                  <span>225</span>
                  <span>🪙</span>
                </button>
              </div>

              {/* Individual Power-ups list (50 coins each) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Hammer */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] flex items-center justify-center text-white shadow-xs shrink-0 p-1">
                      <HammerIcon className="w-7 h-7" showBurst={false} />
                    </div>
                    <div className="text-left truncate">
                      <div className="font-black text-xs text-white truncate">Giant Hammer</div>
                      <div className="text-[10px] text-blue-300">Own: {inventory.hammer}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePowerUp('hammer', 50, 1, 'Giant Hammer')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                  >
                    <span>50</span>
                    <span>🪙</span>
                  </button>
                </div>

                {/* 2. Swap */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#34D399] to-[#059669] flex items-center justify-center text-white shadow-xs shrink-0">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div className="text-left truncate">
                      <div className="font-black text-xs text-white truncate">Any Tile Swap</div>
                      <div className="text-[10px] text-blue-300">Own: {inventory.swap}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePowerUp('swap', 50, 1, 'Tile Swap')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                  >
                    <span>50</span>
                    <span>🪙</span>
                  </button>
                </div>

                {/* 3. Replace Letter */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#A78BFA] to-[#7C3AED] flex items-center justify-center text-white shadow-xs shrink-0">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div className="text-left truncate">
                      <div className="font-black text-xs text-white truncate">Replace Letter</div>
                      <div className="text-[10px] text-blue-300">Own: {inventory.replace}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePowerUp('replace', 50, 1, 'Letter Replace')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                  >
                    <span>50</span>
                    <span>🪙</span>
                  </button>
                </div>

                {/* 4. Rearrange */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2DD4BF] to-[#0D9488] flex items-center justify-center text-white shadow-xs shrink-0">
                      <Shuffle className="w-5 h-5" />
                    </div>
                    <div className="text-left truncate">
                      <div className="font-black text-xs text-white truncate">Rearrange Grid</div>
                      <div className="text-[10px] text-blue-300">Own: {inventory.rearrange}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePowerUp('rearrange', 50, 1, 'Grid Rearrange')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                  >
                    <span>50</span>
                    <span>🪙</span>
                  </button>
                </div>

                {/* 5. Clue */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs sm:col-span-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#FCD34D] to-[#D97706] flex items-center justify-center text-amber-950 shadow-xs shrink-0">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="text-left truncate">
                      <div className="font-black text-xs text-white truncate">Instant Word Clue</div>
                      <div className="text-[10px] text-blue-300">Own: {inventory.clue}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchasePowerUp('clue', 50, 1, 'Word Clue')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                  >
                    <span>50</span>
                    <span>🪙</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GET COINS (CONVERT DIAMONDS) */}
          {activeTab === 'coins' && (
            <div className="space-y-2.5">
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-3 text-amber-200 text-xs flex items-center gap-2.5">
                <span className="text-2xl">💡</span>
                <span className="text-left">
                  Convert diamonds into coins (Base rate: 1 💎 = 25 🪙) with up to 20% discount bonus!
                </span>
              </div>

              <div className="space-y-2">
                {/* 1 💎 -> 25 🪙 */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
                      🪙
                    </div>
                    <div className="text-left">
                      <span className="font-black text-sm text-white block">Quick Coin Handful</span>
                      <span className="text-xs text-amber-300 font-bold">+25 Coins</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExchange(1, 25, 'Handful')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-cyan-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <span>1</span>
                    <span>💎</span>
                  </button>
                </div>

                {/* 5 💎 -> 131 🪙 (5% Discount / Bonus) */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden">
                  <span className="absolute top-1 right-2 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    5% Discount Bonus
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
                      🪙🪙
                    </div>
                    <div className="text-left">
                      <span className="font-black text-sm text-white block">Pouch of Coins</span>
                      <span className="text-xs text-amber-300 font-bold">+131 Coins</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExchange(5, 131, 'Pouch')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-cyan-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <span>5</span>
                    <span>💎</span>
                  </button>
                </div>

                {/* 10 💎 -> 275 🪙 (10% Discount / Bonus) */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden">
                  <span className="absolute top-1 right-2 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    10% Discount Bonus
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
                      💰
                    </div>
                    <div className="text-left">
                      <span className="font-black text-sm text-white block">Bag of Coins</span>
                      <span className="text-xs text-amber-300 font-bold">+275 Coins</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExchange(10, 275, 'Bag')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-cyan-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <span>10</span>
                    <span>💎</span>
                  </button>
                </div>

                {/* 20 💎 -> 600 🪙 (20% Discount / Bonus) */}
                <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden">
                  <span className="absolute top-1 right-2 text-[9px] font-black text-amber-300 uppercase tracking-wider">
                    20% BEST VALUE
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
                      💎🪙
                    </div>
                    <div className="text-left">
                      <span className="font-black text-sm text-white block">Treasure Chest of Coins</span>
                      <span className="text-xs text-amber-300 font-bold">+600 Coins</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExchange(20, 600, 'Treasure')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <span>20</span>
                    <span>💎</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIAMONDS & REWARDS */}
          {activeTab === 'diamonds' && (
            <div className="space-y-2.5">
              {/* Category Score Diamond Rule info banner */}
              <div className="bg-cyan-950/60 border border-cyan-400/40 rounded-2xl p-3 text-cyan-100 text-xs flex items-start gap-2.5 shadow-sm">
                <span className="text-xl shrink-0 mt-0.5">💎</span>
                <div className="text-left">
                  <span className="font-black uppercase tracking-wide text-cyan-200 block">
                    Score Milestone Diamond Rewards
                  </span>
                  <span className="text-[11px] text-cyan-100/90 leading-snug">
                    Reach <strong>15,000 PTS</strong> in any category round to automatically earn <strong>+1 Diamond (💎)</strong>, and <strong>20,000 PTS</strong> to earn <strong>+2 Diamonds (💎)</strong>!
                  </span>
                </div>
              </div>

              {/* Free Daily Claim */}
              <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-inner">
                    🎁
                  </div>
                  <div className="text-left">
                    <span className="font-black text-sm text-white block">Daily Diamond Gift</span>
                    <span className="text-xs text-emerald-300 font-bold">+1 Diamond Free</span>
                  </div>
                </div>

                <button
                  onClick={handleClaimDailyDiamond}
                  disabled={hasClaimedDaily}
                  className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-transform ${
                    hasClaimedDaily
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 active:scale-95'
                  }`}
                >
                  {hasClaimedDaily ? 'Claimed' : 'Claim Free'}
                </button>
              </div>

              {/* Watch Video for 2 Diamonds */}
              <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 text-xl shadow-inner">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="font-black text-sm text-white block">Watch Sponsored Video</span>
                    <span className="text-xs text-purple-300 font-bold">+2 Diamonds Free</span>
                  </div>
                </div>

                <button
                  onClick={handleWatchAdReward}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Watch Video</span>
                </button>
              </div>

              {/* Diamond Packages (Instant Top-ups) */}
              <div className="pt-2 border-t border-[#1E3A8A]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-blue-300 block text-left">
                    Diamond Vault Packs (In-App Purchase)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3 flex flex-col items-center gap-2 text-center relative overflow-hidden">
                    <span className="text-2xl">💎</span>
                    <div>
                      <span className="font-black text-xs text-white block">Starter Pack</span>
                      <span className="text-xs text-cyan-300 font-bold block">+10 Diamonds</span>
                      <span className="text-[10px] text-amber-300 font-black">$0.99 USD</span>
                    </div>
                    <button
                      onClick={() => handleDiamondPackPurchase(10, 'Starter Pack', 'com.wordblast.diamonds_10')}
                      className="w-full py-2 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-cyan-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>$0.99 Buy</span>
                      <span className="text-[9px] bg-cyan-950/30 text-cyan-900 px-1.5 py-0.5 rounded font-black">IAP</span>
                    </button>
                  </div>

                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-2xl p-3 flex flex-col items-center gap-2 text-center relative overflow-hidden">
                    <span className="absolute top-1.5 right-1.5 text-[8px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                      BEST VALUE
                    </span>
                    <span className="text-2xl mt-1">✨💎✨</span>
                    <div>
                      <span className="font-black text-xs text-white block">Master Vault</span>
                      <span className="text-xs text-cyan-300 font-bold block">+50 Diamonds</span>
                      <span className="text-[10px] text-amber-300 font-black">$3.99 USD</span>
                    </div>
                    <button
                      onClick={() => handleDiamondPackPurchase(50, 'Master Vault', 'com.wordblast.diamonds_50')}
                      className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>$3.99 Buy</span>
                      <span className="text-[9px] bg-amber-950/30 text-amber-900 px-1.5 py-0.5 rounded font-black">IAP</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1E3A8A] bg-[#071330] flex items-center justify-between text-xs text-blue-200">
          <button
            onClick={handleRestorePurchases}
            className="text-[11px] text-blue-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
          >
            Restore Purchases
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0E286C] hover:bg-[#143588] text-white font-bold rounded-xl border border-[#204090] text-xs active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* SPONSORED VIDEO AD PLAYER OVERLAY */}
        {isVideoAdModalOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
            <div className="max-w-xs w-full bg-[#0E245C] border-2 border-purple-400 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col items-center">
              {/* Ad Header */}
              <div className="w-full flex items-center justify-between mb-3 text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                <span className="bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1">
                  <Tv className="w-3 h-3 text-purple-300" />
                  <span>Sponsored Video Ad</span>
                </span>
                <span className="font-mono text-xs bg-purple-400/20 text-purple-200 px-2 py-0.5 rounded-full font-black">
                  {videoAdCompleted ? 'Completed' : `${videoAdTimeLeft}s`}
                </span>
              </div>

              {/* Video Simulated Stage */}
              <div className="w-full aspect-video bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-inner mb-4">
                {/* Background animated glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />

                {!videoAdCompleted ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg mb-2 animate-bounce">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-white tracking-tight">WordBlast Turbo</span>
                    <span className="text-[10px] text-purple-200 mt-0.5">Playing interactive game sponsor...</span>

                    {/* Progress Bar */}
                    <div className="w-3/4 h-2 bg-slate-800 rounded-full overflow-hidden mt-3 border border-purple-400/30">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-cyan-400 transition-all duration-1000 ease-linear"
                        style={{ width: `${((5 - videoAdTimeLeft) / 5) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center animate-scale-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg mb-2">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-black text-emerald-300">Video Finished!</span>
                    <span className="text-[11px] text-emerald-100 mt-0.5">Reward ready to collect</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {videoAdCompleted ? (
                <button
                  onClick={handleClaimVideoAdReward}
                  className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-emerald-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer animate-bounce"
                >
                  <Gift className="w-4 h-4" />
                  <span>Claim +2 Diamonds 💎</span>
                </button>
              ) : (
                <div className="text-[11px] text-blue-200/80 flex items-center gap-1.5 py-2">
                  <span>Please watch until timer finishes</span>
                  <span className="font-mono font-bold text-amber-300">({videoAdTimeLeft}s)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Currency Insufficient Confirmation Prompt */}
        <CurrencyPromptModal
          isOpen={!!currencyPrompt}
          type={currencyPrompt}
          coins={coins}
          diamonds={diamonds}
          onConfirm={() => {
            if (currencyPrompt === 'buy_coins_with_diamonds') {
              setActiveTab('coins');
            } else if (currencyPrompt === 'buy_more_diamonds') {
              setActiveTab('diamonds');
            }
            setCurrencyPrompt(null);
          }}
          onClose={() => setCurrencyPrompt(null)}
        />
      </div>
    </div>
  );
};
