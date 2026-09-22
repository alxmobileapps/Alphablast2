import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Music, Smartphone, ArrowLeftRight, Lightbulb, Flame, Languages } from 'lucide-react';
import { isSoundEnabled, toggleSound, isMusicEnabled, toggleMusic } from '../utils/audio';
import {
  isSwipeControlsEnabled,
  setSwipeControlsEnabled,
  isCluesEnabled as isCluesEnabledUtil,
  setCluesEnabled as setCluesEnabledUtil,
  getSpellingPreference,
  setSpellingPreference,
  SpellingPreference,
} from '../utils/settings';
import { haptics } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSwipeEnabled?: boolean;
  onToggleSwipe?: (enabled: boolean) => void;
  isCluesEnabled?: boolean;
  onToggleClues?: (enabled: boolean) => void;
  onTriggerFireWipeoutDemo?: () => void;
  onSpellingPreferenceChange?: (pref: SpellingPreference) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isSwipeEnabled,
  onToggleSwipe,
  isCluesEnabled,
  onToggleClues,
  onTriggerFireWipeoutDemo,
  onSpellingPreferenceChange,
}) => {
  const [sound, setSound] = useState<boolean>(() => isSoundEnabled());
  const [music, setMusic] = useState<boolean>(() => isMusicEnabled());
  const [vibration, setVibration] = useState<boolean>(true);
  const [swipe, setSwipe] = useState<boolean>(() =>
    isSwipeEnabled !== undefined ? isSwipeEnabled : isSwipeControlsEnabled()
  );
  const [clues, setClues] = useState<boolean>(() =>
    isCluesEnabled !== undefined ? isCluesEnabled : isCluesEnabledUtil()
  );
  const [spelling, setSpelling] = useState<SpellingPreference>(() => getSpellingPreference());

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSound(isSoundEnabled());
      setMusic(isMusicEnabled());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = toggleSound();
    setSound(next);
    haptics.tap();
  };

  const handleToggleMusic = () => {
    const next = toggleMusic();
    setMusic(next);
    haptics.tap();
  };

  const handleToggleVibration = () => {
    const next = !vibration;
    setVibration(next);
    if (next) {
      haptics.tap();
    }
  };

  const handleToggleSwipe = () => {
    const next = !swipe;
    setSwipe(next);
    setSwipeControlsEnabled(next);
    if (onToggleSwipe) {
      onToggleSwipe(next);
    }
    haptics.tap();
  };

  const handleToggleClues = () => {
    const next = !clues;
    setClues(next);
    setCluesEnabledUtil(next);
    if (onToggleClues) {
      onToggleClues(next);
    }
    haptics.tap();
  };

  const handleToggleSpelling = () => {
    const next: SpellingPreference = spelling === 'US' ? 'UK' : 'US';
    setSpelling(next);
    setSpellingPreference(next);
    if (onSpellingPreferenceChange) {
      onSpellingPreferenceChange(next);
    }
    haptics.tap();
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#071330]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      {/* Outer Sky Blue Frame Matching the Game Board Theme */}
      <div
        id="settings-modal-outer-frame"
        className="w-full max-w-md relative p-2 sm:p-2.5 rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_20px_50px_rgba(2,132,199,0.5),inset_0_2px_4px_rgba(255,255,255,0.7)]"
      >
        {/* Subtle Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/70 shadow-inner" />

        {/* Inner Midnight Navy Container */}
        <div
          id="settings-modal-card"
          className="bg-[#071330] rounded-2xl sm:rounded-[20px] p-5 sm:p-6 border border-[#0F2864] shadow-[inset_0_3px_12px_rgba(0,0,0,0.8)] relative text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white flex items-center justify-center font-black shadow-md border border-[#7DD3FC]">
                ⚙️
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)]">
                  Game Settings
                </h2>
                <p className="text-xs font-semibold text-cyan-200/70">
                  Audio, Feedback & Preferences
                </p>
              </div>
            </div>

            <button
              id="settings-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toggles & Options */}
          <div className="space-y-3 mb-5">
            {/* 1. Sound Effects FX */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  sound ? 'bg-cyan-900/60 border-cyan-400 text-cyan-300' : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}>
                  {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-black text-sm text-white">Sound Effects</div>
                  <div className="text-[11px] text-cyan-200/70">Tile taps, swaps, explosions & alerts</div>
                </div>
              </div>

              <button
                onClick={handleToggleSound}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                  sound
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-300 shadow-md shadow-emerald-500/30'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {sound ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 2. Background Music */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  music ? 'bg-indigo-900/60 border-indigo-400 text-indigo-300' : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}>
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-white">Background Music</div>
                  <div className="text-[11px] text-cyan-200/70">Relaxing ambient Neo-Soul groove</div>
                </div>
              </div>

              <button
                onClick={handleToggleMusic}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                  music
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-300 shadow-md shadow-indigo-500/30'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {music ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 3. Haptic Feedback */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  vibration ? 'bg-sky-900/60 border-sky-400 text-sky-300' : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-white">Haptic Vibration</div>
                  <div className="text-[11px] text-cyan-200/70">Tactile buzz on taps, matches & bombs</div>
                </div>
              </div>

              <button
                onClick={handleToggleVibration}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                  vibration
                    ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white border-sky-300 shadow-md shadow-sky-500/30'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {vibration ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 4. Swipe to Swap Controls */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  swipe ? 'bg-amber-900/60 border-amber-400 text-amber-300' : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}>
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-white">Swipe to Swap</div>
                  <div className="text-[11px] text-cyan-200/70">Swipe any letter up, down, left or right to swap</div>
                </div>
              </div>

              <button
                onClick={handleToggleSwipe}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                  swipe
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300 shadow-md shadow-amber-500/30'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {swipe ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 5. Inactivity Word Clues (Default: ON) */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  clues ? 'bg-yellow-900/60 border-yellow-400 text-yellow-300' : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}>
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-white">Word Clues</div>
                  <div className="text-[11px] text-cyan-200/70">Auto-suggest word clues when inactive</div>
                </div>
              </div>

              <button
                onClick={handleToggleClues}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                  clues
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-300 shadow-md shadow-yellow-500/30'
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {clues ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 5b. Spelling Preference (US/UK) — picks BOTH which spelling
                of a word counts as valid on the board (e.g. only "COLOR"
                when set to US, only "COLOUR" when set to UK) AND which
                spelling category names are shown in (defaults to US). */}
            <div className="bg-[#0C2158] border border-[#1E3A8A] rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  'bg-sky-900/60 border-sky-400 text-sky-300'
                }`}>
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-white">Spelling</div>
                  <div className="text-[11px] text-cyan-200/70">
                    Sets which spelling of a word counts as correct (e.g. COLOR vs COLOUR)
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleSpelling}
                className="px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-300 shadow-md shadow-sky-500/30"
              >
                {spelling === 'UK' ? '🇬🇧 UK' : '🇺🇸 US'}
              </button>
            </div>

          </div>

          {/* Footer Close Button */}
          <div className="pt-2 border-t border-[#1E3A8A]">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#38BDF8] hover:to-[#0284C7] text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
