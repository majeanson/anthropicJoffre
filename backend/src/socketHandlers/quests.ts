/**
 * Quest Socket Handlers
 *
 * Sprint 19: Daily Engagement System
 *
 * Handles all WebSocket events for the quest system:
 * - Daily quest fetching
 * - Quest reward claiming
 * - Login streak tracking
 * - Calendar reward claiming
 */

import { Socket } from 'socket.io';
import pool from '../db';
import {
  getPlayerDailyQuests,
  claimQuestReward,
  updateLoginStreak,
  getLoginStreak,
  getDailyRewardsCalendar,
  getPlayerCalendarProgress,
  claimCalendarReward,
  getQuestStats,
} from '../db/quests';
import { calculateLevelFromXP } from '../game/quests';

/**
 * Register all quest-related socket handlers
 */
export function registerQuestHandlers(socket: Socket): void {
  socket.on('get_daily_quests', async function(this: Socket, data: { playerName: string }) {
    await handleGetDailyQuests.call(this, data);
  });

  socket.on('claim_quest_reward', async function(this: Socket, data: { playerName: string; questId: number }) {
    await handleClaimQuestReward.call(this, data);
  });

  socket.on('update_login_streak', async function(this: Socket, data: { playerName: string }) {
    await handleUpdateLoginStreak.call(this, data);
  });

  socket.on('get_login_streak', async function(this: Socket, data: { playerName: string }) {
    await handleGetLoginStreak.call(this, data);
  });

  socket.on('get_daily_calendar', async function(this: Socket) {
    await handleGetDailyCalendar.call(this);
  });

  socket.on('get_player_calendar_progress', async function(this: Socket, data: { playerName: string }) {
    await handleGetPlayerCalendarProgress.call(this, data);
  });

  socket.on('claim_calendar_reward', async function(this: Socket, data: { playerName: string; dayNumber: number }) {
    await handleClaimCalendarReward.call(this, data);
  });

  socket.on('get_quest_stats', async function(this: Socket, data: { playerName: string }) {
    await handleGetQuestStats.call(this, data);
  });
}

/**
 * Get daily quests for a player
 */
async function handleGetDailyQuests(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const quests = await getPlayerDailyQuests(playerName);

    this.emit('daily_quests', { quests });
  } catch (error) {
    console.error('[Quests] Error fetching daily quests:', error);
    this.emit('error', {
      message: 'Failed to fetch daily quests. Please try again.',
    });
  }
}

/**
 * Claim quest reward
 */
async function handleClaimQuestReward(
  this: Socket,
  data: { playerName: string; questId: number }
): Promise<void> {
  try {
    const { playerName, questId } = data;

    if (!playerName || questId === undefined) {
      this.emit('error', { message: 'Player name and quest ID are required' });
      return;
    }

    const rewards = await claimQuestReward(playerName, questId);

    if (!rewards) {
      this.emit('error', { message: 'Quest not found' });
      return;
    }

    if (!pool) {
      this.emit('error', { message: 'Database not available' });
      return;
    }

    // Get updated player stats (with new XP and level)
    const { rows } = await pool.query(
      `SELECT total_xp, current_level, cosmetic_currency FROM player_stats WHERE player_name = $1`,
      [playerName]
    );

    let levelInfo = { level: 1, currentLevelXP: 0, nextLevelXP: 100 };
    if (rows.length > 0) {
      levelInfo = calculateLevelFromXP(rows[0].total_xp);
    }

    this.emit('quest_reward_claimed', {
      questId,
      rewards,
      newLevel: levelInfo.level,
      currentLevelXP: levelInfo.currentLevelXP,
      nextLevelXP: levelInfo.nextLevelXP,
      totalXP: rows[0]?.total_xp || 0,
      currency: rows[0]?.cosmetic_currency || 0,
    });

    // Refresh quest list
    const updatedQuests = await getPlayerDailyQuests(playerName);
    this.emit('daily_quests', { quests: updatedQuests });
  } catch (error: any) {
    console.error('[Quests] Error claiming quest reward:', error);
    this.emit('error', {
      message: error.message || 'Failed to claim quest reward. Please try again.',
    });
  }
}

/**
 * Update login streak (called on player login)
 */
async function handleUpdateLoginStreak(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const streakInfo = await updateLoginStreak(playerName);

    this.emit('login_streak_updated', {
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      freezeUsed: streakInfo.freezeUsed,
    });

    // If freeze was used, show notification
    if (streakInfo.freezeUsed) {
      this.emit('streak_freeze_used', {
        message: 'Streak freeze used! Your streak continues.',
      });
    }
  } catch (error) {
    console.error('[Quests] Error updating login streak:', error);
    this.emit('error', {
      message: 'Failed to update login streak. Please try again.',
    });
  }
}

/**
 * Get login streak info
 */
async function handleGetLoginStreak(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const streak = await getLoginStreak(playerName);

    if (!streak) {
      this.emit('login_streak', {
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: null,
        streakFreezeAvailable: false,
        totalLogins: 0,
      });
      return;
    }

    this.emit('login_streak', streak);
  } catch (error) {
    console.error('[Quests] Error fetching login streak:', error);
    this.emit('error', {
      message: 'Failed to fetch login streak. Please try again.',
    });
  }
}

/**
 * Get daily rewards calendar
 */
async function handleGetDailyCalendar(this: Socket): Promise<void> {
  try {
    const calendar = await getDailyRewardsCalendar();

    this.emit('daily_calendar', { calendar });
  } catch (error) {
    console.error('[Quests] Error fetching daily calendar:', error);
    this.emit('error', {
      message: 'Failed to fetch daily calendar. Please try again.',
    });
  }
}

/**
 * Get player's calendar progress
 */
async function handleGetPlayerCalendarProgress(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const progress = await getPlayerCalendarProgress(playerName);

    this.emit('calendar_progress', progress);
  } catch (error) {
    console.error('[Quests] Error fetching calendar progress:', error);
    this.emit('error', {
      message: 'Failed to fetch calendar progress. Please try again.',
    });
  }
}

/**
 * Claim calendar reward
 */
async function handleClaimCalendarReward(
  this: Socket,
  data: { playerName: string; dayNumber: number }
): Promise<void> {
  try {
    const { playerName, dayNumber } = data;

    if (!playerName || dayNumber === undefined) {
      this.emit('error', { message: 'Player name and day number are required' });
      return;
    }

    const rewards = await claimCalendarReward(playerName, dayNumber);

    if (!rewards) {
      this.emit('error', { message: 'Invalid calendar reward' });
      return;
    }

    // Get updated calendar progress
    const progress = await getPlayerCalendarProgress(playerName);

    this.emit('calendar_reward_claimed', {
      dayNumber,
      rewards,
      currentDay: progress.currentDay,
      rewardsClaimed: progress.rewardsClaimed,
    });
  } catch (error: any) {
    console.error('[Quests] Error claiming calendar reward:', error);
    this.emit('error', {
      message: error.message || 'Failed to claim calendar reward. Please try again.',
    });
  }
}

/**
 * Get quest statistics
 */
async function handleGetQuestStats(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const stats = await getQuestStats(playerName);

    this.emit('quest_stats', stats);
  } catch (error) {
    console.error('[Quests] Error fetching quest stats:', error);
    this.emit('error', {
      message: 'Failed to fetch quest statistics. Please try again.',
    });
  }
}
