/**
 * XP/Rewards UI Strings
 *
 * All user-facing strings for the XP and rewards system.
 * Centralized for future i18n (internationalization) support.
 *
 * Usage: import { XP_STRINGS } from '../constants/xpStrings';
 *
 * Future i18n: Replace with i18n library like react-i18next
 * and use keys for translation lookup.
 */

export const XP_STRINGS = {
  // Level titles
  LEVEL_BEGINNER: 'Beginner',
  LEVEL_NOVICE: 'Novice',
  LEVEL_APPRENTICE: 'Apprentice',
  LEVEL_SKILLED: 'Skilled',
  LEVEL_ADEPT: 'Adept',
  LEVEL_VETERAN: 'Veteran',
  LEVEL_EXPERT: 'Expert',
  LEVEL_MASTER: 'Master',
  LEVEL_GRANDMASTER: 'Grandmaster',

  // XP display
  XP_EARNED: 'XP Earned',
  XP_TOTAL: 'Total XP',
  XP_TO_NEXT_LEVEL: 'XP to next level',
  XP_PROGRESS: 'Level Progress',

  // Coins display
  COINS_EARNED: 'Coins Earned',
  COINS_TOTAL: 'Total Coins',

  // Round rewards
  ROUND_REWARDS: 'Round Rewards',
  ROUND_SUMMARY: 'Round Summary',

  // Game rewards
  GAME_REWARDS: 'Game Rewards',
  GAME_COMPLETION: 'Game',
  VICTORY_BONUS: 'Victory',
  PARTICIPATION: 'Participation',

  // Session tracking
  SESSION_TOTALS: 'This Session',
  SESSION_XP: 'Session XP',
  SESSION_COINS: 'Session Coins',

  // Reward breakdown labels
  TRICKS_WON: 'tricks',
  ROUNDS_WON: 'rounds won',
  BETS_SUCCESSFUL: 'bets',
  RED_ZEROS: 'red 0s',
  COINS: 'coins',
  WIN_BONUS: 'Win bonus',

  // Level up modal
  LEVEL_UP: 'Level Up!',
  CONGRATULATIONS: 'Congratulations!',
  REACHED_LEVEL: 'You reached level',
  NEW_SKIN_UNLOCKED: 'New Skin Unlocked!',
  AWESOME: 'Awesome!',

  // Tier names (for LevelUpModal)
  TIER_LEGENDARY: 'Legendary',
  TIER_MASTER: 'Master',
  TIER_EXPERT: 'Expert',
  TIER_VETERAN: 'Veteran',
  TIER_SKILLED: 'Skilled',
  TIER_APPRENTICE: 'Apprentice',
  TIER_BEGINNER: 'Beginner',
} as const;

// Type for string keys (useful for i18n libraries)
export type XpStringKey = keyof typeof XP_STRINGS;
