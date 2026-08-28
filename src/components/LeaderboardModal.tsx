import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Sparkles,
  X,
  User,
  Flame,
  Zap,
  Check,
  Edit2,
  RefreshCw,
  Clock,
  Globe,
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '../data/categories';
import { Category } from '../types';
import {
  getOverallLeaderboard,
  getCategoryLeaderboard,
  fetchLiveGlobalOverall,
  fetchLiveGlobalCategory,
  getUserProfile,
  saveUserProfile,
  LeaderboardEntry,
  UserProfile,
  DEFAULT_AVATARS,
  resetLeaderboards,
} from '../utils/leaderboard';
import { formatPoints } from '../utils/scoring';
import { haptics } from '../utils/haptics';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategoryId?: number;
  currentScore?: number;
  customCategories?: Category[];
}

type TabType = 'overall' | 'category' | 'custom' | 'profile';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentCategoryId = 1,
  currentScore = 0,
  customCategories = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overall');
  const [selectedCategory, setSelectedCategory] = useState<number>(currentCategoryId);
  const [selectedCustomId, setSelectedCustomId] = useState<number>(() => {
    if (customCategories.length > 0) return customCategories[0].id;
    return currentCategoryId >= 1000 ? currentCategoryId : 1001;
  });
  const [overallList, setOverallList] = useState<LeaderboardEntry[]>([]);
  const [categoryList, setCategoryList] = useState<LeaderboardEntry[]>([]);
  const [customGameList, setCustomGameList] = useState<LeaderboardEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editNameInput, setEditNameInput] = useState<string>('');
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const user = getUserProfile();
      setProfile(user);
      setEditNameInput(user.name);

      const isCurrentCustom = currentCategoryId >= 1000 || customCategories.some((c) => c.id === currentCategoryId);
      if (isCurrentCustom) {
        setSelectedCustomId(currentCategoryId);
        setActiveTab('custom');
      } else {
        setSelectedCategory(currentCategoryId);
      }
      refreshData(currentCategoryId);
    }
  }, [isOpen, currentCategoryId, customCategories.length]);

  const refreshData = async (catId: number) => {
    // Immediate local cache
    setOverallList(getOverallLeaderboard());
    setCategoryList(getCategoryLeaderboard(catId));
    setProfile(getUserProfile());

    const activeCustom = customCategories.find((c) => c.id === selectedCustomId);
    if (activeCustom) {
      setCustomGameList(getCategoryLeaderboard(activeCustom.id, activeCustom.name));
    }

    // Live global fetch from Firestore
    setIsLiveSyncing(true);
    try {
      const [liveOverall, liveCategory, liveCustom] = await Promise.all([
        fetchLiveGlobalOverall(),
        fetchLiveGlobalCategory(catId),
        activeCustom ? fetchLiveGlobalCategory(activeCustom.id, activeCustom.name) : Promise.resolve([]),
      ]);
      setOverallList(liveOverall);
      setCategoryList(liveCategory);
      if (activeCustom && liveCustom.length > 0) {
        setCustomGameList(liveCustom);
      }
    } catch (e) {
      console.warn('Live leaderboard fallback active:', e);
    } finally {
      setIsLiveSyncing(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    haptics.tap();
    setActiveTab(tab);
    if (tab === 'category') {
      refreshData(selectedCategory);
    } else if (tab === 'overall') {
      refreshData(selectedCategory);
    } else if (tab === 'custom') {
      const targetId = customCategories[0]?.id || selectedCustomId;
      const targetCat = customCategories.find((c) => c.id === targetId);
      const catName = targetCat?.name || 'Custom Game';
      setCustomGameList(getCategoryLeaderboard(targetId, catName));
      fetchLiveGlobalCategory(targetId, catName).then((live) => {
        if (live.length > 0) setCustomGameList(live);
      });
    }
  };

  const handleCategorySelect = (id: number) => {
    haptics.tap();
    setSelectedCategory(id);
    setCategoryList(getCategoryLeaderboard(id));
    fetchLiveGlobalCategory(id).then((live) => setCategoryList(live));
  };

  const handleCustomCategorySelect = (cat: Category) => {
    haptics.tap();
    setSelectedCustomId(cat.id);
    setCustomGameList(getCategoryLeaderboard(cat.id, cat.name));
    fetchLiveGlobalCategory(cat.id, cat.name).then((live) => setCustomGameList(live));
  };

  const handleSaveProfileName = () => {
    const trimmed = editNameInput.trim() || 'Player 1';
    const updated = { ...profile, name: trimmed };
    saveUserProfile(updated);
    setProfile(updated);
    setIsEditingName(false);
    refreshData(selectedCategory);
    haptics.tap();
  };

  const handleSelectAvatar = (av: string) => {
    const updated = { ...profile, avatar: av };
    saveUserProfile(updated);
    setProfile(updated);
    refreshData(selectedCategory);
    haptics.tap();
  };

  const handleResetData = () => {
    if (confirm('Reset leaderboards to default scores?')) {
      resetLeaderboards();
      refreshData(selectedCategory);
      haptics.tap();
    }
  };

  if (!isOpen) return null;

  const currentCategoryObj = INITIAL_CATEGORIES.find((c) => c.id === selectedCategory) || INITIAL_CATEGORIES[0];

  return (
    <div
      id="leaderboard-modal-overlay"
      className="fixed inset-0 z-50 bg-[#030B1E]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      <div
        id="leaderboard-window"
        className="bg-[#071330] border-2 sm:border-4 border-[#1E3A8A] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden text-white relative animate-scale-up"
      >
        {/* Top Window Header Bar */}
        <div className="bg-[#0B1E52] border-b border-[#1E3A8A] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 border border-amber-200 flex items-center justify-center text-amber-950 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                  LEADERBOARDS
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black tracking-wider flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                  {isLiveSyncing ? 'SYNCING...' : 'LIVE GLOBAL'}
                </span>
              </div>
              <p className="text-xs text-blue-300 font-medium">
                Live global high scores & multiplayer rankings across all categories
              </p>
            </div>
          </div>

          <button
            id="close-leaderboard-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-blue-200 hover:text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
            title="Close Leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="bg-[#081844] border-b border-[#1E3A8A]/80 px-2 sm:px-6 py-2 flex items-center justify-between gap-1 sm:gap-2 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2 w-full min-w-0">
            <button
              id="tab-overall-btn"
              onClick={() => handleTabChange('overall')}
              className={`flex-1 min-w-0 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'overall'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#0B1E52] text-blue-200 hover:bg-[#102A6B] hover:text-white border border-[#1E3A8A]/60'
              }`}
            >
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Overall</span>
            </button>

            <button
              id="tab-category-btn"
              onClick={() => handleTabChange('category')}
              className={`flex-1 min-w-0 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'category'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 shadow-md shadow-emerald-500/20'
                  : 'bg-[#0B1E52] text-blue-200 hover:bg-[#102A6B] hover:text-white border border-[#1E3A8A]/60'
              }`}
            >
              <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Campaign</span>
            </button>

            <button
              id="tab-custom-btn"
              onClick={() => handleTabChange('custom')}
              className={`flex-1 min-w-0 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'custom'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'bg-[#0B1E52] text-blue-200 hover:bg-[#102A6B] hover:text-white border border-[#1E3A8A]/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Custom</span>
            </button>

            <button
              id="tab-profile-btn"
              onClick={() => handleTabChange('profile')}
              className={`flex-1 min-w-0 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-blue-950 shadow-md shadow-cyan-500/20'
                  : 'bg-[#0B1E52] text-blue-200 hover:bg-[#102A6B] hover:text-white border border-[#1E3A8A]/60'
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Stats</span>
            </button>
          </div>
        </div>

        {/* Tab 2: Category Selector Pill Row (Only visible when activeTab === 'category') */}
        {activeTab === 'category' && (
          <div className="bg-[#06122E] border-b border-[#1E3A8A]/60 px-3 sm:px-6 py-2 overflow-x-auto custom-scrollbar flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase font-black tracking-wider text-blue-300/80 mr-1 shrink-0">
              Round:
            </span>
            {INITIAL_CATEGORIES.map((cat) => {
              const isSelected = cat.id === selectedCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-emerald-950 shadow-md scale-105 border border-white'
                      : 'bg-[#0C2158] text-blue-200 hover:bg-[#132E75] border border-[#1E3A8A]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Window Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 space-y-3">
          {/* TAB 1: OVERALL LEADERBOARD */}
          {activeTab === 'overall' && (
            <div className="space-y-2.5">
              {/* Highlight summary bar */}
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-xs">
                    {profile.avatar}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-amber-300 block">
                      YOUR TOTAL CAREER SCORE
                    </span>
                    <span className="text-xl font-black text-white font-mono">
                      {formatPoints(profile.totalPoints)} <span className="text-xs text-amber-300">PTS</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold text-blue-300 block">
                    TOTAL WORDS
                  </span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {profile.totalWordsFormed} Words
                  </span>
                </div>
              </div>

              {/* Ranks List */}
              <div className="space-y-2">
                {overallList.map((entry, index) => {
                  const rank = index + 1;
                  return (
                    <LeaderboardRow
                      key={entry.id || `ov-${index}`}
                      rank={rank}
                      entry={entry}
                      isCurrentPlayer={entry.isCurrentUser}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORY LEADERBOARD */}
          {activeTab === 'category' && (
            <div className="space-y-2.5">
              {/* Category Info Header */}
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentCategoryObj.icon}</span>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider block">
                      ROUND {currentCategoryObj.id} LEADERBOARD
                    </span>
                    <h3 className="text-lg font-black text-white uppercase tracking-wide">
                      {currentCategoryObj.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold text-blue-300 block">
                    Goal Count
                  </span>
                  <span className="text-sm font-black text-emerald-400">
                    {currentCategoryObj.targetCount} Target Words
                  </span>
                </div>
              </div>

              {/* Category Ranks List */}
              <div className="space-y-2">
                {categoryList.map((entry, index) => {
                  const rank = index + 1;
                  return (
                    <LeaderboardRow
                      key={entry.id || `cat-${selectedCategory}-${index}`}
                      rank={rank}
                      entry={entry}
                      isCurrentPlayer={entry.isCurrentUser}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM GAMES LEADERBOARD */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              {customCategories.length === 0 ? (
                <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-6 text-center space-y-2 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400/40 text-pink-300 flex items-center justify-center mx-auto text-2xl">
                    ✨
                  </div>
                  <h4 className="text-base font-black text-white">No Custom Games Created Yet</h4>
                  <p className="text-xs text-blue-200 max-w-sm mx-auto">
                    Create custom games with your own word themes and choose between Timer Rush or Target mode!
                  </p>
                </div>
              ) : (
                <>
                  {/* Custom Game Selector Pill Row */}
                  <div className="bg-[#06122E] border border-[#1E3A8A]/60 rounded-2xl px-3 py-2 overflow-x-auto custom-scrollbar flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] uppercase font-black tracking-wider text-pink-300 mr-1 shrink-0">
                      Game:
                    </span>
                    {customCategories.map((cat) => {
                      const isSelected = cat.id === selectedCustomId;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCustomCategorySelect(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md scale-105 border border-white ring-2 ring-pink-400/40'
                              : 'bg-[#0C2158] text-blue-200 hover:bg-[#132E75] border border-[#1E3A8A]'
                          }`}
                        >
                          <span>{cat.icon || '🎯'}</span>
                          <span className="truncate max-w-[120px]">{cat.name}</span>
                          {cat.gameMode === 'timer' ? (
                            <span className="text-[9px] bg-amber-400 text-amber-950 px-1 rounded font-mono font-black">
                              ⏱ {Math.round((cat.timerSeconds || 120) / 60)}m
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-400 text-emerald-950 px-1 rounded font-mono font-black">
                              🎯 {cat.targetCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Custom Game Overview Header Card */}
                  {(() => {
                    const activeCat = customCategories.find((c) => c.id === selectedCustomId) || customCategories[0];
                    if (!activeCat) return null;
                    const isTimer = activeCat.gameMode === 'timer';
                    const timerMins = Math.round((activeCat.timerSeconds || 120) / 60);

                    return (
                      <div className="bg-gradient-to-r from-[#121B4A] via-[#0E2055] to-[#121B4A] border-2 border-pink-500/40 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-lg overflow-hidden">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0">
                            {activeCat.icon || '✨'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide truncate max-w-[160px] sm:max-w-xs">
                                {activeCat.name}
                              </h3>
                              {isTimer ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black tracking-wider flex items-center gap-1 shrink-0 whitespace-nowrap">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{timerMins}m Timer Rush</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black tracking-wider flex items-center gap-1 shrink-0 whitespace-nowrap">
                                  <span>🎯 {activeCat.targetCount} Target</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-pink-200/90 font-medium truncate">
                              {isTimer
                                ? `Find as many words as possible within ${timerMins} minutes!`
                                : `Form ${activeCat.targetCount} target words to clear the board!`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t border-pink-500/20 sm:border-t-0 text-left sm:text-right">
                          <span className="text-[10px] uppercase font-extrabold text-blue-300 sm:hidden">
                            Theme Word Bank:
                          </span>
                          <span className="text-xs sm:text-sm font-black text-cyan-300 font-mono">
                            {activeCat.words.length} Words
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Custom Game Leaderboard Entries or Empty State */}
                  {customGameList.length === 0 ? (
                    <div className="bg-[#0C2158]/80 border border-[#1E3A8A] rounded-2xl p-5 text-center space-y-2 shadow-inner">
                      <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/40 text-pink-300 flex items-center justify-center mx-auto text-xl shadow-xs">
                        🏆
                      </div>
                      <h4 className="text-sm font-black text-white">No Custom Game Scores Yet</h4>
                      <p className="text-xs text-blue-200 max-w-sm mx-auto">
                        Leaderboard is exclusive to this custom game! Play a round to record the very first high score.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customGameList.map((entry, index) => {
                        const rank = index + 1;
                        return (
                          <LeaderboardRow
                            key={entry.id || `custom-${selectedCustomId}-${index}`}
                            rank={rank}
                            entry={entry}
                            isCurrentPlayer={entry.isCurrentUser}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 4: MY STATS & SCORING GUIDE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Customizer Card */}
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-4 space-y-3 shadow-md">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Player Profile & Avatar
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#081844] border-2 border-cyan-400 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {profile.avatar}
                  </div>

                  <div className="flex-1 w-full space-y-1.5">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={16}
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          className="bg-[#081844] border border-cyan-400 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                          placeholder="Enter player name"
                        />
                        <button
                          onClick={handleSaveProfileName}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-xs font-black flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-blue-300 block">Display Name</span>
                          <span className="text-base font-black text-white">{profile.name}</span>
                        </div>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="px-2.5 py-1 bg-[#102A6B] hover:bg-[#193B8A] border border-[#1E3A8A] text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Picker row */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-300 block mb-1.5">
                    Choose Your Avatar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_AVATARS.map((av) => (
                      <button
                        key={av}
                        onClick={() => handleSelectAvatar(av)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          profile.avatar === av
                            ? 'bg-cyan-500 text-cyan-950 scale-110 shadow-lg ring-2 ring-white'
                            : 'bg-[#081844] hover:bg-[#102A6B] border border-[#1E3A8A]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Point Values Breakdown Card */}
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Letter Point Values
                  </h4>
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-black rounded-md border border-amber-400/40">
                    Tile Values
                  </span>
                </div>

                <p className="text-xs text-blue-200 leading-relaxed">
                  Every word formed awards points based on letter values. Category words grant an additional <strong>+50% bonus points</strong>!
                </p>

                {/* Tile Values Legend Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-xs">
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-xl p-1.5">
                    <span className="text-[10px] text-amber-300 font-extrabold block">100 PTS</span>
                    <span className="font-mono font-black text-white text-xs">A E I O U L N S T R</span>
                  </div>
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-xl p-1.5">
                    <span className="text-[10px] text-amber-300 font-extrabold block">200 PTS</span>
                    <span className="font-mono font-black text-white text-xs">D G</span>
                  </div>
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-xl p-1.5">
                    <span className="text-[10px] text-amber-300 font-extrabold block">300 PTS</span>
                    <span className="font-mono font-black text-white text-xs">B C M P</span>
                  </div>
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-xl p-1.5">
                    <span className="text-[10px] text-amber-300 font-extrabold block">400 PTS</span>
                    <span className="font-mono font-black text-white text-xs">F H V W Y</span>
                  </div>
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-xl p-1.5">
                    <span className="text-[10px] text-amber-300 font-extrabold block">500 PTS</span>
                    <span className="font-mono font-black text-white text-xs">K</span>
                  </div>
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-xl p-1.5">
                    <span className="text-[10px] text-amber-300 font-extrabold block">800 PTS</span>
                    <span className="font-mono font-black text-white text-xs">J X</span>
                  </div>
                  <div className="bg-[#081844] border border-[#1E3A8A] rounded-xl p-1.5">
                    <span className="text-[10px] text-amber-300 font-extrabold block">1,000 PTS</span>
                    <span className="font-mono font-black text-yellow-300 text-xs">Q Z</span>
                  </div>
                </div>
              </div>

              {/* Career Best Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#0B1E52] border border-[#1E3A8A] rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Total Points</span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    {formatPoints(profile.totalPoints)}
                  </span>
                </div>
                <div className="bg-[#0B1E52] border border-[#1E3A8A] rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Words Formed</span>
                  <span className="text-lg font-black text-emerald-300 font-mono">
                    {profile.totalWordsFormed}
                  </span>
                </div>
                <div className="bg-[#0B1E52] border border-[#1E3A8A] rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Categories Cleared</span>
                  <span className="text-lg font-black text-cyan-300 font-mono">
                    {profile.categoriesCompleted}
                  </span>
                </div>
                <div className="bg-[#0B1E52] border border-[#1E3A8A] rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Best Word</span>
                  <span className="text-sm font-black text-yellow-200 truncate block">
                    {profile.highestWord || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0B1E52] border-t border-[#1E3A8A] px-4 sm:px-6 py-3 flex items-center justify-between gap-2 shrink-0">
          {activeTab === 'profile' ? (
            <button
              onClick={handleResetData}
              className="text-xs text-red-300 hover:text-red-200 flex items-center gap-1 font-bold"
            >
              <RefreshCw className="w-3 h-3" /> Reset Scores
            </button>
          ) : (
            <span className="text-xs text-blue-300 font-medium">
              Rankings update automatically on every word formed!
            </span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-950 font-black text-xs sm:text-sm rounded-xl shadow-lg active:scale-95 transition-all"
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};

// Format seconds to mm:ss or mm:sss
function formatTimeConsumed(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Row component for rendering individual leaderboard entries
const LeaderboardRow: React.FC<{
  rank: number;
  entry: LeaderboardEntry;
  isCurrentPlayer?: boolean;
}> = ({ rank, entry, isCurrentPlayer }) => {
  let rankBadge: React.ReactNode = null;
  let bgClass = 'bg-[#0B1E52] border-[#193B8A]';

  if (rank === 1) {
    rankBadge = (
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 flex items-center justify-center font-black text-xs shadow-md border border-yellow-200">
        🥇
      </div>
    );
    bgClass = 'bg-gradient-to-r from-[#122863] via-[#102359] to-[#122863] border-amber-400/50 shadow-md shadow-amber-500/10';
  } else if (rank === 2) {
    rankBadge = (
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 flex items-center justify-center font-black text-xs shadow-md border border-slate-100">
        🥈
      </div>
    );
  } else if (rank === 3) {
    rankBadge = (
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xs shadow-md border border-amber-500">
        🥉
      </div>
    );
  } else {
    rankBadge = (
      <div className="w-7 h-7 rounded-xl bg-[#081844] border border-[#1E3A8A] text-blue-200 flex items-center justify-center font-mono font-black text-xs">
        #{rank}
      </div>
    );
  }

  if (isCurrentPlayer) {
    bgClass = 'bg-gradient-to-r from-[#0C2F6E] via-[#0E357E] to-[#0C2F6E] border-2 border-cyan-400 shadow-lg shadow-cyan-500/20';
  }

  return (
    <div
      className={`border rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-2.5 transition-all overflow-hidden ${bgClass}`}
    >
      {/* Left: Rank & Avatar & Name */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        <div className="shrink-0">{rankBadge}</div>

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#081844] border border-[#1E3A8A] flex items-center justify-center text-sm sm:text-base shrink-0 shadow-inner">
          {entry.avatar}
        </div>

        <div className="flex flex-col text-left min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-black text-xs sm:text-sm text-white tracking-wide truncate">
              {entry.playerName}
            </span>
            {isCurrentPlayer && (
              <span className="px-1.5 py-0.2 bg-cyan-400 text-cyan-950 text-[8px] sm:text-[9px] font-black rounded uppercase tracking-wider shrink-0">
                YOU
              </span>
            )}
          </div>
          <div className="text-[10px] text-blue-300 font-medium truncate flex items-center gap-1">
            <span className="shrink-0">{entry.wordsCount} Words</span>
            {entry.highestWord && (
              <>
                <span className="text-blue-400">•</span>
                <span className="text-emerald-300 font-mono truncate">Best: {entry.highestWord}</span>
              </>
            )}
            {entry.timeConsumedSeconds !== undefined && (
              <>
                <span className="text-blue-400 hidden sm:inline">•</span>
                <span className="text-cyan-300 font-mono hidden sm:flex items-center gap-0.5 shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatTimeConsumed(entry.timeConsumedSeconds)}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Score (Formatted Points) & Time */}
      <div className="flex flex-col items-end shrink-0 pl-1">
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-sm sm:text-base font-black text-amber-300 tracking-tight">
            {formatPoints(entry.score)}
          </span>
          <span className="text-[9px] font-extrabold text-amber-400/80">PTS</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-blue-300/70 font-mono">
          {entry.timeConsumedSeconds !== undefined && (
            <span className="text-cyan-300 font-bold bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40 sm:hidden">
              ⏱ {formatTimeConsumed(entry.timeConsumedSeconds)}
            </span>
          )}
          <span className="truncate">{entry.date}</span>
        </div>
      </div>
    </div>
  );
};
