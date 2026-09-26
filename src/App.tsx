import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { WordHistory } from './components/WordHistory';
import { GameBoard } from './components/GameBoard';
import { ThinkingRobot } from './components/ThinkingRobot';
import { LifelinePromptToast } from './components/LifelinePromptToast';
import { TopInfoBar, SpecialTileInfo } from './components/TopInfoBar';
import { PowerUpBar } from './components/PowerUpBar';
import { AdModal } from './components/AdModal';
import { PowerUpAdModal } from './components/PowerUpAdModal';
import { RoundCompleteModal } from './components/RoundCompleteModal';
import { GameOverModal } from './components/GameOverModal';
import { HelpModal } from './components/HelpModal';
import { CategorySelectorModal } from './components/CategorySelectorModal';
import { CreateCategoryModal } from './components/CreateCategoryModal';
import { LetterPickerModal } from './components/LetterPickerModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ShopModal } from './components/ShopModal';
import { ReadyPrompt } from './components/ReadyPrompt';
import { HomeMenu } from './components/HomeMenu';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { BottomBannerAd } from './components/BottomBannerAd';
import { RoundLockModal } from './components/RoundLockModal';
import { CustomGamePasswordModal } from './components/CustomGamePasswordModal';
import { perfMark, perfResetBaseline } from './utils/perfDebug';
import { PortraitLockOverlay } from './components/PortraitLockOverlay';
import { isSwipeControlsEnabled, isCluesEnabled as isCluesEnabledUtil, getSpellingPreference, SpellingPreference } from './utils/settings';
import { setDictionarySpellingPreference } from './data/dictionary';
import { initUniversalAds, refreshBannerIfDue } from './utils/universalAds';
import { initRemoteAdsListener } from './utils/remoteAdsService';
import { initNativeBilling } from './utils/medianBridge';
import { initOrientationLock } from './utils/orientation';
import { INITIAL_CATEGORIES } from './data/categories';
import { calculateWordPoints, calculateSpecialReactionPoints, formatPoints } from './utils/scoring';
import { recordScore, getUserProfile } from './utils/leaderboard';
import { syncProgressToCloud } from './utils/authService';
import {
  subscribeToActiveCustomCategories,
  recordCategoryPlay,
  canPlayCustomGameWithoutPassword,
} from './utils/customCategoriesService';
import {
  GameProgress,
  loadGameProgress,
  saveGameProgress,
  completeCategory,
  setLastPlayedCategory,
  isCategoryUnlocked,
  getHighestUnlockedCategoryId,
  addCoins,
  deductCoins,
  addDiamonds,
  deductDiamonds,
  exchangeDiamondsForCoins,
  checkAndAwardDiamondMilestones,
  convertRoundEndAssetsToCoins,
  purchaseRemoveAllAds,
  ROUNDS_PER_UNLOCK_BLOCK,
  isRoundBlockUnlocked,
  unlockNextRoundBlock,
  isCustomCategoryAdUnlocked,
  unlockCustomCategoryByAd,
} from './utils/gameProgress';
import {
  Tile,
  Category,
  WordHistoryItem,
  PowerUpInventory,
  PowerUpType,
  ClueInfo,
  ExplosionEffect,
  SpecialTileType,
  BoardBanner,
  WordAlert,
} from './types';
import {
  generateInitialBoard,
  cloneBoard,
  findValidWordsOnBoard,
  findCategoryWordsWithDuplicateCheck,
  findThreeIdenticalLetters,
  applyGravityAndRefill,
  findStrategicClue,
  findThreePossibleAnswers,
  findOneMoveWordTiles,
  shuffleBoard,
  BOARD_SIZE,
} from './utils/boardLogic';
import {
  playSwap,
  playWordFound,
  playBomb,
  playSpecialCard,
  playBeam,
  playShining,
  playBoardClear,
  playPowerUp,
  playLetterPop,
  playTileSelect,
  playElectricSurge,
  playElectricZap,
  playElectricKnockoff,
  playBoardRoll,
  playFireInferno,
  playFireSizzle,
  playHammerSmash,
  playWin,
  startBackgroundMusic,
} from './utils/audio';
import { haptics } from './utils/haptics';

const INITIAL_MOVES = 7;
const MAX_MOVES = 7;
const MAX_AD_REFILLS = 4;
const REFILL_MOVES_AMOUNT = 5;

export default function App() {
  // Saved device game progress
  const [gameProgress, setGameProgress] = useState<GameProgress>(() => loadGameProgress());
  const [newlyUnlockedCategory, setNewlyUnlockedCategory] = useState<Category | null>(null);

  // Game state - Default to latest/highest unlocked round
  const [categoryIndex, setCategoryIndex] = useState<number>(() => {
    const saved = loadGameProgress();
    const highestUnlocked = getHighestUnlockedCategoryId(saved);
    const foundIdx = INITIAL_CATEGORIES.findIndex((c) => c.id === highestUnlocked);
    return foundIdx >= 0 ? foundIdx : 0;
  });
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<Category | null>(null);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState<boolean>(false);

  const currentCategory: Category =
    selectedCustomCategory || INITIAL_CATEGORIES[categoryIndex] || INITIAL_CATEGORIES[0];

  const [categoryProgress, setCategoryProgress] = useState<number>(0);
  const categoryProgressRef = useRef<number>(0);
  const [movesRemaining, setMovesRemaining] = useState<number>(INITIAL_MOVES);
  const movesRemainingRef = useRef<number>(INITIAL_MOVES);

  // Guarantee that movesRemaining is strictly clamped to MAX_MOVES (7) and never exceeds 7
  useEffect(() => {
    if (movesRemaining > MAX_MOVES) {
      movesRemainingRef.current = MAX_MOVES;
      setMovesRemaining(MAX_MOVES);
    }
  }, [movesRemaining]);
  const [movesGainedBonus, setMovesGainedBonus] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number>(0);
  const roundScoreRef = useRef<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [adRefillsUsed, setAdRefillsUsed] = useState<number>(0);
  const [board, setBoard] = useState<Tile[][]>(() => {
    const saved = loadGameProgress();
    const highestUnlocked = getHighestUnlockedCategoryId(saved);
    return generateInitialBoard(highestUnlocked);
  });
  const [wordHistory, setWordHistory] = useState<WordHistoryItem[]>([]);
  // Ref mirror of wordHistory, read by the timer-mode completion handler so
  // that effect doesn't need `wordHistory` in its dependency array (which
  // would otherwise tear down and recreate the countdown interval every
  // time a word is formed during a timer-mode round).
  const wordHistoryRef = useRef<WordHistoryItem[]>([]);
  useEffect(() => {
    wordHistoryRef.current = wordHistory;
  }, [wordHistory]);
  const [powerUps, setPowerUps] = useState<PowerUpInventory>(() => {
    // Power-up starting balances are always 1x — purchasing "Remove All Ads"
    // no longer doubles them (see handlePurchaseRemoveAds below).
    const initBal = 1;
    return { hammer: initBal, swap: initBal, rearrange: initBal, clue: initBal, replace: initBal };
  });
  const [replaceTargetTile, setReplaceTargetTile] = useState<{ row: number; col: number; currentLetter: string } | null>(null);
  const [isLetterPickerOpen, setIsLetterPickerOpen] = useState<boolean>(false);
  const [pendingReplaceLetter, setPendingReplaceLetter] = useState<string | null>(null);
  const roundStartTimeRef = useRef<number>(Date.now());
  const [roundTimeConsumed, setRoundTimeConsumed] = useState<number>(0);

  // REQUIREMENT: A word can only be formed once per round
  const [formedWords, setFormedWords] = useState<Set<string>>(new Set());
  const formedWordsRef = useRef<Set<string>>(new Set());

  // Track already alerted duplicate words so the alert is never repeated for the same set of letters
  const alertedDuplicateSetsRef = useRef<Set<string>>(new Set());

  // Same idea as alertedDuplicateSetsRef above, but for the "this is a
  // UK/US word" region-mismatch tip -- never repeated for the same tiles.
  const alertedRegionMismatchSetsRef = useRef<Set<string>>(new Set());

  // Inactivity Timer & Thinking Robot Clue (5s initial inactivity, 12s cooldown upon closing)
  const lastActivityTimeRef = useRef<number>(Date.now());
  const clueDismissedUntilRef = useRef<number>(0);
  const isClueDismissedRef = useRef<boolean>(false);
  const hasComputedRobotWordsRef = useRef<boolean>(false);
  const [robotWords, setRobotWords] = useState<string[] | null>(null);

  // First-Time Category Beginner Tips Tracking (Only active on 1st ever category)
  const [hasCompletedFirstCategoryTutorial, setHasCompletedFirstCategoryTutorial] = useState<boolean>(() => {
    return localStorage.getItem('alphablast_first_category_tips_completed') === 'true';
  });
  const [isTutorialTipDismissed, setIsTutorialTipDismissed] = useState<boolean>(false);
  const lastTutorialActivityRef = useRef<number>(Date.now());

  // Real-time Statement Banner State
  const [boardBanner, setBoardBanner] = useState<BoardBanner | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBanner = useCallback(
    (
      text: string,
      type: BoardBanner['type'] = 'info',
      icon?: string,
      subtext?: string,
      duration = 2000
    ) => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
      const newBanner: BoardBanner = {
        id: `b-${Date.now()}-${Math.random()}`,
        text,
        type,
        icon,
        subtext,
      };
      setBoardBanner(newBanner);
      bannerTimeoutRef.current = setTimeout(() => {
        setBoardBanner(null);
      }, duration);
    },
    []
  );

  // Interactions & Visual state
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null);
  const [swappingTiles, setSwappingTiles] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);

  // Compute informational popup data for touched/selected special tiles.
  //
  // Depending on the whole `board` array below used to make this recompute
  // (and return a brand-new object) on EVERY board change anywhere -- a
  // match, a refill, a burn-tick toggling isBurning on an unrelated tile --
  // not just when the SELECTED tile's own special type actually changes.
  // TopInfoBar's memo compares specialTileInfo by reference (see
  // topInfoBarPropsAreEqual in TopInfoBar.tsx), so a fresh object every
  // board update made it re-render and remount its badge (animate-scale-in
  // / animate-bounce) constantly while a special tile was selected -- the
  // "kumikislap" reported on special-tile badges during active play,
  // roughly once per board change instead of only when it should actually
  // change. Depending on just the selected cell's own special/electrified
  // fields (primitives, stable unless THAT cell actually changes) instead
  // of the whole board keeps the returned object's reference stable across
  // unrelated board churn.
  const selectedTileForInfo = selectedTile ? board[selectedTile.row]?.[selectedTile.col] : undefined;
  const selectedTileSpecialType = selectedTileForInfo?.special;
  const selectedTileIsElectrified = selectedTileForInfo?.isElectrified;
  const selectedSpecialTileInfo = useMemo<SpecialTileInfo | null>(() => {
    if (!selectedTile || activePowerUp) return null;
    const t = selectedTileForInfo;
    if (!t || (t.special === 'none' && !t.isElectrified)) return null;

    if (t.special === 'bomb') {
      return {
        title: 'Bomb Tile',
        icon: '💣',
        desc: 'Swap or match to blow up a 3×3 tile sector!',
        accentColor: 'border-orange-400/90 bg-orange-950/90 text-orange-200',
        badgeBg: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
      };
    }
    if (t.special === 'card') {
      return {
        title: 'Laser Card',
        icon: '💳',
        desc: 'Swap with a letter to electrocute all matching letters!',
        accentColor: 'border-purple-400/90 bg-purple-950/90 text-purple-200',
        badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
      };
    }
    if (t.special === 'shining') {
      return {
        title: 'Shining Star',
        icon: '🌟',
        desc: 'Match in a word to clear a 3×3 radiant grid area!',
        accentColor: 'border-amber-400/90 bg-amber-950/90 text-amber-200',
        badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      };
    }
    if (t.special === 'highlighted') {
      return {
        title: 'Laser Tile',
        icon: '⚡',
        desc: 'Match in a word to shoot high-energy laser beams!',
        accentColor: 'border-cyan-400/90 bg-cyan-950/90 text-cyan-200',
        badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      };
    }
    if (t.isElectrified) {
      return {
        title: 'Electrified Tile',
        icon: '⚡',
        desc: 'High-voltage tile ready for electric chain reaction!',
        accentColor: 'border-sky-400/90 bg-sky-950/90 text-sky-200',
        badgeBg: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
      };
    }
    return null;
  }, [selectedTile, activePowerUp, selectedTileSpecialType, selectedTileIsElectrified]);
  const [clue, setClue] = useState<ClueInfo | null>(null);
  const [explosions, setExplosions] = useState<ExplosionEffect[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [wordAlerts, setWordAlerts] = useState<WordAlert[]>([]);

  // Navigation & Screens
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game'>('menu');

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSwipeEnabled, setIsSwipeEnabled] = useState<boolean>(() => isSwipeControlsEnabled());
  const [spellingPreference, setSpellingPreference] = useState<SpellingPreference>(() => getSpellingPreference());

  // Keep the dictionary's word-validation gate in sync with the player's
  // US/UK preference -- runs on mount (so gameplay is correct from the
  // very first board) and again every time the player toggles it in
  // Settings, so an in-progress round respects the change immediately.
  useEffect(() => {
    setDictionarySpellingPreference(spellingPreference);
  }, [spellingPreference]);
  const [isCluesEnabled, setIsCluesEnabled] = useState<boolean>(() => isCluesEnabledUtil());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCustomCategory, setEditingCustomCategory] = useState<Category | null>(null);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(120);
  // Live per-second mirror of timerSecondsRemaining, updated WITHOUT calling
  // setState -- see the "Timer gameMode countdown loop" effect below and
  // useTickingRefValue for the full story. Keeping this in sync with the
  // state value at every point the state is set (round start/reset, round
  // end) means the two never drift even though only one of them re-renders
  // App every time it changes.
  const timerSecondsRemainingRef = useRef<number>(120);
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [isPowerUpAdOpen, setIsPowerUpAdOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [shopInitialTab, setShopInitialTab] = useState<'powerups' | 'coins' | 'diamonds'>('powerups');

  const handleOpenShop = useCallback((tab: 'powerups' | 'coins' | 'diamonds' = 'powerups') => {
    setShopInitialTab(tab);
    setIsShopOpen(true);
  }, []);
  const [roundEndCoinConversion, setRoundEndCoinConversion] = useState<{
    coloredTiles: number;
    powerups: number;
    total: number;
  } | null>(null);
  const [diamondMilestoneAwarded, setDiamondMilestoneAwarded] = useState<{
    count: number;
    milestoneName: string;
  } | null>(null);
  const [targetAdPowerUpType, setTargetAdPowerUpType] = useState<PowerUpType | null>(null);
  const [isRoundCompleteOpen, setIsRoundCompleteOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);

  // Subscribe to real-time 1-hour community categories from Firestore ("Public
  // Shelf"). This fires on EVERY change anywhere -- another player publishing
  // or updating a custom category, this device's own play-count increment
  // echoing back, or just the 15s prune sweep -- and pushing it into state
  // re-renders the entire App tree (customCategories is read by the home
  // menu/category picker). That's harmless at the menu, but starting a
  // custom round always fires recordCategoryPlay() (a Firestore write) whose
  // local echo lands back in this same subscription within the same
  // gameplay session, and every other publish on the "Public Shelf" while
  // this device happens to be mid-round does too -- forcing a full top-level
  // re-render on top of the tile-clear/refill animation and causing the
  // custom-game-only lag/white-screen. Campaign rounds never touch this
  // collection at all, which is why they never see it.
  // Fix: while a round is actually being played (board interactive), buffer
  // the latest list in a ref instead of pushing it into state, and flush it
  // once the player is back at a point where a re-render is free (menu, or
  // the round-complete/game-over modal is up and the board is no longer
  // animating).
  const isActivelyPlayingRef = useRef(false);
  const pendingCustomCategoriesRef = useRef<Category[] | null>(null);

  useEffect(() => {
    isActivelyPlayingRef.current = currentScreen === 'game' && !isRoundCompleteOpen && !isGameOverOpen;
    if (!isActivelyPlayingRef.current && pendingCustomCategoriesRef.current) {
      setCustomCategories(pendingCustomCategoriesRef.current);
      pendingCustomCategoriesRef.current = null;
    }
  }, [currentScreen, isRoundCompleteOpen, isGameOverOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToActiveCustomCategories((cats) => {
      if (isActivelyPlayingRef.current) {
        pendingCustomCategoriesRef.current = cats;
      } else {
        setCustomCategories(cats);
      }
    });
    return () => unsubscribe();
  }, []);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isReadyPromptOpen, setIsReadyPromptOpen] = useState<boolean>(true);
  // True once the new round's board has actually finished generating (see
  // playCategoryRound below) — the "Ready?" prompt uses this to keep the
  // GO! button disabled until there's really a board to play on.
  const [isBoardReady, setIsBoardReady] = useState<boolean>(true);
  // Round end: the board is taken off screen and a plain "Clearing Game
  // Board... please wait." panel is shown while the round's results upload
  // (see finishRoundBehindClearingScreen). isBoardCleared stays true until
  // the next round starts, so the finished board isn't drawn again behind
  // the results modal.
  const [isBoardCleared, setIsBoardCleared] = useState<boolean>(false);
  const [isClearingBoard, setIsClearingBoard] = useState<boolean>(false);
  // Bumped at the start of every round and used as the React `key` of the
  // gameplay area, so each round starts from freshly mounted components
  // instead of reusing the previous round's.
  const [roundKey, setRoundKey] = useState<number>(0);
  const roundEndingRef = useRef(false);
  const [isRollingTiles, setIsRollingTiles] = useState<boolean>(false);
  const [isRoundLockOpen, setIsRoundLockOpen] = useState<boolean>(false);
  const [pendingTargetCategory, setPendingTargetCategory] = useState<Category | null>(null);
  // Custom game waiting for its (optional) creator-set password -- see
  // requestOpenCategory and CustomGamePasswordModal.
  const [passwordPromptCategory, setPasswordPromptCategory] = useState<Category | null>(null);
  // Round-lock cadence: rounds are grouped into fixed blocks of
  // ROUNDS_PER_UNLOCK_BLOCK (block 1 = rounds 1-5, always free; block 2 =
  // rounds 6-10; etc.). Entering a round outside an already ad-unlocked
  // block shows RoundLockModal, and watching the rewarded ad permanently
  // unlocks the next block via unlockNextRoundBlock() (gameProgress.ts —
  // persisted to localStorage, so it survives closing/reopening the app).
  // This used to be an in-memory "rounds completed since last ad" ref
  // that reset to 0 on every app restart, which meant the gate could be
  // bypassed entirely just by closing and reopening the app before it
  // reached round 6 — see gameProgress.ts's ROUNDS_PER_UNLOCK_BLOCK
  // comment for the full story. Players who bought "Remove All Ads" skip
  // this lock completely (see requestOpenCategory below).

  // Lifeline Inactivity Prompt & Shine Animation State
  const [isLifelinePromptActive, setIsLifelinePromptActive] = useState<boolean>(false);
  const [isLifelineShining, setIsLifelineShining] = useState<boolean>(false);
  const isLifelinePromptActiveRef = useRef<boolean>(false);
  isLifelinePromptActiveRef.current = isLifelinePromptActive;

  // Inactivity Loop Step Tracker: 'waiting_clue' | 'clue_active' | 'waiting_lifeline' | 'lifeline_active'
  const idleCycleStepRef = useRef<'waiting_clue' | 'clue_active' | 'waiting_lifeline' | 'lifeline_active'>('waiting_clue');
  const lastClueDismissedTimeRef = useRef<number>(0);
  const lastLifelineFinishedTimeRef = useRef<number>(0);
  const lifelineTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Starts the round timer and clears the Ready prompt, triggering 3D tile roll
  const handleStartGameRound = useCallback(() => {
    roundStartTimeRef.current = Date.now();
    lastActivityTimeRef.current = Date.now();
    lastClueDismissedTimeRef.current = 0;
    lastLifelineFinishedTimeRef.current = 0;
    idleCycleStepRef.current = 'waiting_clue';
    setIsLifelinePromptActive(false);
    setIsLifelineShining(false);
    isClueDismissedRef.current = false;
    clueDismissedUntilRef.current = 0;
    setIsReadyPromptOpen(false);
    setIsRollingTiles(true);
    try {
      playBoardRoll();
    } catch {
      // Audio fallback
    }
    setTimeout(() => {
      setIsRollingTiles(false);
    }, 700);
  }, []);

  // Keep references to prevent race conditions during cascades
  const boardRef = useRef<Tile[][]>(board);
  boardRef.current = board;
  const currentCategoryRef = useRef(currentCategory);
  currentCategoryRef.current = currentCategory;
  const robotWordsRef = useRef<string[] | null>(robotWords);
  robotWordsRef.current = robotWords;
  // The board state the idle clue search last came back EMPTY for -- see
  // the inactivity monitor below. Prevents re-running that expensive scan
  // every 500ms on a board that has no clue to give.
  const noClueForBoardRef = useRef<Tile[][] | null>(null);
  const isResolvingRef = useRef(false);

  // Unified helper to add round points and instantly check/award real-time diamond milestones
  const addRoundPoints = useCallback(
    (points: number, explicitCatId?: number) => {
      if (points <= 0) return;
      roundScoreRef.current += points;
      const updatedScore = roundScoreRef.current;
      setRoundScore(updatedScore);
      setTotalScore((prev) => prev + points);

      const targetCatId = explicitCatId || currentCategoryRef.current?.id || 1;
      const diamondCheck = checkAndAwardDiamondMilestones(targetCatId, updatedScore);
      if (diamondCheck.awarded) {
        setGameProgress(diamondCheck.progress);
        setDiamondMilestoneAwarded({
          count: diamondCheck.diamondsAwarded,
          milestoneName: diamondCheck.milestoneName,
        });
        playWin();
        // Deferred a frame for the same reason as RoundCompleteModal's
        // confetti call — see the comment there. Firing this synchronously
        // mid-round (this runs while the board/banner are also updating)
        // is the same "canvas redraws competing with everything else the
        // WebView needs to paint right now" risk.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.4 },
              });
            } catch {}
          });
        });
        triggerBanner(
          `💎 Round Reward: +${diamondCheck.diamondsAwarded} Diamond${diamondCheck.diamondsAwarded > 1 ? 's' : ''}!`,
          'special',
          '💎',
          `+${diamondCheck.diamondsAwarded} 💎`,
          3500
        );
      }
    },
    [triggerBanner]
  );

  // Reset inactivity timer and loop whenever the player interacts
  const registerPlayerActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    lastTutorialActivityRef.current = Date.now();
    lastClueDismissedTimeRef.current = 0;
    lastLifelineFinishedTimeRef.current = 0;
    idleCycleStepRef.current = 'waiting_clue';
    isClueDismissedRef.current = false;
    hasComputedRobotWordsRef.current = false;
    clueDismissedUntilRef.current = 0;
    setRobotWords(null);
    setIsLifelinePromptActive(false);
    setIsLifelineShining(false);
    if (lifelineTimeoutRef.current) {
      clearTimeout(lifelineTimeoutRef.current);
      lifelineTimeoutRef.current = null;
    }
  }, []);

  // Check if player is on their first category ever (Category 1, not completed yet)
  const isFirstCategoryEver =
    !hasCompletedFirstCategoryTutorial &&
    currentCategory.id === 1 &&
    !selectedCustomCategory &&
    !(gameProgress.completedCategoryIds || []).includes(1);

  // Compute beginner tutorial tip string
  const currentTutorialTip: string | null = (() => {
    if (!isFirstCategoryEver || currentScreen !== 'game' || isTutorialTipDismissed) {
      return null;
    }
    if (!selectedTile) {
      return `Move letters to form words. ${movesRemaining} moves left.`;
    }
    return 'Now swap it with an adjacent letter to form words!';
  })();

  const handleDismissTutorialTip = useCallback(() => {
    setIsTutorialTipDismissed(true);
    lastTutorialActivityRef.current = Date.now();
  }, []);

  // Handler for when the clue disappears or is closed
  const handleDismissClue = useCallback(() => {
    setRobotWords(null);
    setClue(null);
    lastClueDismissedTimeRef.current = Date.now();
    idleCycleStepRef.current = 'waiting_lifeline';
  }, []);

  // Handler for when the lifeline prompt is dismissed manually
  const handleDismissLifelinePrompt = useCallback(() => {
    setIsLifelinePromptActive(false);
    setIsLifelineShining(false);
    if (lifelineTimeoutRef.current) {
      clearTimeout(lifelineTimeoutRef.current);
      lifelineTimeoutRef.current = null;
    }
    lastLifelineFinishedTimeRef.current = Date.now();
    idleCycleStepRef.current = 'waiting_clue';
  }, []);

  // Inactivity monitor: Alternating Clue and Lifelines Shine/Zoom loop
  // - 5s idle -> Show Clue
  // - After clue disappears: 5s idle -> Show "You can use your lifelines!" + Shine/Zoom PowerUpBar for 3s
  // - 5s after lifeline effect finishes: if no move -> Show Clue again
  // - Loop continues until player interacts!
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      if (
        isReadyPromptOpen ||
        isAnimating ||
        isResolvingRef.current ||
        isRoundCompleteOpen ||
        isGameOverOpen ||
        isAdModalOpen ||
        isPowerUpAdOpen ||
        isShopOpen ||
        isCategoryModalOpen ||
        isLeaderboardOpen ||
        isProfileOpen ||
        isSettingsOpen ||
        isHelpOpen ||
        isLetterPickerOpen ||
        activePowerUp !== null
      ) {
        lastActivityTimeRef.current = Date.now();
        lastTutorialActivityRef.current = Date.now();
        idleCycleStepRef.current = 'waiting_clue';
        return;
      }

      // Redisplay beginner tutorial tips after 5s of inactivity if dismissed
      const tutorialIdleDuration = now - lastTutorialActivityRef.current;
      if (tutorialIdleDuration >= 5000) {
        setIsTutorialTipDismissed(false);
      }

      const currentBoard = boardRef.current;
      const currentCat = currentCategoryRef.current;

      // STEP 1: Waiting for Clue (either after game start/move, or 5s after lifeline effect finished)
      if (idleCycleStepRef.current === 'waiting_clue') {
        const timeSinceEvent = lastLifelineFinishedTimeRef.current > 0
          ? now - lastLifelineFinishedTimeRef.current
          : now - lastActivityTimeRef.current;

        if (isCluesEnabled && timeSinceEvent >= 5000 && !robotWordsRef.current && !isLifelinePromptActiveRef.current) {
          // Only search each board state once. When the search comes back
          // empty (e.g. every word of a small custom list is already formed,
          // or the list is all plurals), this used to re-run the full
          // one-move scan -- tens of thousands of allocations -- every 500ms
          // for as long as the player sat idle, causing repeated main-thread
          // stalls (visible stutter/flicker) in custom games. The board
          // array is replaced on every change, so identity is a reliable
          // "has anything changed since the last empty search" check.
          if (noClueForBoardRef.current !== currentBoard) {
            const answers = findThreePossibleAnswers(currentBoard, currentCat.id, formedWordsRef.current);
            if (answers.length > 0) {
              idleCycleStepRef.current = 'clue_active';
              setRobotWords(answers);
            } else {
              noClueForBoardRef.current = currentBoard;
            }
          }
        }
      }
      // STEP 2: Waiting for Lifeline (5s after clue disappeared)
      else if (idleCycleStepRef.current === 'waiting_lifeline') {
        const timeSinceClue = now - lastClueDismissedTimeRef.current;
        if (timeSinceClue >= 5000 && !isLifelinePromptActiveRef.current && !robotWordsRef.current) {
          idleCycleStepRef.current = 'lifeline_active';
          setIsLifelinePromptActive(true);
          setIsLifelineShining(true);
          try {
            playPowerUp();
          } catch {}

          if (lifelineTimeoutRef.current) {
            clearTimeout(lifelineTimeoutRef.current);
          }
          lifelineTimeoutRef.current = setTimeout(() => {
            setIsLifelinePromptActive(false);
            setIsLifelineShining(false);
            lastLifelineFinishedTimeRef.current = Date.now();
            idleCycleStepRef.current = 'waiting_clue';
          }, 3000);
        }
      }
    }, 500);

    return () => {
      clearInterval(timer);
      if (lifelineTimeoutRef.current) {
        clearTimeout(lifelineTimeoutRef.current);
      }
    };
  }, [
    isCluesEnabled,
    isReadyPromptOpen,
    isAnimating,
    isRoundCompleteOpen,
    isGameOverOpen,
    isAdModalOpen,
    isPowerUpAdOpen,
    isShopOpen,
    isCategoryModalOpen,
    isLeaderboardOpen,
    isProfileOpen,
    isSettingsOpen,
    isHelpOpen,
    isLetterPickerOpen,
    activePowerUp,
  ]);

  // REQUIREMENT: Highlight for 0.25 seconds the one-move new word when letters are replaced (color tiles in very soft, non-vibrant pastel light yellow)
  const highlightOneMoveOpportunity = useCallback((targetBoard: Tile[][], catId: number) => {
    const oppTiles = findOneMoveWordTiles(targetBoard, catId, formedWordsRef.current);
    if (!oppTiles || oppTiles.length === 0) return;

    const tileKeys = new Set(oppTiles.map((t) => `${t.row},${t.col}`));

    // Color tiles in very soft pastel light yellow
    setBoard((prev) =>
      prev.map((row, r) =>
        row.map((tile, c) => {
          if (tileKeys.has(`${r},${c}`)) {
            return { ...tile, isOneMoveHighlighted: true };
          }
          return tile;
        })
      )
    );

    // Keep highlight for exactly 0.25 seconds (250ms)
    setTimeout(() => {
      setBoard((prev) =>
        prev.map((row, r) =>
          row.map((tile, c) => {
            if (tileKeys.has(`${r},${c}`) && tile.isOneMoveHighlighted) {
              return { ...tile, isOneMoveHighlighted: false };
            }
            return tile;
          })
        )
      );
    }, 250);
  }, []);

  // Start relaxing background sound, enforce portrait lock, and initialize universal ads + Firestore remote config sync on mount
  useEffect(() => {
    initOrientationLock();
    startBackgroundMusic();
    initUniversalAds();
    initNativeBilling();
    const unsubscribeAds = initRemoteAdsListener();
    return () => {
      unsubscribeAds();
    };
  }, []);

  // Helper to trigger temporary explosion visual effect
  const triggerExplosion = (
    row: number,
    col: number,
    type: ExplosionEffect['type'],
    letter?: string,
    sourceRow?: number,
    sourceCol?: number,
    targetCoords?: { row: number; col: number }[]
  ) => {
    const id = `fx-${Date.now()}-${Math.random()}`;
    const fx: ExplosionEffect = {
      id,
      row,
      col,
      type,
      letter,
      sourceRow,
      sourceCol,
      targetCoords,
    };
    setExplosions((prev) => [...prev, fx]);
    const duration = type === 'board_wipe' ? 2000 : type === 'board_shine' ? 1000 : 950;
    setTimeout(() => {
      setExplosions((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  };

  // Start/Reset a round for any category (Campaign or Custom 1-Hour Community)
  const playCategoryRound = useCallback(
    (targetCat: Category) => {
      perfMark('playCategoryRound start');
      if (targetCat.isCustom) {
        setSelectedCustomCategory(targetCat);
        // Deferred (setTimeout 0), same reasoning as recordScore below: this
        // fires a Firestore write right as the round is starting, alongside
        // every other state reset in this function -- pushing it one tick
        // out keeps the round-start frame purely local/instant.
        setTimeout(() => {
          recordCategoryPlay(targetCat.firestoreDocId);
        }, 0);
      } else {
        setSelectedCustomCategory(null);
        const catIndex = INITIAL_CATEGORIES.findIndex((c) => c.id === targetCat.id);
        if (catIndex >= 0) {
          setCategoryIndex(catIndex);
        }
        // Ensure standard category is unlocked
        const currentProgress = loadGameProgress();
        if (!isCategoryUnlocked(targetCat.id, currentProgress)) {
          return;
        }
        setLastPlayedCategory(targetCat.id);
      }

      setCategoryProgress(0);
      categoryProgressRef.current = 0;
      setRoundScore(0);
      roundScoreRef.current = 0;
      setNewlyUnlockedCategory(null);
      setDiamondMilestoneAwarded(null);
      setMovesRemaining(INITIAL_MOVES);
      movesRemainingRef.current = INITIAL_MOVES;
      setAdRefillsUsed(0);
      setWordHistory([]);
      setFormedWords(new Set());
      formedWordsRef.current = new Set();
      alertedDuplicateSetsRef.current.clear();
      alertedRegionMismatchSetsRef.current.clear();
      // Power-up starting balances are always 1x, regardless of hasRemovedAds
      // (see handlePurchaseRemoveAds below — purchasing no longer doubles them).
      const initBal = 1;
      setPowerUps({ hammer: initBal, swap: initBal, rearrange: initBal, clue: initBal, replace: initBal });
      setReplaceTargetTile(null);
      setSelectedTile(null);
      setActivePowerUp(null);
      setClue(null);
      setRobotWords(null);
      isClueDismissedRef.current = false;
      clueDismissedUntilRef.current = 0;
      lastActivityTimeRef.current = Date.now();
      roundStartTimeRef.current = Date.now();
      setRoundTimeConsumed(0);
      setIsReadyPromptOpen(true);
      // Controlled banner refresh: right here, the screen is just the
      // static "Ready?" prompt — board generation and every gameplay
      // animation are still a moment away (deferred below via rAF). This
      // is the safest, most predictable idle point in the whole round
      // cycle to let the native banner tear down/reload, instead of
      // leaving that to AdMob's own timer, which could just as easily
      // fire mid-effect. Time-gated internally, so this is a no-op most
      // of the time it's called.
      refreshBannerIfDue();
      setExplosions([]);
      setIsRoundCompleteOpen(false);
      setIsGameOverOpen(false);
      setIsAdModalOpen(false);
      setIsPowerUpAdOpen(false);
      setCurrentScreen('game');

      if (targetCat.gameMode === 'timer') {
        const initSeconds = targetCat.timerSeconds || 120;
        timerSecondsRemainingRef.current = initSeconds;
        setTimerSecondsRemaining(initSeconds);
      }
      perfMark('fast resets done, scheduling rAF');

      // generateInitialBoard() retries board layouts (up to 25 attempts,
      // each scanning the whole board for word opportunities) until it
      // finds one that guarantees enough playable moves. That search is
      // CPU-heavy, and running it synchronously right here — in the same
      // tick as all the state updates above — used to block the main
      // thread for several seconds before React ever got a chance to
      // paint anything. That's the reported round-transition white-screen
      // freeze: nothing was actually frozen, the browser just never got a
      // chance to draw a frame until this finished.
      //
      // Deferring it with a double requestAnimationFrame doesn't make the
      // search itself faster, but it lets the browser paint the "Ready?"
      // prompt FIRST — the player sees that immediately instead of a
      // blank screen, and ReadyPrompt keeps its GO! button disabled
      // (isBoardReady) until the real board underneath is actually ready.
      setIsBoardReady(false);
      setIsBoardCleared(false);
      setIsClearingBoard(false);
      roundEndingRef.current = false;
      setRoundKey((k) => k + 1);
      requestAnimationFrame(() => {
        perfMark('1st rAF fired');
        requestAnimationFrame(() => {
          perfMark('2nd rAF fired, calling generateInitialBoard');
          const freshBoard = generateInitialBoard(targetCat.id);
          perfMark('generateInitialBoard returned');
          setBoard(freshBoard);
          highlightOneMoveOpportunity(freshBoard, targetCat.id);
          perfMark('highlightOneMoveOpportunity done, board ready');
          setIsBoardReady(true);
        });
      });
    },
    [highlightOneMoveOpportunity]
  );

  // No more automatic interstitials at all — banner and interstitial are
  // both off (see universalAds.ts), rewarded is the only ad type left.
  // Instead, every ROUNDS_PER_UNLOCK_BLOCK (5) rounds is a block, and the
  // next block is locked until the player watches ONE rewarded ad
  // (RoundLockModal below). Players who bought "Remove All Ads" skip this
  // check entirely and always play straight through.
  const requestOpenCategory = useCallback(
    (targetCat: Category) => {
      perfMark('requestOpenCategory start');

      // A custom game whose creator set a password asks for it first (its
      // creator, and anyone who already typed it on this device, skip this).
      // Checked before every other gate so nothing -- not even "already
      // completed" or "Remove Ads" -- starts a protected game without it.
      if (targetCat.isCustom && !canPlayCustomGameWithoutPassword(targetCat)) {
        setPasswordPromptCategory(targetCat);
        return;
      }

      const currentProgress = loadGameProgress();
      if (currentProgress.hasRemovedAds) {
        playCategoryRound(targetCat);
        return;
      }

      // Replaying a round the player already completed before must NEVER
      // be gated by the lock — it only exists to gate ADVANCING into new
      // content the player hasn't cleared yet. completeCategory() (see
      // gameProgress.ts) records every finished round's id here, standard
      // categories and custom ones alike, so this check covers both.
      const alreadyCompleted = (currentProgress.completedCategoryIds || []).includes(targetCat.id);
      if (alreadyCompleted) {
        playCategoryRound(targetCat);
        return;
      }

      // Custom (community) games have their own per-game ad gate, separate
      // from the every-5-rounds campaign lock: the ad unlocks only that one
      // custom game, and the campaign's round blocks never unlock it.
      if (targetCat.isCustom) {
        if (isCustomCategoryAdUnlocked(targetCat)) {
          playCategoryRound(targetCat);
        } else {
          setPendingTargetCategory(targetCat);
          setIsRoundLockOpen(true);
          perfMark('custom game ad lock opened');
        }
        return;
      }

      if (!isRoundBlockUnlocked(targetCat.id, currentProgress)) {
        setPendingTargetCategory(targetCat);
        setIsRoundLockOpen(true);
        perfMark('round lock opened');
        return;
      }

      playCategoryRound(targetCat);
    },
    [playCategoryRound]
  );

  const handleRoundsUnlocked = useCallback(() => {
    perfMark('handleRoundsUnlocked start');
    setIsRoundLockOpen(false);
    // Unlock ONLY what the ad was watched for: a custom game's ad unlocks
    // just that custom game; the round-lock ad unlocks just the next 5
    // campaign rounds.
    if (pendingTargetCategory?.isCustom) {
      unlockCustomCategoryByAd(pendingTargetCategory);
    } else {
      unlockNextRoundBlock(); // Persist the unlock so it survives app restarts
    }
    if (pendingTargetCategory) {
      playCategoryRound(pendingTargetCategory);
      setPendingTargetCategory(null);
    }
  }, [pendingTargetCategory, playCategoryRound]);

  const handleRoundLockDismissed = useCallback(() => {
    perfMark('handleRoundLockDismissed start');
    setIsRoundLockOpen(false);
    setPendingTargetCategory(null);
    // adUnlockedBlocks in gameProgress is untouched — the next attempt to
    // advance into this block re-opens the same lock instead of silently
    // proceeding, and this holds even across an app restart now.
  }, []);

  // RoundLockModal's "Or Remove Ads to Unlock Everything" upsell button —
  // ShopModal and RoundLockModal render at the same z-50 stacking level, and
  // RoundLockModal is mounted after ShopModal in the JSX below, so simply
  // opening the shop while leaving isRoundLockOpen true left the lock
  // window visually on top of it (looked like the button did nothing /
  // the lock window never closed). Close the lock here first — but keep
  // pendingTargetCategory set (don't clear it, unlike handleRoundLockDismissed)
  // so handlePurchaseRemoveAds can still auto-resume the round if they go
  // through with the purchase.
  const handleOpenShopFromRoundLock = useCallback(() => {
    setIsRoundLockOpen(false);
    handleOpenShop();
  }, [handleOpenShop]);

  const startRound = useCallback(
    (catIndex: number) => {
      const targetCat = INITIAL_CATEGORIES[catIndex] || INITIAL_CATEGORIES[0];
      requestOpenCategory(targetCat);
    },
    [requestOpenCategory]
  );

  /**
   * Round end: take the board off screen, show "Clearing Game Board...
   * please wait." while this round's results upload, then open the results
   * modal. The board (every tile with its animations and glows) is by far
   * the heaviest thing on screen; unmounting it here means the phone only
   * has a plain panel to draw while the round-end work runs. Waits for the
   * uploads to finish, but never longer than MAX_WAIT_MS (a slow or offline
   * connection must not trap the player here), and shows the panel for at
   * least MIN_SHOW_MS so it doesn't just flicker by.
   */
  const finishRoundBehindClearingScreen = useCallback((uploads: Promise<unknown>[]) => {
    // Only once per round (a cascade can match again after the last target
    // word; the timer effect can re-run). Reset in playCategoryRound.
    if (roundEndingRef.current) return;
    roundEndingRef.current = true;
    const MIN_SHOW_MS = 800;
    const MAX_WAIT_MS = 5000;
    const shownAt = Date.now();
    setIsBoardCleared(true);
    setIsClearingBoard(true);
    perfMark('Round end: clearing screen shown, waiting for uploads');

    const timeout = new Promise<void>((resolve) => setTimeout(resolve, MAX_WAIT_MS));
    Promise.race([Promise.allSettled(uploads), timeout]).then(() => {
      const remaining = Math.max(0, MIN_SHOW_MS - (Date.now() - shownAt));
      setTimeout(() => {
        perfMark('Round end: uploads done, opening RoundCompleteModal');
        setIsClearingBoard(false);
        setIsRoundCompleteOpen(true);
      }, remaining);
    });
  }, []);

  // Process Matches, Specials, Gravity & Cascades
  const resolveBoard = useCallback(
    async (currentBoard: Tile[][], catId: number): Promise<Tile[][]> => {
      let activeBoard = cloneBoard(currentBoard);
      let foundMatches = true;
      let loopCount = 0;

      while (foundMatches && loopCount < 8) {
        loopCount++;
        perfMark(`resolveBoard loop #${loopCount}: board scan starting`);
        // REQUIREMENT: A word can only be formed once! (Including its plural / root forms)
        const { matches, duplicates, regionMismatches } = findCategoryWordsWithDuplicateCheck(
          activeBoard,
          catId,
          formedWordsRef.current
        );
        const threeIdenticals = findThreeIdenticalLetters(activeBoard);
        perfMark(`resolveBoard loop #${loopCount}: board scan done (${matches.length} matches)`);

        // Alert player if a previously formed word or its plural is formed:
        // Small alert positioned on the word itself (3 seconds) & highlight word for 1 second (1000ms)
        // REQUIREMENT: Once an alert is given for an already existing word, it should NOT be repeated for the same set of letters.
        if (duplicates.length > 0) {
          duplicates.forEach((dup) => {
            const tileIdsKey = dup.tiles.map((t) => t.id).sort().join('-');
            const alertKey = `${dup.word}:${tileIdsKey}`;
            if (alertedDuplicateSetsRef.current.has(alertKey)) {
              return;
            }
            alertedDuplicateSetsRef.current.add(alertKey);

            const avgRow = dup.tiles.reduce((acc, t) => acc + t.row, 0) / dup.tiles.length;
            const avgCol = dup.tiles.reduce((acc, t) => acc + t.col, 0) / dup.tiles.length;
            const alertId = `dup-${Date.now()}-${Math.random()}`;
            const newAlert: WordAlert = {
              id: alertId,
              word: dup.word,
              row: avgRow,
              col: avgCol,
              message: `"${dup.word}" already formed!`,
            };

            setWordAlerts((prev) => [...prev, newAlert]);
            setTimeout(() => {
              setWordAlerts((prev) => prev.filter((a) => a.id !== alertId));
            }, 3000);

            // Highlight the duplicate word for 1 second (1000ms)
            const dupKeys = new Set(dup.tiles.map((t) => `${t.row},${t.col}`));
            setBoard((prev) =>
              prev.map((row, r) =>
                row.map((tile, c) => {
                  if (dupKeys.has(`${r},${c}`)) {
                    return { ...tile, isWordHighlighted: true };
                  }
                  return tile;
                })
              )
            );
            setTimeout(() => {
              setBoard((prev) =>
                prev.map((row, r) =>
                  row.map((tile, c) => {
                    if (dupKeys.has(`${r},${c}`)) {
                      return { ...tile, isWordHighlighted: false };
                    }
                    return tile;
                  })
                )
              );
            }, 1000);
          });
        }

        // Tip the player off when a formed word is a real word but only in
        // the OTHER US/UK region's spelling from their current Settings
        // preference (e.g. "COLOUR" formed while set to US) -- otherwise
        // it just silently doesn't count, with no clue why.
        // REQUIREMENT: Once given for a set of letters, don't repeat it.
        if (regionMismatches.length > 0) {
          regionMismatches.forEach((mismatch) => {
            const tileIdsKey = mismatch.tiles.map((t) => t.id).sort().join('-');
            const alertKey = `${mismatch.word}:${tileIdsKey}`;
            if (alertedRegionMismatchSetsRef.current.has(alertKey)) {
              return;
            }
            alertedRegionMismatchSetsRef.current.add(alertKey);

            const avgRow = mismatch.tiles.reduce((acc, t) => acc + t.row, 0) / mismatch.tiles.length;
            const avgCol = mismatch.tiles.reduce((acc, t) => acc + t.col, 0) / mismatch.tiles.length;
            const alertId = `region-${Date.now()}-${Math.random()}`;
            const newAlert: WordAlert = {
              id: alertId,
              word: mismatch.word,
              row: avgRow,
              col: avgCol,
              message: mismatch.region === 'UK' ? 'This is a UK word.' : 'This is a US word.',
              icon: mismatch.region === 'UK' ? '🇬🇧' : '🇺🇸',
            };

            setWordAlerts((prev) => [...prev, newAlert]);
            setTimeout(() => {
              setWordAlerts((prev) => prev.filter((a) => a.id !== alertId));
            }, 3000);
          });
        }

        if (matches.length === 0 && threeIdenticals.length === 0) {
          foundMatches = false;
          break;
        }

        const clearedPositions = new Set<string>();
        const spawnSpecials: { row: number; col: number; special: SpecialTileType; letter?: string }[] = [];
        let hasBoardClear = false;

        // Process 3-Identical Letter Shining Tile conversions
        threeIdenticals.forEach((item) => {
          activeBoard[item.row][item.col].special = 'shining';
          playShining();
          triggerExplosion(item.row, item.col, 'shining');
          triggerBanner(`Triplet Fusion: Created Shining Star Tile!`, 'special', '⭐', 'STAR TILE');
        });

        // STEP 1: HIGHLIGHT FORMED WORD & POP LETTERS OUT SEQUENTIALLY ONE BY ONE (Requirement)
        if (matches.length > 0) {
          // Permanently complete beginner tutorial tips on first formed word
          if (!hasCompletedFirstCategoryTutorial) {
            localStorage.setItem('alphablast_first_category_tips_completed', 'true');
            setHasCompletedFirstCategoryTutorial(true);
          }

          const matchedKeys = new Set<string>();
          matches.forEach((m) => {
            m.tiles.forEach((t) => matchedKeys.add(`${t.row},${t.col}`));
          });

          // Retain highlight on all matched tiles throughout the resolution
          setBoard((prev) =>
            prev.map((row, r) =>
              row.map((tile, c) => ({
                ...tile,
                isWordHighlighted: matchedKeys.has(`${r},${c}`),
              }))
            )
          );

          // Play word sound & Trigger Highlighted Statement Banner (+5 Moves per Word)
          haptics.wordMatch();
          matches.forEach((match) => {
            playWordFound(match.isCategory, match.word.length);
            if (match.isCategory) {
              triggerBanner(
                `Category Word Formed: "${match.word}" (+5 Moves)`,
                'category',
                '🎯',
                '+5 MOVES'
              );
            } else {
              triggerBanner(
                `Word Formed: "${match.word}" (+5 Moves)`,
                'word',
                '📝',
                '+5 MOVES'
              );
            }
          });

          // Sequential letter pop-out and disappearance: pop each letter one by one with musical feedback
          const uniqueTilesInOrder: { row: number; col: number }[] = [];
          const visitedKeys = new Set<string>();
          matches.forEach((m) => {
            m.tiles.forEach((t) => {
              const k = `${t.row},${t.col}`;
              if (!visitedKeys.has(k)) {
                visitedKeys.add(k);
                uniqueTilesInOrder.push({ row: t.row, col: t.col });
              }
            });
          });

          for (let i = 0; i < uniqueTilesInOrder.length; i++) {
            const { row, col } = uniqueTilesInOrder[i];
            playLetterPop(i, uniqueTilesInOrder.length);

            // Pop out animation
            setBoard((prev) =>
              prev.map((rList, rIdx) =>
                rList.map((t, cIdx) =>
                  rIdx === row && cIdx === col ? { ...t, isPopping: true } : t
                )
              )
            );

            await new Promise((res) => setTimeout(res, 160));

            // Disappear the popped letter while preserving the highlight slot
            setBoard((prev) =>
              prev.map((rList, rIdx) =>
                rList.map((t, cIdx) =>
                  rIdx === row && cIdx === col
                    ? { ...t, isPopping: false, isMatched: true }
                    : t
                )
              )
            );
          }

          await new Promise((res) => setTimeout(res, 220));
        }

        // STEP 2: Process Word Matches and Special Triggers
        // REQUIREMENT: Increase moves left by 5 every successful word formation
        let totalWordsGainedMoves = 0;
        for (const match of matches) {
          totalWordsGainedMoves += 5;

          // Calculate Points (Letter values * 100 + category/length bonuses)
          const wordPts = calculateWordPoints(match.word, match.isCategory);
          addRoundPoints(wordPts.points, catId);

          // Register formed word in unique formed words set
          const upperWord = match.word.toUpperCase();
          formedWordsRef.current.add(upperWord);
          setFormedWords((prev) => new Set(prev).add(upperWord));

          // Update Category Progress if matched category word
          // Read the LIVE category through currentCategoryRef, not the
          // `currentCategory` closure: resolveBoard is a useCallback whose
          // deps never change, so that closure was frozen at the category
          // the app launched with (a campaign category, targetCount 10, no
          // gameMode). Custom categories aren't in INITIAL_CATEGORIES, so
          // they fell through to that stale campaign category -- a custom
          // game with a 3-word target never completed at 3 (it waited for
          // 10), and a timer-mode custom game ended early at 10 words. The
          // player then kept playing past the end of the custom word list,
          // which is exactly the state where the board helpers do their
          // most expensive work (flicker / white-screen stalls).
          const liveCat = currentCategoryRef.current;
          const cat =
            liveCat && liveCat.id === catId
              ? liveCat
              : INITIAL_CATEGORIES.find((c) => c.id === catId) || liveCat;
          if (match.isCategory) {
            categoryProgressRef.current += 1;
            setCategoryProgress(categoryProgressRef.current);
            if (cat && cat.gameMode !== 'timer' && categoryProgressRef.current >= cat.targetCount) {
              perfMark('ROUND COMPLETE: last target word matched');
              haptics.roundComplete();

              const finalRoundScore = roundScoreRef.current;
              const elapsedSeconds = Math.max(1, Math.round((Date.now() - roundStartTimeRef.current) / 1000));
              setRoundTimeConsumed(elapsedSeconds);

              // Calculate stars based on remaining moves
              const earnedStars = movesRemainingRef.current >= 5 ? 3 : movesRemainingRef.current >= 2 ? 2 : 1;

              // Save completion and unlock next category on device
              const completionResult = completeCategory(catId, finalRoundScore, earnedStars);
              let latestProgress = completionResult.progress;
              perfMark('completeCategory() returned');

              // Monetization: Convert leftover colored tiles (1 coin each) and remaining powerups (1 coin each) to coins
              const leftoverColoredTiles = activeBoard
                .flat()
                .filter((t) => t.special && t.special !== 'none').length;
              const leftoverPowerups =
                (powerUps.hammer || 0) +
                (powerUps.swap || 0) +
                (powerUps.rearrange || 0) +
                (powerUps.clue || 0) +
                (powerUps.replace || 0);

              const conversion = convertRoundEndAssetsToCoins(leftoverColoredTiles, leftoverPowerups);
              latestProgress = conversion.progress;
              setRoundEndCoinConversion({
                coloredTiles: leftoverColoredTiles,
                powerups: leftoverPowerups,
                total: conversion.coinsAdded,
              });
              perfMark('convertRoundEndAssetsToCoins() returned');

              // Monetization: Award +1 diamond at 15,000 PTS, +2 diamonds at 20,000 PTS (Total 2)
              const diamondCheck = checkAndAwardDiamondMilestones(catId, finalRoundScore);
              if (diamondCheck.awarded) {
                latestProgress = diamondCheck.progress;
                setDiamondMilestoneAwarded({
                  count: diamondCheck.diamondsAwarded,
                  milestoneName: diamondCheck.milestoneName,
                });
              }
              perfMark('checkAndAwardDiamondMilestones() returned');

              setGameProgress(latestProgress);
              if (completionResult.newlyUnlockedCategory) {
                setNewlyUnlockedCategory(completionResult.newlyUnlockedCategory);
              }
              perfMark('setGameProgress + setNewlyUnlockedCategory called');

              // Auto backup progress to cloud every round completion
              const cloudBackupUpload = syncProgressToCloud(latestProgress).catch((err) => {
                console.warn('Auto cloud backup error:', err);
              });
              perfMark('syncProgressToCloud() fired (async, not awaited)');

              // Record score to Category and Overall Leaderboards. Deferred
              // (setTimeout 0) so this doesn't run inline in resolveBoard's
              // per-match loop -- recordScore does a localStorage
              // read-modify-write plus (on round completion) two Firestore
              // calls, and firing it synchronously mid-cascade would block
              // the tile-clear animation from painting.
              //
              // Called ONCE, here, at true round completion -- not per word
              // match. It used to be called after every single match with
              // that match's own points (categoryScore: wordPts.points) and
              // wordsCount hardcoded to 1; recordScore keeps the highest
              // score ever seen per category via Math.max(), so that made
              // the leaderboard "score" the single highest-value word ever
              // formed in that category (never a round total), and
              // "wordsCount" could never read anything but 1. Passing the
              // true round totals here (matching how timer-mode categories
              // already record their score, below) fixes both.
              const recordScoreArgs = {
                categoryId: catId,
                categoryName: cat.name,
                categoryScore: finalRoundScore,
                wordsCount: formedWordsRef.current.size,
                highestWord: match.word,
                highestWordPoints: wordPts.points,
                isRoundComplete: true,
                timeConsumedSeconds: elapsedSeconds,
              };
              const leaderboardUpload = new Promise<void>((resolve) => {
                setTimeout(() => {
                  try {
                    recordScore(recordScoreArgs).upload.then(() => resolve());
                  } catch (err) {
                    console.warn('recordScore error:', err);
                    resolve();
                  }
                }, 0);
              });

              // The 700ms lets the last word's clear animation play out
              // before the board is taken off screen.
              setTimeout(() => {
                perfMark('700ms setTimeout FIRED, showing clearing screen');
                finishRoundBehindClearingScreen([cloudBackupUpload, leaderboardUpload]);
              }, 700);
              perfMark('700ms setTimeout for RoundCompleteModal scheduled');
            }
          }

          // Trigger real-time statement banner showing points earned
          triggerBanner(
            match.isCategory
              ? `Category Word: "${match.word}" (+${formatPoints(wordPts.points)} PTS)`
              : `Word Formed: "${match.word}" (+${formatPoints(wordPts.points)} PTS)`,
            match.isCategory ? 'category' : 'word',
            match.isCategory ? '⭐' : '✨',
            `+${formatPoints(wordPts.points)} PTS`,
            2400
          );

          // Add to word history with calculated points
          const specialCreatedValue: WordHistoryItem['specialCreated'] =
            match.specialGenerated === 'board_clear'
              ? 'board_clear'
              : match.specialGenerated && match.specialGenerated !== 'none'
              ? match.specialGenerated
              : undefined;

          setWordHistory((prev) => [
            {
              id: `w-${Date.now()}-${Math.random()}`,
              word: match.word,
              isCategory: match.isCategory,
              length: match.word.length,
              points: wordPts.points,
              baseLetterPoints: wordPts.baseLetterPoints,
              timestamp: Date.now(),
              specialCreated: specialCreatedValue,
            },
            ...prev,
          ]);

          // Handle 6+ letter word: COMPLETE BOARD CLEAR
          if (match.word.length >= 6) {
            hasBoardClear = true;
            playBoardClear();
            triggerExplosion(4, 4, 'board_wipe');
            break;
          }

          // Handle 4-Letter Bomb or 5-Letter Card generation
          if (match.specialGenerated && match.specialLocation) {
            haptics.specialCreated();
            spawnSpecials.push({
              row: match.specialLocation.row,
              col: match.specialLocation.col,
              special: match.specialGenerated as SpecialTileType,
            });
          }

          // Check if any tile in this word is a HIGHLIGHTED tile
          for (const t of match.tiles) {
            if (t.special === 'highlighted') {
              playBeam();
              if (match.direction === 'horizontal' || match.direction === 'backwards-horizontal') {
                triggerExplosion(0, t.col, 'beam_col');
                for (let r = 0; r < BOARD_SIZE; r++) {
                  clearedPositions.add(`${r},${t.col}`);
                }
              } else if (match.direction === 'vertical' || match.direction === 'upwards-vertical') {
                triggerExplosion(t.row, 0, 'beam_row');
                for (let c = 0; c < BOARD_SIZE; c++) {
                  clearedPositions.add(`${t.row},${c}`);
                }
              } else {
                // Diagonal matches discharge a dual cross-beam!
                triggerExplosion(0, t.col, 'beam_col');
                triggerExplosion(t.row, 0, 'beam_row');
                for (let r = 0; r < BOARD_SIZE; r++) {
                  clearedPositions.add(`${r},${t.col}`);
                }
                for (let c = 0; c < BOARD_SIZE; c++) {
                  clearedPositions.add(`${t.row},${c}`);
                }
              }
            }

            // Check if any tile is a SHINING tile (Explodes 3x3 area)
            if (t.special === 'shining') {
              playShining();
              triggerExplosion(t.row, t.col, 'shining');
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  const nr = t.row + dr;
                  const nc = t.col + dc;
                  if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    clearedPositions.add(`${nr},${nc}`);
                  }
                }
              }
            }

            // Add standard word tile positions to clear
            clearedPositions.add(`${t.row},${t.col}`);
          }
        }
        perfMark(`resolveBoard loop #${loopCount}: for-of matches loop finished`);

        // Calculate points for extra tiles that disappeared from special tiles reactions (beams/shining)
        const wordTilesSet = new Set<string>();
        matches.forEach((m) => m.tiles.forEach((t) => wordTilesSet.add(`${t.row},${t.col}`)));
        const extraDisappearedLetters: string[] = [];
        clearedPositions.forEach((posKey) => {
          if (!wordTilesSet.has(posKey)) {
            const [r, c] = posKey.split(',').map(Number);
            if (activeBoard[r] && activeBoard[r][c] && activeBoard[r][c].letter) {
              extraDisappearedLetters.push(activeBoard[r][c].letter);
            }
          }
        });
        if (extraDisappearedLetters.length > 0) {
          const extraPts = calculateSpecialReactionPoints(extraDisappearedLetters);
          if (extraPts > 0) {
            addRoundPoints(extraPts, catId);
          }
        }

        // Apply +5 Moves gain per successful word formation (capped at MAX_MOVES 20)
        // REQUIREMENT: When there is 1 or 0 move left and a word is formed, additional 5 moves are given and game does not end!
        if (totalWordsGainedMoves > 0) {
          movesRemainingRef.current = Math.min(MAX_MOVES, movesRemainingRef.current + totalWordsGainedMoves);
          setMovesRemaining(movesRemainingRef.current);
          setMovesGainedBonus(totalWordsGainedMoves);
          setTimeout(() => setMovesGainedBonus(null), 1300);
        }

        // REQUIREMENT: When the board is cleared due to 6+ letter word (Fire Wipeout):
        // 1. All individual letters catch fire and incinerate simultaneously (sabay-sabay).
        // 2. The tiles flip in 3D simultaneously (sabay-sabay din) revealing the new set of letters!
        // 3. "FIRE WIPE OUT!" appears in fire letters without rectangle margin.
        if (hasBoardClear) {
          // Award points for all disappeared tiles on the board
          const wipeLetters: string[] = [];
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (activeBoard[r][c].letter && !wordTilesSet.has(`${r},${c}`)) {
                wipeLetters.push(activeBoard[r][c].letter);
              }
            }
          }
          const wipePts = calculateSpecialReactionPoints(wipeLetters);
          if (wipePts > 0) {
            addRoundPoints(wipePts, catId);
          }

          // REQUIREMENT:
          // 1. Show the alert for 2 seconds total.
          // 2. Start turning the tiles red 1 second after the alert appears.
          // 3. Sabay mawawala yung alert and magpapakita yung new letters with 3D tile flip!
          haptics.fireWipe();
          playFireInferno();
          triggerExplosion(3, 3, 'board_wipe');

          // PHASE 1: Wait 1.0 second after alert appears before tiles start turning red
          await new Promise((res) => setTimeout(res, 1000));

          // PHASE 2: Board letters and tiles turn red within 1.0 second (t=1.0s to 2.0s)
          playFireSizzle();
          haptics.fireCrackle();
          setBoard((prev) =>
            prev.map((rowArr) =>
              rowArr.map((tile) => ({
                ...tile,
                isBurning: true,
                isVaporizing: false,
              }))
            )
          );

          // Glow red for 1.0 full second until t=2.0s
          await new Promise((res) => setTimeout(res, 1000));

          // PHASE 3: Sabay mawawala yung alert and magpapakita yung new letters with simultaneous 3D flip!
          activeBoard = generateInitialBoard(catId, formedWordsRef.current);
          activeBoard = activeBoard.map((rowArr) =>
            rowArr.map((tile) => ({
              ...tile,
              isFlipping: true,
              isBurning: false,
              isMatched: false,
              isFalling: false,
            }))
          );
          setBoard(activeBoard);
          playLetterPop();
          playBoardClear();
          haptics.fireCrackle();

          // Trigger shining glow running through the board for 1.0 second right after the new set of letters appear
          triggerExplosion(3, 3, 'board_shine');
          playShining();

          // Wait for simultaneous 3D tile flip animation (~450ms)
          await new Promise((res) => setTimeout(res, 450));

          // Reset flipping and temporary states
          setBoard((prev) =>
            prev.map((rowArr) =>
              rowArr.map((tile) => ({
                ...tile,
                isFlipping: false,
                isBurning: false,
                isElectrified: false,
                isKnockedOff: false,
                isVaporizing: false,
                isMatched: false,
              }))
            )
          );

          await new Promise((res) => setTimeout(res, 120));
          continue;
        }

        // Apply visual clearing state to remaining cleared positions
        setBoard((prev) =>
          prev.map((row, r) =>
            row.map((tile, c) => ({
              ...tile,
              isMatched: clearedPositions.has(`${r},${c}`) || tile.isMatched,
            }))
          )
        );

        await new Promise((res) => setTimeout(res, 200));

        // Apply Gravity & Refill (Letters from above fall down smoothly)
        perfMark(`resolveBoard loop #${loopCount}: applyGravityAndRefill starting`);
        const { newBoard, fallenCount } = applyGravityAndRefill(
          activeBoard,
          clearedPositions,
          spawnSpecials,
          catId,
          formedWordsRef.current
        );
        activeBoard = newBoard;
        setBoard(activeBoard);
        perfMark(`resolveBoard loop #${loopCount}: applyGravityAndRefill + setBoard done`);

        // REQUIREMENT: Highlight for one second the one-move new word when letters are replaced (color tiles in light green)
        if (fallenCount > 0) {
          highlightOneMoveOpportunity(activeBoard, catId);
          perfMark(`resolveBoard loop #${loopCount}: highlightOneMoveOpportunity done`);
        }

        await new Promise((res) => setTimeout(res, 350));
        perfMark(`resolveBoard loop #${loopCount}: end of iteration (about to recheck foundMatches)`);
      }
      perfMark('resolveBoard: while loop exited, returning board');

      return activeBoard;
    },
    [triggerBanner, highlightOneMoveOpportunity, finishRoundBehindClearingScreen]
  );

  // Perform a Swap between two adjacent tiles
  const performSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isResolvingRef.current || isAnimating) return;

    // Validate adjacency
    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist !== 1) {
      setSelectedTile(null);
      return;
    }

    registerPlayerActivity();
    isResolvingRef.current = true;
    setIsAnimating(true);
    setClue(null); // Clear clue once player makes a move

    // Consume 1 move
    movesRemainingRef.current = Math.max(0, movesRemainingRef.current - 1);
    setMovesRemaining(movesRemainingRef.current);
    playSwap();
    haptics.swap();

    // Trigger visual sliding animation between swapping tiles
    setSwappingTiles({ r1, c1, r2, c2 });
    await new Promise((res) => setTimeout(res, 220));
    setSwappingTiles(null);

    const t1 = board[r1][c1];
    const t2 = board[r2][c2];

    let nextBoard = cloneBoard(board);

    // 1. Check for BOMB Swap (Section 6)
    // REQUIREMENT: In the 3x3 explosion, the midpoint (middle tile) should be the tile swapped with the special tile, not the special tile itself.
    // REQUIREMENT: Highlight the 3x3 tiles first (box them) before disappearing them.
    if (t1.special === 'bomb' || t2.special === 'bomb') {
      const bombMidpointRow = t1.special === 'bomb' ? r2 : r1;
      const bombMidpointCol = t1.special === 'bomb' ? c2 : c1;

      const cleared = new Set<string>();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = bombMidpointRow + dr;
          const nc = bombMidpointCol + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            cleared.add(`${nr},${nc}`);
          }
        }
      }

      // STEP 1: Box and Highlight the 3x3 tiles FIRST before disappearing
      triggerExplosion(bombMidpointRow, bombMidpointCol, 'bomb');

      // Calculate points for all tiles disappearing in 3x3 explosion
      const bombDisappearedLetters: string[] = [];
      cleared.forEach((posKey) => {
        const [r, c] = posKey.split(',').map(Number);
        if (board[r] && board[r][c] && board[r][c].letter) {
          bombDisappearedLetters.push(board[r][c].letter);
        }
      });
      const bombPoints = calculateSpecialReactionPoints(bombDisappearedLetters);
      if (bombPoints > 0) {
        addRoundPoints(bombPoints, currentCategory.id);
      }

      triggerBanner(
        `Explosive Blast: 3×3 Sector (+${formatPoints(bombPoints)} PTS)!`,
        'special',
        '💥',
        `+${formatPoints(bombPoints)} PTS`
      );
      haptics.bomb();

      setBoard((prev) =>
        prev.map((rowArr, rIdx) =>
          rowArr.map((tile, cIdx) => {
            if (cleared.has(`${rIdx},${cIdx}`)) {
              return { ...tile, isWordHighlighted: true };
            }
            return tile;
          })
        )
      );

      playBomb();

      // Hold the 3x3 highlight framing box for 480ms so the player sees the targeted area
      await new Promise((res) => setTimeout(res, 480));

      // STEP 2: Disappear the 3x3 letters
      setBoard((prev) =>
        prev.map((rowArr, rIdx) =>
          rowArr.map((tile, cIdx) => {
            if (cleared.has(`${rIdx},${cIdx}`)) {
              return { ...tile, isWordHighlighted: false, isMatched: true };
            }
            return tile;
          })
        )
      );

      await new Promise((res) => setTimeout(res, 220));

      // STEP 3: Apply Gravity and refill
      // Pass the current category + formed words (previously omitted, so the
      // refill's "guarantee a move" step defaulted to category 1 and planted
      // Land Animals words into custom boards -- words that never count, so
      // the planting search always ran to its full time budget).
      const { newBoard } = applyGravityAndRefill(
        nextBoard,
        cleared,
        [],
        currentCategory.id,
        formedWordsRef.current
      );
      nextBoard = newBoard;
      setBoard(nextBoard);
      await new Promise((res) => setTimeout(res, 350));
      await resolveBoard(nextBoard, currentCategory.id);
    }
    // 2. Check for SPECIAL CARD Swap (Section 6)
    // When Special Card is swapped with a letter tile -> wipes all instances of that letter with ELECTRICITY ANIMATION!
    else if (t1.special === 'card' || t2.special === 'card') {
      const cardRow = t1.special === 'card' ? r1 : r2;
      const cardCol = t1.special === 'card' ? c1 : c2;
      const targetLetter = t1.special === 'card' ? t2.letter : t1.letter;

      // Find all target coordinates on the board
      const targetCoords: { row: number; col: number }[] = [];
      const cleared = new Set<string>();
      cleared.add(`${r1},${c1}`);
      cleared.add(`${r2},${c2}`);

      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (nextBoard[r][c].letter === targetLetter) {
            targetCoords.push({ row: r, col: c });
            cleared.add(`${r},${c}`);
          }
        }
      }

      // STAGE 1: Electricity Flow & Electrification
      haptics.electric();
      playElectricSurge();
      playElectricZap();
      triggerExplosion(cardRow, cardCol, 'card_wipe', targetLetter, cardRow, cardCol, targetCoords);
      triggerBanner(`High-Voltage Surge: Electricity Flowing to All "${targetLetter}" Tiles!`, 'special', '⚡', 'ELECTRICITY');

      setBoard((prev) =>
        prev.map((rowArr, rIdx) =>
          rowArr.map((tile, cIdx) => {
            const isCard = rIdx === cardRow && cIdx === cardCol;
            const isTarget = tile.letter === targetLetter || (rIdx === r2 && cIdx === c2) || (rIdx === r1 && cIdx === c1);
            if (isCard || isTarget) {
              return { ...tile, isElectrified: true };
            }
            return tile;
          })
        )
      );

      await new Promise((res) => setTimeout(res, 380));

      // STAGE 2: Electricity Flow Disappears Selected Letters One By One (Fast)!
      playElectricKnockoff(0, targetCoords.length);

      // Calculate score for all letter tiles wiped by special card
      const cardDisappearedLetters: string[] = [];
      targetCoords.forEach((coord) => {
        if (nextBoard[coord.row] && nextBoard[coord.row][coord.col] && nextBoard[coord.row][coord.col].letter) {
          cardDisappearedLetters.push(nextBoard[coord.row][coord.col].letter);
        }
      });
      const cardPoints = calculateSpecialReactionPoints(cardDisappearedLetters);
      if (cardPoints > 0) {
        addRoundPoints(cardPoints, currentCategory.id);
      }

      triggerBanner(
        `Electric Discharge: Knocked Off All "${targetLetter}" Tiles (+${formatPoints(cardPoints)} PTS)!`,
        'clear',
        '⚡',
        `+${formatPoints(cardPoints)} PTS`
      );

      for (const target of targetCoords) {
        haptics.wipeoutZap();
        playElectricZap();
        setBoard((prev) =>
          prev.map((rowArr, rIdx) =>
            rowArr.map((tile, cIdx) => {
              if (rIdx === target.row && cIdx === target.col) {
                return {
                  ...tile,
                  isElectrified: true,
                  isVaporizing: true,
                };
              }
              return tile;
            })
          )
        );
        await new Promise((res) => setTimeout(res, 30));
        setBoard((prev) =>
          prev.map((rowArr, rIdx) =>
            rowArr.map((tile, cIdx) => {
              if (rIdx === target.row && cIdx === target.col) {
                return {
                  ...tile,
                  letter: '',
                  isElectrified: false,
                  isVaporizing: false,
                  isMatched: true,
                };
              }
              return tile;
            })
          )
        );
      }

      await new Promise((res) => setTimeout(res, 200));

      // STAGE 3: Gravity and Cascade
      // Pass the current category + formed words (previously omitted, so the
      // refill's "guarantee a move" step defaulted to category 1 and planted
      // Land Animals words into custom boards -- words that never count, so
      // the planting search always ran to its full time budget).
      const { newBoard } = applyGravityAndRefill(
        nextBoard,
        cleared,
        [],
        currentCategory.id,
        formedWordsRef.current
      );
      nextBoard = newBoard;
      setBoard(nextBoard);
      await new Promise((res) => setTimeout(res, 350));
      await resolveBoard(nextBoard, currentCategory.id);
    }
    // 3. COMBINING IDENTICAL LETTERS
    else if (t1.letter === t2.letter) {
      haptics.specialCreated();
      let targetSpecial: SpecialTileType = 'highlighted';
      let fusionIcon = '⚡';
      let fusionDescription = `Letter Fusion: Created Laser Tile!`;
      let fusionSubtext = 'LASER TILE';

      // Preserve or upgrade special tiers (Never downgrade Shining to Blue)
      if (t1.special === 'shining' || t2.special === 'shining') {
        targetSpecial = 'shining'; // Never downgrade shining!
        fusionIcon = '🌟';
        fusionDescription = `Celestial Fusion: Shining Star Tile Preserved!`;
        fusionSubtext = 'SHINING STAR';
        playShining();
      } else if (t1.special === 'highlighted' && t2.special === 'highlighted') {
        targetSpecial = 'shining'; // Two blue laser tiles upgrade into a Shining Star tile!
        fusionIcon = '⭐';
        fusionDescription = `Twin Lasers Synthesized: Upgraded to Shining Star!`;
        fusionSubtext = 'UPGRADE';
        playShining();
      } else {
        targetSpecial = 'highlighted';
        fusionIcon = '⚡';
        fusionDescription = `Letter Fusion: Created Laser Tile & Space Filled!`;
        fusionSubtext = 'LASER TILE';
        playShining();
      }

      // Calculate score for the letter tile that disappears into fusion
      const fusionPoints = calculateSpecialReactionPoints([t1.letter]);
      if (fusionPoints > 0) {
        addRoundPoints(fusionPoints, currentCategory.id);
      }

      triggerBanner(fusionDescription, 'fusion', fusionIcon, fusionSubtext);

      const cleared = new Set<string>([`${r1},${c1}`]);
      const spawnSpecials = [
        {
          row: r2,
          col: c2,
          special: targetSpecial,
          letter: t1.letter,
        },
      ];

      nextBoard[r1][c1].isMatched = true;
      nextBoard[r2][c2].isMerged = true;
      setBoard(nextBoard);

      await new Promise((res) => setTimeout(res, 280));

      const { newBoard, fallenCount } = applyGravityAndRefill(
        nextBoard,
        cleared,
        spawnSpecials,
        currentCategory.id,
        formedWordsRef.current
      );
      nextBoard = newBoard;
      setBoard(nextBoard);

      if (fallenCount > 0) {
        highlightOneMoveOpportunity(nextBoard, currentCategory.id);
      }

      await new Promise((res) => setTimeout(res, 400));
      setBoard((prev) =>
        prev.map((row) =>
          row.map((tile) => (tile.isMerged ? { ...tile, isMerged: false } : tile))
        )
      );

      await resolveBoard(nextBoard, currentCategory.id);
    }
    // 4. Standard Swap
    else {
      // Swap tiles
      haptics.swap();
      nextBoard[r1][c1] = { ...t2, row: r1, col: c1 };
      nextBoard[r2][c2] = { ...t1, row: r2, col: c2 };
      setBoard(nextBoard);

      await new Promise((res) => setTimeout(res, 250));
      await resolveBoard(nextBoard, currentCategory.id);
    }

    setSelectedTile(null);
    setIsAnimating(false);
    isResolvingRef.current = false;

    // REQUIREMENT: When there is 1 or 0 move left and a word is formed, the game should not end.
    // Instead additional 5 moves are given. Check moves AFTER resolveBoard completes.
    // In target mode: Only open game over / ad modal if moves are truly 0 and objective is not reached.
    if (currentCategory.gameMode !== 'timer' && movesRemainingRef.current <= 0 && categoryProgressRef.current < currentCategory.targetCount) {
      setTimeout(() => setIsAdModalOpen(true), 600);
    }
  };

  // Perform Swap Anywhere on the board (Swap Power-up)
  const executeTileSwapAnywhere = async (r1: number, c1: number, r2: number, c2: number) => {
    isResolvingRef.current = true;
    setIsAnimating(true);
    registerPlayerActivity();
    playSwap();
    haptics.swap();

    // Trigger visual sliding animation between swapping tiles
    setSwappingTiles({ r1, c1, r2, c2 });
    await new Promise((res) => setTimeout(res, 220));
    setSwappingTiles(null);

    const t1 = board[r1][c1];
    const t2 = board[r2][c2];
    let nextBoard = cloneBoard(board);

    // If both letters are identical, combine them into special tile
    if (t1.letter === t2.letter) {
      let targetSpecial: SpecialTileType = 'highlighted';
      let fusionIcon = '⚡';
      let fusionDescription = `Letter Fusion: Created Laser Tile!`;
      let fusionSubtext = 'LASER TILE';

      if (t1.special === 'shining' || t2.special === 'shining') {
        targetSpecial = 'shining';
        fusionIcon = '🌟';
        fusionDescription = `Celestial Fusion: Shining Star Tile Preserved!`;
        fusionSubtext = 'SHINING STAR';
        playShining();
      } else if (t1.special === 'highlighted' && t2.special === 'highlighted') {
        targetSpecial = 'shining';
        fusionIcon = '⭐';
        fusionDescription = `Twin Lasers Synthesized: Upgraded to Shining Star!`;
        fusionSubtext = 'UPGRADE';
        playShining();
      } else if (t1.special === 'card' || t2.special === 'card') {
        targetSpecial = 'card';
        fusionIcon = '🎴';
        fusionDescription = `Card Fusion: Letter Wipe Special Preserved!`;
        fusionSubtext = 'SPECIAL CARD';
        playSpecialCard();
      } else if (t1.special === 'bomb' || t2.special === 'bomb') {
        targetSpecial = 'bomb';
        fusionIcon = '💥';
        fusionDescription = `Bomb Fusion: Explosive Tile Preserved!`;
        fusionSubtext = 'BOMB TILE';
        playBomb();
      } else {
        targetSpecial = 'highlighted';
        fusionIcon = '⚡';
        fusionDescription = `Letter Fusion: Created Laser Tile & Space Filled!`;
        fusionSubtext = 'LASER TILE';
        playShining();
      }

      // Calculate score for the letter tile that disappears into fusion
      const fusionPoints = calculateSpecialReactionPoints([t1.letter]);
      if (fusionPoints > 0) {
        addRoundPoints(fusionPoints, currentCategory.id);
      }

      triggerBanner(fusionDescription, 'fusion', fusionIcon, fusionSubtext);

      const cleared = new Set<string>([`${r1},${c1}`]);
      const spawnSpecials = [
        {
          row: r2,
          col: c2,
          special: targetSpecial,
          letter: t1.letter,
        },
      ];

      nextBoard[r1][c1].isMatched = true;
      nextBoard[r2][c2].isMerged = true;
      setBoard(nextBoard);

      await new Promise((res) => setTimeout(res, 280));
      const { newBoard, fallenCount } = applyGravityAndRefill(
        nextBoard,
        cleared,
        spawnSpecials,
        currentCategory.id,
        formedWordsRef.current
      );
      nextBoard = newBoard;
      setBoard(nextBoard);

      if (fallenCount > 0) {
        highlightOneMoveOpportunity(nextBoard, currentCategory.id);
      }

      await new Promise((res) => setTimeout(res, 400));
      setBoard((prev) =>
        prev.map((row) =>
          row.map((tile) => (tile.isMerged ? { ...tile, isMerged: false } : tile))
        )
      );

      await resolveBoard(nextBoard, currentCategory.id);
    } else {
      // Swap tiles anywhere
      nextBoard[r1][c1] = { ...t2, row: r1, col: c1 };
      nextBoard[r2][c2] = { ...t1, row: r2, col: c2 };
      setBoard(nextBoard);

      await new Promise((res) => setTimeout(res, 280));
      await resolveBoard(nextBoard, currentCategory.id);
    }

    setIsAnimating(false);
    isResolvingRef.current = false;
  };

  // Execute Giant Hammer Strike (Smashes 3x3 block centered at selected tile)
  const executeHammerStrike = async (r: number, c: number) => {
    if (powerUps.hammer <= 0) {
      setTargetAdPowerUpType('hammer');
      setIsPowerUpAdOpen(true);
      return;
    }

    isResolvingRef.current = true;
    setIsAnimating(true);
    registerPlayerActivity();

    // Deduct 1 hammer and clear active states
    setPowerUps((prev) => ({ ...prev, hammer: Math.max(0, prev.hammer - 1) }));
    setActivePowerUp(null);
    setSelectedTile(null);
    setClue(null);

    // Compute 3x3 block coordinates centered at (r, c)
    const cleared = new Set<string>();
    const affectedCoords: { row: number; col: number }[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          cleared.add(`${nr},${nc}`);
          affectedCoords.push({ row: nr, col: nc });
        }
      }
    }

    // Start powerup sound & visual swing
    playPowerUp();
    triggerExplosion(r, c, 'hammer', undefined, r, c, affectedCoords);

    // Calculate score for smashed tiles
    const hammerLetters: string[] = [];
    affectedCoords.forEach((pos) => {
      if (board[pos.row] && board[pos.row][pos.col] && board[pos.row][pos.col].letter) {
        hammerLetters.push(board[pos.row][pos.col].letter);
      }
    });
    const hammerPoints = calculateSpecialReactionPoints(hammerLetters);
    if (hammerPoints > 0) {
      addRoundPoints(hammerPoints, currentCategory.id);
    }

    triggerBanner(
      `Giant Hammer Strike: Smashed 3×3 (+${formatPoints(hammerPoints)} PTS)!`,
      'special',
      '🔨',
      `+${formatPoints(hammerPoints)} PTS`
    );

    // Set 3x3 tiles to breaking block state
    setBoard((prev) =>
      prev.map((rowArr, rIdx) =>
        rowArr.map((tile, cIdx) => {
          const isAffected = affectedCoords.some((pos) => pos.row === rIdx && pos.col === cIdx);
          if (isAffected) {
            return { ...tile, isBreakingBlock: true };
          }
          return tile;
        })
      )
    );

    // Hammer winds up and strikes at 200ms -> trigger impact sound & haptics right on hit
    await new Promise((res) => setTimeout(res, 200));
    playHammerSmash();
    haptics.hammerSmash();

    // Allow block shattering effect to play out smoothly
    await new Promise((res) => setTimeout(res, 320));

    // Breaking blocks crumble and clear
    setBoard((prev) =>
      prev.map((rowArr, rIdx) =>
        rowArr.map((tile, cIdx) => {
          const isAffected = affectedCoords.some((pos) => pos.row === rIdx && pos.col === cIdx);
          if (isAffected) {
            return { ...tile, isBreakingBlock: false, isMatched: true, letter: '' };
          }
          return tile;
        })
      )
    );

    await new Promise((res) => setTimeout(res, 140));

    // Apply gravity and refill fresh tiles from above
    const { newBoard, fallenCount } = applyGravityAndRefill(
      board,
      cleared,
      [],
      currentCategory.id,
      formedWordsRef.current
    );
    setBoard(newBoard);

    if (fallenCount > 0) {
      highlightOneMoveOpportunity(newBoard, currentCategory.id);
    }

    await new Promise((res) => setTimeout(res, 360));
    await resolveBoard(newBoard, currentCategory.id);

    setIsAnimating(false);
    isResolvingRef.current = false;
  };

  // Handle Tile Click / Tap
  // REQUIREMENT: One letter must be selected first. Directly swapping 2 letters should not swap the letters.
  const handleTileClick = (r: number, c: number) => {
    if (isAnimating) return;
    registerPlayerActivity();

    // 1. Hammer Power-Up Active: Break 3x3 block centered at touched tile
    if (activePowerUp === 'hammer') {
      executeHammerStrike(r, c);
      return;
    }

    // 2. Replace Power-Up Active: Choose tile to replace with chosen letter
    if (activePowerUp === 'replace') {
      if (powerUps.replace <= 0) {
        setTargetAdPowerUpType('replace');
        setIsPowerUpAdOpen(true);
        return;
      }
      // If a letter was already chosen in advance:
      if (pendingReplaceLetter) {
        handleExecuteLetterReplace(pendingReplaceLetter, r, c);
        return;
      }
      // If no letter was chosen yet, open the Letter Picker modal for this tile:
      playTileSelect();
      setReplaceTargetTile({ row: r, col: c, currentLetter: board[r][c].letter });
      setIsLetterPickerOpen(true);
      return;
    }

    // 3. Swap Power-Up Active: Swap any 2 tiles anywhere on the board
    if (activePowerUp === 'swap') {
      if (powerUps.swap <= 0) {
        setTargetAdPowerUpType('swap');
        setIsPowerUpAdOpen(true);
        return;
      }
      if (!selectedTile) {
        setSelectedTile({ row: r, col: c });
        playSwap();
      } else {
        if (selectedTile.row === r && selectedTile.col === c) {
          // Deselect
          setSelectedTile(null);
        } else {
          const r1 = selectedTile.row;
          const c1 = selectedTile.col;
          const r2 = r;
          const c2 = c;

          playPowerUp();
          setPowerUps((prev) => ({ ...prev, swap: Math.max(0, prev.swap - 1) }));
          setActivePowerUp(null);
          setSelectedTile(null);
          setClue(null);
          triggerBanner(
            `Power-up Swap: Swapped (${board[r1][c1].letter}) with (${board[r2][c2].letter})!`,
            'special',
            '🔀',
            'SWAP'
          );

          executeTileSwapAnywhere(r1, c1, r2, c2);
        }
      }
      return;
    }

    // 4. Normal Selection / Adjacent Swap
    // REQUIREMENT: One letter must be selected first.
    lastTutorialActivityRef.current = Date.now();
    setIsTutorialTipDismissed(false);

    if (!selectedTile) {
      // First tap: Select the letter
      playTileSelect();
      setSelectedTile({ row: r, col: c });
    } else {
      if (selectedTile.row === r && selectedTile.col === c) {
        // Tapped the same letter again -> Deselect
        setSelectedTile(null);
      } else {
        const dist = Math.abs(selectedTile.row - r) + Math.abs(selectedTile.col - c);
        if (dist === 1) {
          // Adjacent letter touched after selecting first letter -> Execute swap!
          performSwap(selectedTile.row, selectedTile.col, r, c);
        } else {
          // Non-adjacent letter touched -> switch selection so new tile pops out
          playTileSelect();
          setSelectedTile({ row: r, col: c });
        }
      }
    }
  };

  // Immediate tile selection & zoom on touch down
  const handleTileSelect = (r: number, c: number) => {
    if (isAnimating || isResolvingRef.current) return;
    registerPlayerActivity();
    if (activePowerUp === 'hammer' || activePowerUp === 'replace') return;
    if (selectedTile?.row !== r || selectedTile?.col !== c) {
      playTileSelect();
      setSelectedTile({ row: r, col: c });
    }
  };

  // Handle Tile Swipe: Swaping letter with adjacent letter (up, down, left, right)
  // REQUIREMENT: Letter selected zooms in then immediately swaps tile; 1 swipe immediately swaps the tiles
  const handleTileSwipe = (fromR: number, fromC: number, toR: number, toC: number) => {
    if (isAnimating || isResolvingRef.current) return;
    registerPlayerActivity();

    // 1. Hammer or Replace power-ups don't swipe
    if (activePowerUp === 'hammer' || activePowerUp === 'replace') return;

    // 2. Swap Power-Up Active: Swap swiped tiles
    if (activePowerUp === 'swap') {
      if (powerUps.swap <= 0) {
        setTargetAdPowerUpType('swap');
        setIsPowerUpAdOpen(true);
        return;
      }
      playPowerUp();
      setPowerUps((prev) => ({ ...prev, swap: Math.max(0, prev.swap - 1) }));
      setActivePowerUp(null);
      setSelectedTile(null);
      setClue(null);
      triggerBanner(
        `Power-up Swap: Swapped (${board[fromR][fromC].letter}) with (${board[toR][toC].letter})!`,
        'special',
        '🔀',
        'SWAP'
      );
      executeTileSwapAnywhere(fromR, fromC, toR, toC);
      return;
    }

    // 3. Normal Adjacent 1-Swipe Swap:
    // Zoom in on initial tile and immediately execute swap with adjacent tile!
    lastTutorialActivityRef.current = Date.now();
    setIsTutorialTipDismissed(false);

    // Keep initial tile highlighted & zoomed in before swap executes
    setSelectedTile({ row: fromR, col: fromC });

    // Validate that only adjacent letters swap
    const dist = Math.abs(fromR - toR) + Math.abs(fromC - toC);
    if (dist === 1) {
      performSwap(fromR, fromC, toR, toC);
    }
  };

  // Execute Replace Letter Power-up
  const handleExecuteLetterReplace = async (newLetter: string, explicitRow?: number, explicitCol?: number) => {
    const target = replaceTargetTile || (explicitRow !== undefined && explicitCol !== undefined ? { row: explicitRow, col: explicitCol, currentLetter: board[explicitRow][explicitCol]?.letter || '' } : null);

    if (target) {
      const { row: r, col: c } = target;
      const upperLetter = (newLetter || 'A').trim().toUpperCase();
      setReplaceTargetTile(null);
      setIsLetterPickerOpen(false);
      setPendingReplaceLetter(null);
      setActivePowerUp(null);
      registerPlayerActivity();

      if (powerUps.replace <= 0) return;
      setPowerUps((prev) => ({ ...prev, replace: Math.max(0, prev.replace - 1) }));

      isResolvingRef.current = true;
      setIsAnimating(true);

      playPowerUp();
      haptics.tap();
      triggerBanner(
        `Replaced Tile (${r + 1}, ${c + 1}) with Letter "${upperLetter}"!`,
        'special',
        '✏️',
        'REPLACE'
      );

      // Create new clean board with replaced letter and reset all animation/match/special flags so letter is crystal clear and visible!
      let currentBoardCopy = cloneBoard(boardRef.current);
      currentBoardCopy[r][c] = {
        ...currentBoardCopy[r][c],
        letter: upperLetter,
        special: 'none',
        isMatched: false,
        isClearing: false,
        isWordHighlighted: false,
        isElectrified: false,
        isKnockedOff: false,
        isVaporizing: false,
        isBurning: false,
        isBreakingBlock: false,
        isFalling: false,
        isMerged: false,
        isPopping: true,
      };
      setBoard(currentBoardCopy);

      setTimeout(async () => {
        const unpoppedBoard = cloneBoard(currentBoardCopy).map((rowArr) =>
          rowArr.map((t) => (t.isPopping ? { ...t, isPopping: false } : t))
        );
        setBoard(unpoppedBoard);
        const resolved = await resolveBoard(unpoppedBoard, currentCategory.id);
        if (resolved) {
          setBoard(resolved);
        }
        setIsAnimating(false);
        isResolvingRef.current = false;
      }, 250);
    } else {
      // Pre-select letter to transform any tile on board
      const upperLetter = (newLetter || 'A').trim().toUpperCase();
      setPendingReplaceLetter(upperLetter);
      setIsLetterPickerOpen(false);
      setActivePowerUp('replace');
      registerPlayerActivity();
      triggerBanner(
        `Letter "${upperLetter}" chosen! Tap any tile on the board to transform it.`,
        'special',
        '✏️',
        'REPLACE',
        4000
      );
    }
  };

  // Power-Up Selections
  const handleSelectPowerUp = (type: PowerUpType) => {
    if (isAnimating) return;
    registerPlayerActivity();

    if (type === 'hammer') {
      if (powerUps.hammer <= 0) {
        setTargetAdPowerUpType('hammer');
        setIsPowerUpAdOpen(true);
        return;
      }
      setActivePowerUp((prev) => (prev === 'hammer' ? null : 'hammer'));
      setSelectedTile(null);
      triggerBanner('Hammer Ready: Tap any tile on the board to smash it', 'info', '🔨', 'POWER-UP');
    } else if (type === 'replace') {
      if (powerUps.replace <= 0) {
        setTargetAdPowerUpType('replace');
        setIsPowerUpAdOpen(true);
        return;
      }
      // If player already selected a tile on the board, immediately prompt for that tile's new letter!
      if (selectedTile) {
        setReplaceTargetTile({
          row: selectedTile.row,
          col: selectedTile.col,
          currentLetter: board[selectedTile.row][selectedTile.col].letter,
        });
        setSelectedTile(null);
      } else {
        setReplaceTargetTile(null);
      }
      setPendingReplaceLetter(null);
      setIsLetterPickerOpen(true);
      setActivePowerUp(null);
    } else if (type === 'swap') {
      if (powerUps.swap <= 0) {
        setTargetAdPowerUpType('swap');
        setIsPowerUpAdOpen(true);
        return;
      }
      setActivePowerUp((prev) => (prev === 'swap' ? null : 'swap'));
      setSelectedTile(null);
      triggerBanner('Swap Active: Tap any 2 letters on the board to swap them', 'info', '🔀', 'POWER-UP');
    } else if (type === 'rearrange') {
      if (powerUps.rearrange <= 0) {
        setTargetAdPowerUpType('rearrange');
        setIsPowerUpAdOpen(true);
        return;
      }
      playPowerUp();
      const shuffled = shuffleBoard(board, currentCategory.id);
      setBoard(shuffled);
      setPowerUps((prev) => ({ ...prev, rearrange: 0 }));
      setActivePowerUp(null);
      setSelectedTile(null);
      setClue(null);
      triggerBanner('Board Shuffled: All Letters Rearranged!', 'info', '🔄', 'SHUFFLE');

      setTimeout(() => {
        resolveBoard(shuffled, currentCategory.id);
      }, 400);
    } else if (type === 'clue') {
      if (powerUps.clue <= 0) {
        setTargetAdPowerUpType('clue');
        setIsPowerUpAdOpen(true);
        return;
      }
      playPowerUp();
      const strategicClue = findStrategicClue(board, currentCategory.id, formedWordsRef.current);
      if (strategicClue) {
        setClue(strategicClue);
        setPowerUps((prev) => ({ ...prev, clue: 0 }));
      }
      setActivePowerUp(null);
    }
  };

  const handleCancelPowerUp = () => {
    setActivePowerUp(null);
    setReplaceTargetTile(null);
    setPendingReplaceLetter(null);
    setIsLetterPickerOpen(false);
    setSelectedTile(null);
  };

  // Open Ad Modal for Power-Ups
  const handleOpenPowerUpAd = (type?: PowerUpType) => {
    setTargetAdPowerUpType(type || null);
    setIsPowerUpAdOpen(true);
  };

  // Claim Rewarded Ad for Power-Ups (Requirement: Player chooses only 1 powerup to refill)
  const handleClaimPowerUpReward = (type: PowerUpType) => {
    setPowerUps((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    triggerBanner(`Unlocked +1 ${type.toUpperCase()} from Ad!`, 'special', '🎁', '+1 POWER-UP');
    setIsPowerUpAdOpen(false);
  };

  // Claim Rewarded Ad +5 Moves (Capped at MAX_MOVES 20)
  const handleClaimAdReward = () => {
    const nextUsed = adRefillsUsed + 1;
    setAdRefillsUsed(nextUsed);
    movesRemainingRef.current = Math.min(MAX_MOVES, movesRemainingRef.current + REFILL_MOVES_AMOUNT);
    setMovesRemaining(movesRemainingRef.current);
    setIsAdModalOpen(false);
    triggerBanner('+5 Moves Added From Ad Refill!', 'moves', '⏳', '+5 MOVES');
  };

  // Monetization Handlers
  const handleBuyPowerUpWithCoins = (type: PowerUpType, costInCoins: number, count: number = 1) => {
    const res = deductCoins(costInCoins);
    if (res.success) {
      setGameProgress(res.progress);
      setPowerUps((prev) => ({ ...prev, [type]: (prev[type] || 0) + count }));
      triggerBanner(`Bought +${count} ${type.toUpperCase()} with ${costInCoins} Coins!`, 'special', '🪙', 'PURCHASE');
      return true;
    }
    return false;
  };

  const handleBuyMegaBundle = (costInCoins: number) => {
    const res = deductCoins(costInCoins);
    if (res.success) {
      setGameProgress(res.progress);
      setPowerUps((prev) => ({
        hammer: (prev.hammer || 0) + 1,
        swap: (prev.swap || 0) + 1,
        rearrange: (prev.rearrange || 0) + 1,
        clue: (prev.clue || 0) + 1,
        replace: (prev.replace || 0) + 1,
      }));
      triggerBanner('Mega Bundle Acquired! +1 to All 5 Power-ups!', 'special', '🎁', 'MEGA BUNDLE');
      return true;
    }
    return false;
  };

  const handleExchangeDiamonds = (diamondsToDeduct: number, coinsToAdd: number) => {
    const res = exchangeDiamondsForCoins(diamondsToDeduct, coinsToAdd);
    if (res.success) {
      setGameProgress(res.progress);
      triggerBanner(`Exchanged ${diamondsToDeduct} Diamonds for +${coinsToAdd} Coins!`, 'special', '🪙', 'EXCHANGE');
      return true;
    }
    return false;
  };

  const handleAddDiamonds = (amount: number) => {
    const updated = addDiamonds(amount);
    setGameProgress(updated);
    triggerBanner(`Added +${amount} Diamonds to your Vault!`, 'special', '💎', '+DIAMONDS');
    syncProgressToCloud(updated).catch((err) => {
      console.warn('Auto cloud sync after adding diamonds:', err);
    });
  };

  const handlePurchaseRemoveAds = () => {
    const { progress } = purchaseRemoveAllAds();
    setGameProgress(progress);
    // Power-up balances are NOT doubled on purchase anymore — they stay at
    // whatever the player currently has (always started at 1x, see
    // playCategoryRound / the powerUps initial state above).
    triggerBanner('All Ads Removed Forever! +100 💎 & All Rounds Unlocked!', 'special', '🛡️', 'NO ADS ACTIVE');
    // hasRemovedAds now bypasses the 5-round lock entirely (see
    // requestOpenCategory). If the player reached the Shop via the lock
    // modal's "Or Remove Ads to Unlock Everything" upsell button,
    // handleOpenShopFromRoundLock already closed that modal (so it doesn't
    // sit on top of the Shop) but deliberately left pendingTargetCategory
    // set — check that directly here (not isRoundLockOpen, which is
    // already false by now) and resume the round they were trying to
    // start instead of leaving them stuck back at the category screen.
    setIsRoundLockOpen(false);
    if (pendingTargetCategory) {
      playCategoryRound(pendingTargetCategory);
      setPendingTargetCategory(null);
    }
    syncProgressToCloud(progress).catch((err) => {
      console.warn('Auto cloud sync after removing ads:', err);
    });
  };

  const handleUseCoinsForMoves = (coinsCost: number = 50): boolean => {
    if (adRefillsUsed >= MAX_AD_REFILLS) {
      triggerBanner('Refill Limit Reached (3 max)! Please restart category.', 'special', '⚠️', 'LIMIT REACHED');
      return false;
    }
    const res = deductCoins(coinsCost);
    if (res.success) {
      const nextUsed = adRefillsUsed + 1;
      setAdRefillsUsed(nextUsed);
      setGameProgress(res.progress);
      movesRemainingRef.current = Math.min(MAX_MOVES, movesRemainingRef.current + REFILL_MOVES_AMOUNT);
      setMovesRemaining(movesRemainingRef.current);
      setIsGameOverOpen(false);
      setIsAdModalOpen(false);
      triggerBanner(`+5 Moves Added (Refill ${nextUsed}/3 used)!`, 'moves', '🪙', '+5 MOVES');
      return true;
    }
    return false;
  };

  // Demo Trigger for Fire Wipeout FX in preview
  const handleTriggerFireWipeoutDemo = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    haptics.fireWipe();
    playFireInferno();
    triggerExplosion(3, 3, 'board_wipe');

    // PHASE 1: Wait 1.0 second after alert appears before tiles start turning red
    await new Promise((res) => setTimeout(res, 1000));

    // PHASE 2: Board letters and tiles turn red within 1.0 second (t=1.0s to 2.0s)
    playFireSizzle();
    haptics.fireCrackle();
    setBoard((prev) =>
      prev.map((rowArr) =>
        rowArr.map((tile) => ({
          ...tile,
          isBurning: true,
          isVaporizing: false,
        }))
      )
    );

    // Glow red for 1.0 full second until t=2.0s
    await new Promise((res) => setTimeout(res, 1000));

    // PHASE 3: Sabay mawawala yung alert and magpapakita yung new letters with simultaneous 3D flip!
    const catId = currentCategory.id;
    let freshBoard = generateInitialBoard(catId, formedWordsRef.current);
    freshBoard = freshBoard.map((rowArr) =>
      rowArr.map((tile) => ({
        ...tile,
        isFlipping: true,
        isBurning: false,
        isMatched: false,
        isFalling: false,
      }))
    );
    setBoard(freshBoard);
    playLetterPop();
    playBoardClear();
    haptics.fireCrackle();

    // Trigger shining glow running through the board for 1.0 second right after the new set of letters appear
    triggerExplosion(3, 3, 'board_shine');
    playShining();

    await new Promise((res) => setTimeout(res, 450));

    // Reset flipping states
    setBoard((prev) =>
      prev.map((rowArr) =>
        rowArr.map((tile) => ({
          ...tile,
          isFlipping: false,
          isBurning: false,
          isElectrified: false,
          isKnockedOff: false,
          isVaporizing: false,
          isMatched: false,
        }))
      )
    );

    setIsAnimating(false);
  }, [isAnimating, currentCategory.id]);

  // Move to Next Category
  const handleNextRound = () => {
    perfResetBaseline();
    perfMark('Continue tapped (handleNextRound)');
    if (selectedCustomCategory) {
      // Return to campaign round
      setSelectedCustomCategory(null);
      startRound(categoryIndex);
      return;
    }
    const nextIdx = (categoryIndex + 1) % INITIAL_CATEGORIES.length;
    startRound(nextIdx);
  };

  const handleGoHome = () => {
    setIsRoundCompleteOpen(false);
    setIsGameOverOpen(false);
    setSelectedCustomCategory(null);
    setCurrentScreen('menu');
  };

  const handleDeductDiamondsForCategory = (amount: number): boolean => {
    const res = deductDiamonds(amount);
    if (res.success) {
      setGameProgress(res.progress);
      return true;
    }
    return false;
  };

  const handleCustomCategoryCreated = (newCat: Category) => {
    playCategoryRound(newCat);
    triggerBanner(
      `✨ Community category "${newCat.name}" is now live!`,
      'category',
      newCat.icon,
      'LIVE',
      3500
    );
  };

  const handleOpenCreateCategory = () => {
    setEditingCustomCategory(null);
    setIsCreateCategoryOpen(true);
  };

  const handleEditCustomCategory = (cat: Category) => {
    setEditingCustomCategory(cat);
    setIsCreateCategoryOpen(true);
  };

  const handleCustomCategoryUpdated = (updatedCat: Category) => {
    if (selectedCustomCategory && selectedCustomCategory.id === updatedCat.id) {
      setSelectedCustomCategory(updatedCat);
    }
    triggerBanner(
      `Updated custom category "${updatedCat.name}"!`,
      'category',
      updatedCat.icon,
      'UPDATED'
    );
  };

  // Timer gameMode countdown loop
  //
  // Used to call `setTimerSecondsRemaining` (App-level state) once a second,
  // which re-rendered the whole App component tree once a second for the
  // entire duration of every timer-mode custom-game round -- see
  // useTickingRefValue.ts for the full story and why that's a real (if
  // subtle) source of on-device flicker/jank even with GameBoard/TopInfoBar/
  // Header's memos in place. Now decrements timerSecondsRemainingRef (a
  // plain ref, no re-render) every second instead, and only calls
  // setTimerSecondsRemaining -- a real, necessary re-render -- exactly once,
  // when the round actually ends. WordHistory's and PowerUpBar's countdown
  // badges display the live value via useTickingRefValue, ticking
  // themselves independently of App.
  useEffect(() => {
    if (currentScreen !== 'game') return;
    if (currentCategory.gameMode !== 'timer') return;

    const interval = setInterval(() => {
      if (
        isReadyPromptOpen ||
        isRoundCompleteOpen ||
        isGameOverOpen ||
        isAdModalOpen ||
        isPowerUpAdOpen ||
        isShopOpen ||
        isCategoryModalOpen ||
        isLeaderboardOpen ||
        isProfileOpen ||
        isSettingsOpen ||
        isHelpOpen
      ) {
        return;
      }

      // Already finished and waiting behind the clearing screen -- don't
      // finish the round a second time if this effect re-runs meanwhile.
      if (roundEndingRef.current) return;

      const next = Math.max(0, timerSecondsRemainingRef.current - 1);
      timerSecondsRemainingRef.current = next;
      if (next > 0) return;

      // Timer finished! Round completed!
      clearInterval(interval);
      haptics.roundComplete();
      const elapsedSeconds = currentCategory.timerSeconds || 120;
      setRoundTimeConsumed(elapsedSeconds);
      const finalScore = roundScoreRef.current;
      const totalWords = formedWordsRef.current.size;
      const bestWord = wordHistoryRef.current[0]?.word || '';
      const bestWordPts = wordHistoryRef.current[0]?.points || 0;

      // Calculate timer earned stars based on words formed
      const timerEarnedStars = totalWords >= 15 ? 3 : totalWords >= 8 ? 2 : 1;
      const completionResult = completeCategory(currentCategory.id, finalScore, timerEarnedStars);
      let latestProgress = completionResult.progress;

      // Check diamond milestones
      const diamondCheck = checkAndAwardDiamondMilestones(currentCategory.id, finalScore);
      if (diamondCheck.awarded) {
        latestProgress = diamondCheck.progress;
        setDiamondMilestoneAwarded({
          count: diamondCheck.diamondsAwarded,
          milestoneName: diamondCheck.milestoneName,
        });
      }

      setGameProgress(latestProgress);
      if (completionResult.newlyUnlockedCategory) {
        setNewlyUnlockedCategory(completionResult.newlyUnlockedCategory);
      }

      let leaderboardUpload: Promise<void> = Promise.resolve();
      try {
        leaderboardUpload = recordScore({
          categoryId: currentCategory.id,
          categoryName: currentCategory.name,
          categoryScore: finalScore,
          wordsCount: totalWords,
          highestWord: bestWord,
          highestWordPoints: bestWordPts,
          isRoundComplete: true,
          timeConsumedSeconds: elapsedSeconds,
        }).upload;
      } catch (err) {
        console.warn('recordScore error in timer mode:', err);
      }

      // Auto backup progress to cloud every round completion
      const cloudBackupUpload = syncProgressToCloud(latestProgress).catch((err) => {
        console.warn('Auto cloud backup error in timer mode:', err);
      });

      setTimerSecondsRemaining(0);
      finishRoundBehindClearingScreen([cloudBackupUpload, leaderboardUpload]);
    }, 1000);

    return () => clearInterval(interval);
  }, [
    currentScreen,
    currentCategory.id,
    currentCategory.gameMode,
    currentCategory.timerSeconds,
    currentCategory.name,
    isReadyPromptOpen,
    isRoundCompleteOpen,
    isGameOverOpen,
    isAdModalOpen,
    isPowerUpAdOpen,
    isShopOpen,
    isCategoryModalOpen,
    isLeaderboardOpen,
    isProfileOpen,
    isSettingsOpen,
    isHelpOpen,
  ]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#071330] text-white flex flex-col font-sans selection:bg-[#0EA5E9] selection:text-white overflow-hidden">
      {/* Active Screen Area (Menu or Game Board) */}
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
        {currentScreen === 'menu' ? (
          /* HOME SCREEN: GAME MENU */
          <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
            <HomeMenu
              currentCategory={currentCategory}
              gameProgress={gameProgress}
              score={roundScore}
              onPlayGame={() => {
                // When player opens the game board, ensure it starts on the highest unlocked round
                const latestProgress = loadGameProgress();
                const highestUnlockedId = getHighestUnlockedCategoryId(latestProgress);
                const foundIdx = INITIAL_CATEGORIES.findIndex((c) => c.id === highestUnlockedId);
                const targetIdx = foundIdx >= 0 ? foundIdx : categoryIndex;
                const targetCat = INITIAL_CATEGORIES[targetIdx] || currentCategory;

                // roundEndingRef: that round already finished (its board was
                // cleared off screen), so there's nothing to resume.
                if (currentCategory.id !== targetCat.id || categoryProgress === 0 || roundEndingRef.current) {
                  playCategoryRound(targetCat);
                } else {
                  setIsReadyPromptOpen(true);
                  setCurrentScreen('game');
                }
              }}
              onOpenCategories={() => setIsCategoryModalOpen(true)}
              onOpenCreateCategory={handleOpenCreateCategory}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onOpenHelp={() => setIsHelpOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenShop={handleOpenShop}
            />
          </div>
        ) : (
          /* GAME BOARD SCREEN: Retains all existing assets and gameplay */
          <div className="flex-1 min-h-0 bg-gradient-to-b from-[#F0F5FA] via-[#E4EDF7] to-[#ECF3FA] text-[#0F172A] flex flex-col overflow-hidden">
            {/* Top Header */}
            <Header
              category={currentCategory}
              categoryProgress={categoryProgress}
              movesRemaining={movesRemaining}
              movesGainedBonus={movesGainedBonus || undefined}
              score={roundScore}
              coins={gameProgress.coins || 0}
              diamonds={gameProgress.diamonds || 0}
              spellingPreference={spellingPreference}
              onOpenCategories={() => setIsCategoryModalOpen(true)}
              onOpenHome={() => setCurrentScreen('menu')}
              onOpenShop={handleOpenShop}
            />

            {/* Main Gameplay Container: Vertically balanced to fit all screen ratios & iPad without overlapping banner ads */}
            {/* While a round's board is being built (!isBoardReady) or cleared
                away at round end (isClearingBoard), show a plain status panel
                instead of the board. isBoardCleared keeps the finished board
                off screen behind the results modal until the next round. */}
            {isClearingBoard || isBoardCleared || !isBoardReady ? (
              <div className="flex-1 min-h-0 w-full flex items-center justify-center px-4">
                {(isClearingBoard || !isBoardReady) && (
                  <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-[#0C2158] border-2 border-[#1E3A8A] text-white text-center">
                    <div className="w-8 h-8 rounded-full border-4 border-white/90 border-t-transparent animate-spin" />
                    <p className="font-black text-base sm:text-lg">
                      {isClearingBoard ? 'Clearing Game Board...' : 'Game Board loading...'}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-200 font-bold">Please wait.</p>
                  </div>
                )}
              </div>
            ) : (
            /* fx-lite: lighter special effects for custom games in the
               Android app (see the `.fx-lite` rules in index.css). */
            <main
              key={roundKey}
              className={`flex-1 min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5 flex flex-col justify-between sm:justify-evenly items-center overflow-hidden ${
                currentCategory.isCustom ? 'fx-lite' : ''
              }`}
            >
              {/* Main Center Area: Formed Words Bar + Maximized 8x8 Board + Power-Up Bar (Cohesive unit scaled to available height) */}
              <div
                className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 my-auto w-full mx-auto shrink-0 ${
                  gameProgress.hasRemovedAds
                    ? 'max-w-[min(96vw,calc(100dvh-250px),530px)]'
                    : 'max-w-[min(96vw,calc(100dvh-320px),510px)]'
                }`}
              >
                {/* Top Informational Popups Bar (Special tile explanations, active power-up instructions, action banners, tutorial tips) */}
                <div className="w-full flex justify-center shrink-0">
                  <TopInfoBar
                    specialTileInfo={selectedSpecialTileInfo}
                    activePowerUp={activePowerUp}
                    pendingReplaceLetter={pendingReplaceLetter}
                    selectedTileForSwap={selectedTile}
                    banner={boardBanner}
                    tutorialTip={currentTutorialTip}
                    onDismissTutorialTip={handleDismissTutorialTip}
                    onDismissBanner={() => setBoardBanner(null)}
                    onTriggerFireWipeoutDemo={handleTriggerFireWipeoutDemo}
                  />
                </div>

                {/* List of Formed Words Horizontally Above the Board */}
                <div className="w-full flex justify-center shrink-0">
                  <WordHistory
                    history={wordHistory}
                    category={currentCategory}
                    categoryProgress={categoryProgress}
                    timerSecondsRemainingRef={timerSecondsRemainingRef}
                  />
                </div>

                {/* Maximized 8x8 Game Board */}
                <div className="w-full flex flex-col items-center justify-center shrink-0">
                  <GameBoard
                    board={board}
                    selectedTile={selectedTile}
                    onTileClick={handleTileClick}
                    onTileSelect={handleTileSelect}
                    onTileSwipe={handleTileSwipe}
                    isSwipeEnabled={isSwipeEnabled}
                    swappingTiles={swappingTiles}
                    clue={clue}
                    activePowerUp={activePowerUp}
                    pendingReplaceLetter={pendingReplaceLetter}
                    explosions={explosions}
                    isAnimating={isAnimating}
                    banner={null}
                    wordAlerts={wordAlerts}
                    robotWords={null}
                    onDismissRobot={handleDismissClue}
                    isReady={isReadyPromptOpen}
                    isRolling={isRollingTiles}
                    tutorialTip={null}
                    onDismissTutorialTip={handleDismissTutorialTip}
                  />
                </div>

                {/* Elevated Power-Up Bar with Floating Yellow Inactivity Clue & Lifeline Prompt */}
                <div className="w-full flex justify-center shrink-0 relative mt-0.5 sm:mt-1">
                  {/* Floating Clue Toast overlapping into powerup buttons area (Yellow 10% opacity, no 1/3) */}
                  {robotWords && robotWords.length > 0 && isCluesEnabled && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                      <ThinkingRobot
                        possibleWords={robotWords}
                        onDismiss={handleDismissClue}
                      />
                    </div>
                  )}

                  {/* Floating Lifeline Inactivity Prompt: "You can use your lifelines!" */}
                  {isLifelinePromptActive && !robotWords && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                      <LifelinePromptToast onDismiss={handleDismissLifelinePrompt} />
                    </div>
                  )}

                  {/* Active Power-up Clue message bar */}
                  {clue && !robotWords && !isLifelinePromptActive && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-[min(96vw,500px)] z-20 pointer-events-auto">
                      <div className="bg-yellow-400/15 backdrop-blur-md border border-yellow-400/40 text-yellow-200 rounded-full px-3 py-0.5 flex items-center justify-between text-[11px] sm:text-xs font-black shadow-lg animate-bounce">
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="text-xs">💡</span>
                          <span className="truncate text-yellow-300">Clue: {clue.reason}</span>
                        </span>
                        <button
                          onClick={() => setClue(null)}
                          className="text-[10px] sm:text-xs text-rose-300 underline font-black ml-2 hover:text-white shrink-0 cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  <PowerUpBar
                    inventory={powerUps}
                    activePowerUp={activePowerUp}
                    movesRemaining={movesRemaining}
                    movesGainedBonus={movesGainedBonus}
                    isTimerMode={currentCategory.gameMode === 'timer'}
                    timerSecondsRemainingRef={timerSecondsRemainingRef}
                    isLifelineShining={isLifelineShining}
                    onSelectPowerUp={handleSelectPowerUp}
                    onCancelPowerUp={handleCancelPowerUp}
                    onOpenPowerUpAd={handleOpenPowerUpAd}
                    disabled={isAnimating}
                  />
                </div>
              </div>
            </main>
            )}
          </div>
        )}
      </div>

      {/* Global Modals accessible across Menu & Game Board */}
      <ProfileModal
        isOpen={isProfileOpen}
        gameProgress={gameProgress}
        onClose={() => setIsProfileOpen(false)}
        onUpdateGameProgress={(updated) => {
          const highestUnlockedId = getHighestUnlockedCategoryId(updated);
          const updatedWithHighest = {
            ...updated,
            lastPlayedCategoryId: highestUnlockedId,
          };
          setGameProgress(updatedWithHighest);
          saveGameProgress(updatedWithHighest);

          const foundIdx = INITIAL_CATEGORIES.findIndex((c) => c.id === highestUnlockedId);
          if (foundIdx >= 0) {
            setCategoryIndex(foundIdx);
            setSelectedCustomCategory(null);
            const targetCat = INITIAL_CATEGORIES[foundIdx];
            // Prepare board and category state for highest round without forcibly jumping screen
            setCategoryProgress(0);
            categoryProgressRef.current = 0;
            setRoundScore(0);
            roundScoreRef.current = 0;
            setNewlyUnlockedCategory(null);
            setDiamondMilestoneAwarded(null);
            setMovesRemaining(INITIAL_MOVES);
            movesRemainingRef.current = INITIAL_MOVES;
            setAdRefillsUsed(0);
            setWordHistory([]);
            setFormedWords(new Set());
            formedWordsRef.current = new Set();
            alertedDuplicateSetsRef.current.clear();
            alertedRegionMismatchSetsRef.current.clear();
            const freshBoard = generateInitialBoard(targetCat.id);
            setBoard(freshBoard);
            setIsBoardCleared(false);
            setIsClearingBoard(false);
            roundEndingRef.current = false;
            roundStartTimeRef.current = Date.now();
            setRoundTimeConsumed(0);
          }

          // Power-up balances are always 1x now, even after a cloud-restore
          // that brings back hasRemovedAds — no more bumping them to 2 here
          // (see handlePurchaseRemoveAds and the powerUps initial state).
        }}
        onSelectCategory={(catId) => {
          const found = INITIAL_CATEGORIES.find((c) => c.id === catId);
          if (found) {
            setIsProfileOpen(false);
            requestOpenCategory(found);
            setCurrentScreen('game');
          }
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isSwipeEnabled={isSwipeEnabled}
        onToggleSwipe={setIsSwipeEnabled}
        isCluesEnabled={isCluesEnabled}
        onToggleClues={(enabled) => {
          setIsCluesEnabled(enabled);
          if (!enabled) {
            setRobotWords(null);
          }
        }}
        onTriggerFireWipeoutDemo={handleTriggerFireWipeoutDemo}
        onSpellingPreferenceChange={setSpellingPreference}
      />

      <AdModal
        isOpen={isAdModalOpen}
        adRefillsUsed={adRefillsUsed}
        maxRefills={MAX_AD_REFILLS}
        hasRemovedAds={gameProgress.hasRemovedAds || false}
        coins={gameProgress.coins || 0}
        diamonds={gameProgress.diamonds || 0}
        onUseCoinsForMoves={handleUseCoinsForMoves}
        onClaimReward={handleClaimAdReward}
        onResetGame={() => {
          setIsAdModalOpen(false);
          playCategoryRound(currentCategory);
        }}
        onOpenShop={handleOpenShop}
      />

      <PowerUpAdModal
        isOpen={isPowerUpAdOpen}
        selectedPowerUpType={targetAdPowerUpType}
        coins={gameProgress.coins || 0}
        diamonds={gameProgress.diamonds || 0}
        onBuyWithCoins={handleBuyPowerUpWithCoins}
        onClaimReward={handleClaimPowerUpReward}
        onOpenShop={handleOpenShop}
        onClose={() => setIsPowerUpAdOpen(false)}
      />

      <RoundCompleteModal
        isOpen={isRoundCompleteOpen}
        category={currentCategory}
        history={wordHistory}
        movesRemaining={movesRemaining}
        score={roundScore}
        earnedStars={gameProgress.categoryStars?.[currentCategory.id] || (currentCategory.gameMode === 'timer' ? (wordHistory.length >= 15 ? 3 : wordHistory.length >= 8 ? 2 : 1) : (movesRemaining >= 5 ? 3 : movesRemaining >= 2 ? 2 : 1))}
        timeConsumed={roundTimeConsumed}
        newlyUnlockedCategory={newlyUnlockedCategory}
        convertedCoins={roundEndCoinConversion}
        diamondMilestoneAwarded={diamondMilestoneAwarded}
        coins={gameProgress.coins || 0}
        diamonds={gameProgress.diamonds || 0}
        onNextRound={handleNextRound}
        onReplayRound={() => playCategoryRound(currentCategory)}
        onGoHome={handleGoHome}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenShop={handleOpenShop}
        hasNextRound={categoryIndex < INITIAL_CATEGORIES.length - 1 || !!selectedCustomCategory}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        category={currentCategory}
        categoryProgress={categoryProgress}
        history={wordHistory}
        score={roundScore}
        diamondMilestoneAwarded={diamondMilestoneAwarded}
        coins={gameProgress.coins || 0}
        diamonds={gameProgress.diamonds || 0}
        adRefillsUsed={adRefillsUsed}
        maxRefills={MAX_AD_REFILLS}
        onUseCoinsForMoves={handleUseCoinsForMoves}
        onOpenShop={handleOpenShop}
        onRetry={() => playCategoryRound(currentCategory)}
        onGoHome={handleGoHome}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      <ShopModal
        isOpen={isShopOpen}
        initialTab={shopInitialTab}
        onClose={() => setIsShopOpen(false)}
        coins={gameProgress.coins || 0}
        diamonds={gameProgress.diamonds || 0}
        inventory={powerUps}
        hasRemovedAds={gameProgress.hasRemovedAds || false}
        onBuyPowerUp={handleBuyPowerUpWithCoins}
        onBuyMegaBundle={handleBuyMegaBundle}
        onExchangeDiamonds={handleExchangeDiamonds}
        onAddDiamonds={handleAddDiamonds}
        onPurchaseRemoveAds={handlePurchaseRemoveAds}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        currentCategoryId={currentCategory.id}
        currentScore={roundScore}
        customCategories={customCategories}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <LetterPickerModal
        isOpen={isLetterPickerOpen}
        targetTile={replaceTargetTile}
        onSelectLetter={handleExecuteLetterReplace}
        onClose={handleCancelPowerUp}
      />

      <CategorySelectorModal
        isOpen={isCategoryModalOpen}
        currentCategory={currentCategory}
        gameProgress={gameProgress}
        customCategories={customCategories}
        diamonds={gameProgress.diamonds || 0}
        spellingPreference={spellingPreference}
        onSelectCategory={(cat) => {
          setIsCategoryModalOpen(false);
          requestOpenCategory(cat);
        }}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onRestartRound={() => {
          setIsCategoryModalOpen(false);
          playCategoryRound(currentCategory);
        }}
        onOpenCreateCategory={handleOpenCreateCategory}
        onEditCustomCategory={handleEditCustomCategory}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => {
          setIsCreateCategoryOpen(false);
          setEditingCustomCategory(null);
        }}
        diamonds={gameProgress.diamonds || 0}
        coins={gameProgress.coins || 0}
        onDeductDiamonds={handleDeductDiamondsForCategory}
        onCategoryCreated={handleCustomCategoryCreated}
        editingCategory={editingCustomCategory}
        onCategoryUpdated={handleCustomCategoryUpdated}
        onOpenShop={handleOpenShop}
      />

      <CustomGamePasswordModal
        category={passwordPromptCategory}
        onUnlocked={(cat) => {
          setPasswordPromptCategory(null);
          // The right password is now remembered, so this continues on to
          // the normal custom-game flow (ad gate, then play).
          requestOpenCategory(cat);
        }}
        onClose={() => setPasswordPromptCategory(null)}
      />

      {/* Round Lock: shown every 5 completed rounds — one rewarded ad unlocks the next 5 */}
      <RoundLockModal
        isOpen={isRoundLockOpen}
        roundsPerCycle={ROUNDS_PER_UNLOCK_BLOCK}
        customGameName={pendingTargetCategory?.isCustom ? pendingTargetCategory.name : undefined}
        onUnlocked={handleRoundsUnlocked}
        onClose={handleRoundLockDismissed}
        onOpenShop={handleOpenShopFromRoundLock}
      />

      {/* Bottom Banner Ad across the screen */}
      <BottomBannerAd hasRemovedAds={gameProgress.hasRemovedAds} />

      {currentScreen === 'game' && (
        <ReadyPrompt
          isOpen={isReadyPromptOpen}
          category={currentCategory}
          isBoardReady={isBoardReady}
          onStart={handleStartGameRound}
          onHome={() => {
            setIsReadyPromptOpen(false);
            handleGoHome();
          }}
        />
      )}

      {/* Strict Portrait Orientation Lock Overlay */}
      <PortraitLockOverlay />
    </div>
  );
}
