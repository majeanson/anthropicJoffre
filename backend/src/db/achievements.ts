/**
 * Achievement Database Functions
 * Sprint 2 Phase 1
 */

import { query, getPool } from './index';
import {
  Achievement,
  PlayerAchievement,
  AchievementProgress,
} from '../types/achievements';

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  const result = await query(
    'SELECT achievement_id, achievement_key, achievement_name, description, icon, tier, points, is_secret, category, created_at FROM achievements ORDER BY tier, points ASC'
  );
  return result.rows;
}

/**
 * Get player's unlocked achievements
 */
export async function getPlayerAchievements(
  playerName: string
): Promise<AchievementProgress[]> {
  const result = await query(
    `SELECT
      a.*,
      COALESCE(pa.progress, 0) as progress,
      COALESCE(pa.max_progress, 1) as max_progress,
      CASE WHEN pa.id IS NOT NULL THEN true ELSE false END as is_unlocked,
      pa.unlocked_at
    FROM achievements a
    LEFT JOIN player_achievements pa
      ON a.achievement_id = pa.achievement_id
      AND pa.player_name = $1
    ORDER BY a.tier, a.points ASC`,
    [playerName]
  );
  return result.rows;
}

/**
 * Sprint 21: Achievement skin unlock types and helpers
 * Defined before unlockAchievement to avoid forward reference
 */
export interface AchievementSkinUnlock {
  achievement_key: string;
  skin_id: string;
  skin_type: 'special' | 'card' | 'ui';
}

async function getAchievementSkinUnlocksInternal(
  achievementKey: string
): Promise<AchievementSkinUnlock[]> {
  try {
    const result = await query(
      `SELECT achievement_key, skin_id, skin_type
       FROM achievement_skin_unlocks
       WHERE achievement_key = $1`,
      [achievementKey]
    );
    return result.rows;
  } catch (error) {
    // Table may not exist yet
    return [];
  }
}

async function awardAchievementSkinsInternal(
  playerName: string,
  achievementKey: string
): Promise<string[]> {
  const unlockedSkins: string[] = [];

  try {
    const skinUnlocks = await getAchievementSkinUnlocksInternal(achievementKey);

    for (const unlock of skinUnlocks) {
      if (unlock.skin_type === 'special') {
        await query(
          `INSERT INTO player_special_card_skins (player_name, skin_id)
           VALUES ($1, $2)
           ON CONFLICT (player_name, skin_id) DO NOTHING`,
          [playerName, unlock.skin_id]
        );
        unlockedSkins.push(unlock.skin_id);
      } else if (unlock.skin_type === 'card') {
        await query(
          `INSERT INTO player_card_skin_purchases (player_name, card_skin_id, price_paid)
           VALUES ($1, $2, 0)
           ON CONFLICT (player_name, card_skin_id) DO NOTHING`,
          [playerName, unlock.skin_id]
        );
        unlockedSkins.push(unlock.skin_id);
      } else if (unlock.skin_type === 'ui') {
        await query(
          `INSERT INTO player_skin_unlocks (player_name, skin_id)
           VALUES ($1, $2)
           ON CONFLICT (player_name, skin_id) DO NOTHING`,
          [playerName, unlock.skin_id]
        );
        unlockedSkins.push(unlock.skin_id);
      }
    }

    if (unlockedSkins.length > 0) {
      console.log(`[Achievement] Awarded ${unlockedSkins.length} skins to ${playerName} for ${achievementKey}:`, unlockedSkins);
    }
  } catch (error) {
    console.error('Error awarding achievement skins:', error);
  }

  return unlockedSkins;
}

/**
 * Unlock achievement for player
 */
export async function unlockAchievement(
  playerName: string,
  achievementKey: string
): Promise<{ achievement: Achievement; isNewUnlock: boolean; unlockedSkins: string[] }> {
  // Get achievement
  const achievementResult = await query(
    'SELECT achievement_id, achievement_key, achievement_name, description, icon, tier, points, is_secret, category, created_at FROM achievements WHERE achievement_key = $1',
    [achievementKey]
  );

  if (achievementResult.rows.length === 0) {
    throw new Error(`Achievement not found: ${achievementKey}`);
  }

  const achievement = achievementResult.rows[0];
  let unlockedSkins: string[] = [];

  // Check if already unlocked
  const existingResult = await query(
    'SELECT id FROM player_achievements WHERE player_name = $1 AND achievement_id = $2',
    [playerName, achievement.achievement_id]
  );

  const isNewUnlock = existingResult.rows.length === 0;

  if (isNewUnlock) {
    // Insert new unlock
    await query(
      `INSERT INTO player_achievements (player_name, achievement_id, progress, max_progress)
       VALUES ($1, $2, $3, $3)
       ON CONFLICT (player_name, achievement_id) DO NOTHING`,
      [playerName, achievement.achievement_id, achievement.max_progress || 1]
    );

    // Calculate coin reward based on tier
    const coinRewardByTier: Record<string, number> = {
      bronze: 100,
      silver: 250,
      gold: 500,
      platinum: 1000,
    };
    const coinReward = coinRewardByTier[achievement.tier] || 100;

    // Update player's achievement points and award coins
    await query(
      `UPDATE player_stats
       SET achievement_points = achievement_points + $1,
           cosmetic_currency = COALESCE(cosmetic_currency, 100) + $2
       WHERE player_name = $3`,
      [achievement.points, coinReward, playerName]
    );

    // Sprint 21: Award any skins linked to this achievement
    unlockedSkins = await awardAchievementSkinsInternal(playerName, achievementKey);
  }

  return { achievement, isNewUnlock, unlockedSkins };
}

/**
 * Update progress for incremental achievement
 */
export async function updateAchievementProgress(
  playerName: string,
  achievementKey: string,
  progressIncrement: number = 1
): Promise<{ achievement: Achievement; progress: number; unlocked: boolean }> {
  // Get achievement
  const achievementResult = await query(
    'SELECT achievement_id, achievement_key, achievement_name, description, icon, tier, points, is_secret, category, created_at FROM achievements WHERE achievement_key = $1',
    [achievementKey]
  );

  if (achievementResult.rows.length === 0) {
    throw new Error(`Achievement not found: ${achievementKey}`);
  }

  const achievement = achievementResult.rows[0];
  const maxProgress = achievement.max_progress || 1;

  // Upsert progress
  const result = await query(
    `INSERT INTO player_achievements (player_name, achievement_id, progress, max_progress)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (player_name, achievement_id)
     DO UPDATE SET progress = player_achievements.progress + $3
     RETURNING progress`,
    [playerName, achievement.achievement_id, progressIncrement, maxProgress]
  );

  const newProgress = result.rows[0].progress;
  const unlocked = newProgress >= maxProgress;

  // If just unlocked, update achievement points AND award coins based on tier
  if (unlocked && newProgress - progressIncrement < maxProgress) {
    // Calculate coin reward based on tier
    const coinRewardByTier: Record<string, number> = {
      bronze: 100,
      silver: 250,
      gold: 500,
      platinum: 1000,
    };
    const coinReward = coinRewardByTier[achievement.tier] || 100;

    await query(
      `UPDATE player_stats
       SET achievement_points = achievement_points + $1,
           cosmetic_currency = COALESCE(cosmetic_currency, 100) + $2
       WHERE player_name = $3`,
      [achievement.points, coinReward, playerName]
    );
  }

  return { achievement, progress: newProgress, unlocked };
}

/**
 * Get player's total achievement points
 */
export async function getPlayerAchievementPoints(
  playerName: string
): Promise<number> {
  const result = await query(
    'SELECT achievement_points FROM player_stats WHERE player_name = $1',
    [playerName]
  );

  if (result.rows.length === 0) {
    return 0;
  }

  return result.rows[0].achievement_points || 0;
}

/**
 * Get achievement leaderboard (top players by achievement points)
 */
export async function getAchievementLeaderboard(
  limit: number = 10
): Promise<Array<{ player_name: string; achievement_points: number; rank: number }>> {
  const result = await query(
    `SELECT
      player_name,
      achievement_points,
      ROW_NUMBER() OVER (ORDER BY achievement_points DESC) as rank
    FROM player_stats
    WHERE achievement_points > 0
    ORDER BY achievement_points DESC
    LIMIT $1`,
    [limit]
  );

  return result.rows;
}

/**
 * Reset all achievements for a player (for testing)
 */
export async function resetPlayerAchievements(playerName: string): Promise<void> {
  const pool = await getPool();
  if (!pool) return;

  await pool.query(
    `DELETE FROM player_achievements WHERE player_name = $1`,
    [playerName]
  );
}

/**
 * Sprint 21: Public exports for skin unlock functions
 * (Internal functions are defined above unlockAchievement to avoid forward references)
 */
export async function getAchievementSkinUnlocks(
  achievementKey: string
): Promise<AchievementSkinUnlock[]> {
  return getAchievementSkinUnlocksInternal(achievementKey);
}

/**
 * Sprint 21: Get all skins unlocked by a player's achievements
 */
export async function getPlayerAchievementSkinUnlocks(
  playerName: string
): Promise<AchievementSkinUnlock[]> {
  try {
    const result = await query(
      `SELECT asu.achievement_key, asu.skin_id, asu.skin_type
       FROM achievement_skin_unlocks asu
       INNER JOIN player_achievements pa
         ON pa.achievement_id = (
           SELECT a.achievement_id FROM achievements a WHERE a.achievement_key = asu.achievement_key
         )
       WHERE pa.player_name = $1`,
      [playerName]
    );
    return result.rows;
  } catch (error) {
    // Table may not exist yet
    console.warn('Error getting player achievement skin unlocks:', error);
    return [];
  }
}

/**
 * Sprint 21: Award skin when achievement is unlocked (public export)
 */
export async function awardAchievementSkins(
  playerName: string,
  achievementKey: string
): Promise<string[]> {
  return awardAchievementSkinsInternal(playerName, achievementKey);
}
