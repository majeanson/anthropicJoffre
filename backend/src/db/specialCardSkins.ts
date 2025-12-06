/**
 * Special Card Skins Database Operations
 *
 * Handles all database operations for the special card skin system:
 * - Red 0 (+5 points) and Brown 0 (-2 points) card skins
 * - Fetching available skins and player unlocks
 * - Equipping and purchasing skins
 * - Unlocking skins via achievements or level
 */

import pool from './index';

// ============================================================================
// TYPES
// ============================================================================

export type SpecialCardType = 'red_zero' | 'brown_zero';
export type SpecialCardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UnlockType = 'default' | 'level' | 'achievement' | 'purchase';

export interface SpecialCardSkin {
  skinId: string;
  skinName: string;
  description: string | null;
  cardType: SpecialCardType;
  rarity: SpecialCardRarity;
  unlockType: UnlockType;
  unlockRequirement: string | null;
  price: number;
  centerIcon: string | null;
  glowColor: string | null;
  animationClass: string | null;
  borderColor: string | null;
}

export interface PlayerSpecialCardSkinStatus extends SpecialCardSkin {
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface PlayerEquippedSpecialSkins {
  redZeroSkin: string | null;
  brownZeroSkin: string | null;
}

// ============================================================================
// FETCH OPERATIONS
// ============================================================================

/**
 * Get all special card skins
 */
export async function getAllSpecialCardSkins(): Promise<SpecialCardSkin[]> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return [];
  }

  const result = await pool.query(`
    SELECT
      skin_id, skin_name, description, card_type, rarity,
      unlock_type, unlock_requirement, price,
      center_icon, glow_color, animation_class, border_color
    FROM special_card_skins
    ORDER BY
      card_type,
      CASE rarity
        WHEN 'legendary' THEN 1
        WHEN 'epic' THEN 2
        WHEN 'rare' THEN 3
        WHEN 'common' THEN 4
      END,
      skin_name
  `);

  return result.rows.map(row => ({
    skinId: row.skin_id,
    skinName: row.skin_name,
    description: row.description,
    cardType: row.card_type,
    rarity: row.rarity,
    unlockType: row.unlock_type,
    unlockRequirement: row.unlock_requirement,
    price: row.price,
    centerIcon: row.center_icon,
    glowColor: row.glow_color,
    animationClass: row.animation_class,
    borderColor: row.border_color,
  }));
}

/**
 * Get special card skins by type (red_zero or brown_zero)
 */
export async function getSpecialCardSkinsByType(cardType: SpecialCardType): Promise<SpecialCardSkin[]> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return [];
  }

  const result = await pool.query(`
    SELECT
      skin_id, skin_name, description, card_type, rarity,
      unlock_type, unlock_requirement, price,
      center_icon, glow_color, animation_class, border_color
    FROM special_card_skins
    WHERE card_type = $1
    ORDER BY
      CASE rarity
        WHEN 'legendary' THEN 1
        WHEN 'epic' THEN 2
        WHEN 'rare' THEN 3
        WHEN 'common' THEN 4
      END,
      skin_name
  `, [cardType]);

  return result.rows.map(row => ({
    skinId: row.skin_id,
    skinName: row.skin_name,
    description: row.description,
    cardType: row.card_type,
    rarity: row.rarity,
    unlockType: row.unlock_type,
    unlockRequirement: row.unlock_requirement,
    price: row.price,
    centerIcon: row.center_icon,
    glowColor: row.glow_color,
    animationClass: row.animation_class,
    borderColor: row.border_color,
  }));
}

/**
 * Get a single special card skin by ID
 */
export async function getSpecialCardSkin(skinId: string): Promise<SpecialCardSkin | null> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return null;
  }

  const result = await pool.query(`
    SELECT
      skin_id, skin_name, description, card_type, rarity,
      unlock_type, unlock_requirement, price,
      center_icon, glow_color, animation_class, border_color
    FROM special_card_skins
    WHERE skin_id = $1
  `, [skinId]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    skinId: row.skin_id,
    skinName: row.skin_name,
    description: row.description,
    cardType: row.card_type,
    rarity: row.rarity,
    unlockType: row.unlock_type,
    unlockRequirement: row.unlock_requirement,
    price: row.price,
    centerIcon: row.center_icon,
    glowColor: row.glow_color,
    animationClass: row.animation_class,
    borderColor: row.border_color,
  };
}

// ============================================================================
// PLAYER UNLOCK OPERATIONS
// ============================================================================

/**
 * Get all special card skins with unlock status for a player
 */
export async function getPlayerSpecialCardSkins(playerName: string): Promise<PlayerSpecialCardSkinStatus[]> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return [];
  }

  const result = await pool.query(`
    SELECT
      scs.skin_id, scs.skin_name, scs.description, scs.card_type, scs.rarity,
      scs.unlock_type, scs.unlock_requirement, scs.price,
      scs.center_icon, scs.glow_color, scs.animation_class, scs.border_color,
      pscs.unlocked_at IS NOT NULL AS is_unlocked,
      pscs.unlocked_at
    FROM special_card_skins scs
    LEFT JOIN player_special_card_skins pscs
      ON scs.skin_id = pscs.skin_id AND pscs.player_name = $1
    ORDER BY
      scs.card_type,
      CASE scs.rarity
        WHEN 'legendary' THEN 1
        WHEN 'epic' THEN 2
        WHEN 'rare' THEN 3
        WHEN 'common' THEN 4
      END,
      scs.skin_name
  `, [playerName]);

  return result.rows.map(row => ({
    skinId: row.skin_id,
    skinName: row.skin_name,
    description: row.description,
    cardType: row.card_type,
    rarity: row.rarity,
    unlockType: row.unlock_type,
    unlockRequirement: row.unlock_requirement,
    price: row.price,
    centerIcon: row.center_icon,
    glowColor: row.glow_color,
    animationClass: row.animation_class,
    borderColor: row.border_color,
    isUnlocked: row.is_unlocked,
    unlockedAt: row.unlocked_at,
  }));
}

/**
 * Get player's unlocked skin IDs only
 */
export async function getPlayerUnlockedSpecialSkinIds(playerName: string): Promise<string[]> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return [];
  }

  const result = await pool.query(`
    SELECT skin_id
    FROM player_special_card_skins
    WHERE player_name = $1
  `, [playerName]);

  return result.rows.map(row => row.skin_id);
}

/**
 * Get player's currently equipped special skins
 */
export async function getPlayerEquippedSpecialSkins(playerName: string): Promise<PlayerEquippedSpecialSkins> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    // Return defaults
    return { redZeroSkin: 'red_zero_default', brownZeroSkin: 'brown_zero_default' };
  }

  const result = await pool.query(`
    SELECT red_zero_skin, brown_zero_skin
    FROM player_equipped_special_skins
    WHERE player_name = $1
  `, [playerName]);

  if (result.rows.length === 0) {
    // Return defaults if no record exists
    return { redZeroSkin: 'red_zero_default', brownZeroSkin: 'brown_zero_default' };
  }

  return {
    redZeroSkin: result.rows[0].red_zero_skin || 'red_zero_default',
    brownZeroSkin: result.rows[0].brown_zero_skin || 'brown_zero_default',
  };
}

// ============================================================================
// UNLOCK OPERATIONS
// ============================================================================

/**
 * Unlock a special card skin for a player
 */
export async function unlockSpecialCardSkin(playerName: string, skinId: string): Promise<boolean> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return false;
  }

  try {
    await pool.query(`
      INSERT INTO player_special_card_skins (player_name, skin_id)
      VALUES ($1, $2)
      ON CONFLICT (player_name, skin_id) DO NOTHING
    `, [playerName, skinId]);
    return true;
  } catch (error) {
    console.error('[SpecialCardSkins DB] Error unlocking skin:', error);
    return false;
  }
}

/**
 * Unlock default skins for a new player
 * Should be called when player first accesses the skin system
 */
export async function unlockDefaultSpecialSkins(playerName: string): Promise<void> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return;
  }

  try {
    // Unlock all default skins
    await pool.query(`
      INSERT INTO player_special_card_skins (player_name, skin_id)
      SELECT $1, skin_id
      FROM special_card_skins
      WHERE unlock_type = 'default'
      ON CONFLICT (player_name, skin_id) DO NOTHING
    `, [playerName]);

    // Create equipped skins record with defaults if not exists
    await pool.query(`
      INSERT INTO player_equipped_special_skins (player_name, red_zero_skin, brown_zero_skin)
      VALUES ($1, 'red_zero_default', 'brown_zero_default')
      ON CONFLICT (player_name) DO NOTHING
    `, [playerName]);
  } catch (error) {
    console.error('[SpecialCardSkins DB] Error unlocking default skins:', error);
  }
}

/**
 * Check and unlock level-gated skins for a player
 * Returns array of newly unlocked skin IDs
 */
export async function checkAndUnlockLevelSkins(playerName: string, playerLevel: number): Promise<string[]> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return [];
  }

  try {
    // Find level-gated skins the player qualifies for but doesn't have
    const result = await pool.query(`
      INSERT INTO player_special_card_skins (player_name, skin_id)
      SELECT $1, scs.skin_id
      FROM special_card_skins scs
      WHERE scs.unlock_type = 'level'
        AND scs.unlock_requirement::INTEGER <= $2
        AND NOT EXISTS (
          SELECT 1 FROM player_special_card_skins pscs
          WHERE pscs.player_name = $1 AND pscs.skin_id = scs.skin_id
        )
      RETURNING skin_id
    `, [playerName, playerLevel]);

    return result.rows.map(row => row.skin_id);
  } catch (error) {
    console.error('[SpecialCardSkins DB] Error checking level skins:', error);
    return [];
  }
}

/**
 * Unlock skins associated with an achievement
 * Returns array of unlocked skin IDs
 */
export async function unlockAchievementSkins(playerName: string, achievementKey: string): Promise<string[]> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return [];
  }

  try {
    const result = await pool.query(`
      INSERT INTO player_special_card_skins (player_name, skin_id)
      SELECT $1, skin_id
      FROM special_card_skins
      WHERE unlock_type = 'achievement' AND unlock_requirement = $2
      ON CONFLICT (player_name, skin_id) DO NOTHING
      RETURNING skin_id
    `, [playerName, achievementKey]);

    return result.rows.map(row => row.skin_id);
  } catch (error) {
    console.error('[SpecialCardSkins DB] Error unlocking achievement skins:', error);
    return [];
  }
}

// ============================================================================
// EQUIP OPERATIONS
// ============================================================================

/**
 * Equip a special card skin
 * Returns success status
 */
export async function equipSpecialCardSkin(
  playerName: string,
  skinId: string,
  cardType: SpecialCardType
): Promise<{ success: boolean; error?: string }> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return { success: false, error: 'Database not available' };
  }

  try {
    // Verify the player owns this skin
    const ownershipCheck = await pool.query(`
      SELECT 1 FROM player_special_card_skins
      WHERE player_name = $1 AND skin_id = $2
    `, [playerName, skinId]);

    if (ownershipCheck.rows.length === 0) {
      return { success: false, error: 'You do not own this skin' };
    }

    // Verify the skin matches the card type
    const skinCheck = await pool.query(`
      SELECT card_type FROM special_card_skins WHERE skin_id = $1
    `, [skinId]);

    if (skinCheck.rows.length === 0) {
      return { success: false, error: 'Skin not found' };
    }

    if (skinCheck.rows[0].card_type !== cardType) {
      return { success: false, error: 'Skin type does not match card type' };
    }

    // Update equipped skin
    const column = cardType === 'red_zero' ? 'red_zero_skin' : 'brown_zero_skin';
    await pool.query(`
      INSERT INTO player_equipped_special_skins (player_name, ${column})
      VALUES ($1, $2)
      ON CONFLICT (player_name) DO UPDATE SET ${column} = $2
    `, [playerName, skinId]);

    return { success: true };
  } catch (error) {
    console.error('[SpecialCardSkins DB] Error equipping skin:', error);
    return { success: false, error: 'Failed to equip skin' };
  }
}

// ============================================================================
// PURCHASE OPERATIONS
// ============================================================================

/**
 * Purchase a special card skin with cosmetic currency
 */
export async function purchaseSpecialCardSkin(
  playerName: string,
  skinId: string
): Promise<{
  success: boolean;
  error?: string;
  newBalance?: number;
}> {
  if (!pool) {
    console.error('[SpecialCardSkins DB] Database pool not initialized');
    return { success: false, error: 'Database not available' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get skin info
    const skinResult = await client.query(`
      SELECT price, unlock_type FROM special_card_skins WHERE skin_id = $1
    `, [skinId]);

    if (skinResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Skin not found' };
    }

    const { price, unlock_type } = skinResult.rows[0];

    if (unlock_type !== 'purchase') {
      await client.query('ROLLBACK');
      return { success: false, error: 'This skin cannot be purchased' };
    }

    if (price <= 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'This skin is free' };
    }

    // Check if already owned
    const ownershipCheck = await client.query(`
      SELECT 1 FROM player_special_card_skins
      WHERE player_name = $1 AND skin_id = $2
    `, [playerName, skinId]);

    if (ownershipCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'You already own this skin' };
    }

    // Check player balance
    const balanceResult = await client.query(`
      SELECT cosmetic_currency FROM player_stats WHERE player_name = $1
    `, [playerName]);

    if (balanceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Player not found' };
    }

    const currentBalance = balanceResult.rows[0].cosmetic_currency || 0;

    if (currentBalance < price) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: `Not enough coins. Need ${price}, have ${currentBalance}`,
      };
    }

    // Deduct currency
    await client.query(`
      UPDATE player_stats
      SET cosmetic_currency = cosmetic_currency - $1
      WHERE player_name = $2
    `, [price, playerName]);

    // Unlock the skin
    await client.query(`
      INSERT INTO player_special_card_skins (player_name, skin_id)
      VALUES ($1, $2)
    `, [playerName, skinId]);

    await client.query('COMMIT');

    // Get new balance
    const newBalanceResult = await pool.query(`
      SELECT cosmetic_currency FROM player_stats WHERE player_name = $1
    `, [playerName]);

    return {
      success: true,
      newBalance: newBalanceResult.rows[0]?.cosmetic_currency || 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SpecialCardSkins DB] Error purchasing skin:', error);
    return { success: false, error: 'Purchase failed' };
  } finally {
    client.release();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a player can unlock a skin based on level
 */
export async function canUnlockByLevel(playerName: string, skinId: string): Promise<boolean> {
  if (!pool) return false;

  try {
    const result = await pool.query(`
      SELECT
        scs.unlock_requirement::INTEGER as required_level,
        ps.current_level
      FROM special_card_skins scs
      CROSS JOIN player_stats ps
      WHERE scs.skin_id = $1
        AND ps.player_name = $2
        AND scs.unlock_type = 'level'
    `, [skinId, playerName]);

    if (result.rows.length === 0) return false;

    const { required_level, current_level } = result.rows[0];
    return current_level >= required_level;
  } catch (error) {
    console.error('[SpecialCardSkins DB] Error checking level unlock:', error);
    return false;
  }
}

/**
 * Get skins that would be unlocked by an achievement
 */
export async function getSkinsForAchievement(achievementKey: string): Promise<SpecialCardSkin[]> {
  if (!pool) return [];

  const result = await pool.query(`
    SELECT
      skin_id, skin_name, description, card_type, rarity,
      unlock_type, unlock_requirement, price,
      center_icon, glow_color, animation_class, border_color
    FROM special_card_skins
    WHERE unlock_type = 'achievement' AND unlock_requirement = $1
  `, [achievementKey]);

  return result.rows.map(row => ({
    skinId: row.skin_id,
    skinName: row.skin_name,
    description: row.description,
    cardType: row.card_type,
    rarity: row.rarity,
    unlockType: row.unlock_type,
    unlockRequirement: row.unlock_requirement,
    price: row.price,
    centerIcon: row.center_icon,
    glowColor: row.glow_color,
    animationClass: row.animation_class,
    borderColor: row.border_color,
  }));
}
