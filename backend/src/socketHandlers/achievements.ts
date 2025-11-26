/**
 * Achievement Socket Handlers
 * Sprint 2 Phase 1
 * Sprint 6: Enhanced with error boundary integration
 */

import { Server, Socket } from 'socket.io';
import * as achievementDb from '../db/achievements.js';
import { checkAchievements, checkSecretAchievements } from '../utils/achievementChecker.js';
import { Achievement, AchievementCheckContext } from '../types/achievements.js';
import { errorBoundaries } from '../middleware/errorBoundary.js';

interface AchievementHandlerDependencies {
  errorBoundaries: typeof errorBoundaries;
}

/**
 * Register achievement-related socket event handlers
 */
export function registerAchievementHandlers(
  io: Server,
  socket: Socket,
  deps: AchievementHandlerDependencies
) {
  const { errorBoundaries } = deps;

  type AchievementCallback = (data: { success: boolean; [key: string]: unknown }) => void;

  // Get all achievements
  socket.on(
    'get_all_achievements',
    errorBoundaries.readOnly('get_all_achievements')(async (callback: AchievementCallback) => {
      const achievements = await achievementDb.getAllAchievements();
      callback({ success: true, achievements });
    })
  );

  // Get player's achievements with progress
  socket.on(
    'get_player_achievements',
    errorBoundaries.readOnly('get_player_achievements')(async ({ playerName }: { playerName: string }, callback: AchievementCallback) => {
      const achievements = await achievementDb.getPlayerAchievements(playerName);
      const points = await achievementDb.getPlayerAchievementPoints(playerName);
      callback({ success: true, achievements, points });
    })
  );

  // Get achievement leaderboard
  socket.on(
    'get_achievement_leaderboard',
    errorBoundaries.readOnly('get_achievement_leaderboard')(async ({ limit = 10 }: { limit?: number }, callback: AchievementCallback) => {
      const leaderboard = await achievementDb.getAchievementLeaderboard(limit);
      callback({ success: true, leaderboard });
    })
  );

  // Check tutorial completion achievement
  socket.on(
    'check_tutorial_achievement',
    errorBoundaries.gameAction('check_tutorial_achievement')(async ({ playerName }: { playerName: string }) => {
      try {
        // Unlock tutorial completion achievement
        const result = await achievementDb.unlockAchievement(playerName, 'tutorial_complete');

        if (result.isNewUnlock) {
          console.log(`🎓 Tutorial achievement unlocked for ${playerName}`);

          // Emit achievement unlocked event to player
          socket.emit('achievement_unlocked', {
            playerName,
            achievement: result.achievement,
            isNewUnlock: true,
          });

          // Create notification for authenticated users
          try {
            const { createNotification } = await import('../db/notifications.js');
            const { getUserByUsername } = await import('../db/users.js');

            const user = await getUserByUsername(playerName);
            if (user) {
              await createNotification({
                user_id: user.user_id,
                notification_type: 'achievement_unlocked',
                title: `Achievement Unlocked: ${result.achievement.achievement_name}`,
                message: result.achievement.description,
                data: {
                  achievement_id: result.achievement.achievement_id,
                  achievement_name: result.achievement.achievement_name,
                  achievement_icon: result.achievement.icon,
                  achievement_tier: result.achievement.tier,
                  points: result.achievement.points,
                },
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              });
            }
          } catch (error) {
            // Silently fail for guest users
            console.log(`Achievement notification skipped for guest player: ${playerName}`);
          }
        }
      } catch (error) {
        console.error('Error checking tutorial achievement:', error);
        socket.emit('error', { message: 'Failed to check tutorial achievement' });
      }
    })
  );
}

/**
 * Helper function to emit achievement unlocked event to all players in a game
 * Also creates a notification for authenticated users
 */
export async function emitAchievementUnlocked(
  io: Server,
  gameId: string,
  playerName: string,
  achievement: Achievement
) {
  // Emit real-time event to all players in game
  io.to(gameId).emit('achievement_unlocked', {
    playerName,
    achievement,
  });

  // Create notification for authenticated users
  // Note: For guest players (no user_id), notification is skipped
  // This is handled by the notification system's user lookup
  try {
    const { createNotification } = await import('../db/notifications.js');
    const { getUserByUsername } = await import('../db/users.js');

    // Try to get user ID from player name (if authenticated)
    const user = await getUserByUsername(playerName);
    if (user) {
      await createNotification({
        user_id: user.user_id,
        notification_type: 'achievement_unlocked',
        title: `Achievement Unlocked: ${achievement.achievement_name}`,
        message: achievement.description,
        data: {
          achievement_id: achievement.achievement_id,
          achievement_name: achievement.achievement_name,
          achievement_icon: achievement.icon,
          achievement_tier: achievement.tier,
          points: achievement.points,
        },
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      // Emit notification to the specific user's socket
      const userSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.data.playerName === playerName);
      if (userSocket) {
        userSocket.emit('notification_received', {
          notification_type: 'achievement_unlocked',
          title: `Achievement Unlocked: ${achievement.achievement_name}`,
          message: achievement.description,
        });
      }
    }
  } catch (error) {
    // Silently fail for guest users (no user account)
    // Achievement toast will still show via achievement_unlocked event
    console.log(`Achievement notification skipped for guest player: ${playerName}`);
  }
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
