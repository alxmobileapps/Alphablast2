import React, { useState, useEffect } from 'react';
import { X, Sparkles, Gem, Plus, Minus, Clock, Users, Lightbulb, AlertCircle, CheckCircle2, Target, Wand2, Loader2, Timer, Zap, Edit3 } from 'lucide-react';
import {
  CUSTOM_CATEGORY_DIAMOND_COST,
  DEFAULT_TIMER_SECONDS,
  publishCustomCategory,
  updateCustomCategory,
  sanitizeCategoryWords,
} from '../utils/customCategoriesService';
import { Category, CustomGameMode } from '../types';
import { playRewardRefill, playWin } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { generateAiCategory, suggestWordsWithAi } from '../utils/geminiService';
import { CurrencyPromptModal, CurrencyPromptType } from './CurrencyPromptModal';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  diamonds: number;
  coins?: number;
  onDeductDiamonds: (amount: number) => boolean;
  onCategoryCreated: (category: Category) => void;
  onCategoryUpdated?: (category: Category) => void;
  onOpenShop?: (tab?: 'powerups' | 'coins' | 'diamonds') => void;
  editingCategory?: Category | null;
}

const EMOJI_OPTIONS = [
  '🚀', '🎮', '☕', '🍕', '⚡', '🎸', '🐾', '🍩',
  '🐉', '🏎️', '🏀', '🌺', '🎨', '🧪', '🏰', '🏝️',
  '🤖', '📚', '🎬', '🌟', '💎', '🍣', '🏕️', '🏆'
];

const PRESET_GOALS = [5, 6, 8, 10, 12, 15];
const PRESET_TIMERS = [
  { label: '1 Min', seconds: 60, desc: 'Fast Sprint' },
  { label: '2 Mins', seconds: 120, desc: 'Recommended' },
  { label: '3 Mins', seconds: 180, desc: 'Endurance' },
  { label: '5 Mins', seconds: 300, desc: 'Marathon' },
];

const PRESET_THEMES = [
  {
    name: 'Space Explorer',
    icon: '🚀',
    targetCount: 8,
    words: [
      'ROCKET', 'PLANET', 'METEOR', 'GALAXY', 'COMET', 'ORBIT', 'STAR', 'MOON',
      'ASTEROID', 'NEBULA', 'COSMOS', 'SOLAR', 'ALIEN', 'MARS', 'VENUS', 'JUPITER',
      'SATURN', 'CRATER', 'SHUTTLE', 'PULSAR', 'PROBE', 'GRAVITY'
    ],
  },
  {
    name: 'Video Games',
    icon: '🎮',
    targetCount: 8,
    words: [
      'GAMER', 'QUEST', 'PIXEL', 'ARCADE', 'BOSS', 'LEVEL', 'CONSOLE', 'PLAYER',
      'BONUS', 'SHIELD', 'JOYSTICK', 'RETRO', 'SPEED', 'POWER', 'SCORE', 'AVATAR',
      'STEALTH', 'HEALER', 'COMBO', 'GLITCH', 'LOOT', 'ROGUE'
    ],
  },
  {
    name: 'Coffee & Cafe',
    icon: '☕',
    targetCount: 8,
    words: [
      'LATTE', 'MOCHA', 'ESPRESSO', 'BEANS', 'BREW', 'ROAST', 'MATCHA', 'CARAMEL',
      'BARISTA', 'FRAPPE', 'CREAM', 'PASTRY', 'SUGAR', 'MUG', 'STEAM', 'VANILLA',
      'FILTER', 'POTION', 'SYRUP', 'CINNAMON', 'BAKERY', 'CAFE'
    ],
  },
  {
    name: 'Superheroes',
    icon: '⚡',
    targetCount: 8,
    words: [
      'HERO', 'POWER', 'MUTANT', 'FLYING', 'LASER', 'STRONG', 'ARMOR', 'STEEL',
      'SHIELD', 'MASK', 'BRAVE', 'SPEED', 'AVENGER', 'CAPE', 'FORCE', 'VILLAIN',
      'FLIGHT', 'MIGHTY', 'ENERGY', 'JUSTICE', 'TITAN', 'SHADOW'
    ],
  },
  {
    name: 'Sweet Desserts',
    icon: '🍩',
    targetCount: 8,
    words: [
      'COOKIE', 'DONUT', 'CANDY', 'WAFFLE', 'PUDDING', 'SUNDAE', 'FUDGE', 'TART',
      'CARAMEL', 'CREAM', 'PASTRY', 'JELLY', 'ICING', 'CAKE', 'MUFFIN', 'GELATO',
      'BROWNIE', 'HONEY', 'SYRUP', 'SUGAR', 'CHERRY', 'CHOUX'
    ],
  },
  {
    name: 'Rock & Music',
    icon: '🎸',
    targetCount: 8,
    words: [
      'GUITAR', 'DRUMS', 'PIANO', 'CHORD', 'RHYTHM', 'MELODY', 'TEMPO', 'SYNTH',
      'FLUTE', 'VIOLIN', 'BRASS', 'SONG', 'BEAT', 'ALBUM', 'SOLO', 'SINGER',
      'STAGE', 'VOCAL', 'CHORUS', 'TREBLE', 'BASS', 'CONCERT'
    ],
  },
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  diamonds,
  coins = 0,
  onDeductDiamonds,
  onCategoryCreated,
  onCategoryUpdated,
  onOpenShop,
  editingCategory,
}) => {
  const isEditing = !!editingCategory;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [gameMode, setGameMode] = useState<CustomGameMode>('timer');
  const [timerSeconds, setTimerSeconds] = useState<number>(DEFAULT_TIMER_SECONDS);
  const [targetCount, setTargetCount] = useState<number>(8);
  const [creatorName, setCreatorName] = useState(() => {
    try {
      return localStorage.getItem('word_blast_player_name') || 'WordMaster';
    } catch {
      return 'WordMaster';
    }
  });
  const [wordsInput, setWordsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currencyPrompt, setCurrencyPrompt] = useState<CurrencyPromptType>(null);

  // Gemini AI Generation States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSuggestingAi, setIsSuggestingAi] = useState(false);

  // Populate when editing
  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name || '');
      setIcon(editingCategory.icon || '⭐');
      setGameMode(editingCategory.gameMode || (editingCategory.timerSeconds ? 'timer' : 'target'));
      setTimerSeconds(editingCategory.timerSeconds || DEFAULT_TIMER_SECONDS);
      setTargetCount(editingCategory.targetCount || 8);
      setCreatorName(editingCategory.creatorName || 'WordMaster');
      setWordsInput((editingCategory.words || []).join(', '));
      setErrorMessage(null);
    } else {
      setName('');
      setIcon('🚀');
      setGameMode('timer');
      setTimerSeconds(DEFAULT_TIMER_SECONDS);
      setTargetCount(8);
      setWordsInput('');
      setErrorMessage(null);
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  // Compute parsed words
  const rawList = wordsInput
    .split(/[\n,;\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const parsedWords = sanitizeCategoryWords(rawList);

  // Requirement for valid words:
  // In Target mode: 2x rule (at least targetCount * 2)
  // In Timer mode: at least 10 words for rich board spawning
  const minRequiredWords = gameMode === 'target' ? targetCount * 2 : 10;
  const isWordsSatisfied = parsedWords.length >= minRequiredWords;
  const wordsProgressPercent = Math.min(100, Math.round((parsedWords.length / minRequiredWords) * 100));

  const handleGenerateAiTheme = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || aiPrompt || name).trim();
    if (!promptToUse) {
      setErrorMessage('Please type an AI theme idea (e.g. "Mythical Beasts", "Coffee brewing", "Formula 1 Racing").');
      return;
    }

    setIsGeneratingAi(true);
    setErrorMessage(null);
    haptics.specialCreated();

    try {
      const result = await generateAiCategory(promptToUse, targetCount);
      setName(result.name);
      setIcon(result.icon || '✨');
      setTargetCount(result.targetCount || targetCount);
      setWordsInput(result.words.join(', '));
      setAiPrompt('');
      playRewardRefill();
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setErrorMessage(err.message || 'Gemini AI generation failed. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSuggestAiWords = async () => {
    const currentTheme = (name || aiPrompt || 'General Words').trim();
    setIsSuggestingAi(true);
    setErrorMessage(null);
    haptics.tap();

    try {
      const suggestions = await suggestWordsWithAi(currentTheme, parsedWords, 50);
      if (suggestions.length > 0) {
        const combined = Array.from(new Set([...parsedWords, ...suggestions]));
        setWordsInput(combined.join(', '));
        playRewardRefill();
      }
    } catch (err: any) {
      console.error('AI Suggestion error:', err);
      setErrorMessage(err.message || 'Failed to suggest words from Gemini.');
    } finally {
      setIsSuggestingAi(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setTargetCount(preset.targetCount || 8);
    setWordsInput(preset.words.join(', '));
    setErrorMessage(null);
    haptics.tap();
  };

  const handleGoalChange = (newGoal: number) => {
    const clamped = Math.max(4, Math.min(20, newGoal));
    setTargetCount(clamped);
    haptics.tap();
  };

  const handleTimerChange = (seconds: number) => {
    setTimerSeconds(Math.max(30, Math.min(600, seconds)));
    haptics.tap();
  };

  const handlePublishOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a Category Title.');
      return;
    }

    if (parsedWords.length < minRequiredWords) {
      setErrorMessage(
        gameMode === 'target'
          ? `Goal of ${targetCount} words requires at least ${minRequiredWords} valid options (2× the goal). You have provided ${parsedWords.length}.`
          : `Timer mode requires at least ${minRequiredWords} words. You have provided ${parsedWords.length}.`
      );
      return;
    }

    // If creating brand new, check and deduct diamonds
    if (!isEditing) {
      if (diamonds < CUSTOM_CATEGORY_DIAMOND_COST) {
        setErrorMessage(`You need at least ${CUSTOM_CATEGORY_DIAMOND_COST} diamonds to create a 1-hour custom game.`);
        return;
      }

      const deducted = onDeductDiamonds(CUSTOM_CATEGORY_DIAMOND_COST);
      if (!deducted) {
        setErrorMessage('Could not deduct diamonds. Please check your balance.');
        return;
      }
    }

    // Save player name
    try {
      localStorage.setItem('word_blast_player_name', creatorName.trim() || 'Player');
    } catch {}

    setIsSubmitting(true);

    try {
      if (isEditing && editingCategory) {
        // Update existing category
        const updated = updateCustomCategory(editingCategory.id, {
          name: trimmedName,
          icon,
          words: parsedWords,
          creatorName: creatorName.trim() || 'Player',
          targetCount: gameMode === 'target' ? targetCount : 10,
          gameMode,
          timerSeconds: gameMode === 'timer' ? timerSeconds : undefined,
        });

        haptics.specialCreated();
        playRewardRefill();
        if (updated && onCategoryUpdated) {
          onCategoryUpdated(updated);
        }
        onClose();
      } else {
        // Create new category
        const newCategory = await publishCustomCategory({
          name: trimmedName,
          icon,
          words: parsedWords,
          creatorName: creatorName.trim() || 'Player',
          targetCount: gameMode === 'target' ? targetCount : 10,
          color: 'purple',
          gameMode,
          timerSeconds: gameMode === 'timer' ? timerSeconds : undefined,
        });

        haptics.specialCreated();
        playRewardRefill();
        playWin();

        onCategoryCreated(newCategory);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to save custom category:', err);
      setErrorMessage(err.message || 'Failed to save custom game. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-white border-4 border-purple-300 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto custom-scrollbar shadow-2xl relative text-[#2D3748] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-purple-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center text-xl shadow-xs">
              {isEditing ? '✏️' : '✨'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-purple-950 leading-tight">
                {isEditing ? 'Edit Custom Game' : 'Create 1-Hour Custom Game'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {isEditing ? 'Custom Game Settings' : 'Public live for 1 hour'}
                </span>
                {!isEditing && (
                  <span className="text-[11px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded-full flex items-center gap-1">
                    <Gem className="w-3 h-3 text-cyan-600" /> Cost: {CUSTOM_CATEGORY_DIAMOND_COST} Diamonds
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diamond Balance Status if creating new */}
        {!isEditing && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-3 mb-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <div>
                <div className="text-xs font-black text-purple-950">Your Diamond Balance</div>
                <div className="text-sm font-black text-cyan-700 font-mono">{diamonds} Diamonds</div>
              </div>
            </div>

            {diamonds < CUSTOM_CATEGORY_DIAMOND_COST && onOpenShop && (
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  setCurrencyPrompt('buy_more_diamonds');
                }}
                className="bg-amber-400 hover:bg-amber-500 border border-amber-600 text-amber-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Get Diamonds
              </button>
            )}
          </div>
        )}

        {/* Gemini Magic AI Theme Generator */}
        <div className="mb-4 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 border-2 border-purple-400/80 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-r from-amber-400 to-purple-400 flex items-center justify-center text-xs font-black shadow-xs">
                ✨
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-amber-300 tracking-wide uppercase">
                  AI Theme Wizard (Gemini)
                </h3>
                <p className="text-[10.5px] text-purple-200/90 font-medium">
                  Type any theme to auto-generate title, icon, and 25+ verified words!
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold bg-purple-800/80 border border-purple-400/50 px-2 py-0.5 rounded-full text-purple-200 shrink-0">
              AI Powered
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateAiTheme();
                }
              }}
              placeholder="e.g. Mythical Beasts, French Pastries, 90s Cartoons..."
              disabled={isGeneratingAi}
              className="w-full flex-1 px-3 py-2 bg-slate-900/90 border border-purple-400/60 rounded-xl text-xs font-bold text-white placeholder:text-purple-300/50 focus:outline-none focus:border-amber-300 transition-colors"
            />
            <button
              type="button"
              onClick={() => handleGenerateAiTheme()}
              disabled={isGeneratingAi}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-500 hover:from-amber-300 hover:to-indigo-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Generate Theme</span>
                </>
              )}
            </button>
          </div>

          {/* Quick AI Idea Prompts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-purple-800/60">
            <span className="text-[10px] text-purple-300/80 font-bold mr-1">Try:</span>
            {[
              { label: '🐉 Mythical Beasts', prompt: 'Mythical Beasts and Creatures' },
              { label: '☕ Coffee & Cafe', prompt: 'Coffee brewing and Cafe culture' },
              { label: '🏎️ Formula 1', prompt: 'Formula 1 Racing and Tracks' },
              { label: '🧁 French Bakery', prompt: 'French Bakery and Desserts' },
              { label: '🎸 Rock Music', prompt: 'Rock Music Instruments and Legends' },
            ].map((idea) => (
              <button
                key={idea.prompt}
                type="button"
                onClick={() => handleGenerateAiTheme(idea.prompt)}
                disabled={isGeneratingAi}
                className="bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-200 hover:text-white text-[10px] font-bold px-2 py-0.5 rounded-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {idea.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Theme Quick Selectors */}
        <div className="mb-4">
          <div className="flex items-center gap-1 text-xs font-black text-gray-600 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Classic Preset Themes:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_THEMES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePublishOrUpdate} className="flex flex-col gap-3.5">
          {/* GAME MODE SELECTION TOGGLE */}
          <div className="bg-purple-50/80 border-2 border-purple-200 rounded-2xl p-3 flex flex-col gap-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-950 flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="w-4 h-4 text-purple-700" /> Custom Game Mode
              </span>
              <span className="text-[10px] font-black text-purple-700 bg-purple-200/80 px-2 py-0.5 rounded-md">
                {gameMode === 'timer' ? '⏱ Timed Rush Mode' : '🎯 Target Goal Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Timed Rush */}
              <button
                type="button"
                onClick={() => {
                  setGameMode('timer');
                  haptics.tap();
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  gameMode === 'timer'
                    ? 'bg-gradient-to-br from-purple-700 to-indigo-700 text-white border-purple-400 shadow-md ring-2 ring-purple-300'
                    : 'bg-white hover:bg-purple-50 text-gray-700 border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
                    <Timer className={`w-4 h-4 ${gameMode === 'timer' ? 'text-amber-300' : 'text-purple-600'}`} />
                    <span>Timed Rush</span>
                  </div>
                  {gameMode === 'timer' && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[9px] font-black rounded uppercase">
                      Selected
                    </span>
                  )}
                </div>
                <p className={`text-[11px] leading-tight ${gameMode === 'timer' ? 'text-purple-100' : 'text-gray-500'}`}>
                  Find as many words as you can within the timer! (e.g. 2 Mins)
                </p>
              </button>

              {/* Option 2: Target Goal */}
              <button
                type="button"
                onClick={() => {
                  setGameMode('target');
                  haptics.tap();
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  gameMode === 'target'
                    ? 'bg-gradient-to-br from-purple-700 to-indigo-700 text-white border-purple-400 shadow-md ring-2 ring-purple-300'
                    : 'bg-white hover:bg-purple-50 text-gray-700 border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
                    <Target className={`w-4 h-4 ${gameMode === 'target' ? 'text-amber-300' : 'text-purple-600'}`} />
                    <span>Target Goal</span>
                  </div>
                  {gameMode === 'target' && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[9px] font-black rounded uppercase">
                      Selected
                    </span>
                  )}
                </div>
                <p className={`text-[11px] leading-tight ${gameMode === 'target' ? 'text-purple-100' : 'text-gray-500'}`}>
                  Clear target count of theme words with move limits (7 moves).
                </p>
              </button>
            </div>

            {/* If Timer Mode: Timer Duration Selector */}
            {gameMode === 'timer' && (
              <div className="bg-white border border-purple-200 rounded-xl p-2.5 flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" /> Timer Duration:
                  </span>
                  <span className="text-xs font-black font-mono text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-300">
                    ⏱ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')} ({Math.floor(timerSeconds / 60)} min{timerSeconds >= 120 ? 's' : ''})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {PRESET_TIMERS.map((preset) => (
                    <button
                      key={preset.seconds}
                      type="button"
                      onClick={() => handleTimerChange(preset.seconds)}
                      className={`px-2.5 py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        timerSeconds === preset.seconds
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs font-black scale-105'
                          : 'bg-purple-50/50 hover:bg-purple-100 border-purple-200 text-purple-900 font-bold'
                      }`}
                    >
                      <div className="text-xs font-black">{preset.label}</div>
                      <div className={`text-[9px] ${timerSeconds === preset.seconds ? 'text-amber-300' : 'text-purple-600/80'}`}>
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-gray-500 font-medium pt-1 border-t border-purple-100">
                  <span>Players find as many words as possible before time runs out.</span>
                  <span className="text-purple-700 font-bold">Editable later</span>
                </div>
              </div>
            )}

            {/* If Target Goal Mode: Target Goal Selector */}
            {gameMode === 'target' && (
              <div className="bg-white border border-purple-200 rounded-xl p-2.5 flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-purple-600" /> Target Word Goal:
                  </span>
                  <span className="text-xs font-black font-mono text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-300">
                    {targetCount} Words Goal
                  </span>
                </div>

                {/* Goal Presets & Stepper */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center bg-white border-2 border-purple-200 rounded-xl overflow-hidden shadow-2xs mr-1">
                    <button
                      type="button"
                      onClick={() => handleGoalChange(targetCount - 1)}
                      disabled={targetCount <= 4}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 disabled:opacity-40 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 py-1 text-xs font-black font-mono text-purple-950 min-w-[28px] text-center">
                      {targetCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGoalChange(targetCount + 1)}
                      disabled={targetCount >= 20}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {PRESET_GOALS.map((presetVal) => (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => handleGoalChange(presetVal)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono transition-all cursor-pointer ${
                        targetCount === presetVal
                          ? 'bg-purple-600 text-white shadow-xs scale-105'
                          : 'bg-white hover:bg-purple-100 border border-purple-200 text-purple-900'
                      }`}
                    >
                      {presetVal} words
                    </button>
                  ))}
                </div>

                <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-1.5 flex items-center justify-between text-[11px] font-bold text-purple-900">
                  <span className="flex items-center gap-1">
                    <span className="text-purple-600 font-black">2× Rule:</span>
                    <span>Provide at least <strong>{minRequiredWords}</strong> words for this goal</span>
                  </span>
                  <span className="font-mono text-purple-700 text-[10.5px]">
                    ({targetCount} × 2 = {minRequiredWords})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category Title & Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-black text-gray-700">
                Category Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Space Exploration, Anime Heroes"
                maxLength={30}
                required
                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-1 flex flex-col gap-1">
              <label className="text-xs font-black text-gray-700">Icon</label>
              <div className="relative">
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value.substring(0, 2))}
                  maxLength={2}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-center text-lg font-black text-gray-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Emoji Picker Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
            {EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setIcon(em)}
                className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-base border transition-all cursor-pointer ${
                  icon === em
                    ? 'bg-purple-200 border-purple-500 scale-110 shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Creator Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-gray-700">
              Creator Handle / Name
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. WordMaster Alex"
              maxLength={24}
              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Word List Textarea */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black text-gray-700">
                  Theme Words <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSuggestAiWords}
                  disabled={isSuggestingAi || !name.trim()}
                  className="bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-[10.5px] font-black px-2 py-0.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  title="Use Gemini AI to suggest words matching this category"
                >
                  {isSuggestingAi ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-purple-700" />
                      <span>Suggesting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-purple-700" />
                      <span>AI Suggested Words</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={wordsInput}
              onChange={(e) => setWordsInput(e.target.value)}
              placeholder="Type or paste words separated by commas or spaces: ROCKET, PLANET, METEOR, GALAXY, COMET, ORBIT, STAR, MOON, ASTEROID, NEBULA, COSMOS, SOLAR, ALIEN, MARS, VENUS, JUPITER..."
              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors resize-none uppercase mt-1"
            />
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-medium text-gray-500">
                Separate words with commas, spaces, or lines.
              </span>
              {!isWordsSatisfied ? (
                <span className="text-rose-600 font-bold">
                  Need {minRequiredWords - parsedWords.length} more words ({gameMode === 'timer' ? '10 min words for rush' : '2× goal rule'})
                </span>
              ) : (
                <span className="text-emerald-700 font-black flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Ready to {isEditing ? 'update' : 'publish'} ({parsedWords.length} words)
                </span>
              )}
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Community 1-Hour Notice Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-blue-900 font-semibold">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Global Public Shelf:</strong> Your custom game is active for players worldwide for <strong>1 hour</strong>, with ranked live leaderboards (Score, Words, Time)!
            </span>
          </div>

          {/* Publish / Update Button */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-black text-sm rounded-2xl transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (!isEditing && diamonds < CUSTOM_CATEGORY_DIAMOND_COST) || !isWordsSatisfied || !name.trim()}
              className={`flex-2 py-3 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                isSubmitting || (!isEditing && diamonds < CUSTOM_CATEGORY_DIAMOND_COST) || !isWordsSatisfied || !name.trim()
                  ? 'bg-gray-300 border border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-2 border-purple-400 text-white shadow-purple-500/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEditing ? 'Updating...' : 'Publishing...'}</span>
                </>
              ) : isEditing ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-300" />
                  <span>Save & Update Custom Game</span>
                </>
              ) : diamonds < CUSTOM_CATEGORY_DIAMOND_COST ? (
                <span>Need {CUSTOM_CATEGORY_DIAMOND_COST} Diamonds to Publish</span>
              ) : !isWordsSatisfied ? (
                <span>Need {minRequiredWords - parsedWords.length} more words</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Publish for 1 Hour (💎 {CUSTOM_CATEGORY_DIAMOND_COST})</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Currency Insufficient Confirmation Prompt */}
        <CurrencyPromptModal
          isOpen={!!currencyPrompt}
          type={currencyPrompt}
          coins={coins}
          diamonds={diamonds}
          onConfirm={() => {
            if (currencyPrompt === 'buy_more_diamonds') {
              onClose();
              if (onOpenShop) onOpenShop('diamonds');
            } else if (currencyPrompt === 'buy_coins_with_diamonds') {
              onClose();
              if (onOpenShop) onOpenShop('coins');
            }
            setCurrencyPrompt(null);
          }}
          onClose={() => setCurrencyPrompt(null)}
        />
      </div>
    </div>
  );
};
