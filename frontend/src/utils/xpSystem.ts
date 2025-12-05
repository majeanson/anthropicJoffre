/**
 * XP and Level System (Frontend)
 *
 * Utility functions for displaying XP and level information.
 * MUST match backend calculations in backend/src/game/quests.ts
 *
 * Formula: 75 * (1.25 ^ (level - 1))
 * - Level 1→2: 75 XP (1-2 games)
 * - Level 5: ~117 XP
 * - Level 10: ~186 XP
 * - Level 20: ~423 XP
 * - Level 30: ~963 XP
 *
 * For i18n: See constants/xpStrings.ts for all user-facing strings
 */

import { XP_STRINGS } from '../constants/xpStrings';

// Level calculation constants (MUST match backend/src/game/quests.ts)
const BASE_XP = 75;
const LEVEL_MULTIPLIER = 1.25;

/**
 * Calculate XP required for a specific level (not cumulative)
 * Matches backend calculateXPForLevel()
 */
export function getXpForLevel(level: number): number {
  // Validate input
  const safeLevel = Math.max(1, Math.min(100, Math.floor(level) || 1));
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, safeLevel - 1));
}

/**
 * Calculate total XP required to reach a target level (cumulative)
 * Matches backend calculateTotalXPForLevel()
 */
export function getTotalXpForLevel(targetLevel: number): number {
  // Validate input
  const safeTarget = Math.max(1, Math.min(100, Math.floor(targetLevel) || 1));
  let totalXP = 0;
  for (let level = 1; level < safeTarget; level++) {
    totalXP += getXpForLevel(level);
  }
  return totalXP;
}

/**
 * Calculate level from total XP
 * Matches backend calculateLevelFromXP()
 */
export function getLevelFromXp(totalXP: number): number {
  // Validate input - handle NaN, undefined, negative
  const safeXp = Math.max(0, Math.floor(totalXP) || 0);
  if (safeXp <= 0) return 1;

  let level = 1;
  let xpSoFar = 0;

  while (level < 50) {
    const xpForNextLevel = getXpForLevel(level);

    if (xpSoFar + xpForNextLevel > safeXp) {
      return level;
    }

    xpSoFar += xpForNextLevel;
    level++;
  }

  return 50; // Cap at level 50
}

/**
 * Get XP progress within current level
 * Matches backend calculateLevelFromXP() return values
 */
export function getLevelProgress(totalXP: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
  xpToNextLevel: number;
} {
  // Validate input - handle NaN, undefined, negative
  const safeXp = Math.max(0, Math.floor(totalXP) || 0);
  if (safeXp <= 0) {
    return {
      level: 1,
      currentLevelXp: 0,
      nextLevelXp: getXpForLevel(1),
      progressXp: 0,
      progressPercent: 0,
      xpToNextLevel: getXpForLevel(1),
    };
  }

  let level = 1;
  let xpSoFar = 0;

  while (level < 50) {
    const xpForNextLevel = getXpForLevel(level);

    if (xpSoFar + xpForNextLevel > safeXp) {
      // Found the level!
      const progressXp = safeXp - xpSoFar;
      const progressPercent = Math.min(100, Math.round((progressXp / xpForNextLevel) * 100));
      const xpToNextLevel = xpForNextLevel - progressXp;

      return {
        level,
        currentLevelXp: progressXp,
        nextLevelXp: xpForNextLevel,
        progressXp,
        progressPercent,
        xpToNextLevel,
      };
    }

    xpSoFar += xpForNextLevel;
    level++;
  }

  // Capped at level 50
  return {
    level: 50,
    currentLevelXp: safeXp - xpSoFar,
    nextLevelXp: getXpForLevel(50),
    progressXp: safeXp - xpSoFar,
    progressPercent: 100,
    xpToNextLevel: 0,
  };
}

/**
 * Get title for a level
 * Uses XP_STRINGS for i18n-ready string extraction
 */
export function getLevelTitle(level: number): string {
  // Validate input
  const safeLevel = Math.max(1, Math.floor(level) || 1);
  if (safeLevel >= 100) return XP_STRINGS.LEVEL_GRANDMASTER;
  if (safeLevel >= 75) return XP_STRINGS.LEVEL_MASTER;
  if (safeLevel >= 50) return XP_STRINGS.LEVEL_EXPERT;
  if (safeLevel >= 35) return XP_STRINGS.LEVEL_VETERAN;
  if (safeLevel >= 25) return XP_STRINGS.LEVEL_ADEPT;
  if (safeLevel >= 15) return XP_STRINGS.LEVEL_SKILLED;
  if (safeLevel >= 10) return XP_STRINGS.LEVEL_APPRENTICE;
  if (safeLevel >= 5) return XP_STRINGS.LEVEL_NOVICE;
  return XP_STRINGS.LEVEL_BEGINNER;
}

/**
 * Get color class for level display
 */
export function getLevelColor(level: number): string {
  // Validate input
  const safeLevel = Math.max(1, Math.floor(level) || 1);
  if (safeLevel >= 100) return 'text-red-500';       // Grandmaster - Red
  if (safeLevel >= 75) return 'text-purple-500';     // Master - Purple
  if (safeLevel >= 50) return 'text-yellow-400';     // Expert - Gold
  if (safeLevel >= 35) return 'text-cyan-400';       // Veteran - Cyan
  if (safeLevel >= 25) return 'text-blue-400';       // Adept - Blue
  if (safeLevel >= 15) return 'text-green-400';      // Skilled - Green
  if (safeLevel >= 10) return 'text-lime-400';       // Apprentice - Lime
  if (safeLevel >= 5) return 'text-gray-300';        // Novice - Silver
  return 'text-amber-700';                            // Beginner - Bronze
}

/**
 * Get background gradient for level badge
 */
export function getLevelGradient(level: number): string {
  // Validate input
  const safeLevel = Math.max(1, Math.floor(level) || 1);
  if (safeLevel >= 100) return 'from-red-600 to-red-800';
  if (safeLevel >= 75) return 'from-purple-500 to-purple-700';
  if (safeLevel >= 50) return 'from-yellow-500 to-amber-600';
  if (safeLevel >= 35) return 'from-cyan-500 to-cyan-700';
  if (safeLevel >= 25) return 'from-blue-500 to-blue-700';
  if (safeLevel >= 15) return 'from-green-500 to-green-700';
  if (safeLevel >= 10) return 'from-lime-500 to-lime-700';
  if (safeLevel >= 5) return 'from-gray-400 to-gray-600';
  return 'from-amber-600 to-amber-800';
}

/**
 * Format XP number with commas
 */
export function formatXp(xp: number): string {
  // Validate input - handle NaN, undefined
  const safeXp = Math.floor(xp) || 0;
  return safeXp.toLocaleString();
}

/**
 * XP rewards configuration (must match backend/src/utils/xpSystem.ts)
 */
export const XP_REWARDS = {
  GAME_COMPLETION: 50,
  GAME_WIN: 100,
  TRICK_WON: 5,
  SUCCESSFUL_BET: 25,
  RED_ZERO_COLLECTED: 15,
};

/**
 * Currency (coins) rewards configuration (must match backend/src/db/skins.ts GAME_EVENT_REWARDS)
 */
export const CURRENCY_REWARDS = {
  // Round events
  ROUND_WON: 2,
  ROUND_LOST: 1,
  // Game events
  GAME_WON: 8,
  GAME_LOST: 3,
  // Special cards
  RED_ZERO_COLLECTED: 2,
  BROWN_ZERO_DODGED: 1,
  // Betting
  BET_MADE: 1,
  WITHOUT_TRUMP_WON: 3,
};

/**
 * Calculate XP earned from a round
 */
export function calculateRoundXp(params: {
  tricksWon: number;
  betSuccessful: boolean;
  redZerosCollected: number;
}): number {
  // Validate inputs - handle NaN, undefined, negative
  const tricksWon = Math.max(0, Math.floor(params.tricksWon) || 0);
  const redZerosCollected = Math.max(0, Math.floor(params.redZerosCollected) || 0);

  let xp = 0;

  xp += tricksWon * XP_REWARDS.TRICK_WON;

  if (params.betSuccessful) {
    xp += XP_REWARDS.SUCCESSFUL_BET;
  }

  xp += redZerosCollected * XP_REWARDS.RED_ZERO_COLLECTED;

  return xp;
}

/**
 * Calculate coins earned from a round
 */
export function calculateRoundCoins(params: {
  betSuccessful: boolean;
  redZerosCollected: number;
  brownZerosDodged: number;
}): number {
  // Validate inputs - handle NaN, undefined, negative
  const redZerosCollected = Math.max(0, Math.floor(params.redZerosCollected) || 0);
  const brownZerosDodged = Math.max(0, Math.floor(params.brownZerosDodged) || 0);

  let coins = 0;

  if (params.betSuccessful) {
    coins += CURRENCY_REWARDS.ROUND_WON;
    coins += CURRENCY_REWARDS.BET_MADE;
  } else {
    coins += CURRENCY_REWARDS.ROUND_LOST;
  }

  coins += redZerosCollected * CURRENCY_REWARDS.RED_ZERO_COLLECTED;
  coins += brownZerosDodged * CURRENCY_REWARDS.BROWN_ZERO_DODGED;

  return coins;
}

/**
 * Calculate total XP earned from a game
 */
export function calculateGameXp(params: {
  won: boolean;
  tricksWon: number;
  betsSuccessful: number;
  redZerosCollected: number;
}): number {
  // Validate inputs - handle NaN, undefined, negative
  const tricksWon = Math.max(0, Math.floor(params.tricksWon) || 0);
  const betsSuccessful = Math.max(0, Math.floor(params.betsSuccessful) || 0);
  const redZerosCollected = Math.max(0, Math.floor(params.redZerosCollected) || 0);

  let xp = XP_REWARDS.GAME_COMPLETION;

  if (params.won) {
    xp += XP_REWARDS.GAME_WIN;
  }

  xp += tricksWon * XP_REWARDS.TRICK_WON;
  xp += betsSuccessful * XP_REWARDS.SUCCESSFUL_BET;
  xp += redZerosCollected * XP_REWARDS.RED_ZERO_COLLECTED;

  return xp;
}

/**
 * Calculate total coins earned from a game
 */
export function calculateGameCoins(params: {
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  redZerosCollected: number;
  brownZerosDodged: number;
}): number {
  // Validate inputs - handle NaN, undefined, negative
  const roundsWon = Math.max(0, Math.floor(params.roundsWon) || 0);
  const roundsLost = Math.max(0, Math.floor(params.roundsLost) || 0);
  const redZerosCollected = Math.max(0, Math.floor(params.redZerosCollected) || 0);
  const brownZerosDodged = Math.max(0, Math.floor(params.brownZerosDodged) || 0);

  let coins = 0;

  if (params.won) {
    coins += CURRENCY_REWARDS.GAME_WON;
  } else {
    coins += CURRENCY_REWARDS.GAME_LOST;
  }

  coins += roundsWon * (CURRENCY_REWARDS.ROUND_WON + CURRENCY_REWARDS.BET_MADE);
  coins += roundsLost * CURRENCY_REWARDS.ROUND_LOST;
  coins += redZerosCollected * CURRENCY_REWARDS.RED_ZERO_COLLECTED;
  coins += brownZerosDodged * CURRENCY_REWARDS.BROWN_ZERO_DODGED;

  return coins;
}
