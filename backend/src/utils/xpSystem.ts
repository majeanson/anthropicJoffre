/**
 * XP and Level System
 *
 * Handles XP calculations, level thresholds, and progression mechanics.
 * MUST stay in sync with frontend/src/utils/xpSystem.ts
 *
 * XP Sources:
 * - Game completion: 50 XP base
 * - Game win: +100 XP bonus
 * - Tricks won: 5 XP per trick
 * - Successful bet: +25 XP
 * - Red Zero collected: +15 XP
 * - Achievement unlocked: varies by tier
 * - Daily quest completed: varies by quest
 *
 * Level Thresholds (exponential growth - easy early, harder later):
 * - Formula: 75 * (1.25 ^ (level - 1))
 * - Level 1→2: 75 XP
 * - Level 5: ~117 XP per level
 * - Level 10: ~186 XP per level
 * - Level 20: ~423 XP per level
 * - Level 30: ~963 XP per level
 * - Level 50 (cap): ~4,291 XP per level
 */

// XP rewards configuration
export const XP_REWARDS = {
  // Game-based XP
  GAME_COMPLETION: 50,      // Just for finishing a game
  GAME_WIN: 100,            // Bonus for winning
  TRICK_WON: 5,             // Per trick won
  SUCCESSFUL_BET: 25,       // Team met or exceeded bet
  RED_ZERO_COLLECTED: 15,   // Per Red 0 card collected

  // Quest XP (base values, actual values in quest definitions)
  QUEST_EASY: 50,
  QUEST_MEDIUM: 100,
  QUEST_HARD: 200,

  // Achievement XP by tier
  ACHIEVEMENT_BRONZE: 25,
  ACHIEVEMENT_SILVER: 50,
  ACHIEVEMENT_GOLD: 100,
  ACHIEVEMENT_PLATINUM: 250,
};

// Level calculation constants (MUST match frontend/src/utils/xpSystem.ts)
const BASE_XP = 75;
const LEVEL_MULTIPLIER = 1.25;
const MAX_LEVEL = 50;

/**
 * Calculate XP required for a specific level (not cumulative)
 * Returns XP needed to go FROM this level TO the next level
 */
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, level - 1));
}

/**
 * Calculate total XP required to reach a target level (cumulative)
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
 * Uses cumulative XP calculation matching frontend
 */
export function getLevelFromXp(totalXP: number): number {
  if (totalXP <= 0) return 1;

  let level = 1;
  let xpSoFar = 0;

  while (level < MAX_LEVEL) {
    const xpForNextLevel = getXpForLevel(level);

    if (xpSoFar + xpForNextLevel > totalXP) {
      return level;
    }

    xpSoFar += xpForNextLevel;
    level++;
  }

  return MAX_LEVEL; // Cap at max level
}

/**
 * Get XP progress within current level
 * Matches frontend getLevelProgress() exactly
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

  while (level < MAX_LEVEL) {
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

  // Capped at max level
  return {
    level: MAX_LEVEL,
    currentLevelXp: totalXP - xpSoFar,
    nextLevelXp: getXpForLevel(MAX_LEVEL),
    progressXp: totalXP - xpSoFar,
    progressPercent: 100,
    xpToNextLevel: 0,
  };
}

/**
 * Calculate XP earned from a game
 */
export function calculateGameXp(params: {
  won: boolean;
  tricksWon: number;
  betSuccessful: boolean;
  redZerosCollected: number;
}): number {
  let xp = XP_REWARDS.GAME_COMPLETION;

  if (params.won) {
    xp += XP_REWARDS.GAME_WIN;
  }

  xp += params.tricksWon * XP_REWARDS.TRICK_WON;

  if (params.betSuccessful) {
    xp += XP_REWARDS.SUCCESSFUL_BET;
  }

  xp += params.redZerosCollected * XP_REWARDS.RED_ZERO_COLLECTED;

  return xp;
}

/**
 * Get XP reward for achievement tier
 */
export function getAchievementXp(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): number {
  switch (tier) {
    case 'bronze': return XP_REWARDS.ACHIEVEMENT_BRONZE;
    case 'silver': return XP_REWARDS.ACHIEVEMENT_SILVER;
    case 'gold': return XP_REWARDS.ACHIEVEMENT_GOLD;
    case 'platinum': return XP_REWARDS.ACHIEVEMENT_PLATINUM;
    default: return 0;
  }
}

/**
 * Get title for a level (optional flavor)
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
 * Get color theme for level display
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
