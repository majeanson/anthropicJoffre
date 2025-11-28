/**
 * Quest Database Operations
 *
 * Sprint 19: Daily Engagement System
 *
 * Handles all database operations for the quest system:
 * - Daily quest assignment and tracking
 * - Login streak management
 * - Reward calendar progress
 * - Quest progress updates and completion
 */

import pool from './index';
import {
  QuestTemplate,
  PlayerQuest,
  QuestProgress,
  GameQuestContext,
  calculateQuestProgress,
  isQuestCompleted,
  canClaimQuestReward,
} from '../game/quests';

/**
 * Get all active quest templates
 */
export async function getAllQuestTemplates(): Promise<QuestTemplate[]> {
  const result = await pool.query<QuestTemplate>(
    `SELECT * FROM quest_templates WHERE is_active = TRUE ORDER BY quest_type, id`
  );

  return result.rows;
}

/**
 * Get a player's daily quests for today
 * Automatically assigns new quests if none exist for today
 */
export async function getPlayerDailyQuests(
  playerName: string
): Promise<PlayerQuest[]> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Call the auto-assign function (creates quests if none exist for today)
    await client.query(`SELECT assign_daily_quests($1)`, [playerName]);

    // Fetch player's quests for today with template details
    const result = await client.query<PlayerQuest>(
      `
      SELECT
        pdq.*,
        row_to_json(qt.*) as template
      FROM player_daily_quests pdq
      JOIN quest_templates qt ON pdq.quest_template_id = qt.id
      WHERE pdq.player_name = $1
        AND pdq.date_assigned = CURRENT_DATE
      ORDER BY qt.quest_type, pdq.id
      `,
      [playerName]
    );

    await client.query('COMMIT');

    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Quests DB] Error fetching player quests:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update quest progress for a player after a game
 * Returns array of quests that made progress
 */
export async function updateQuestProgress(
  context: GameQuestContext
): Promise<QuestProgress[]> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get player's active quests for today
    const questsResult = await client.query<PlayerQuest>(
      `
      SELECT
        pdq.*,
        row_to_json(qt.*) as template
      FROM player_daily_quests pdq
      JOIN quest_templates qt ON pdq.quest_template_id = qt.id
      WHERE pdq.player_name = $1
        AND pdq.date_assigned = CURRENT_DATE
        AND pdq.completed = FALSE
      `,
      [context.playerName]
    );

    const questProgressUpdates: QuestProgress[] = [];

    // Update each quest
    for (const quest of questsResult.rows) {
      const progressDelta = calculateQuestProgress(quest, context);

      if (progressDelta === 0) {
        continue; // No progress for this quest
      }

      const newProgress = quest.progress + progressDelta;
      const completed = isQuestCompleted(quest.progress, progressDelta, quest.template!.target_value);

      // Update quest in database
      await client.query(
        `
        UPDATE player_daily_quests
        SET progress = $1,
            completed = $2,
            completed_at = CASE WHEN $2 = TRUE THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = $3
        `,
        [newProgress, completed, quest.id]
      );

      // Log quest progress event
      await client.query(
        `
        INSERT INTO quest_progress_events (player_name, quest_template_id, event_type, progress_delta, game_id)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          context.playerName,
          quest.quest_template_id,
          completed ? 'completed' : 'progress',
          progressDelta,
          context.gameId,
        ]
      );

      questProgressUpdates.push({
        questId: quest.id,
        progressDelta,
        newProgress,
        completed,
        questName: quest.template!.name,
      });
    }

    await client.query('COMMIT');

    return questProgressUpdates;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Quests DB] Error updating quest progress:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Claim quest rewards (XP and currency)
 * Returns the rewards granted
 */
export async function claimQuestReward(
  playerName: string,
  questId: number
): Promise<{ xp: number; currency: number } | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get quest details
    const questResult = await client.query<PlayerQuest>(
      `
      SELECT
        pdq.*,
        row_to_json(qt.*) as template
      FROM player_daily_quests pdq
      JOIN quest_templates qt ON pdq.quest_template_id = qt.id
      WHERE pdq.id = $1 AND pdq.player_name = $2
      `,
      [questId, playerName]
    );

    if (questResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const quest = questResult.rows[0];

    // Validate claim
    const validation = canClaimQuestReward(quest);
    if (!validation.canClaim) {
      await client.query('ROLLBACK');
      throw new Error(validation.reason);
    }

    const { reward_xp, reward_currency } = quest.template!;

    // Mark quest as claimed
    await client.query(
      `
      UPDATE player_daily_quests
      SET reward_claimed = TRUE,
          claimed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [questId]
    );

    // Award XP and currency to player
    await client.query(
      `
      UPDATE player_stats
      SET total_xp = total_xp + $1,
          cosmetic_currency = cosmetic_currency + $2
      WHERE player_name = $3
      `,
      [reward_xp, reward_currency, playerName]
    );

    // Log claim event
    await client.query(
      `
      INSERT INTO quest_progress_events (player_name, quest_template_id, event_type)
      VALUES ($1, $2, 'claimed')
      `,
      [playerName, quest.quest_template_id]
    );

    await client.query('COMMIT');

    return {
      xp: reward_xp,
      currency: reward_currency,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Quests DB] Error claiming quest reward:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update login streak for a player
 * Returns updated streak info
 */
export async function updateLoginStreak(playerName: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  freezeUsed: boolean;
}> {
  const result = await pool.query<{
    current_streak: number;
    longest_streak: number;
    freeze_used: boolean;
  }>(
    `SELECT * FROM update_login_streak($1)`,
    [playerName]
  );

  if (result.rows.length === 0) {
    throw new Error('Failed to update login streak');
  }

  return {
    currentStreak: result.rows[0].current_streak,
    longestStreak: result.rows[0].longest_streak,
    freezeUsed: result.rows[0].freeze_used,
  };
}

/**
 * Get login streak for a player
 */
export async function getLoginStreak(playerName: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  streakFreezeAvailable: boolean;
  totalLogins: number;
} | null> {
  const result = await pool.query(
    `
    SELECT
      current_streak,
      longest_streak,
      last_login_date,
      streak_freeze_available,
      total_logins
    FROM login_streaks
    WHERE player_name = $1
    `,
    [playerName]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    currentStreak: result.rows[0].current_streak,
    longestStreak: result.rows[0].longest_streak,
    lastLoginDate: result.rows[0].last_login_date,
    streakFreezeAvailable: result.rows[0].streak_freeze_available,
    totalLogins: result.rows[0].total_logins,
  };
}

/**
 * Get daily rewards calendar
 */
export async function getDailyRewardsCalendar(): Promise<
  Array<{
    dayNumber: number;
    rewardType: string;
    rewardAmount: number | null;
    rewardItemId: number | null;
    isSpecial: boolean;
    icon: string;
    description: string;
  }>
> {
  const result = await pool.query(
    `
    SELECT
      day_number,
      reward_type,
      reward_amount,
      reward_item_id,
      is_special,
      icon,
      description
    FROM daily_rewards_calendar
    ORDER BY day_number
    `
  );

  return result.rows.map(row => ({
    dayNumber: row.day_number,
    rewardType: row.reward_type,
    rewardAmount: row.reward_amount,
    rewardItemId: row.reward_item_id,
    isSpecial: row.is_special,
    icon: row.icon,
    description: row.description,
  }));
}

/**
 * Get player's calendar progress
 * Auto-creates if doesn't exist
 */
export async function getPlayerCalendarProgress(playerName: string): Promise<{
  currentDay: number;
  rewardsClaimed: number[];
  monthStartDate: string;
  lastClaimedDate: string | null;
  calendarResets: number;
}> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get or create calendar progress
    let result = await client.query(
      `
      SELECT
        current_day,
        rewards_claimed,
        month_start_date,
        last_claimed_date,
        calendar_resets
      FROM player_calendar_progress
      WHERE player_name = $1
        AND month_start_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY month_start_date DESC
      LIMIT 1
      `,
      [playerName]
    );

    // Create if doesn't exist
    if (result.rows.length === 0) {
      await client.query(
        `
        INSERT INTO player_calendar_progress (player_name, current_day, month_start_date)
        VALUES ($1, 1, CURRENT_DATE)
        `,
        [playerName]
      );

      result = await client.query(
        `
        SELECT
          current_day,
          rewards_claimed,
          month_start_date,
          last_claimed_date,
          calendar_resets
        FROM player_calendar_progress
        WHERE player_name = $1
        ORDER BY month_start_date DESC
        LIMIT 1
        `,
        [playerName]
      );
    }

    await client.query('COMMIT');

    return {
      currentDay: result.rows[0].current_day,
      rewardsClaimed: result.rows[0].rewards_claimed || [],
      monthStartDate: result.rows[0].month_start_date,
      lastClaimedDate: result.rows[0].last_claimed_date,
      calendarResets: result.rows[0].calendar_resets,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Quests DB] Error fetching calendar progress:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Claim daily calendar reward
 */
export async function claimCalendarReward(
  playerName: string,
  dayNumber: number
): Promise<{ xp?: number; currency?: number } | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get player's calendar progress
    const progressResult = await client.query(
      `
      SELECT * FROM player_calendar_progress
      WHERE player_name = $1
      ORDER BY month_start_date DESC
      LIMIT 1
      `,
      [playerName]
    );

    if (progressResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const progress = progressResult.rows[0];
    const rewardsClaimed: number[] = progress.rewards_claimed || [];

    // Check if already claimed
    if (rewardsClaimed.includes(dayNumber)) {
      await client.query('ROLLBACK');
      throw new Error('Reward already claimed');
    }

    // Check if can claim (must be current day or earlier)
    if (dayNumber > progress.current_day) {
      await client.query('ROLLBACK');
      throw new Error('Cannot claim future rewards');
    }

    // Get reward details
    const rewardResult = await pool.query(
      `SELECT * FROM daily_rewards_calendar WHERE day_number = $1`,
      [dayNumber]
    );

    if (rewardResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const reward = rewardResult.rows[0];

    // Update calendar progress
    await client.query(
      `
      UPDATE player_calendar_progress
      SET rewards_claimed = array_append(rewards_claimed, $1),
          last_claimed_date = CURRENT_DATE,
          current_day = CASE
            WHEN $1 = current_day AND current_day < 30 THEN current_day + 1
            WHEN $1 = 30 THEN 1
            ELSE current_day
          END,
          calendar_resets = CASE
            WHEN $1 = 30 THEN calendar_resets + 1
            ELSE calendar_resets
          END,
          month_start_date = CASE
            WHEN $1 = 30 THEN CURRENT_DATE
            ELSE month_start_date
          END
      WHERE player_name = $2
        AND month_start_date = $3
      `,
      [dayNumber, playerName, progress.month_start_date]
    );

    // Award rewards based on type
    const rewards: { xp?: number; currency?: number } = {};

    if (reward.reward_type === 'xp') {
      await client.query(
        `UPDATE player_stats SET total_xp = total_xp + $1 WHERE player_name = $2`,
        [reward.reward_amount, playerName]
      );
      rewards.xp = reward.reward_amount;
    } else if (reward.reward_type === 'currency') {
      await client.query(
        `UPDATE player_stats SET cosmetic_currency = cosmetic_currency + $1 WHERE player_name = $2`,
        [reward.reward_amount, playerName]
      );
      rewards.currency = reward.reward_amount;
    }

    await client.query('COMMIT');

    return rewards;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Quests DB] Error claiming calendar reward:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get quest completion statistics for a player
 */
export async function getQuestStats(playerName: string): Promise<{
  totalQuestsCompleted: number;
  totalQuestsClaimed: number;
  questsCompletedToday: number;
  totalXpEarned: number;
  totalCurrencyEarned: number;
}> {
  const result = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE completed = TRUE) as total_completed,
      COUNT(*) FILTER (WHERE reward_claimed = TRUE) as total_claimed,
      COUNT(*) FILTER (WHERE completed = TRUE AND date_assigned = CURRENT_DATE) as completed_today,
      COALESCE(SUM(qt.reward_xp) FILTER (WHERE pdq.reward_claimed = TRUE), 0) as total_xp,
      COALESCE(SUM(qt.reward_currency) FILTER (WHERE pdq.reward_claimed = TRUE), 0) as total_currency
    FROM player_daily_quests pdq
    JOIN quest_templates qt ON pdq.quest_template_id = qt.id
    WHERE pdq.player_name = $1
    `,
    [playerName]
  );

  return {
    totalQuestsCompleted: parseInt(result.rows[0].total_completed) || 0,
    totalQuestsClaimed: parseInt(result.rows[0].total_claimed) || 0,
    questsCompletedToday: parseInt(result.rows[0].completed_today) || 0,
    totalXpEarned: parseInt(result.rows[0].total_xp) || 0,
    totalCurrencyEarned: parseInt(result.rows[0].total_currency) || 0,
  };
}
