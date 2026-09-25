import React, { useRef } from 'react';
import { Bomb, Sparkles, Zap, Flame, Hammer, ArrowLeftRight, Edit3, X } from 'lucide-react';
import { HammerIcon } from './HammerIcon';
import { Tile, SpecialTileType, ClueInfo, ExplosionEffect, BoardBanner, PowerUpType, WordAlert } from '../types';
import { ThinkingRobot } from './ThinkingRobot';
import { FireFlameGraphic } from './FireFlameGraphic';
import { FireWipeoutAnnouncement } from './FireWipeoutAnnouncement';
import { haptics } from '../utils/haptics';

interface GameBoardProps {
  board: Tile[][];
  selectedTile: { row: number; col: number } | null;
  onTileClick: (row: number, col: number) => void;
  onTileSelect?: (row: number, col: number) => void;
  onTileSwipe?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
  isSwipeEnabled?: boolean;
  swappingTiles?: { r1: number; c1: number; r2: number; c2: number } | null;
  clue: ClueInfo | null;
  activePowerUp: PowerUpType | null;
  pendingReplaceLetter?: string | null;
  explosions: ExplosionEffect[];
  isAnimating: boolean;
  banner: BoardBanner | null;
  wordAlerts?: WordAlert[] | null;
  robotWords?: string[] | null;
  onDismissRobot?: () => void;
  isReady?: boolean;
  isRolling?: boolean;
  tutorialTip?: string | null;
  onDismissTutorialTip?: () => void;
}

// Running edge light SVG component for special tiles
const RunningEdgeLight: React.FC<{
  color1?: string;
  color2?: string;
  fast?: boolean;
  intensity?: 'normal' | 'high';
}> = ({ color1 = '#38bdf8', color2 = '#ffffff', fast = false, intensity = 'normal' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-[6px] sm:rounded-lg overflow-hidden z-20">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full absolute inset-0"
      >
        {/* Subtle static glowing background edge track */}
        <rect
          x="1.5"
          y="1.5"
          width="97"
          height="97"
          rx="10"
          ry="10"
          fill="none"
          stroke={color1}
          strokeWidth={intensity === 'high' ? '2.5' : '1.5'}
          strokeOpacity="0.45"
        />
        {/* Animated Running Light Beam 1 */}
        <rect
          x="1.5"
          y="1.5"
          width="97"
          height="97"
          rx="10"
          ry="10"
          fill="none"
          stroke={color1}
          strokeWidth={intensity === 'high' ? '4.5' : '3.5'}
          strokeLinecap="round"
          strokeDasharray="65 315"
          className={fast ? 'animate-edge-light-fast' : 'animate-edge-light'}
        />
        {/* Opposing counter running white beam for brilliant dual-head laser edge */}
        <rect
          x="1.5"
          y="1.5"
          width="97"
          height="97"
          rx="10"
          ry="10"
          fill="none"
          stroke={color2}
          strokeWidth={intensity === 'high' ? '3' : '2'}
          strokeLinecap="round"
          strokeDasharray="35 345"
          strokeDashoffset="190"
          className={fast ? 'animate-edge-light-fast' : 'animate-edge-light'}
          opacity="0.95"
        />
      </svg>
    </div>
  );
};

// Helper to generate dynamic jagged lightning paths between two coordinate percentages
function generateLightningBolt(x1: number, y1: number, x2: number, y2: number, segments = 6, jitter = 3.5): string {
  let path = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  const dx = (x2 - x1) / segments;
  const dy = (y2 - y1) / segments;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  for (let i = 1; i < segments; i++) {
    const offset = (Math.sin(i * 3.7) + (Math.random() - 0.5) * 2) * jitter;
    const px = x1 + dx * i + nx * offset;
    const py = y1 + dy * i + ny * offset;
    path += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  path += ` L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  return path;
}

const GameBoardImpl: React.FC<GameBoardProps> = ({
  board,
  selectedTile,
  onTileClick,
  onTileSelect,
  onTileSwipe,
  isSwipeEnabled = true,
  swappingTiles = null,
  clue,
  activePowerUp,
  pendingReplaceLetter = null,
  explosions,
  isAnimating,
  banner,
  wordAlerts,
  robotWords,
  onDismissRobot,
  isReady = false,
  isRolling = false,
  tutorialTip = null,
  onDismissTutorialTip,
}) => {
  const lastTouchTimeRef = useRef<number>(0);
  const lastSwipeTimeRef = useRef<number>(0);
  const boardRef = useRef<HTMLDivElement>(null);

  // Gesture tracking for Swipe to Swap
  const pointerStateRef = useRef<{
    pointerId: number;
    startR: number;
    startC: number;
    startX: number;
    startY: number;
    startTime: number;
    hasSwiped: boolean;
    targetEl: HTMLElement | null;
    prevSelectedTile: { row: number; col: number } | null;
  } | null>(null);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (isAnimating || isReady || isRolling) return;
    if (e.button !== 0) return; // Only primary mouse/touch button

    const targetEl = e.currentTarget;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is not supported
    }

    const prevSelected = selectedTile;

    pointerStateRef.current = {
      pointerId: e.pointerId,
      startR: r,
      startC: c,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      hasSwiped: false,
      targetEl,
      prevSelectedTile: prevSelected,
    };

    lastTouchTimeRef.current = Date.now();

    // If power-up is active (hammer / replace), defer to click/tap logic
    if (activePowerUp) {
      return;
    }

    // REQUIREMENT: Zoom in then immediately swap tile.
    // When swipe controls are enabled: Immediately zoom in / select this tile on touch down!
    if (isSwipeEnabled) {
      if (onTileSelect) {
        onTileSelect(r, c);
      } else {
        onTileClick(r, c);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = pointerStateRef.current;
    if (!state || state.hasSwiped || !isSwipeEnabled || isAnimating || isReady || isRolling) return;
    if (state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const distance = Math.hypot(dx, dy);

    // Responsive swipe distance threshold (14px for instantaneous 1-swipe trigger)
    const SWIPE_THRESHOLD = 14;
    if (distance >= SWIPE_THRESHOLD) {
      state.hasSwiped = true;
      lastSwipeTimeRef.current = Date.now();

      let targetR = state.startR;
      let targetC = state.startC;

      if (absY > absX) {
        // Vertical swipe:
        // Swiping UP swaps with adjacent letter UP (targetR = startR - 1)
        // Swiping DOWN swaps with adjacent letter DOWN (targetR = startR + 1)
        targetR = dy < 0 ? state.startR - 1 : state.startR + 1;
      } else {
        // Horizontal swipe:
        // Swiping LEFT (targetC = startC - 1) / Swiping RIGHT (targetC = startC + 1)
        targetC = dx < 0 ? state.startC - 1 : state.startC + 1;
      }

      // Check board boundaries
      const numRows = board.length;
      const numCols = board[0]?.length || 8;
      if (targetR >= 0 && targetR < numRows && targetC >= 0 && targetC < numCols) {
        haptics.tap();
        if (onTileSwipe) {
          onTileSwipe(state.startR, state.startC, targetR, targetC);
        } else {
          onTileClick(targetR, targetC);
        }
      }
    }
  };

  const handlePointerUp = (r: number, c: number, e: React.PointerEvent<HTMLButtonElement>) => {
    const state = pointerStateRef.current;
    if (state?.targetEl) {
      try {
        state.targetEl.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (!state) return;
    const hasSwiped = state.hasSwiped;
    const prevSelected = state.prevSelectedTile;
    pointerStateRef.current = null;

    if (hasSwiped || isAnimating || isReady || isRolling) {
      return;
    }

    // Power-up active (hammer / replace / swap power-up) -> execute onTileClick
    if (activePowerUp) {
      haptics.tap();
      onTileClick(r, c);
      return;
    }

    // When swipe controls are disabled -> classic click behavior
    if (!isSwipeEnabled) {
      haptics.tap();
      onTileClick(r, c);
      return;
    }

    // Tap Handling when Swipe is enabled:
    // 1. Tapping on already selected tile deselects it
    if (prevSelected && prevSelected.row === r && prevSelected.col === c) {
      haptics.tap();
      onTileClick(r, c);
      return;
    }

    // 2. Tapping on a DIFFERENT adjacent tile executes classic 2-tap swap
    if (
      prevSelected &&
      (prevSelected.row !== r || prevSelected.col !== c) &&
      Math.abs(prevSelected.row - r) + Math.abs(prevSelected.col - c) === 1
    ) {
      haptics.tap();
      if (onTileSwipe) {
        onTileSwipe(prevSelected.row, prevSelected.col, r, c);
      } else {
        onTileClick(r, c);
      }
      return;
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = pointerStateRef.current;
    if (state?.targetEl) {
      try {
        state.targetEl.releasePointerCapture(e.pointerId);
      } catch {}
    }
    pointerStateRef.current = null;
  };

  // Keyboard accessibility and fallback click
  const handleTileButtonClick = (r: number, c: number) => {
    if (isAnimating || isReady || isRolling) return;
    // Prevent synthetic ghost click from firing right after touch or swipe event
    if (Date.now() - lastTouchTimeRef.current < 450 || Date.now() - lastSwipeTimeRef.current < 450) {
      return;
    }
    haptics.tap();
    onTileClick(r, c);
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full mx-auto">
      {/* Sky Blue Outer Border Frame Matching Screenshot */}
      <div
        id="words-with-friends-board-container"
        className="w-full relative p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_16px_40px_rgba(2,132,199,0.45),inset_0_2px_4px_rgba(255,255,255,0.7)]"
      >
        {/* Subtle Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-white/70 shadow-inner" />

        {/* Board Playing Grid Canvas */}
        <div
          ref={boardRef}
          id="game-board-grid"
          className={`relative bg-[#071330] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-[#0F2864] shadow-[inset_0_3px_10px_rgba(0,0,0,0.8)] ${
            activePowerUp === 'hammer' ? 'cursor-crosshair' : 'cursor-pointer'
          }`}
          style={{
            aspectRatio: '1/1',
            width: '100%',
          }}
        >
          {/* Small Alerts Directly On The Word Itself (Lasts 3s) -- covers both
              duplicate/plural re-forms and US/UK region-spelling mismatches;
              alert.message/alert.icon carry the specific text/emoji to show. */}
          {wordAlerts &&
            wordAlerts.map((alert) => {
              const topPct = (alert.row + 0.5) * 12.5;
              const leftPct = (alert.col + 0.5) * 12.5;
              return (
                <div
                  key={alert.id}
                  className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-word-alert"
                  style={{
                    top: `${topPct}%`,
                    left: `${leftPct}%`,
                  }}
                >
                  <div className="relative bg-amber-950/80 backdrop-blur-md border-2 border-amber-300 text-amber-200 px-3 py-1 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.7),0_0_15px_rgba(251,191,36,0.6)] flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-xs">{alert.icon || '⚠️'}</span>
                    <span className="font-black text-[11px] sm:text-xs tracking-wide">
                      {alert.message}
                    </span>
                    {/* Speech Pointer Arrow */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-950/80 border-r-2 border-b-2 border-amber-300 rotate-45" />
                  </div>
                </div>
              );
            })}
          {/* Dynamic Grid Slots with 3D tactile block tiles optimized for board size */}
          {(() => {
            const rowsCount = board.length || 8;
            const colsCount = board[0]?.length || 8;

            // Dynamically scale letter sizes based on board grid columns and screen width
            const letterSizeClass =
              colsCount <= 6
                ? 'text-[clamp(1.4rem,5.5vw,2.6rem)]'
                : colsCount === 7
                ? 'text-[clamp(1.2rem,4.8vw,2.25rem)]'
                : colsCount === 8
                ? 'text-[clamp(1.05rem,4.3vw,1.95rem)] sm:text-[clamp(1.3rem,4vw,2.25rem)]'
                : 'text-[clamp(0.9rem,3.6vw,1.7rem)]';

            const iconSizeClass =
              colsCount <= 6
                ? 'w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10'
                : colsCount === 7
                ? 'w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9'
                : 'w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8';

            return (
              <div
                className="grid gap-1 sm:gap-1.5 md:gap-2 h-full w-full"
                style={{
                  gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rowsCount}, minmax(0, 1fr))`,
                }}
              >
                {board.map((row, r) =>
                  row.map((tile, c) => {
                    const isSelected = selectedTile?.row === r && selectedTile?.col === c;
                    const isClueFrom = clue?.from.row === r && clue?.from.col === c;
                    const isClueTo = clue?.to.row === r && clue?.to.col === c;
                    const isClueTarget = isClueFrom || isClueTo;
                    const isAdjacentToSelected =
                      !isSelected &&
                      selectedTile !== null &&
                      activePowerUp === null &&
                      Math.abs(selectedTile.row - r) + Math.abs(selectedTile.col - c) === 1;

                    // Check if this tile is currently actively sliding/swapping
                    const isSwappingThisTile =
                      swappingTiles !== null &&
                      swappingTiles !== undefined &&
                      ((swappingTiles.r1 === r && swappingTiles.c1 === c) ||
                        (swappingTiles.r2 === r && swappingTiles.c2 === c));

                    let swapDx = 0;
                    let swapDy = 0;
                    if (isSwappingThisTile && swappingTiles) {
                      if (swappingTiles.r1 === r && swappingTiles.c1 === c) {
                        swapDx = swappingTiles.c2 - swappingTiles.c1;
                        swapDy = swappingTiles.r2 - swappingTiles.r1;
                      } else {
                        swapDx = swappingTiles.c1 - swappingTiles.c2;
                        swapDy = swappingTiles.r1 - swappingTiles.r2;
                      }
                    }

                    // 3D Tile Base Appearance: Crisp White/Pearl Block with 3D bottom extrusion
                    let tileBg =
                      'bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#E2E8F0] border-t-2 border-l border-white border-r border-[#CBD5E1] border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#94A3B8] text-[#0F172A] shadow-[0_3px_5px_-1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.15)]';
                    let letterColor = 'text-[#0F172A] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]';
                    let glowRing = '';

                    // Special 3D Tile Types
                    if (tile.special === 'bomb') {
                      tileBg =
                        'bg-gradient-to-b from-[#FF6E40] via-[#FF5722] to-[#E64A19] border-t-2 border-l border-orange-200 border-r border-red-800 border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#8B1A04] text-white shadow-[0_4px_10px_rgba(230,74,25,0.45)]';
                      letterColor = 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]';
                    } else if (tile.special === 'card') {
                      tileBg =
                        'bg-gradient-to-b from-[#AB47BC] via-[#8E24AA] to-[#6A1B9A] border-t-2 border-l border-purple-200 border-r border-purple-900 border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#3B0764] text-white shadow-[0_4px_10px_rgba(142,36,170,0.45)]';
                      letterColor = 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]';
                    } else if (tile.special === 'highlighted') {
                      tileBg =
                        'bg-gradient-to-b from-[#42A5F5] via-[#1E88E5] to-[#1565C0] border-t-2 border-l border-blue-200 border-r border-blue-900 border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#0D47A1] text-white shadow-[0_4px_10px_rgba(30,136,229,0.45)]';
                      letterColor = 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]';
                    } else if (tile.special === 'shining') {
                      tileBg =
                        'bg-gradient-to-b from-[#FFE082] via-[#FFCA28] to-[#FFA000] border-t-2 border-l border-yellow-100 border-r border-amber-700 border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#B45309] text-[#2C1810] shadow-[0_4px_10px_rgba(255,160,0,0.45)]';
                      letterColor = 'text-[#2C1810] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]';
                    }

                    // Word Match 3D Highlight (Green 3D Glow)
                    if (tile.isWordHighlighted) {
                      tileBg =
                        'bg-gradient-to-b from-[#6EE7B7] via-[#10B981] to-[#047857] border-t-2 border-l border-emerald-100 border-r border-emerald-900 border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#064E3B] text-white shadow-[0_0_22px_rgba(16,185,129,0.95),0_4px_8px_rgba(0,0,0,0.3)] ring-2 sm:ring-3 ring-emerald-300 scale-105 z-20';
                      letterColor = 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]';
                    }

                    // 1-Move Opportunity Highlight (Very soft, non-vibrant pastel light yellow for 0.25s)
                    if (tile.isOneMoveHighlighted) {
                      tileBg =
                        'bg-gradient-to-b from-[#FFFDF5] via-[#FEFDF0] to-[#FEFCE8] border-t-2 border-l border-yellow-100 border-r border-yellow-200 border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#CA8A04]/40 text-[#452A08] shadow-[0_0_14px_rgba(254,249,195,0.7)] ring-2 sm:ring-3 ring-yellow-200/70 scale-[1.03] z-25';
                      letterColor = 'text-[#452A08] font-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]';
                    }

                    // Electrified State: 3D High-voltage cyan/blue plasma glow
                    if (tile.isElectrified) {
                      tileBg =
                        'bg-gradient-to-b from-cyan-200 via-sky-400 to-blue-600 border-t-2 border-l-2 border-white border-r border-blue-900 border-b-[3px] sm:border-b-[4px] md:border-b-[5px] border-b-[#082F49] text-white shadow-[0_0_30px_rgba(34,211,238,1),0_4px_8px_rgba(0,0,0,0.4)] ring-3 sm:ring-4 ring-cyan-300 scale-110 z-30 animate-electric-shock';
                      letterColor = 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]';
                    }

                    // Selected 3D Tile: Elevates and Pops Out with 3D shadow
                    if (isSelected && !isSwappingThisTile) {
                      glowRing =
                        activePowerUp === 'swap'
                          ? 'ring-3 sm:ring-4 ring-cyan-400 ring-offset-2 ring-offset-[#071330] shadow-[0_12px_24px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.9)] z-30 -translate-y-1 brightness-110 animate-selected-pop'
                          : 'ring-3 sm:ring-4 ring-amber-400 ring-offset-2 ring-offset-[#071330] shadow-[0_14px_28px_rgba(0,0,0,0.6),0_0_26px_rgba(245,158,11,0.95)] z-30 -translate-y-1 brightness-115 animate-selected-pop';
                    } else if (activePowerUp === 'replace') {
                      glowRing =
                        'hover:ring-3 hover:ring-purple-400 hover:scale-105 z-10 cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.4)]';
                    } else if (isAdjacentToSelected && !isSwappingThisTile) {
                      glowRing =
                        'ring-2 ring-cyan-400/80 ring-offset-1 ring-offset-[#071330] shadow-[0_0_14px_rgba(56,189,248,0.45)] hover:scale-105 z-10 cursor-pointer';
                    } else if (isClueTarget) {
                      // Radiant clue target indicator with blinking glow ring
                      glowRing =
                        'ring-4 ring-emerald-400 ring-offset-2 ring-offset-[#071330] shadow-[0_0_28px_rgba(52,211,153,1)] animate-bounce animate-pulse z-20 brightness-110';
                    } else if (tile.isMerged) {
                      glowRing =
                        'ring-3 sm:ring-4 ring-cyan-300 ring-offset-2 ring-offset-[#071330] shadow-[0_0_22px_rgba(56,189,248,0.95)] z-20 brightness-110';
                    }

                    const dropAnimationClass = tile.isFalling
                      ? 'animate-tile-drop'
                      : tile.isMerged
                      ? 'animate-merge-pulse'
                      : '';

                    const popAnimationClass = tile.isPopping ? 'animate-letter-pop z-30 scale-125' : '';
                    const knockOffAnimationClass = tile.isKnockedOff ? 'animate-electric-knockoff z-40' : '';
                    const vaporizeAnimationClass = tile.isVaporizing ? 'animate-electric-vaporize z-40' : '';
                    const swapAnimationClass = isSwappingThisTile ? 'animate-tile-swap z-45' : '';

                    const knockAngle = tile.knockOffAngle || ((r * 7 + c * 13) % 70) - 35;
                    const knockX = Math.sin((knockAngle * Math.PI) / 180) * 35;
                    const knockY = -Math.abs(Math.cos((knockAngle * Math.PI) / 180) * 45) - 15;

                    // Running light border effects on edges according to special type & yellow tiles
                    let edgeLight: React.ReactNode = null;
                    if (tile.isElectrified) {
                      edgeLight = <RunningEdgeLight color1="#22d3ee" color2="#ffffff" fast={true} intensity="high" />;
                    } else if (tile.special === 'bomb') {
                      edgeLight = <RunningEdgeLight color1="#f97316" color2="#fef08a" fast={false} intensity="normal" />;
                    } else if (tile.special === 'card') {
                      edgeLight = <RunningEdgeLight color1="#c084fc" color2="#67e8f9" fast={false} intensity="normal" />;
                    } else if (tile.special === 'highlighted') {
                      edgeLight = <RunningEdgeLight color1="#38bdf8" color2="#ffffff" fast={false} intensity="normal" />;
                    } else if (tile.special === 'shining') {
                      // Yellow / Golden Tile running edge light
                      edgeLight = <RunningEdgeLight color1="#f59e0b" color2="#fef08a" fast={false} intensity="high" />;
                    } else if (tile.isMerged) {
                      edgeLight = <RunningEdgeLight color1="#38bdf8" color2="#ffffff" fast={false} intensity="normal" />;
                    }

                    const breakingBlockAnimationClass = tile.isBreakingBlock ? 'animate-block-break z-30' : '';
                    const flipAnimationClass = tile.isFlipping ? 'animate-tile-flip z-35' : '';
                    const rollAnimationClass = isRolling ? 'animate-tile-roll z-10' : '';
                    const rollDelay = isRolling ? `${(r * 0.035 + c * 0.015).toFixed(3)}s` : undefined;

                    return (
                      <div
                        key={tile.id || `${r}-${c}`}
                        className={`relative w-full h-full bg-[#050D24] rounded-[7px] sm:rounded-xl p-[1px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] ${
                          isSwappingThisTile ? 'z-40' : 'z-0'
                        }`}
                      >
                        <button
                          id={`tile-${r}-${c}`}
                          onClick={() => handleTileButtonClick(r, c)}
                          onPointerDown={(e) => handlePointerDown(r, c, e)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={(e) => handlePointerUp(r, c, e)}
                          onPointerCancel={handlePointerCancel}
                          disabled={isAnimating || isReady || isRolling}
                          style={{
                            touchAction: 'none',
                            ['--knock-rot' as any]: `${knockAngle}deg`,
                            ['--knock-x' as any]: `${knockX}px`,
                            ['--knock-y' as any]: `${knockY}px`,
                            ['--swap-x' as any]: isSwappingThisTile ? `calc(${swapDx} * (100% + var(--grid-gap, 4px)))` : undefined,
                            ['--swap-y' as any]: isSwappingThisTile ? `calc(${swapDy} * (100% + var(--grid-gap, 4px)))` : undefined,
                            animationDelay: rollDelay,
                          }}
                          className={`relative w-full h-full flex items-center justify-center rounded-[6px] sm:rounded-lg font-bold transition-all active:translate-y-[2px] sm:active:translate-y-[3px] active:border-b-[2px] active:shadow-xs duration-150 ease-out select-none overflow-hidden ${tileBg} ${glowRing} ${swapAnimationClass} ${flipAnimationClass} ${rollAnimationClass} ${dropAnimationClass} ${popAnimationClass} ${knockOffAnimationClass} ${vaporizeAnimationClass} ${breakingBlockAnimationClass} ${
                            tile.isBurning ? 'animate-tile-heat-glow z-30 !bg-gradient-to-b !from-red-600 !via-[#990000] !to-[#4a0000] !border-red-500 !border-b-[#300000] !text-white' : ''
                          } ${
                            tile.isMatched && !tile.isKnockedOff && !tile.isVaporizing && !tile.isBreakingBlock ? 'opacity-0 scale-50 transition-all duration-300 pointer-events-none' : ''
                          }`}
                        >
                          {/* Fiery Blood-Red Flash Overlay when Burning */}
                          {tile.isBurning && (
                            <div className="absolute inset-0 bg-gradient-to-b from-red-600/90 via-[#990000]/90 to-[#4a0000]/95 pointer-events-none z-20 animate-pulse" />
                          )}

                          {/* 3D Glossy Specular Top Sheen */}
                          <div className="absolute inset-x-1 top-0.5 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-t-sm sm:rounded-t-md pointer-events-none" />

                          {/* Running Edge Light along the tile borders */}
                          {!isReady && edgeLight}

                          {/* Breaking Block Crack Lines and Shatter Shards */}
                          {tile.isBreakingBlock && (
                            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-visible">
                              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                                <path
                                  d="M 50 50 L 10 15 M 50 50 L 90 20 M 50 50 L 15 85 M 50 50 L 85 85 M 50 50 L 50 5 M 50 50 L 48 95"
                                  stroke="#ffffff"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  fill="none"
                                  className="filter drop-shadow-[0_0_8px_rgba(251,191,36,1)]"
                                />
                                <path
                                  d="M 50 50 L 30 10 M 50 50 L 70 90 M 50 50 L 10 50 M 50 50 L 90 50"
                                  stroke="#f59e0b"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  fill="none"
                                />
                              </svg>
                              {/* Flying Rock Shards */}
                              <div className="absolute w-2.5 h-2.5 rounded-xs bg-amber-400 border border-white animate-shard-1 shadow-xs" />
                              <div className="absolute w-2.5 h-2.5 rounded-xs bg-yellow-300 border border-white animate-shard-2 shadow-xs" />
                              <div className="absolute w-2.5 h-2.5 rounded-xs bg-orange-400 border border-white animate-shard-3 shadow-xs" />
                              <div className="absolute w-2.5 h-2.5 rounded-xs bg-amber-200 border border-white animate-shard-4 shadow-xs" />
                            </div>
                          )}

                          {/* Floating Pop-Out Ready-to-Swap / Special Action Badge */}
                          {!isReady && isSelected && !activePowerUp && !tile.isMatched && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 text-white text-[9px] font-black uppercase tracking-wider shadow-lg shadow-cyan-500/60 border border-white flex items-center gap-0.5 whitespace-nowrap z-40 animate-pulse">
                              {tile.special === 'bomb' ? (
                                <><span>💣</span><span>BOMB</span></>
                              ) : tile.special === 'card' ? (
                                <><span>⚡</span><span>CARD</span></>
                              ) : tile.special === 'shining' ? (
                                <><span>🌟</span><span>STAR</span></>
                              ) : tile.special === 'highlighted' ? (
                                <><span>⚡</span><span>LASER</span></>
                              ) : tile.isElectrified ? (
                                <><span>⚡</span><span>VOLT</span></>
                              ) : (
                                <>
                                  <ArrowLeftRight className="w-2.5 h-2.5" />
                                  <span>SWAP</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Ready State Mystery Tile Face (Blank 3D block face with subtle pattern, hiding letters before GO!) */}
                          {isReady ? (
                            <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-300/40 border border-slate-400/30 shadow-inner" />
                            </div>
                          ) : tile.special === 'bomb' ? (
                            <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                              <Bomb className={`${iconSizeClass} text-yellow-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] animate-pulse`} />
                            </div>
                          ) : tile.special === 'card' ? (
                            <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                              <Zap className={`${iconSizeClass} text-purple-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] animate-pulse`} />
                            </div>
                          ) : (
                            <span className={`board-tile-font font-black ${letterSizeClass} leading-none tracking-tight relative z-30 flex items-center justify-center select-none ${letterColor} ${tile.isBurning ? 'animate-letter-heat-glow !text-white !drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]' : ''}`}>
                              {tile.letter}
                            </span>
                          )}

                          {/* Electrocuted High Voltage Spark Particles */}
                          {!isReady && tile.isElectrified && !tile.isBurning && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                              <div className="absolute inset-0 rounded-lg animate-electric-pulse border-2 border-cyan-200" />
                              <span className="absolute -top-1 -right-1 text-xs text-yellow-300 animate-ping">⚡</span>
                              <span className="absolute -bottom-1 -left-1 text-xs text-cyan-200 animate-ping">✦</span>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}

          {/* Dynamic Visual Effects Overlay (Explosions, Lasers, Lightning Electricity Flows, Giant Hammer) */}
          {explosions.map((fx) => {
            if (fx.type === 'hammer') {
              const topPercent = Math.max(0, fx.row - 1) * 12.5;
              const leftPercent = Math.max(0, fx.col - 1) * 12.5;
              const heightPercent = (Math.min(7, fx.row + 1) - Math.max(0, fx.row - 1) + 1) * 12.5;
              const widthPercent = (Math.min(7, fx.col + 1) - Math.max(0, fx.col - 1) + 1) * 12.5;
              const targetX = (fx.col + 0.5) * 12.5;
              const targetY = (fx.row + 0.5) * 12.5;

              return (
                <div key={fx.id} className="absolute inset-0 pointer-events-none z-40 overflow-visible">
                  {/* 3x3 Impact Destruction Area Boundary */}
                  <div
                    className="absolute rounded-2xl border-4 border-amber-400 bg-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.9),inset_0_0_25px_rgba(251,191,36,0.6)] animate-pulse"
                    style={{
                      top: `${topPercent}%`,
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                  >
                    {/* 3x3 Corner Crosshairs */}
                    <div className="absolute -top-2 -left-2 w-5 h-5 border-t-4 border-l-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 border-t-4 border-r-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                    <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-4 border-l-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-4 border-r-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />

                    {/* Fissure Crack Lines inside 3x3 Zone */}
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-85">
                      <path
                        d="M 50 50 L 15 15 M 50 50 L 85 15 M 50 50 L 15 85 M 50 50 L 85 85 M 50 50 L 50 5 M 50 50 L 50 95 M 50 50 L 5 50 M 50 50 L 95 50"
                        stroke="#fef08a"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        className="filter drop-shadow-[0_0_6px_rgba(251,191,36,1)]"
                      />
                      <path
                        d="M 50 50 L 30 20 M 50 50 L 70 20 M 50 50 L 25 75 M 50 50 L 75 75"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </div>

                  {/* Hammer Impact Shockwave Ring */}
                  <div
                    className="absolute rounded-full border-4 border-amber-300 bg-yellow-400/30 animate-hammer-shockwave shadow-[0_0_50px_rgba(251,191,36,1)] pointer-events-none"
                    style={{
                      left: `${targetX}%`,
                      top: `${targetY}%`,
                      width: '140px',
                      height: '140px',
                    }}
                  />

                  {/* Impact Sparks & Particle Burst */}
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                    style={{
                      left: `${targetX}%`,
                      top: `${targetY}%`,
                    }}
                  >
                    <span className="absolute -top-8 -left-8 text-2xl animate-shard-1">💥</span>
                    <span className="absolute -top-8 right-8 text-2xl animate-shard-2">⚡</span>
                    <span className="absolute bottom-8 -left-8 text-2xl animate-shard-3">🪨</span>
                    <span className="absolute bottom-8 right-8 text-2xl animate-shard-4">✦</span>
                    <span className="absolute -top-12 text-xl text-yellow-200 animate-ping">✨</span>
                  </div>

                  {/* GIANT HAMMER - Striking down violently and smoothly on the target center block */}
                  <div
                    className="absolute z-50 animate-giant-hammer pointer-events-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
                    style={{
                      left: `${targetX}%`,
                      top: `${targetY}%`,
                      width: '130px',
                      height: '130px',
                      marginLeft: '-65px',
                      marginTop: '-95px',
                    }}
                  >
                    <HammerIcon className="w-full h-full" showBurst={true} />
                  </div>

                  {/* Impact Smash Badge */}
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                    style={{
                      left: `${targetX}%`,
                      top: `${Math.max(8, targetY - 14)}%`,
                    }}
                  >
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 text-white font-black text-xs sm:text-sm rounded-full border-2 border-white shadow-[0_0_30px_rgba(217,70,239,0.9)] flex items-center gap-2 animate-bounce">
                      <span className="text-base">🔨</span>
                      <span className="tracking-wider uppercase font-black drop-shadow">3×3 HAMMER SMASH!</span>
                    </div>
                  </div>
                </div>
              );
            }

            if (fx.type === 'bomb') {
              const topPercent = Math.max(0, fx.row - 1) * 12.5;
              const leftPercent = Math.max(0, fx.col - 1) * 12.5;
              const heightPercent = (Math.min(7, fx.row + 1) - Math.max(0, fx.row - 1) + 1) * 12.5;
              const widthPercent = (Math.min(7, fx.col + 1) - Math.max(0, fx.col - 1) + 1) * 12.5;

              return (
                <div
                  key={fx.id}
                  className="absolute pointer-events-none rounded-xl sm:rounded-2xl z-30 transition-all duration-300 flex items-center justify-center border-4 border-amber-400 bg-orange-500/25 shadow-[0_0_35px_rgba(251,146,60,0.9),inset_0_0_20px_rgba(245,158,11,0.5)] animate-pulse"
                  style={{
                    top: `${topPercent}%`,
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                >
                  {/* High Visibility 3x3 Box Corner Crosshairs */}
                  <div className="absolute -top-1.5 -left-1.5 w-4 sm:w-5 h-4 sm:h-5 border-t-4 border-l-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                  <div className="absolute -top-1.5 -right-1.5 w-4 sm:w-5 h-4 sm:h-5 border-t-4 border-r-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-4 sm:w-5 h-4 sm:h-5 border-b-4 border-l-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-4 sm:w-5 h-4 sm:h-5 border-b-4 border-r-4 border-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />

                  {/* Explosive Badge In Center */}
                  <div className="relative px-3 py-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-full border-2 border-white shadow-2xl flex items-center gap-1.5 animate-bounce">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-black text-white tracking-wider uppercase drop-shadow">
                      3×3 BLAST ZONE
                    </span>
                  </div>
                </div>
              );
            }

            if (fx.type === 'beam_row') {
              const topPercent = fx.row * 12.5;
              return (
                <div
                  key={fx.id}
                  className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-400"
                  style={{
                    top: `${topPercent}%`,
                    height: '12.5%',
                  }}
                >
                  <div className="w-full h-full bg-cyan-400/90 rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,1)] border-y-2 border-white animate-pulse">
                    <Zap className="w-8 h-8 text-white animate-bounce" />
                  </div>
                </div>
              );
            }

            if (fx.type === 'beam_col') {
              const leftPercent = fx.col * 12.5;
              return (
                <div
                  key={fx.id}
                  className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all duration-400"
                  style={{
                    left: `${leftPercent}%`,
                    width: '12.5%',
                  }}
                >
                  <div className="w-full h-full bg-cyan-400/90 rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,1)] border-x-2 border-white animate-pulse">
                    <Zap className="w-8 h-8 text-white animate-bounce" />
                  </div>
                </div>
              );
            }

            // High Voltage Electricity Flowing & Letter Knock-Off Overlay
            if (fx.type === 'card_wipe') {
              const srcX = ((fx.sourceCol ?? fx.col) + 0.5) * 12.5;
              const srcY = ((fx.sourceRow ?? fx.row) + 0.5) * 12.5;
              const targets = fx.targetCoords || [{ row: fx.row, col: fx.col }];

              return (
                <div key={fx.id} className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                  {/* High Voltage Lightning SVG Canvas Connecting Source to All Knock-off Letter Targets */}
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full animate-lightning">
                    {targets.map((tgt, idx) => {
                      const dstX = (tgt.col + 0.5) * 12.5;
                      const dstY = (tgt.row + 0.5) * 12.5;
                      const boltPath1 = generateLightningBolt(srcX, srcY, dstX, dstY, 7, 4);
                      const boltPath2 = generateLightningBolt(srcX, srcY, dstX, dstY, 5, 2.5);

                      return (
                        <g key={`bolt-${idx}`}>
                          {/* Outer Cyan Plasma Glow — no blur filter: this
                              <g> repeats once per target tile (every tile
                              sharing a letter), so N targets meant N
                              separate blur layers to composite at once. The
                              3 stacked stroke widths/colors below already
                              read as a glowing bolt without it. */}
                          <path
                            d={boltPath1}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            opacity="0.85"
                          />
                          {/* Inner Electric Blue Arc */}
                          <path
                            d={boltPath2}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            opacity="0.95"
                          />
                          {/* Blinding White-Hot Core */}
                          <path
                            d={boltPath1}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1"
                            strokeLinecap="round"
                            opacity="1"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Electricity Origin Shockwave Orb */}
                  <div
                    className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${srcX}%`,
                      top: `${srcY}%`,
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 border-2 border-white shadow-[0_0_40px_rgba(34,211,238,1)] flex items-center justify-center animate-ping opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-white drop-shadow-[0_0_12px_#38bdf8] animate-bounce" />
                    </div>
                  </div>

                  {/* Target Tiles Voltage Burst Rings */}
                  {targets.map((tgt, idx) => {
                    const tX = (tgt.col + 0.5) * 12.5;
                    const tY = (tgt.row + 0.5) * 12.5;
                    return (
                      <div
                        key={`target-zap-${idx}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                          left: `${tX}%`,
                          top: `${tY}%`,
                        }}
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-cyan-300 bg-cyan-400/30 animate-electric-pulse shadow-[0_0_25px_rgba(34,211,238,1)]" />
                        <span className="absolute -top-3 -right-3 text-lg text-yellow-300 animate-ping">⚡</span>
                      </div>
                    );
                  })}

                  {/* Electric Announcement Badge */}
                  <div className="absolute top-2 inset-x-0 flex justify-center">
                    <div className="px-4 py-1.5 bg-gradient-to-r from-blue-900 via-cyan-700 to-blue-900 rounded-full border-2 border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.9)] flex items-center gap-2 animate-bounce">
                      <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                      <span className="text-white font-black text-xs sm:text-sm tracking-wider drop-shadow">
                        ELECTRICITY SURGE: KNOCKING OFF '{fx.letter}' TILES!
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (fx.type === 'board_wipe') {
              return (
                <div
                  key={fx.id}
                  className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center overflow-hidden"
                >
                  <FireWipeoutAnnouncement />

                  {/* Burning Fire in Corners and Middles of the Board */}
                  {/* Top-Left Corner */}
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-50 scale-90 sm:scale-110 pointer-events-none filter drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse">
                    <FireFlameGraphic size="md" />
                  </div>
                  {/* Top-Middle */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 sm:top-2 z-50 scale-90 sm:scale-110 pointer-events-none filter drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse">
                    <FireFlameGraphic size="md" />
                  </div>
                  {/* Top-Right Corner */}
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-50 scale-90 sm:scale-110 pointer-events-none filter drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse">
                    <FireFlameGraphic size="md" />
                  </div>
                  {/* Bottom-Left Corner */}
                  <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 z-50 scale-90 sm:scale-110 pointer-events-none filter drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse">
                    <FireFlameGraphic size="md" />
                  </div>
                  {/* Bottom-Middle */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 sm:bottom-2 z-50 scale-90 sm:scale-110 pointer-events-none filter drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse">
                    <FireFlameGraphic size="md" />
                  </div>
                  {/* Bottom-Right Corner */}
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-50 scale-90 sm:scale-110 pointer-events-none filter drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse">
                    <FireFlameGraphic size="md" />
                  </div>
                </div>
              );
            }

            if (fx.type === 'shining' || fx.type === 'board_shine') {
              return (
                <div
                  key={fx.id}
                  className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-xl sm:rounded-2xl"
                >
                  {/* Shining Glow Light Beam Running Across The Entire Board */}
                  <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent -skew-x-25 animate-board-shine-sweep filter drop-shadow-[0_0_25px_rgba(255,255,255,1)]" />
                  <div className="absolute inset-0 bg-radial from-amber-300/20 via-cyan-400/10 to-transparent pointer-events-none animate-pulse" />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Thinking Robot Clue Avatar at lower right corner of the board after 1 minute of inactivity */}
        {robotWords && robotWords.length > 0 && onDismissRobot && (
          <ThinkingRobot
            possibleWords={robotWords}
            onDismiss={onDismissRobot}
          />
        )}
      </div>
    </div>
  );
};

/**
 * The board (8x8+ tiles, each with its own conditional gradients/shadows/
 * animations) is by far the most expensive thing App.tsx renders. App.tsx
 * also has a `setInterval(..., 1000)` timer-mode countdown that updates
 * state once per second -- and GameBoard doesn't even use that value, but
 * without this memo it was re-rendering (and repainting) in full every
 * single second anyway, just because it's a sibling of whatever component
 * does need the tick. That's the per-second "flicker" reported on-device.
 *
 * Custom comparator instead of plain React.memo: only skip the re-render
 * when none of the props GameBoard actually reads for rendering/game logic
 * have changed -- this deliberately ignores identity changes on the
 * onTileClick/onTileSelect/onTileSwipe/onDismissRobot/onDismissTutorialTip
 * callback props (those aren't memoized with useCallback in App.tsx, so
 * they get a new reference on every render regardless; comparing them
 * would defeat the memo entirely and bring back the every-second
 * re-render).
 *
 * RESTORED: this memo wrapper was accidentally deleted by a later "chore:
 * cleanup and refactor" commit (9d09bb9) that renamed GameBoardImpl
 * directly to the exported GameBoard, dropping this comparator and the
 * React.memo() call along with it -- silently bringing back the
 * once-a-second full-board re-render/flicker in timer-mode (custom game)
 * rounds, since that's the only game mode that runs the per-second
 * countdown tick at all.
 */
function gameBoardPropsAreEqual(prev: GameBoardProps, next: GameBoardProps): boolean {
  return (
    prev.board === next.board &&
    prev.selectedTile === next.selectedTile &&
    prev.isSwipeEnabled === next.isSwipeEnabled &&
    prev.swappingTiles === next.swappingTiles &&
    prev.clue === next.clue &&
    prev.activePowerUp === next.activePowerUp &&
    prev.pendingReplaceLetter === next.pendingReplaceLetter &&
    prev.explosions === next.explosions &&
    prev.isAnimating === next.isAnimating &&
    prev.banner === next.banner &&
    prev.wordAlerts === next.wordAlerts &&
    prev.robotWords === next.robotWords &&
    prev.isReady === next.isReady &&
    prev.isRolling === next.isRolling &&
    prev.tutorialTip === next.tutorialTip
  );
}

export const GameBoard = React.memo(GameBoardImpl, gameBoardPropsAreEqual);
