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
  // Weekly calendar (Sprint 20)
  getWeeklyCalendar,
  getPlayerWeeklyProgress,
  claimWeeklyReward,
} from '../db/quests';
import { calculateLevelFromXP } from '../game/quests';
import {
  getSkinRequirements,
  getPlayerUnlockedSkins,
  getPlayerLevel,
  checkAndUnlockSkins,
  getPlayerSkinStatus,
  updatePlayerLevel,
} from '../db/skins';
import { unlockAchievement } from '../db/achievements';

// Tutorial step rewards (XP and currency)
const TUTORIAL_REWARDS = {
  xp: 5,       // XP per tutorial step
  currency: 3, // Coins per tutorial step
} as const;

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

  // Tutorial completion rewards
  socket.on('complete_tutorial_step', async function(this: Socket, data: { playerName: string; stepId: string }) {
    await handleCompleteTutorialStep.call(this, data);
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

  // Weekly calendar handlers (Sprint 20)
  socket.on('get_weekly_calendar', async function(this: Socket) {
    await handleGetWeeklyCalendar.call(this);
  });

  socket.on('get_player_weekly_progress', async function(this: Socket, data: { playerName: string }) {
    await handleGetPlayerWeeklyProgress.call(this, data);
  });

  socket.on('claim_weekly_reward', async function(this: Socket, data: { playerName: string; dayNumber: number }) {
    await handleClaimWeeklyReward.call(this, data);
  });

  // Skin unlock handlers (Sprint 20)
  socket.on('get_skin_requirements', async function(this: Socket) {
    await handleGetSkinRequirements.call(this);
  });

  socket.on('get_player_unlocked_skins', async function(this: Socket, data: { playerName: string }) {
    await handleGetPlayerUnlockedSkins.call(this, data);
  });

  socket.on('get_player_skin_status', async function(this: Socket, data: { playerName: string }) {
    await handleGetPlayerSkinStatus.call(this, data);
  });

  socket.on('get_player_progression', async function(this: Socket, data: { playerName: string }) {
    await handleGetPlayerProgression.call(this, data);
  });

  socket.on('check_skin_unlocks', async function(this: Socket, data: { playerName: string }) {
    await handleCheckSkinUnlocks.call(this, data);
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

    // If freeze was used, show notification and check for freeze achievement
    if (streakInfo.freezeUsed) {
      this.emit('streak_freeze_used', {
        message: 'Streak freeze used! Your streak continues.',
      });

      // Sprint 21: Unlock "Saved by the Bell" achievement
      try {
        const result = await unlockAchievement(playerName, 'login_streak_freeze_save');
        if (result.isNewUnlock) {
          this.emit('achievement_unlocked', {
            playerName,
            achievement: result.achievement,
            isNewUnlock: true,
          });
        }
      } catch {
        // Achievement may not exist yet, ignore
      }
    }

    // Sprint 21: Check login streak achievements
    const streakMilestones = [
      { threshold: 3, key: 'login_streak_3' },
      { threshold: 7, key: 'login_streak_7' },
      { threshold: 14, key: 'login_streak_14' },
      { threshold: 30, key: 'login_streak_30' },
    ];

    for (const { threshold, key } of streakMilestones) {
      if (streakInfo.currentStreak >= threshold) {
        try {
          const result = await unlockAchievement(playerName, key);
          if (result.isNewUnlock) {
            this.emit('achievement_unlocked', {
              playerName,
              achievement: result.achievement,
              isNewUnlock: true,
            });
          }
        } catch {
          // Achievement may not exist yet, ignore
        }
      }
    }

    // Sprint 21: Check total logins achievements (get from login_streaks table)
    if (pool) {
      try {
        const loginResult = await pool.query(
          'SELECT total_logins FROM login_streaks WHERE player_name = $1',
          [playerName]
        );
        if (loginResult.rows.length > 0) {
          const totalLogins = loginResult.rows[0].total_logins || 0;
          const loginMilestones = [
            { threshold: 50, key: 'total_logins_50' },
            { threshold: 100, key: 'total_logins_100' },
            { threshold: 365, key: 'total_logins_365' },
          ];

          for (const { threshold, key } of loginMilestones) {
            if (totalLogins >= threshold) {
              try {
                const result = await unlockAchievement(playerName, key);
                if (result.isNewUnlock) {
                  this.emit('achievement_unlocked', {
                    playerName,
                    achievement: result.achievement,
                    isNewUnlock: true,
                  });
                }
              } catch {
                // Achievement may not exist yet, ignore
              }
            }
          }
        }
      } catch {
        // Error checking total logins, ignore
      }
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

// ============================================================================
// Weekly Calendar Handlers (Sprint 20)
// ============================================================================

/**
 * Get weekly rewards calendar (7 days Mon-Sun)
 */
async function handleGetWeeklyCalendar(this: Socket): Promise<void> {
  try {
    const calendar = await getWeeklyCalendar();
    this.emit('weekly_calendar', { calendar });
  } catch (error) {
    console.error('[Quests] Error fetching weekly calendar:', error);
    this.emit('error', {
      message: 'Failed to fetch weekly calendar. Please try again.',
    });
  }
}

/**
 * Get player's weekly progress
 */
async function handleGetPlayerWeeklyProgress(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const progress = await getPlayerWeeklyProgress(playerName);
    this.emit('weekly_progress', progress);
  } catch (error) {
    console.error('[Quests] Error fetching weekly progress:', error);
    this.emit('error', {
      message: 'Failed to fetch weekly progress. Please try again.',
    });
  }
}

/**
 * Claim weekly calendar reward
 */
async function handleClaimWeeklyReward(
  this: Socket,
  data: { playerName: string; dayNumber: number }
): Promise<void> {
  try {
    const { playerName, dayNumber } = data;

    if (!playerName || dayNumber === undefined) {
      this.emit('error', { message: 'Player name and day number are required' });
      return;
    }

    const result = await claimWeeklyReward(playerName, dayNumber);

    if (!result.success) {
      this.emit('error', { message: result.message });
      return;
    }

    // Check for level up after awarding XP
    const levelResult = await updatePlayerLevel(playerName);

    // Check for new skin unlocks if leveled up
    let newlyUnlockedSkins: string[] = [];
    if (levelResult.leveledUp) {
      const skinResult = await checkAndUnlockSkins(playerName);
      newlyUnlockedSkins = skinResult.newlyUnlocked;
    }

    // Get updated player level info
    const levelInfo = await getPlayerLevel(playerName);
    const xpInfo = calculateLevelFromXP(levelInfo.totalXp);

    this.emit('weekly_reward_claimed', {
      dayNumber,
      xp: result.xp,
      currency: result.currency,
      message: result.message,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
      oldLevel: levelResult.oldLevel,
      newlyUnlockedSkins,
      currentLevelXP: xpInfo.currentLevelXP,
      nextLevelXP: xpInfo.nextLevelXP,
      totalXP: levelInfo.totalXp,
      totalCurrency: levelInfo.cosmeticCurrency,
    });

    // Refresh weekly progress
    const progress = await getPlayerWeeklyProgress(playerName);
    this.emit('weekly_progress', progress);
  } catch (error: any) {
    console.error('[Quests] Error claiming weekly reward:', error);
    this.emit('error', {
      message: error.message || 'Failed to claim weekly reward. Please try again.',
    });
  }
}

// ============================================================================
// Skin Unlock Handlers (Sprint 20)
// ============================================================================

/**
 * Get all skin requirements
 */
async function handleGetSkinRequirements(this: Socket): Promise<void> {
  try {
    const requirements = await getSkinRequirements();
    this.emit('skin_requirements', { requirements });
  } catch (error) {
    console.error('[Quests] Error fetching skin requirements:', error);
    this.emit('error', {
      message: 'Failed to fetch skin requirements. Please try again.',
    });
  }
}

/**
 * Get player's unlocked skins
 */
async function handleGetPlayerUnlockedSkins(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const unlockedSkins = await getPlayerUnlockedSkins(playerName);
    this.emit('player_unlocked_skins', { unlockedSkins });
  } catch (error) {
    console.error('[Quests] Error fetching unlocked skins:', error);
    this.emit('error', {
      message: 'Failed to fetch unlocked skins. Please try again.',
    });
  }
}

/**
 * Get player's full skin status (all skins with unlock status)
 */
async function handleGetPlayerSkinStatus(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const skins = await getPlayerSkinStatus(playerName);
    const levelInfo = await getPlayerLevel(playerName);

    this.emit('player_skin_status', {
      skins,
      playerLevel: levelInfo.level,
    });
  } catch (error) {
    console.error('[Quests] Error fetching skin status:', error);
    this.emit('error', {
      message: 'Failed to fetch skin status. Please try again.',
    });
  }
}

/**
 * Get player's full progression info (level, XP, currency, unlocked skins)
 */
async function handleGetPlayerProgression(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const levelInfo = await getPlayerLevel(playerName);
    const xpInfo = calculateLevelFromXP(levelInfo.totalXp);
    const unlockedSkins = await getPlayerUnlockedSkins(playerName);
    const streak = await getLoginStreak(playerName);
    const questStats = await getQuestStats(playerName);

    this.emit('player_progression', {
      level: levelInfo.level,
      totalXp: levelInfo.totalXp,
      currentLevelXP: xpInfo.currentLevelXP,
      nextLevelXP: xpInfo.nextLevelXP,
      cosmeticCurrency: levelInfo.cosmeticCurrency,
      unlockedSkins,
      streak: streak || { currentStreak: 0, longestStreak: 0, totalLogins: 0 },
      questStats,
    });
  } catch (error) {
    console.error('[Quests] Error fetching player progression:', error);
    this.emit('error', {
      message: 'Failed to fetch player progression. Please try again.',
    });
  }
}

/**
 * Check and unlock any earned skins based on player level
 */
async function handleCheckSkinUnlocks(
  this: Socket,
  data: { playerName: string }
): Promise<void> {
  try {
    const { playerName } = data;

    if (!playerName) {
      this.emit('error', { message: 'Player name is required' });
      return;
    }

    const result = await checkAndUnlockSkins(playerName);

    this.emit('skin_unlocks_checked', {
      newlyUnlocked: result.newlyUnlocked,
      playerLevel: result.playerLevel,
    });

    // If there are new unlocks, emit a special notification event
    if (result.newlyUnlocked.length > 0) {
      this.emit('new_skins_unlocked', {
        skins: result.newlyUnlocked,
        playerLevel: result.playerLevel,
      });
    }
  } catch (error) {
    console.error('[Quests] Error checking skin unlocks:', error);
    this.emit('error', {
      message: 'Failed to check skin unlocks. Please try again.',
    });
  }
}

// ============================================================================
// Tutorial Completion Handlers
// ============================================================================

/**
 * Handle tutorial step completion - awards XP and currency
 */
async function handleCompleteTutorialStep(
  this: Socket,
  data: { playerName: string; stepId: string }
): Promise<void> {
  try {
    const { playerName, stepId } = data;

    if (!playerName || !stepId) {
      this.emit('error', { message: 'Player name and step ID are required' });
      return;
    }

    if (!pool) {
      this.emit('error', { message: 'Database not available' });
      return;
    }

    // Check if this tutorial step was already completed (to prevent double rewards)
    const checkResult = await pool.query(
      `SELECT 1 FROM player_tutorial_progress WHERE player_name = $1 AND step_id = $2`,
      [playerName, stepId]
    );

    if (checkResult.rows.length > 0) {
      // Already completed, don't award again but still emit success
      this.emit('tutorial_step_completed', {
        stepId,
        xp: 0,
        currency: 0,
        alreadyCompleted: true,
      });
      return;
    }

    // Record the tutorial completion
    await pool.query(
      `INSERT INTO player_tutorial_progress (player_name, step_id, completed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (player_name, step_id) DO NOTHING`,
      [playerName, stepId]
    );

    // Award XP and currency
    await pool.query(
      `UPDATE player_stats
       SET total_xp = total_xp + $1,
           cosmetic_currency = cosmetic_currency + $2
       WHERE player_name = $3`,
      [TUTORIAL_REWARDS.xp, TUTORIAL_REWARDS.currency, playerName]
    );

    // Check for level up
    const levelResult = await updatePlayerLevel(playerName);

    // Check for new skin unlocks if leveled up
    let newlyUnlockedSkins: string[] = [];
    if (levelResult.leveledUp) {
      const skinResult = await checkAndUnlockSkins(playerName);
      newlyUnlockedSkins = skinResult.newlyUnlocked;
    }

    // Get updated stats
    const statsResult = await pool.query(
      `SELECT total_xp, current_level, cosmetic_currency FROM player_stats WHERE player_name = $1`,
      [playerName]
    );

    const totalXp = statsResult.rows[0]?.total_xp || 0;
    const xpInfo = calculateLevelFromXP(totalXp);

    this.emit('tutorial_step_completed', {
      stepId,
      xp: TUTORIAL_REWARDS.xp,
      currency: TUTORIAL_REWARDS.currency,
      alreadyCompleted: false,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
      currentLevelXP: xpInfo.currentLevelXP,
      nextLevelXP: xpInfo.nextLevelXP,
      totalXP: totalXp,
      totalCurrency: statsResult.rows[0]?.cosmetic_currency || 0,
      newlyUnlockedSkins,
    });
  } catch (error) {
    console.error('[Quests] Error completing tutorial step:', error);
    this.emit('error', {
      message: 'Failed to complete tutorial step. Please try again.',
    });
  }
}
