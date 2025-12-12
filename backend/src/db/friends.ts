/**
 * Friends System Database Functions
 * Sprint 2 Phase 2
 */

import { query, getPool } from './index';
import { Friendship, FriendRequest, FriendWithStatus } from '../types/friends';

/**
 * Database row for friend with status query
 * Note: is_online and status are tracked in-memory via onlinePlayers map, not in DB
 */
interface FriendWithStatusRow {
  player_name: string;
  friendship_date: string;
}

/**
 * Send a friend request from one player to another
 */
export async function sendFriendRequest(
  fromPlayer: string,
  toPlayer: string
): Promise<FriendRequest | null> {
  try {
    // Check if friendship already exists
    const existingFriendship = await getFriendship(fromPlayer, toPlayer);
    if (existingFriendship) {
      throw new Error('Already friends');
    }

    // Check if request already exists
    const existingRequest = await query(
      'SELECT id, from_player, to_player, status, created_at FROM friend_requests WHERE from_player = $1 AND to_player = $2 AND status = $3',
      [fromPlayer, toPlayer, 'pending']
    );

    if (existingRequest.rows.length > 0) {
      throw new Error('Friend request already sent');
    }

    // Create new friend request
    const result = await query(
      `INSERT INTO friend_requests (from_player, to_player, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [fromPlayer, toPlayer]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error sending friend request:', error);
    return null;
  }
}

/**
 * Get all pending friend requests for a player
 */
export async function getPendingFriendRequests(playerName: string): Promise<FriendRequest[]> {
  try {
    const result = await query(
      `SELECT id, from_player, to_player, status, created_at, responded_at FROM friend_requests
       WHERE to_player = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [playerName]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return [];
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: number): Promise<Friendship | null> {
  const pool = getPool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the friend request
    const requestResult = await client.query(
      'SELECT id, from_player, to_player, status, created_at, responded_at FROM friend_requests WHERE id = $1 AND status = $2',
      [requestId, 'pending']
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Friend request not found');
    }

    const request = requestResult.rows[0];

    // Update request status
    await client.query(
      `UPDATE friend_requests
       SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [requestId]
    );

    // Create friendship (ensure alphabetical order)
    const [player1, player2] = [request.from_player, request.to_player].sort();
    const friendshipResult = await client.query(
      `INSERT INTO friendships (player1_name, player2_name)
       VALUES ($1, $2)
       ON CONFLICT (player1_name, player2_name) DO NOTHING
       RETURNING *`,
      [player1, player2]
    );

    // If friendship already existed, fetch it
    if (friendshipResult.rows.length === 0) {
      const existingFriendship = await client.query(
        'SELECT id, player1_name, player2_name, created_at FROM friendships WHERE player1_name = $1 AND player2_name = $2',
        [player1, player2]
      );
      if (existingFriendship.rows.length === 0) {
        throw new Error('Failed to create friendship');
      }
      // Use existing friendship but still update counts below
      friendshipResult.rows[0] = existingFriendship.rows[0];
    }

    // Update friends count for both players (ensure rows exist first)
    await client.query(
      `INSERT INTO player_stats (player_name, friends_count)
       VALUES ($1, 1), ($2, 1)
       ON CONFLICT (player_name) DO UPDATE
       SET friends_count = player_stats.friends_count + 1`,
      [player1, player2]
    );

    await client.query('COMMIT');
    return friendshipResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting friend request:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requestId: number): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE friend_requests
       SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending'`,
      [requestId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
}

/**
 * Remove a friendship
 */
export async function removeFriendship(player1: string, player2: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure alphabetical order
    const [p1, p2] = [player1, player2].sort();

    // Delete friendship
    const result = await client.query(
      'DELETE FROM friendships WHERE player1_name = $1 AND player2_name = $2',
      [p1, p2]
    );

    if (result.rowCount === 0) {
      throw new Error('Friendship not found');
    }

    // Update friends count for both players
    await client.query(
      `UPDATE player_stats
       SET friends_count = GREATEST(0, friends_count - 1)
       WHERE player_name IN ($1, $2)`,
      [p1, p2]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing friendship:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Get a specific friendship between two players
 */
export async function getFriendship(player1: string, player2: string): Promise<Friendship | null> {
  try {
    const [p1, p2] = [player1, player2].sort();
    const result = await query(
      'SELECT id, player1_name, player2_name, created_at FROM friendships WHERE player1_name = $1 AND player2_name = $2',
      [p1, p2]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting friendship:', error);
    return null;
  }
}

/**
 * Get all friends for a player with their online status
 * Note: Online status is tracked in-memory (onlinePlayers map), not in the database.
 * This function returns all friends with is_online=false and status='offline'.
 * The socket handler should enrich this with real-time online status and game info.
 */
export async function getFriendsWithStatus(playerName: string): Promise<FriendWithStatus[]> {
  try {
    // Get all friendships where player is either player1 or player2
    // Note: is_online and status will be enriched by the socket handler with real-time data
    const result = await query(
      `SELECT
         CASE
           WHEN f.player1_name = $1 THEN f.player2_name
           ELSE f.player1_name
         END as player_name,
         f.created_at as friendship_date
       FROM friendships f
       WHERE f.player1_name = $1 OR f.player2_name = $1
       ORDER BY f.created_at DESC`,
      [playerName]
    );

    return result.rows.map((row: FriendWithStatusRow) => ({
      player_name: row.player_name,
      is_online: false, // Will be enriched by socket handler with real-time data
      status: 'offline' as const, // Will be enriched by socket handler
      game_id: undefined,
      friendship_date: new Date(row.friendship_date)
    }));
  } catch (error) {
    console.error('Error getting friends with status:', error);
    return [];
  }
}

/**
 * Get sent friend requests (requests sent by this player)
 */
export async function getSentFriendRequests(playerName: string): Promise<FriendRequest[]> {
  try {
    const result = await query(
      `SELECT id, from_player, to_player, status, created_at, responded_at FROM friend_requests
       WHERE from_player = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [playerName]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting sent friend requests:', error);
    return [];
  }
}

/**
 * Check if two players are friends
 */
export async function areFriends(player1: string, player2: string): Promise<boolean> {
  const friendship = await getFriendship(player1, player2);
  return friendship !== null;
}

/**
 * Batch check if a player is friends with multiple other players.
 * Returns a Set of player names that are friends with the given player.
 * Much more efficient than calling areFriends() in a loop (single query vs N queries).
 */
export async function getFriendsAmong(
  playerName: string,
  potentialFriends: string[]
): Promise<Set<string>> {
  if (potentialFriends.length === 0) {
    return new Set();
  }

  try {
    // Query friendships where playerName is involved and the other party is in potentialFriends
    const result = await query(
      `SELECT
         CASE
           WHEN player1_name = $1 THEN player2_name
           ELSE player1_name
         END as friend_name
       FROM friendships
       WHERE (player1_name = $1 AND player2_name = ANY($2))
          OR (player2_name = $1 AND player1_name = ANY($2))`,
      [playerName, potentialFriends]
    );

    return new Set(result.rows.map((row: { friend_name: string }) => row.friend_name));
  } catch (error) {
    console.error('Error getting friends among list:', error);
    return new Set();
  }
}

/**
 * Get friends count for a player
 */
export async function getFriendsCount(playerName: string): Promise<number> {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM friendships
       WHERE player1_name = $1 OR player2_name = $1`,
      [playerName]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('Error getting friends count:', error);
    return 0;
  }
}

/**
 * Expire old friend requests (30 days)
 * Returns the number of expired requests
 */
export async function expireOldFriendRequests(): Promise<number> {
  try {
    const result = await query(
      `UPDATE friend_requests
       SET status = 'expired', responded_at = CURRENT_TIMESTAMP
       WHERE status = 'pending'
         AND (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
              OR expires_at IS NULL AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
       RETURNING id`
    );

    const expiredCount = result.rows.length;
    if (expiredCount > 0) {
      console.log(`Expired ${expiredCount} old friend requests`);
    }
    return expiredCount;
  } catch (error) {
    console.error('Error expiring friend requests:', error);
    return 0;
  }
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequest(requestId: number, fromPlayer: string): Promise<boolean> {
  try {
    const result = await query(
      `DELETE FROM friend_requests
       WHERE id = $1 AND from_player = $2 AND status = 'pending'`,
      [requestId, fromPlayer]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return false;
  }
}
