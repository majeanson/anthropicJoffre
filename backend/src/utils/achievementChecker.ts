/**
 * Achievement Checker
 * Sprint 2 Phase 1
 *
 * Checks and unlocks achievements based on game events
 */

import {
  Achievement,
  AchievementCheckContext,
  AchievementCheckResult,
} from '../types/achievements.js';
import * as achievementDb from '../db/achievements.js';
import { getPlayerStats } from '../db/index.js';

/**
 * Check and unlock achievements for a player based on an event
 */
export async function checkAchievements(
  context: AchievementCheckContext
): Promise<AchievementCheckResult> {
  const { playerName, eventType, eventData } = context;
  const unlocked: Achievement[] = [];
  const progress: Array<{ achievement: Achievement; progress: number; max_progress: number }> = [];

  try {
    // Get player stats for checking milestones
    const stats = await getPlayerStats(playerName);

    // Check achievements based on event type
    switch (eventType) {
      case 'game_won':
        await checkGameWonAchievements(playerName, stats, eventData, unlocked, progress);
        break;
      case 'bet_won':
        await checkBetWonAchievements(playerName, stats, eventData, unlocked, progress);
        break;
      case 'red_zero_collected':
        await checkRedZeroAchievements(playerName, stats, unlocked, progress);
        break;
      case 'brown_zero_collected':
        await checkBrownZeroAchievements(playerName, stats, unlocked, progress);
        break;
      case 'perfect_bet':
        await checkPerfectBetAchievement(playerName, unlocked);
        break;
      case 'no_trump_bet_won':
        await checkNoTrumpAchievements(playerName, stats, unlocked, progress);
        break;
      case 'game_completed':
        await checkGameCompletedAchievements(playerName, stats, unlocked, progress);
        break;
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }

  return { unlocked, progress };
}

/**
 * Check achievements related to winning games
 */
async function checkGameWonAchievements(
  playerName: string,
  stats: any,
  eventData: any,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // First win
  if (stats.games_won === 1) {
    const result = await achievementDb.unlockAchievement(playerName, 'first_win');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Win milestones
  if (stats.games_won === 10) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_won_10');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  if (stats.games_won === 50) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_won_50');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  if (stats.games_won === 100) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_won_100');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Comeback King - win after being down 30+ points
  if (eventData?.wasComeback) {
    const result = await achievementDb.unlockAchievement(playerName, 'comeback_king');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Perfect game - win without losing a bet
  if (eventData?.perfectGame) {
    const result = await achievementDb.unlockAchievement(playerName, 'perfect_game');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Win streak tracking
  if (eventData?.winStreak >= 5) {
    const result = await achievementDb.unlockAchievement(playerName, 'win_streak_5');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }
}

/**
 * Check achievements related to winning bets
 */
async function checkBetWonAchievements(
  playerName: string,
  stats: any,
  eventData: any,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // First bet won
  if (stats.bets_won === 1) {
    const result = await achievementDb.unlockAchievement(playerName, 'first_bet_won');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Trump master - incremental (5 wins with trump)
  if (eventData?.hadTrump) {
    const result = await achievementDb.updateAchievementProgress(playerName, 'trump_master', 1);
    progress.push({
      achievement: result.achievement,
      progress: result.progress,
      max_progress: 5
    });
    if (result.unlocked && result.progress === 5) {
      unlocked.push(result.achievement);
    }
  }
}

/**
 * Check perfect bet achievement
 */
async function checkPerfectBetAchievement(
  playerName: string,
  unlocked: Achievement[]
) {
  const result = await achievementDb.unlockAchievement(playerName, 'perfect_bet');
  if (result.isNewUnlock) unlocked.push(result.achievement);
}

/**
 * Check no-trump achievements
 */
async function checkNoTrumpAchievements(
  playerName: string,
  stats: any,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // No Trump Master - incremental (10 wins)
  const result = await achievementDb.updateAchievementProgress(playerName, 'no_trump_master', 1);
  progress.push({
    achievement: result.achievement,
    progress: result.progress,
    max_progress: 10
  });
  if (result.unlocked && result.progress === 10) {
    unlocked.push(result.achievement);
  }
}

/**
 * Check red zero achievements
 */
async function checkRedZeroAchievements(
  playerName: string,
  stats: any,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // Red Zero Hunter - incremental (20 total)
  if (stats.red_zeros_collected >= 20) {
    const result = await achievementDb.unlockAchievement(playerName, 'red_zero_hunter');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }
}

/**
 * Check brown zero achievements (secret)
 */
async function checkBrownZeroAchievements(
  playerName: string,
  stats: any,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // Brown Zero Avoider - secret achievement (win game without collecting any)
  // This is checked at game end, not per collection
}

/**
 * Check achievements when a game completes
 */
async function checkGameCompletedAchievements(
  playerName: string,
  stats: any,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // Games played milestone
  if (stats.games_played === 10) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_played_10');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }
}

/**
 * Check secret achievements at game end
 */
export async function checkSecretAchievements(
  playerName: string,
  gameData: any
): Promise<Achievement[]> {
  const unlocked: Achievement[] = [];

  try {
    // Brown Zero Avoider - no brown zeros collected in winning game
    if (gameData.won && gameData.brownZerosCollected === 0) {
      const result = await achievementDb.unlockAchievement(playerName, 'brown_zero_avoider');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Underdog Victory - win after being lowest scorer for 3+ rounds
    if (gameData.won && gameData.roundsAsLowestScorer >= 3) {
      const result = await achievementDb.unlockAchievement(playerName, 'underdog_victory');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }
  } catch (error) {
    console.error('Error checking secret achievements:', error);
  }

  return unlocked;
}
