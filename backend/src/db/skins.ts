/**
 * Skin Database Operations
 *
 * Sprint 20: Skin Unlock System
 *
 * Handles all database operations for the skin unlock system:
 * - Fetching skin requirements
 * - Tracking player unlocked skins
 * - Checking and unlocking skins based on level
 */

import pool from './index';

export interface SkinRequirement {
  skinId: string;
  requiredLevel: number;
  unlockDescription: string;
  displayOrder: number;
}

export interface PlayerSkinUnlock {
  skinId: string;
  unlockedAt: string;
}

/**
 * Get all skin requirements
 */
export async function getSkinRequirements(): Promise<SkinRequirement[]> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return [];
  }

  const result = await pool.query(
    `
    SELECT skin_id, required_level, unlock_description, display_order
    FROM skin_requirements
    ORDER BY display_order
    `
  );

  return result.rows.map(row => ({
    skinId: row.skin_id,
    requiredLevel: row.required_level,
    unlockDescription: row.unlock_description,
    displayOrder: row.display_order,
  }));
}

/**
 * Get a player's unlocked skins
 */
export async function getPlayerUnlockedSkins(playerName: string): Promise<string[]> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return [];
  }

  const result = await pool.query(
    `
    SELECT skin_id
    FROM player_skin_unlocks
    WHERE player_name = $1
    ORDER BY unlocked_at
    `,
    [playerName]
  );

  return result.rows.map(row => row.skin_id);
}

/**
 * Get a player's level and XP from player_stats
 */
export async function getPlayerLevel(playerName: string): Promise<{
  level: number;
  totalXp: number;
  cosmeticCurrency: number;
}> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return { level: 1, totalXp: 0, cosmeticCurrency: 0 };
  }

  const result = await pool.query(
    `
    SELECT current_level, total_xp, cosmetic_currency
    FROM player_stats
    WHERE player_name = $1
    `,
    [playerName]
  );

  if (result.rows.length === 0) {
    return { level: 1, totalXp: 0, cosmeticCurrency: 0 };
  }

  return {
    level: result.rows[0].current_level || 1,
    totalXp: result.rows[0].total_xp || 0,
    cosmeticCurrency: result.rows[0].cosmetic_currency || 0,
  };
}

/**
 * Check and unlock any skins the player has earned based on their level
 * Returns array of newly unlocked skin IDs
 */
export async function checkAndUnlockSkins(playerName: string): Promise<{
  newlyUnlocked: string[];
  playerLevel: number;
}> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return { newlyUnlocked: [], playerLevel: 1 };
  }

  const result = await pool.query<{
    newly_unlocked: string[];
    player_level: number;
  }>(
    `SELECT * FROM check_skin_unlocks($1)`,
    [playerName]
  );

  if (result.rows.length === 0) {
    return { newlyUnlocked: [], playerLevel: 1 };
  }

  return {
    newlyUnlocked: result.rows[0].newly_unlocked || [],
    playerLevel: result.rows[0].player_level || 1,
  };
}

/**
 * Manually unlock a skin for a player (e.g., for achievements)
 */
export async function unlockSkin(playerName: string, skinId: string): Promise<boolean> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return false;
  }

  try {
    await pool.query(
      `
      INSERT INTO player_skin_unlocks (player_name, skin_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [playerName, skinId]
    );
    return true;
  } catch (error) {
    console.error('[Skins DB] Error unlocking skin:', error);
    return false;
  }
}

/**
 * Get all skins with their unlock status for a player
 */
export async function getPlayerSkinStatus(playerName: string): Promise<Array<{
  skinId: string;
  requiredLevel: number;
  unlockDescription: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
}>> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return [];
  }

  const result = await pool.query(
    `
    SELECT
      sr.skin_id,
      sr.required_level,
      sr.unlock_description,
      psu.unlocked_at IS NOT NULL as is_unlocked,
      psu.unlocked_at
    FROM skin_requirements sr
    LEFT JOIN player_skin_unlocks psu
      ON sr.skin_id = psu.skin_id AND psu.player_name = $1
    ORDER BY sr.display_order
    `,
    [playerName]
  );

  return result.rows.map(row => ({
    skinId: row.skin_id,
    requiredLevel: row.required_level,
    unlockDescription: row.unlock_description,
    isUnlocked: row.is_unlocked,
    unlockedAt: row.unlocked_at,
  }));
}

/**
 * Update player level based on XP
 * Returns new level if leveled up, null otherwise
 */
export async function updatePlayerLevel(playerName: string): Promise<{
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
}> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return { oldLevel: 1, newLevel: 1, leveledUp: false };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current XP and level
    const statsResult = await client.query(
      `
      SELECT total_xp, current_level
      FROM player_stats
      WHERE player_name = $1
      `,
      [playerName]
    );

    if (statsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { oldLevel: 1, newLevel: 1, leveledUp: false };
    }

    const totalXp = statsResult.rows[0].total_xp || 0;
    const oldLevel = statsResult.rows[0].current_level || 1;

    // Calculate new level based on XP
    // Level formula: XP needed = 100 * (1.5 ^ (level - 1))
    // Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
    let newLevel = 1;
    let xpNeeded = 0;

    while (newLevel < 50) { // Cap at level 50
      const xpForNextLevel = Math.floor(100 * Math.pow(1.5, newLevel - 1));
      if (totalXp < xpNeeded + xpForNextLevel) {
        break;
      }
      xpNeeded += xpForNextLevel;
      newLevel++;
    }

    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      // Update level in database
      await client.query(
        `
        UPDATE player_stats
        SET current_level = $1
        WHERE player_name = $2
        `,
        [newLevel, playerName]
      );
    }

    await client.query('COMMIT');

    return { oldLevel, newLevel, leveledUp };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Skins DB] Error updating player level:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Award XP to a player and check for level up
 * Returns level-up info and any newly unlocked skins
 */
export async function awardXpAndCheckLevelUp(
  playerName: string,
  xpAmount: number
): Promise<{
  totalXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newlyUnlockedSkins: string[];
}> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return {
      totalXp: 0,
      oldLevel: 1,
      newLevel: 1,
      leveledUp: false,
      newlyUnlockedSkins: [],
    };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Add XP
    await client.query(
      `
      UPDATE player_stats
      SET total_xp = total_xp + $1
      WHERE player_name = $2
      `,
      [xpAmount, playerName]
    );

    await client.query('COMMIT');

    // Check level up
    const levelResult = await updatePlayerLevel(playerName);

    // If leveled up, check for new skin unlocks
    let newlyUnlockedSkins: string[] = [];
    if (levelResult.leveledUp) {
      const skinResult = await checkAndUnlockSkins(playerName);
      newlyUnlockedSkins = skinResult.newlyUnlocked;
    }

    // Get updated XP
    const xpResult = await pool.query(
      `SELECT total_xp FROM player_stats WHERE player_name = $1`,
      [playerName]
    );

    return {
      totalXp: xpResult.rows[0]?.total_xp || 0,
      ...levelResult,
      newlyUnlockedSkins,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Skins DB] Error awarding XP:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Purchase a skin with cosmetic currency
 * - Deducts currency from player
 * - Unlocks the skin
 * - Returns success/failure with updated currency balance
 */
export async function purchaseSkin(
  playerName: string,
  skinId: string,
  price: number,
  skinType: 'ui' | 'card'
): Promise<{
  success: boolean;
  error?: string;
  newBalance?: number;
}> {
  if (!pool) {
    console.error('[Skins DB] Database pool not initialized');
    return { success: false, error: 'Database not available' };
  }

  // Free skins don't need purchase
  if (price <= 0) {
    return { success: false, error: 'This skin is free and cannot be purchased' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check current balance
    const balanceResult = await client.query(
      `SELECT cosmetic_currency FROM player_stats WHERE player_name = $1`,
      [playerName]
    );

    if (balanceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Player not found' };
    }

    const currentBalance = balanceResult.rows[0].cosmetic_currency || 0;

    if (currentBalance < price) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: `Not enough currency. Need ${price}, have ${currentBalance}`,
      };
    }

    // Check if already unlocked
    const unlockCheckResult = await client.query(
      `SELECT 1 FROM player_skin_unlocks WHERE player_name = $1 AND skin_id = $2`,
      [playerName, skinId]
    );

    if (unlockCheckResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Skin already owned' };
    }

    // Deduct currency
    await client.query(
      `UPDATE player_stats SET cosmetic_currency = cosmetic_currency - $1 WHERE player_name = $2`,
      [price, playerName]
    );

    // Unlock the skin
    await client.query(
      `INSERT INTO player_skin_unlocks (player_name, skin_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [playerName, skinId]
    );

    await client.query('COMMIT');

    // Get updated balance
    const newBalanceResult = await client.query(
      `SELECT cosmetic_currency FROM player_stats WHERE player_name = $1`,
      [playerName]
    );

    return {
      success: true,
      newBalance: newBalanceResult.rows[0]?.cosmetic_currency || 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Skins DB] Error purchasing skin:', error);
    return { success: false, error: 'Purchase failed' };
  } finally {
    client.release();
  }
}
