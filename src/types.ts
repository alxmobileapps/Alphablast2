export type SpecialTileType = 'none' | 'bomb' | 'card' | 'highlighted' | 'shining';

export type WordDirection =
  | 'horizontal'
  | 'backwards-horizontal'
  | 'vertical'
  | 'upwards-vertical'
  | 'diagonal'
  | 'diagonal-down-right'
  | 'diagonal-down-left'
  | 'diagonal-up-right'
  | 'diagonal-up-left';

export interface Tile {
  id: string;
  row: number;
  col: number;
  letter: string;
  special: SpecialTileType;
  isMatched?: boolean;
  isWordHighlighted?: boolean;
  isOneMoveHighlighted?: boolean;
  isPopping?: boolean;
  isElectrified?: boolean;
  isKnockedOff?: boolean;
  isVaporizing?: boolean;
  knockOffAngle?: number;
  matchedWordText?: string;
  isClearing?: boolean;
  isFalling?: boolean;
  isMerged?: boolean;
  isBreakingBlock?: boolean;
  isBurning?: boolean;
  isFlipping?: boolean;
  highlightDirection?: WordDirection; // For perpendicular beam calculation
}

export type CustomGameMode = 'target' | 'timer';

export interface Category {
  id: number;
  name: string;
  targetCount: number;
  icon: string;
  words: string[];
  color: string;
  isCustom?: boolean;
  creatorName?: string;
  // Who may edit this custom category. creatorName is just a display name
  // (anyone can type anyone's name), so it can't be used for that.
  // creatorKeyHash: SHA-256 of the publishing device's creator secret (see
  // utils/creatorIdentity.ts) -- the primary ownership check.
  // creatorUid: Firebase Anonymous Auth uid, best-effort only (it's null
  // whenever anonymous sign-in isn't available), kept as a secondary check.
  creatorKeyHash?: string;
  creatorUid?: string;
  // Optional password set by the creator. Only a salted SHA-256 of it is
  // stored (see hashCustomGamePassword); no password = anyone can play.
  passwordHash?: string;
  createdAt?: number;
  expiresAt?: number;
  firestoreDocId?: string;
  plays?: number;
  gameMode?: CustomGameMode; // 'target' (word goal) or 'timer' (2-minute rush)
  timerSeconds?: number; // e.g. 120 (2 mins) or user-configured
}

export interface WordMatch {
  word: string;
  tiles: { row: number; col: number; id: string; letter: string; special: SpecialTileType }[];
  direction: WordDirection;
  isCategory: boolean;
  specialGenerated?: SpecialTileType | 'board_clear';
  specialLocation?: { row: number; col: number };
}

export interface WordHistoryItem {
  id: string;
  word: string;
  isCategory: boolean;
  length: number;
  points?: number;
  baseLetterPoints?: number;
  timestamp: number;
  specialCreated?: 'bomb' | 'card' | 'board_clear' | 'highlighted' | 'shining';
}

export type PowerUpType = 'hammer' | 'swap' | 'rearrange' | 'clue' | 'replace';

export interface PowerUpInventory {
  hammer: number;
  swap: number;
  rearrange: number;
  clue: number;
  replace: number;
}

export interface ClueInfo {
  from: { row: number; col: number };
  to: { row: number; col: number };
  reason: string;
  type: 'identical' | 'word';
}

export interface ExplosionEffect {
  id: string;
  row: number;
  col: number;
  type: 'bomb' | 'shining' | 'beam_row' | 'beam_col' | 'card_wipe' | 'board_wipe' | 'hammer' | 'board_shine';
  letter?: string;
  sourceRow?: number;
  sourceCol?: number;
  targetCoords?: { row: number; col: number }[];
}

export interface BoardBanner {
  id: string;
  text: string;
  subtext?: string;
  icon?: string;
  type: 'category' | 'word' | 'special' | 'fusion' | 'moves' | 'cascade' | 'clear' | 'info';
}

export interface WordAlert {
  id: string;
  word: string;
  matchedForm?: string;
  row: number; // centroid row percentage/coordinate
  col: number; // centroid col percentage/coordinate
  message: string;
  icon?: string; // defaults to the warning emoji when omitted (see GameBoard)
}

