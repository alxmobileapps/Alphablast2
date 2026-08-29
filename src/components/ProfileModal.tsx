import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Edit2,
  Lock,
  CheckCircle2,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  Loader2,
  ShieldCheck,
  KeyRound,
  Copy,
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '../data/categories';
import { GameProgress, isCategoryUnlocked, isCategoryCompleted } from '../utils/gameProgress';
import { getUserProfile, saveUserProfile, DEFAULT_AVATARS, UserProfile } from '../utils/leaderboard';
import { formatPoints } from '../utils/scoring';
import { haptics } from '../utils/haptics';
import {
  signInWithGoogleAccount,
  syncProgressToCloud,
  restoreCloudProgress,
  signOutGoogleAccount,
  subscribeToAuth,
  getOrCreateLocalSyncKey,
  syncProgressWithCloudKey,
  restoreWithCloudKey,
} from '../utils/authService';
import { User } from 'firebase/auth';

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

  // Google Auth & Cloud Save state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);

  // Cloud Sync Key / PIN state
  const [syncKey, setSyncKey] = useState<string>(() => getOrCreateLocalSyncKey());
  const [inputSyncKey, setInputSyncKey] = useState<string>('');
  const [isRestoreOpen, setIsRestoreOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAuthStatusMessage({ text, type });
    setTimeout(() => {
      setAuthStatusMessage(null);
    }, 5000);
  };

  const completedCount = gameProgress.completedCategoryIds.length;
  const totalStars = Object.values(gameProgress.categoryStars || {}).reduce<number>(
    (acc, curr) => acc + (typeof curr === 'number' ? curr : Number(curr) || 0),
    0
  );
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

  // Google Login & Account Linking handler
  const handleLinkGoogle = async () => {
    haptics.tap();
    setIsAuthLoading(true);
    try {
      const res = await signInWithGoogleAccount(gameProgress);
      setAuthUser(res.user);
      setLastSyncTimestamp(Date.now());
      if (onUpdateGameProgress) {
        onUpdateGameProgress(res.progress);
      }
      if (res.userProfile) {
        setProfile(res.userProfile);
        setNameInput(res.userProfile.name);
      } else {
        const prof = getUserProfile();
        setProfile(prof);
        setNameInput(prof.name);
      }
      haptics.specialCreated();
      showStatus(res.message, 'success');
    } catch (err: any) {
      console.error(err);
      haptics.invalid();
      showStatus(
        err?.message || 'Google Sign-in failed. You can use the Cloud Sync Code below to backup instantly!',
        'error'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 1-Tap Instant Backup with Cloud Sync Code
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
      setLastSyncTimestamp(res.syncedAt);
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
      setLastSyncTimestamp(res.lastSyncedAt);
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

  // Disconnect / Sign Out Google
  const handleSignOutGoogle = async () => {
    haptics.tap();
    setIsAuthLoading(true);
    try {
      await signOutGoogleAccount();
      setAuthUser(null);
      showStatus('Signed out from Google Account.', 'info');
    } catch (err: any) {
      console.error(err);
      showStatus('Failed to sign out.', 'error');
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
                  Username, Cloud Account & Statistics
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
                {authStatusMessage.type === 'error' && (
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                {authStatusMessage.type === 'info' && (
                  <Cloud className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 leading-snug">{authStatusMessage.text}</span>
              </div>
            )}

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

            {/* 2. INSTANT CLOUD SAVE & SYNC CODE (Always Works 100%) */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-b from-teal-400 to-emerald-600 flex items-center justify-center text-xs shadow-sm">
                    <KeyRound className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-200 block leading-none">
                      Instant Cloud Sync Key
                    </span>
                    <span className="text-[9px] text-cyan-200/60 font-semibold">
                      100% Reliable Cloud Backup & Restore Code
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold border border-emerald-500/40">
                  LIVE CLOUD
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

              {/* Action Buttons for Code Sync */}
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
                  <span>Backup to Cloud</span>
                </button>

                <button
                  onClick={() => setIsRestoreOpen(!isRestoreOpen)}
                  className="p-2.5 rounded-xl bg-gradient-to-b from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/40 text-white font-black text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <CloudDownload className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Restore with Code</span>
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
            </div>

            {/* 3. OPTIONAL GOOGLE ACCOUNT LINK */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 sm:p-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-b from-sky-400 to-blue-600 flex items-center justify-center text-xs shadow-sm">
                    <Cloud className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-200 block leading-none">
                      Google Account Link
                    </span>
                    <span className="text-[9px] text-cyan-200/60 font-semibold">
                      One-tap Google login
                    </span>
                  </div>
                </div>

                {authUser ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> LINKED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 text-[9px] font-extrabold border border-gray-500/30">
                    OPTIONAL
                  </span>
                )}
              </div>

              {authUser ? (
                <div className="space-y-2 mt-2 pt-2 border-t border-[#1E3A8A]">
                  <div className="flex items-center justify-between gap-3 bg-[#071330] p-2.5 rounded-xl border border-[#1E3A8A]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {authUser.photoURL ? (
                        <img
                          src={authUser.photoURL}
                          alt="Avatar"
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full border border-sky-400"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                          {authUser.email ? authUser.email[0].toUpperCase() : 'G'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-black text-xs text-white truncate">
                          {authUser.displayName || 'Google Player'}
                        </div>
                        <div className="text-[10px] text-cyan-300/70 truncate font-mono">
                          {authUser.email}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOutGoogle}
                      disabled={isAuthLoading}
                      className="px-2 py-1 rounded-lg bg-[#0F2864] hover:bg-rose-950/60 border border-[#1E3A8A] text-cyan-200 hover:text-rose-200 text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3 h-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-[#1E3A8A]">
                  <button
                    onClick={handleLinkGoogle}
                    disabled={isAuthLoading}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>{isAuthLoading ? 'Connecting...' : 'Sign in with Google (Link)'}</span>
                  </button>
                </div>
              )}

              {/* IAP Restore Badge */}
              {gameProgress.hasRemovedAds && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-300 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>In-App Purchase Active: All Ads Removed</span>
                </div>
              )}
            </div>

            {/* 4. HIGH-LEVEL CATEGORY STATS BANNER */}
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
                <span className="text-sm sm:text-base font-black text-emerald-300 font-mono mt-0.5 truncate max-w-full">
                  {formatPoints(totalScoreAcrossCategories)}
                </span>
              </div>
            </div>

            {/* 5. CATEGORY STATS DETAILED BREAKDOWN LIST */}
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
