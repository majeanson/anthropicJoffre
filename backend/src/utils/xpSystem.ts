/**
 * XP and Level System
 *
 * Handles XP calculations, level thresholds, and progression mechanics.
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
 * Level Thresholds:
 * - Uses a smooth curve: XP = 100 * level^1.8
 * - Level 1: 0 XP
 * - Level 2: 100 XP
 * - Level 10: ~3,981 XP
 * - Level 25: ~19,953 XP
 * - Level 50: ~63,096 XP
 * - Level 100: ~199,526 XP
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

// Level calculation constants
const BASE_XP = 100;
const LEVEL_EXPONENT = 1.8;

/**
 * Calculate XP required to reach a specific level
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP * Math.pow(level, LEVEL_EXPONENT));
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(xp: number): number {
  if (xp <= 0) return 1;

  // Binary search for the level
  let low = 1;
  let high = 200; // Max level cap

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (getXpForLevel(mid) <= xp) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

/**
 * Get XP progress within current level
 */
export function getLevelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
} {
  const level = getLevelFromXp(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const progressXp = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.round((progressXp / xpNeeded) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressXp,
    progressPercent,
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
