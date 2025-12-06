/**
 * Achievement Checker
 * Sprint 2 Phase 1 + Sprint 21 Expansion
 *
 * Checks and unlocks achievements based on game events
 * Extended with 12 new achievements and retroactive checking
 */

import {
  Achievement,
  AchievementCheckContext,
  AchievementCheckResult,
  GameWonEventData,
  BetWonEventData,
  GameEndData,
} from '../types/achievements.js';
import * as achievementDb from '../db/achievements.js';
import { getPlayerStats } from '../db/index.js';
import { PlayerStats } from '../types/game.js';

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
        await checkGameWonAchievements(playerName, stats, eventData as GameWonEventData | undefined, unlocked, progress);
        break;
      case 'bet_won':
        await checkBetWonAchievements(playerName, stats, eventData as BetWonEventData | undefined, unlocked, progress);
        break;
      case 'red_zero_collected':
        await checkRedZeroAchievements(playerName, stats, unlocked, progress);
        break;
      case 'brown_zero_collected':
        await checkBrownZeroAchievements(playerName, stats, unlocked, progress);
        break;
      case 'perfect_bet':
        await checkPerfectBetAchievement(playerName, unlocked, progress, stats);
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
  stats: PlayerStats,
  eventData: GameWonEventData | undefined,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // First win - use >= to catch players who had wins before achievement system
  if (stats.games_won >= 1) {
    const result = await achievementDb.unlockAchievement(playerName, 'first_win');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Win milestones - use >= to catch players who passed milestones before achievement system
  if (stats.games_won >= 10) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_won_10');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  if (stats.games_won >= 50) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_won_50');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  if (stats.games_won >= 100) {
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
  if (eventData?.winStreak && eventData.winStreak >= 5) {
    const result = await achievementDb.unlockAchievement(playerName, 'win_streak_5');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Sprint 21: Extended win streak achievement (10 wins)
  if (eventData?.winStreak && eventData.winStreak >= 10) {
    const result = await achievementDb.unlockAchievement(playerName, 'win_streak_10');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Sprint 21: Clean game tracking (no brown zeros)
  if (eventData?.noBrownZeros) {
    // Increment clean games won counter
    const cleanGamesWon = (stats.clean_games_won || 0) + 1;
    const cleanGameStreak = (stats.clean_game_streak || 0) + 1;

    // Check for no_brown_10 (10 clean wins)
    if (cleanGamesWon >= 10) {
      const result = await achievementDb.unlockAchievement(playerName, 'no_brown_10');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Check for no_brown_streak (5 consecutive clean wins)
    if (cleanGameStreak >= 5) {
      const result = await achievementDb.unlockAchievement(playerName, 'no_brown_streak');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }
  }
}

/**
 * Check achievements related to winning bets
 */
async function checkBetWonAchievements(
  playerName: string,
  stats: PlayerStats,
  eventData: BetWonEventData | undefined,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // First bet won - use >= to catch players who had bets won before achievement system
  if (stats.bets_won >= 1) {
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

  // Sprint 21: Maximum confidence (win a 12-point bet)
  if (eventData?.betAmount === 12) {
    const result = await achievementDb.unlockAchievement(playerName, 'bet_12_won');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }
}

/**
 * Check perfect bet achievement
 */
async function checkPerfectBetAchievement(
  playerName: string,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>,
  stats: PlayerStats
) {
  const result = await achievementDb.unlockAchievement(playerName, 'perfect_bet');
  if (result.isNewUnlock) unlocked.push(result.achievement);

  // Sprint 21: Oracle achievement (5 perfect bets)
  const perfectBetsWon = (stats.perfect_bets_won || 0) + 1;
  if (perfectBetsWon >= 5) {
    const oracleResult = await achievementDb.unlockAchievement(playerName, 'perfect_bets_5');
    if (oracleResult.isNewUnlock) unlocked.push(oracleResult.achievement);
  }
}

/**
 * Check no-trump achievements
 */
async function checkNoTrumpAchievements(
  playerName: string,
  stats: PlayerStats,
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
  stats: PlayerStats,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>,
  eventData?: { redZerosThisRound?: number }
) {
  // Red Zero Hunter - incremental (20 total)
  if (stats.red_zeros_collected >= 20) {
    const result = await achievementDb.unlockAchievement(playerName, 'red_zero_hunter');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Sprint 21: Flame Collector (50 red zeros)
  if (stats.red_zeros_collected >= 50) {
    const result = await achievementDb.unlockAchievement(playerName, 'red_zero_50');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Sprint 21: Inferno Master (100 red zeros)
  if (stats.red_zeros_collected >= 100) {
    const result = await achievementDb.unlockAchievement(playerName, 'red_zero_100');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Sprint 21: Double Flame (2 red zeros in one round)
  if (eventData?.redZerosThisRound && eventData.redZerosThisRound >= 2) {
    const result = await achievementDb.unlockAchievement(playerName, 'double_red_zero');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }
}

/**
 * Check brown zero achievements (secret)
 */
async function checkBrownZeroAchievements(
  playerName: string,
  stats: PlayerStats,
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
  stats: PlayerStats,
  unlocked: Achievement[],
  progress: Array<{ achievement: Achievement; progress: number; max_progress: number }>
) {
  // Games played milestone - use >= to catch players who passed milestone before achievement system
  if (stats.games_played >= 10) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_played_10');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }

  // Sprint 21: Veteran achievement (100 games played)
  if (stats.games_played >= 100) {
    const result = await achievementDb.unlockAchievement(playerName, 'games_played_100');
    if (result.isNewUnlock) unlocked.push(result.achievement);
  }
}

/**
 * Check secret achievements at game end
 */
export async function checkSecretAchievements(
  playerName: string,
  gameData: GameEndData
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

    // Sprint 21: Clutch Master - win with last card securing victory
    if (gameData.lastCardSecuredVictory) {
      const result = await achievementDb.unlockAchievement(playerName, 'last_card_wins');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Sprint 21: Trump Emperor - play all 4 trump cards in a single round
    if (gameData.trumpCardsPlayedInRound && gameData.trumpCardsPlayedInRound >= 4) {
      const result = await achievementDb.unlockAchievement(playerName, 'all_trump_round');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }
  } catch (error) {
    console.error('Error checking secret achievements:', error);
  }

  return unlocked;
}

/**
 * Sprint 21: Check retroactive achievements on login
 * Checks player stats against all milestone achievements and unlocks any that qualify
 */
export async function checkRetroactiveAchievements(
  playerName: string
): Promise<Achievement[]> {
  const unlocked: Achievement[] = [];

  try {
    const stats = await getPlayerStats(playerName);

    // Game win milestones
    const gameWinMilestones = [
      { key: 'first_win', threshold: 1 },
      { key: 'games_won_10', threshold: 10 },
      { key: 'games_won_50', threshold: 50 },
      { key: 'games_won_100', threshold: 100 },
    ];

    for (const { key, threshold } of gameWinMilestones) {
      if (stats.games_won >= threshold) {
        const result = await achievementDb.unlockAchievement(playerName, key);
        if (result.isNewUnlock) unlocked.push(result.achievement);
      }
    }

    // Games played milestones
    const gamesPlayedMilestones = [
      { key: 'games_played_10', threshold: 10 },
      { key: 'games_played_100', threshold: 100 },
    ];

    for (const { key, threshold } of gamesPlayedMilestones) {
      if (stats.games_played >= threshold) {
        const result = await achievementDb.unlockAchievement(playerName, key);
        if (result.isNewUnlock) unlocked.push(result.achievement);
      }
    }

    // Red zero milestones
    const redZeroMilestones = [
      { key: 'red_zero_hunter', threshold: 20 },
      { key: 'red_zero_50', threshold: 50 },
      { key: 'red_zero_100', threshold: 100 },
    ];

    for (const { key, threshold } of redZeroMilestones) {
      if (stats.red_zeros_collected >= threshold) {
        const result = await achievementDb.unlockAchievement(playerName, key);
        if (result.isNewUnlock) unlocked.push(result.achievement);
      }
    }

    // First bet won
    if (stats.bets_won >= 1) {
      const result = await achievementDb.unlockAchievement(playerName, 'first_bet_won');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Win streak check (uses best_win_streak from stats if available)
    if (stats.best_win_streak && stats.best_win_streak >= 5) {
      const result = await achievementDb.unlockAchievement(playerName, 'win_streak_5');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    if (stats.best_win_streak && stats.best_win_streak >= 10) {
      const result = await achievementDb.unlockAchievement(playerName, 'win_streak_10');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Clean games milestones (Sprint 21)
    if (stats.clean_games_won && stats.clean_games_won >= 10) {
      const result = await achievementDb.unlockAchievement(playerName, 'no_brown_10');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Perfect bets milestones (Sprint 21)
    if (stats.perfect_bets_won && stats.perfect_bets_won >= 5) {
      const result = await achievementDb.unlockAchievement(playerName, 'perfect_bets_5');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Max bet won (Sprint 21)
    if (stats.max_bet_won && stats.max_bet_won >= 12) {
      const result = await achievementDb.unlockAchievement(playerName, 'bet_12_won');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Double red zeros (Sprint 21)
    if (stats.double_red_zeros && stats.double_red_zeros >= 1) {
      const result = await achievementDb.unlockAchievement(playerName, 'double_red_zero');
      if (result.isNewUnlock) unlocked.push(result.achievement);
    }

    // Sprint 21: Login streak achievements (check login_streaks table)
    try {
      const { query } = await import('../db/index.js');
      const loginResult = await query(
        'SELECT current_streak, longest_streak, total_logins FROM login_streaks WHERE player_name = $1',
        [playerName]
      );

      if (loginResult.rows.length > 0) {
        const { current_streak, longest_streak, total_logins } = loginResult.rows[0];
        const bestStreak = Math.max(current_streak || 0, longest_streak || 0);

        // Login streak milestones
        const streakMilestones = [
          { key: 'login_streak_3', threshold: 3 },
          { key: 'login_streak_7', threshold: 7 },
          { key: 'login_streak_14', threshold: 14 },
          { key: 'login_streak_30', threshold: 30 },
        ];

        for (const { key, threshold } of streakMilestones) {
          if (bestStreak >= threshold) {
            try {
              const result = await achievementDb.unlockAchievement(playerName, key);
              if (result.isNewUnlock) unlocked.push(result.achievement);
            } catch {
              // Achievement may not exist yet
            }
          }
        }

        // Total logins milestones
        const loginMilestones = [
          { key: 'total_logins_50', threshold: 50 },
          { key: 'total_logins_100', threshold: 100 },
          { key: 'total_logins_365', threshold: 365 },
        ];

        for (const { key, threshold } of loginMilestones) {
          if ((total_logins || 0) >= threshold) {
            try {
              const result = await achievementDb.unlockAchievement(playerName, key);
              if (result.isNewUnlock) unlocked.push(result.achievement);
            } catch {
              // Achievement may not exist yet
            }
          }
        }
      }
    } catch {
      // login_streaks table may not exist or query failed
    }

    console.log(`[Retroactive] Checked achievements for ${playerName}: ${unlocked.length} new unlocks`);
  } catch (error) {
    console.error('Error checking retroactive achievements:', error);
  }

  return unlocked;
}
