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
 */

// Level calculation constants (MUST match backend/src/game/quests.ts)
const BASE_XP = 75;
const LEVEL_MULTIPLIER = 1.25;

/**
 * Calculate XP required for a specific level (not cumulative)
 * Matches backend calculateXPForLevel()
 */
export function getXpForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, level - 1));
}

/**
 * Calculate total XP required to reach a target level (cumulative)
 * Matches backend calculateTotalXPForLevel()
 */
export function getTotalXpForLevel(targetLevel: number): number {
  let totalXP = 0;
  for (let level = 1; level < targetLevel; level++) {
    totalXP += getXpForLevel(level);
  }
  return totalXP;
}

/**
 * Calculate level from total XP
 * Matches backend calculateLevelFromXP()
 */
export function getLevelFromXp(totalXP: number): number {
  if (totalXP <= 0) return 1;

  let level = 1;
  let xpSoFar = 0;

  while (level < 50) {
    const xpForNextLevel = getXpForLevel(level);

    if (xpSoFar + xpForNextLevel > totalXP) {
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
  if (totalXP <= 0) {
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

    if (xpSoFar + xpForNextLevel > totalXP) {
      // Found the level!
      const progressXp = totalXP - xpSoFar;
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
    currentLevelXp: totalXP - xpSoFar,
    nextLevelXp: getXpForLevel(50),
    progressXp: totalXP - xpSoFar,
    progressPercent: 100,
    xpToNextLevel: 0,
  };
}

/**
 * Get title for a level
 */
export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Grandmaster';
  if (level >= 75) return 'Master';
  if (level >= 50) return 'Expert';
  if (level >= 35) return 'Veteran';
  if (level >= 25) return 'Adept';
  if (level >= 15) return 'Skilled';
  if (level >= 10) return 'Apprentice';
  if (level >= 5) return 'Novice';
  return 'Beginner';
}

/**
 * Get color class for level display
 */
export function getLevelColor(level: number): string {
  if (level >= 100) return 'text-red-500';       // Grandmaster - Red
  if (level >= 75) return 'text-purple-500';     // Master - Purple
  if (level >= 50) return 'text-yellow-400';     // Expert - Gold
  if (level >= 35) return 'text-cyan-400';       // Veteran - Cyan
  if (level >= 25) return 'text-blue-400';       // Adept - Blue
  if (level >= 15) return 'text-green-400';      // Skilled - Green
  if (level >= 10) return 'text-lime-400';       // Apprentice - Lime
  if (level >= 5) return 'text-gray-300';        // Novice - Silver
  return 'text-amber-700';                        // Beginner - Bronze
}

/**
 * Get background gradient for level badge
 */
export function getLevelGradient(level: number): string {
  if (level >= 100) return 'from-red-600 to-red-800';
  if (level >= 75) return 'from-purple-500 to-purple-700';
  if (level >= 50) return 'from-yellow-500 to-amber-600';
  if (level >= 35) return 'from-cyan-500 to-cyan-700';
  if (level >= 25) return 'from-blue-500 to-blue-700';
  if (level >= 15) return 'from-green-500 to-green-700';
  if (level >= 10) return 'from-lime-500 to-lime-700';
  if (level >= 5) return 'from-gray-400 to-gray-600';
  return 'from-amber-600 to-amber-800';
}

/**
 * Format XP number with commas
 */
export function formatXp(xp: number): string {
  return xp.toLocaleString();
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
 * Calculate XP earned from a round
 */
export function calculateRoundXp(params: {
  tricksWon: number;
  betSuccessful: boolean;
  redZerosCollected: number;
}): number {
  let xp = 0;

  xp += params.tricksWon * XP_REWARDS.TRICK_WON;

  if (params.betSuccessful) {
    xp += XP_REWARDS.SUCCESSFUL_BET;
  }

  xp += params.redZerosCollected * XP_REWARDS.RED_ZERO_COLLECTED;

  return xp;
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
  let xp = XP_REWARDS.GAME_COMPLETION;

  if (params.won) {
    xp += XP_REWARDS.GAME_WIN;
  }

  xp += params.tricksWon * XP_REWARDS.TRICK_WON;
  xp += params.betsSuccessful * XP_REWARDS.SUCCESSFUL_BET;
  xp += params.redZerosCollected * XP_REWARDS.RED_ZERO_COLLECTED;

  return xp;
}
