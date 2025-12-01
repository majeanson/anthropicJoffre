/**
 * XP and Level System (Frontend)
 *
 * Utility functions for displaying XP and level information.
 * Mirrors backend calculations for consistent display.
 */

// Level calculation constants (must match backend)
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
  xpToNextLevel: number;
} {
  const level = getLevelFromXp(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const progressXp = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.round((progressXp / xpNeeded) * 100));
  const xpToNextLevel = nextLevelXp - xp;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressXp,
    progressPercent,
    xpToNextLevel,
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
