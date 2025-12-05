/**
 * User Blocking System Database Functions
 * Allows players to block other players to prevent unwanted interactions
 */

import { query, getPool } from './index';

export interface UserBlock {
  id: number;
  blocker_name: string;
  blocked_name: string;
  reason?: string;
  created_at: Date;
}

/**
 * Block a player
 * Returns the block record if successful, null if failed
 */
export async function blockPlayer(
  blockerName: string,
  blockedName: string,
  reason?: string
): Promise<UserBlock | null> {
  try {
    // Can't block yourself
    if (blockerName === blockedName) {
      throw new Error('Cannot block yourself');
    }

    const result = await query(
      `INSERT INTO user_blocks (blocker_name, blocked_name, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (blocker_name, blocked_name) DO NOTHING
       RETURNING *`,
      [blockerName, blockedName, reason || null]
    );

    if (result.rows.length === 0) {
      // Already blocked
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error blocking player:', error);
    return null;
  }
}

/**
 * Unblock a player
 * Returns true if successful
 */
export async function unblockPlayer(
  blockerName: string,
  blockedName: string
): Promise<boolean> {
  try {
    const result = await query(
      `DELETE FROM user_blocks
       WHERE blocker_name = $1 AND blocked_name = $2`,
      [blockerName, blockedName]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error unblocking player:', error);
    return false;
  }
}

/**
 * Check if a specific player is blocked by another
 */
export async function isBlocked(
  blockerName: string,
  blockedName: string
): Promise<boolean> {
  try {
    const result = await query(
      `SELECT 1 FROM user_blocks
       WHERE blocker_name = $1 AND blocked_name = $2`,
      [blockerName, blockedName]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
}

/**
 * Check if either player has blocked the other (mutual check)
 * Useful for friend requests, DMs, game invites
 */
export async function isBlockedEitherWay(
  player1: string,
  player2: string
): Promise<boolean> {
  try {
    const result = await query(
      `SELECT 1 FROM user_blocks
       WHERE (blocker_name = $1 AND blocked_name = $2)
          OR (blocker_name = $2 AND blocked_name = $1)`,
      [player1, player2]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking mutual block status:', error);
    return false;
  }
}

/**
 * Get list of players blocked by a user
 */
export async function getBlockedPlayers(blockerName: string): Promise<UserBlock[]> {
  try {
    const result = await query(
      `SELECT id, blocker_name, blocked_name, reason, created_at
       FROM user_blocks
       WHERE blocker_name = $1
       ORDER BY created_at DESC`,
      [blockerName]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting blocked players:', error);
    return [];
  }
}

/**
 * Get count of players blocked by a user
 */
export async function getBlockedCount(blockerName: string): Promise<number> {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM user_blocks WHERE blocker_name = $1`,
      [blockerName]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('Error getting blocked count:', error);
    return 0;
  }
}

/**
 * Block a player and also remove any existing friendship and pending friend requests
 * This is a comprehensive block that cleans up all social connections
 */
export async function blockPlayerComprehensive(
  blockerName: string,
  blockedName: string,
  reason?: string
): Promise<{ blocked: boolean; friendshipRemoved: boolean; requestsCancelled: number }> {
  const pool = getPool();
  if (!pool) {
    return { blocked: false, friendshipRemoved: false, requestsCancelled: 0 };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add block
    await client.query(
      `INSERT INTO user_blocks (blocker_name, blocked_name, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (blocker_name, blocked_name) DO NOTHING`,
      [blockerName, blockedName, reason || null]
    );

    // 2. Remove any friendship (both directions since friendships are stored alphabetically)
    const [p1, p2] = [blockerName, blockedName].sort();
    const friendshipResult = await client.query(
      `DELETE FROM friendships WHERE player1_name = $1 AND player2_name = $2`,
      [p1, p2]
    );
    const friendshipRemoved = (friendshipResult.rowCount ?? 0) > 0;

    // 3. Update friends count if friendship was removed
    if (friendshipRemoved) {
      await client.query(
        `UPDATE player_stats
         SET friends_count = GREATEST(0, friends_count - 1)
         WHERE player_name IN ($1, $2)`,
        [blockerName, blockedName]
      );
    }

    // 4. Cancel any pending friend requests (both directions)
    const requestsResult = await client.query(
      `UPDATE friend_requests
       SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
       WHERE status = 'pending'
         AND ((from_player = $1 AND to_player = $2)
          OR (from_player = $2 AND to_player = $1))`,
      [blockerName, blockedName]
    );

    await client.query('COMMIT');

    return {
      blocked: true,
      friendshipRemoved,
      requestsCancelled: requestsResult.rowCount ?? 0
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in comprehensive block:', error);
    return { blocked: false, friendshipRemoved: false, requestsCancelled: 0 };
  } finally {
    client.release();
  }
}
