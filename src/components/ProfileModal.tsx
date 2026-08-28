import React, { useState } from 'react';
import { X, Check, Edit2, Trophy, Star, Lock, CheckCircle2, Award } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../data/categories';
import { GameProgress, isCategoryUnlocked, isCategoryCompleted } from '../utils/gameProgress';
import { getUserProfile, saveUserProfile, DEFAULT_AVATARS, UserProfile } from '../utils/leaderboard';
import { formatPoints } from '../utils/scoring';
import { haptics } from '../utils/haptics';

interface ProfileModalProps {
  isOpen: boolean;
  gameProgress: GameProgress;
  onClose: () => void;
  onSelectCategory?: (categoryId: number) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  gameProgress,
  onClose,
  onSelectCategory,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(profile.name || 'Player 1');
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  if (!isOpen) return null;

  const completedCount = gameProgress.completedCategoryIds.length;
  const totalStars = Object.values(gameProgress.categoryStars || {}).reduce<number>(
    (acc, curr) => acc + (typeof curr === 'number' ? curr : Number(curr) || 0),
    0
  );
  const totalScoreAcrossCategories = Object.values(gameProgress.categoryHighScores || {}).reduce<number>(
    (acc, curr) => acc + (typeof curr === 'number' ? curr : Number(curr) || 0),
    0
  );

  const handleSaveName = () => {
    const trimmed = nameInput.trim() || 'Player 1';
    const updated = { ...profile, name: trimmed };
    saveUserProfile(updated);
    setProfile(updated);
    setIsEditingName(false);
    haptics.tap();
  };

  const handleSelectAvatar = (av: string) => {
    const updated = { ...profile, avatar: av };
    saveUserProfile(updated);
    setProfile(updated);
    setShowAvatarPicker(false);
    haptics.tap();
  };

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      {/* Outer Sky Blue Frame Matching the Board Theme */}
      <div
        id="profile-modal-outer-frame"
        className="w-full max-w-lg relative p-2 sm:p-2.5 rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_20px_50px_rgba(2,132,199,0.5),inset_0_2px_4px_rgba(255,255,255,0.7)] max-h-[92vh] flex flex-col"
      >
        {/* Subtle Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />

        {/* Inner Midnight Navy Container */}
        <div
          id="profile-modal-card"
          className="bg-[#071330] rounded-2xl sm:rounded-[20px] p-4 sm:p-6 border border-[#0F2864] shadow-[inset_0_3px_12px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-white flex-1 max-h-[calc(92vh-20px)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white flex items-center justify-center font-black shadow-md border border-[#7DD3FC]">
                👤
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)]">
                  Player Profile
                </h2>
                <p className="text-xs font-semibold text-cyan-200/70">
                  Username & Category Statistics
                </p>
              </div>
            </div>

            <button
              id="profile-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-4">
            {/* 1. USERNAME & AVATAR SECTION */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Avatar Badge with Click to Change */}
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="relative group cursor-pointer"
                  title="Click to change avatar"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-[#1E3A8A] to-[#0A1A44] border-2 border-[#38BDF8] flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-105 transition-transform">
                    {profile.avatar || '👑'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-[#0284C7] text-white text-[9px] font-black px-1 rounded-md border border-white">
                    EDIT
                  </span>
                </button>

                {/* Username with Inline Editing */}
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-cyan-300/80 block">
                    PLAYER USERNAME
                  </span>

                  {isEditingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        maxLength={16}
                        autoFocus
                        className="bg-[#071330] border-2 border-[#38BDF8] rounded-xl px-3 py-1.5 text-sm sm:text-base font-black text-white focus:outline-none w-full shadow-inner"
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-2 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black shadow-md shrink-0 cursor-pointer"
                        title="Save username"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-lg sm:text-2xl font-black text-white truncate drop-shadow">
                        {profile.name || 'Player 1'}
                      </span>
                      <button
                        onClick={() => {
                          setNameInput(profile.name || 'Player 1');
                          setIsEditingName(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#071330] hover:bg-[#102A6B] border border-[#1E3A8A] text-cyan-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar Selector Dropdown Grid */}
              {showAvatarPicker && (
                <div className="mt-3 pt-3 border-t border-[#1E3A8A] animate-in fade-in duration-150">
                  <span className="text-[10px] font-bold text-cyan-200/80 mb-2 block">
                    Choose Your Avatar:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_AVATARS.map((av) => (
                      <button
                        key={av}
                        onClick={() => handleSelectAvatar(av)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all ${
                          profile.avatar === av
                            ? 'bg-[#0284C7] border-2 border-white scale-110 shadow-md'
                            : 'bg-[#071330] hover:bg-[#102A6B] border border-[#1E3A8A]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. HIGH-LEVEL CATEGORY STATS BANNER */}
            <div className="grid grid-cols-3 gap-2">
              {/* Stat 1: Categories Cleared */}
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300/80">
                  CATEGORIES CLEARED
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
                  {completedCount}
                </span>
              </div>

              {/* Stat 2: Total Category Stars */}
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300/80">
                  TOTAL STARS
                </span>
                <span className="text-lg sm:text-xl font-black text-yellow-300 mt-0.5 flex items-center gap-1">
                  ★ {totalStars}
                </span>
              </div>

              {/* Stat 3: Total Category High Score */}
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300/80">
                  TOTAL POINTS
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-300 font-mono mt-0.5 truncate max-w-full">
                  {formatPoints(totalScoreAcrossCategories)}
                </span>
              </div>
            </div>

            {/* 3. CATEGORY STATS DETAILED BREAKDOWN LIST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-200">
                  Category Progress & High Scores
                </h3>
                {completedCount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400">
                    {completedCount} Cleared
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {INITIAL_CATEGORIES.map((cat) => {
                  const unlocked = isCategoryUnlocked(cat.id, gameProgress);
                  const completed = isCategoryCompleted(cat.id, gameProgress);
                  const highScore = gameProgress.categoryHighScores[cat.id] || 0;
                  const stars = gameProgress.categoryStars[cat.id] || (completed ? 1 : 0);

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        if (unlocked && onSelectCategory) {
                          onSelectCategory(cat.id);
                          onClose();
                        }
                      }}
                      className={`rounded-2xl p-2.5 sm:p-3 border transition-all flex items-center justify-between gap-2.5 ${
                        completed
                          ? 'bg-[#0A2054] border-emerald-500/40 hover:border-emerald-400'
                          : unlocked
                          ? 'bg-[#0C2158] border-[#1E3A8A] hover:border-cyan-400 cursor-pointer'
                          : 'bg-[#050D24]/80 border-[#0F1E4A] opacity-60'
                      }`}
                    >
                      {/* Left: Category Icon & Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 border ${
                            completed
                              ? 'bg-emerald-900/40 border-emerald-500/60'
                              : unlocked
                              ? 'bg-[#071330] border-[#38BDF8]/40'
                              : 'bg-gray-900/60 border-gray-700'
                          }`}
                        >
                          {cat.icon || '🎯'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold text-cyan-300/80">
                              Round #{cat.id}
                            </span>
                            {completed && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/30 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> CLEARED
                              </span>
                            )}
                          </div>
                          <div className="font-black text-white text-xs sm:text-sm truncate">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-cyan-200/60 font-medium">
                            Target: {cat.targetCount} words
                          </div>
                        </div>
                      </div>

                      {/* Right: Stars & High Score */}
                      <div className="flex flex-col items-end shrink-0">
                        {unlocked ? (
                          <>
                            {/* Stars rating */}
                            <div className="flex items-center gap-0.5 text-xs text-yellow-300 font-bold mb-0.5">
                              {[1, 2, 3].map((starIdx) => (
                                <span
                                  key={starIdx}
                                  className={
                                    starIdx <= stars
                                      ? 'text-yellow-300 drop-shadow'
                                      : 'text-gray-600'
                                  }
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="font-mono text-xs font-bold text-cyan-200">
                              {highScore > 0 ? `${formatPoints(highScore)} pts` : 'No score yet'}
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-900/60 px-2 py-1 rounded-lg border border-gray-700">
                            <Lock className="w-3 h-3 text-gray-500" />
                            <span>Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Close Button */}
          <div className="pt-3 mt-2 border-t border-[#1E3A8A] shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] hover:from-[#7DD3FC] hover:to-[#0EA5E9] border-t border-white/80 border-b-4 border-b-[#034C70] active:border-b active:translate-y-[3px] text-white font-black text-sm tracking-wider shadow-md transition-all cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
