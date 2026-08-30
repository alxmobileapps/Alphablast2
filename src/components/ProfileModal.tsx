import React, { useState } from 'react';
import {
  X,
  Check,
  Edit2,
  Lock,
  CheckCircle2,
  CloudUpload,
  CloudDownload,
  Loader2,
  ShieldCheck,
  KeyRound,
  Copy,
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '../data/categories';
import { GameProgress, isCategoryUnlocked, isCategoryCompleted, getTotalStars } from '../utils/gameProgress';
import { getUserProfile, saveUserProfile, DEFAULT_AVATARS, UserProfile } from '../utils/leaderboard';
import { formatPoints } from '../utils/scoring';
import { haptics } from '../utils/haptics';
import {
  getOrCreateLocalSyncKey,
  syncProgressWithCloudKey,
  restoreWithCloudKey,
} from '../utils/authService';

interface ProfileModalProps {
  isOpen: boolean;
  gameProgress: GameProgress;
  onClose: () => void;
  onSelectCategory?: (categoryId: number) => void;
  onUpdateGameProgress?: (updated: GameProgress) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  gameProgress,
  onClose,
  onSelectCategory,
  onUpdateGameProgress,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(profile.name || 'Player 1');
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Cloud Save state
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Cloud Sync Key / PIN state
  const [syncKey, setSyncKey] = useState<string>(() => getOrCreateLocalSyncKey());
  const [inputSyncKey, setInputSyncKey] = useState<string>('');
  const [isRestoreOpen, setIsRestoreOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAuthStatusMessage({ text, type });
    setTimeout(() => {
      setAuthStatusMessage(null);
    }, 5000);
  };

  const completedCount = gameProgress.completedCategoryIds.length;
  const totalStars = getTotalStars(gameProgress);
  const totalScoreAcrossCategories = Object.values(
    gameProgress.categoryHighScores || {}
  ).reduce<number>((acc, curr) => acc + (typeof curr === 'number' ? curr : Number(curr) || 0), 0);

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

  // Sync / Backup with Cloud Key
  const handleSyncWithCode = async () => {
    haptics.tap();
    setIsAuthLoading(true);
    try {
      // Auto-commit any unsaved text in nameInput if user edited it
      const currentName = nameInput.trim() || profile.name || 'Player 1';
      const updatedProfile: UserProfile = {
        ...profile,
        name: currentName,
      };
      saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditingName(false);

      const res = await syncProgressWithCloudKey(syncKey, gameProgress, updatedProfile);
      if (onUpdateGameProgress) {
        onUpdateGameProgress(res.progress);
      }
      if (res.userProfile) {
        setProfile(res.userProfile);
        setNameInput(res.userProfile.name);
      }
      haptics.specialCreated();
      showStatus(`Saved to Cloud! Username "${updatedProfile.name}" & progress backed up with Code: ${syncKey}`, 'success');
    } catch (err: any) {
      console.error(err);
      haptics.invalid();
      showStatus(err?.message || 'Failed to save to cloud.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Restore with Custom Cloud Code
  const handleRestoreWithCustomCode = async () => {
    const targetCode = (inputSyncKey.trim() || syncKey).toUpperCase();
    if (!targetCode) {
      showStatus('Please enter a Cloud Sync Code.', 'error');
      return;
    }
    haptics.tap();
    setIsAuthLoading(true);
    try {
      const res = await restoreWithCloudKey(targetCode, gameProgress);
      setSyncKey(targetCode);
      if (onUpdateGameProgress) {
        onUpdateGameProgress(res.progress);
      }
      if (res.userProfile) {
        setProfile(res.userProfile);
        setNameInput(res.userProfile.name);
      }
      setIsRestoreOpen(false);
      haptics.specialCreated();
      showStatus(
        res.restoredIAP
          ? `Welcome back ${res.userProfile.name}! Progress & In-App Purchases restored with Code ${targetCode}!`
          : `Welcome back ${res.userProfile.name}! Progress restored successfully with Code ${targetCode}!`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      haptics.invalid();
      showStatus(err?.message || 'Code not found or invalid.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const copySyncKey = () => {
    try {
      navigator.clipboard.writeText(syncKey);
      haptics.tap();
      showStatus(`Copied Code: ${syncKey}`, 'info');
    } catch {
      showStatus(`Code: ${syncKey}`, 'info');
    }
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
                  Username, Cloud Backup & Statistics
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
            {/* Notification / Toast Banner inside Modal */}
            {authStatusMessage && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 animate-in fade-in duration-200 ${
                  authStatusMessage.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                    : authStatusMessage.type === 'error'
                    ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
                    : 'bg-blue-950/90 border-blue-500/60 text-blue-200'
                }`}
              >
                {authStatusMessage.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">{authStatusMessage.text}</div>
              </div>
            )}

            {/* 1. PLAYER USERNAME & AVATAR CARD */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-4 shadow-inner relative">
              <div className="flex items-center gap-3.5">
                {/* Avatar Icon / Picker Trigger */}
                <div className="relative group shrink-0">
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#0284C7] to-[#0369A1] border-2 border-[#38BDF8] flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
                    title="Change Avatar"
                  >
                    {profile.avatar || '👑'}
                  </button>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#071330] rounded-full border border-sky-400 flex items-center justify-center text-[10px] text-sky-300 pointer-events-none">
                    ✏️
                  </div>
                </div>

                {/* Name Display or Edit Form */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300/70 block mb-0.5">
                    Player Name
                  </span>

                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={16}
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        autoFocus
                        className="bg-[#071330] border border-[#38BDF8] rounded-xl px-2.5 py-1 text-sm font-black text-white focus:outline-none w-full"
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer shrink-0"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setNameInput(profile.name);
                          setIsEditingName(false);
                        }}
                        className="p-1.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white cursor-pointer shrink-0"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white truncate">
                        {profile.name || 'Player 1'}
                      </h3>
                      <button
                        onClick={() => {
                          setNameInput(profile.name || 'Player 1');
                          setIsEditingName(true);
                        }}
                        className="p-1 text-cyan-300/70 hover:text-cyan-200 hover:bg-[#071330] rounded-lg transition-colors cursor-pointer"
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

            {/* 2. CLOUD BACKUP & RESTORE */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-b from-teal-400 to-emerald-600 flex items-center justify-center text-xs shadow-sm">
                    <KeyRound className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-200 block leading-none">
                      Cloud Backup and Restore
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold border border-emerald-500/40">
                  CLOUD READY
                </span>
              </div>

              {/* Unique Sync Code Display */}
              <div className="bg-[#071330] p-2.5 rounded-xl border border-[#1E3A8A] flex items-center justify-between gap-2 mt-2">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-cyan-300/60 block">YOUR BACKUP CODE</span>
                  <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                    {syncKey}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={copySyncKey}
                    className="p-1.5 rounded-lg bg-[#0F2864] hover:bg-[#1E3A8A] text-cyan-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <button
                  onClick={handleSyncWithCode}
                  disabled={isAuthLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-b from-[#0284C7] to-[#0369A1] hover:from-[#0EA5E9] hover:to-[#0284C7] border border-[#38BDF8]/40 text-white font-black text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5 text-cyan-200" />
                  )}
                  <span>Backup</span>
                </button>

                <button
                  onClick={() => setIsRestoreOpen(!isRestoreOpen)}
                  className="p-2.5 rounded-xl bg-gradient-to-b from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/40 text-white font-black text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <CloudDownload className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Restore</span>
                </button>
              </div>

              {/* Restore Input Drawer */}
              {isRestoreOpen && (
                <div className="mt-3 pt-3 border-t border-[#1E3A8A] space-y-2 animate-in fade-in duration-150">
                  <span className="text-[10px] font-bold text-cyan-200 block">
                    Enter Cloud Code from another device/browser:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ALPHA-1234"
                      value={inputSyncKey}
                      onChange={(e) => setInputSyncKey(e.target.value.toUpperCase())}
                      className="bg-[#071330] border border-[#38BDF8] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none w-full uppercase"
                    />
                    <button
                      onClick={handleRestoreWithCustomCode}
                      disabled={isAuthLoading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              )}

              {/* IAP Restore Badge */}
              {gameProgress.hasRemovedAds && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-300 font-bold bg-emerald-950/50 px-2.5 py-1.5 rounded-lg border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>In-App Purchase Active: All Ads Removed Permanently</span>
                </div>
              )}
            </div>

            {/* 3. HIGH-LEVEL CATEGORY STATS BANNER */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300/80">
                  CATEGORIES CLEARED
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
                  {completedCount}
                </span>
              </div>

              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300/80">
                  TOTAL STARS
                </span>
                <span className="text-lg sm:text-xl font-black text-yellow-300 mt-0.5 flex items-center gap-1">
                  ★ {totalStars}
                </span>
              </div>

              <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300/80">
                  TOTAL POINTS
                </span>
                <span className="text-lg sm:text-xl font-black text-cyan-300 mt-0.5">
                  {formatPoints(totalScoreAcrossCategories)}
                </span>
              </div>
            </div>

            {/* 4. OVERALL STATS & RECORD STATS */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner space-y-2.5">
              <span className="text-xs font-black text-cyan-300 uppercase tracking-wider block">
                Player Lifetime Records
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#071330] p-2.5 rounded-xl border border-[#1E3A8A]">
                  <span className="text-[10px] text-cyan-200/70 block">Total Words Formed</span>
                  <span className="font-black text-white text-base">
                    {profile.totalWordsFormed || 0}
                  </span>
                </div>
                <div className="bg-[#071330] p-2.5 rounded-xl border border-[#1E3A8A]">
                  <span className="text-[10px] text-cyan-200/70 block">Highest Word Score</span>
                  <span className="font-black text-amber-300 text-base">
                    {profile.highestWordPoints ? `${profile.highestWordPoints} pts` : '—'}
                  </span>
                  {profile.highestWord && (
                    <span className="text-[10px] font-mono text-cyan-300 block truncate">
                      "{profile.highestWord}"
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 5. ALL 60 CATEGORIES PROGRESS LIST */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  Category Progress ({completedCount} / {INITIAL_CATEGORIES.length})
                </span>
                <span className="text-[11px] font-bold text-amber-300">
                  {Math.round((completedCount / INITIAL_CATEGORIES.length) * 100)}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-[#071330] rounded-full overflow-hidden border border-[#1E3A8A] p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, (completedCount / INITIAL_CATEGORIES.length) * 100)}%`,
                  }}
                />
              </div>

              {/* List of Categories */}
              <div className="space-y-1.5 max-h-48 sm:max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {INITIAL_CATEGORIES.map((cat) => {
                  const unlocked = isCategoryUnlocked(cat.id, gameProgress);
                  const completed = isCategoryCompleted(cat.id, gameProgress);
                  const bestScore = gameProgress.categoryHighScores?.[cat.id] || 0;
                  const stars = gameProgress.categoryStars?.[cat.id] || 0;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        if (unlocked && onSelectCategory) {
                          onSelectCategory(cat.id);
                          onClose();
                        }
                      }}
                      className={`p-2 rounded-xl flex items-center justify-between border transition-all ${
                        completed
                          ? 'bg-[#071330] border-emerald-500/40 text-white'
                          : unlocked
                          ? 'bg-[#071330] border-[#1E3A8A] hover:border-sky-400 text-cyan-100 cursor-pointer'
                          : 'bg-[#050D20] border-[#0F1E4A]/50 text-gray-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{cat.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">{cat.name}</span>
                            <span className="text-[10px] text-cyan-300/60 font-mono">
                              #{cat.id}
                            </span>
                          </div>
                          {bestScore > 0 && (
                            <span className="text-[10px] text-amber-300 font-bold block">
                              Best: {formatPoints(bestScore)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {completed ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-300 text-xs font-bold">
                              {'★'.repeat(stars)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-black">
                              CLEARED
                            </span>
                          </div>
                        ) : unlocked ? (
                          <span className="px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-500/40 text-[9px] font-black">
                            UNLOCKED
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-gray-300 font-bold">
                            <Lock className="w-3 h-3 text-gray-300" />
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
        </div>
      </div>
    </div>
  );
};
