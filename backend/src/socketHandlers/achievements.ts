/**
 * Achievement Socket Handlers
 * Sprint 2 Phase 1
 */

import { Server, Socket } from 'socket.io';
import * as achievementDb from '../db/achievements.js';
import { checkAchievements, checkSecretAchievements } from '../utils/achievementChecker.js';
import { AchievementCheckContext } from '../types/achievements.js';

/**
 * Register achievement-related socket event handlers
 */
export function registerAchievementHandlers(io: Server, socket: Socket) {
  // Get all achievements
  socket.on('get_all_achievements', async (callback) => {
    try {
      const achievements = await achievementDb.getAllAchievements();
      callback({ success: true, achievements });
    } catch (error) {
      console.error('Error getting achievements:', error);
      callback({ success: false, error: 'Failed to get achievements' });
    }
  });

  // Get player's achievements with progress
  socket.on('get_player_achievements', async ({ playerName }, callback) => {
    try {
      const achievements = await achievementDb.getPlayerAchievements(playerName);
      const points = await achievementDb.getPlayerAchievementPoints(playerName);
      callback({ success: true, achievements, points });
    } catch (error) {
      console.error('Error getting player achievements:', error);
      callback({ success: false, error: 'Failed to get player achievements' });
    }
  });

  // Get achievement leaderboard
  socket.on('get_achievement_leaderboard', async ({ limit = 10 }, callback) => {
    try {
      const leaderboard = await achievementDb.getAchievementLeaderboard(limit);
      callback({ success: true, leaderboard });
    } catch (error) {
      console.error('Error getting achievement leaderboard:', error);
      callback({ success: false, error: 'Failed to get leaderboard' });
    }
  });
}

/**
 * Helper function to emit achievement unlocked event to all players in a game
 */
export function emitAchievementUnlocked(
  io: Server,
  gameId: string,
  playerName: string,
  achievement: any
) {
  io.to(gameId).emit('achievement_unlocked', {
    playerName,
    achievement,
  });
}

/**
 * Check and unlock achievements for a game event
 * Call this from game logic when relevant events occur
 */
export async function triggerAchievementCheck(
  io: Server,
  gameId: string,
  context: AchievementCheckContext
) {
  try {
    const result = await checkAchievements(context);

    // Emit unlocked achievements
    for (const achievement of result.unlocked) {
      emitAchievementUnlocked(io, gameId, context.playerName, achievement);
    }

    // Emit progress updates
    for (const prog of result.progress) {
      io.to(gameId).emit('achievement_progress', {
        playerName: context.playerName,
        achievement: prog.achievement,
        progress: prog.progress,
        maxProgress: prog.max_progress,
      });
    }
  } catch (error) {
    console.error('Error triggering achievement check:', error);
  }
}
