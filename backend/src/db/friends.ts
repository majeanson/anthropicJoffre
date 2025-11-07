/**
 * Friends System Database Functions
 * Sprint 2 Phase 2
 */

import { query, getPool } from './index';
import { Friendship, FriendRequest, FriendWithStatus } from '../types/friends';

/**
 * Database row for friend with status query
 */
interface FriendWithStatusRow {
  player_name: string;
  is_online: boolean;
  status: string | null;
  game_id: string | null;
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
       RETURNING *`,
      [player1, player2]
    );

    // Update friends count for both players
    await client.query(
      `UPDATE player_stats
       SET friends_count = friends_count + 1
       WHERE player_name IN ($1, $2)`,
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
 */
export async function getFriendsWithStatus(playerName: string): Promise<FriendWithStatus[]> {
  try {
    // Get all friendships where player is either player1 or player2
    const result = await query(
      `SELECT
         CASE
           WHEN f.player1_name = $1 THEN f.player2_name
           ELSE f.player1_name
         END as player_name,
         f.created_at as friendship_date,
         COALESCE(ps.is_online, false) as is_online,
         CASE
           WHEN g.id IS NOT NULL AND g.status = 'playing' THEN 'in_game'
           WHEN g.id IS NOT NULL AND g.status = 'betting' THEN 'in_game'
           WHEN g.id IS NOT NULL AND g.status = 'team_selection' THEN 'in_team_selection'
           WHEN g.id IS NOT NULL THEN 'in_lobby'
           WHEN COALESCE(ps.is_online, false) THEN 'in_lobby'
           ELSE 'offline'
         END as status,
         g.id as game_id
       FROM friendships f
       LEFT JOIN player_stats ps ON (
         CASE
           WHEN f.player1_name = $1 THEN f.player2_name
           ELSE f.player1_name
         END = ps.player_name
       )
       LEFT JOIN (
         SELECT DISTINCT g.id, g.status, p.player_name
         FROM games g
         JOIN LATERAL jsonb_array_elements(g.players) AS p(player) ON true
         JOIN LATERAL jsonb_to_record(p.player) AS p(player_name text)
         WHERE g.status IN ('team_selection', 'betting', 'playing')
       ) g ON (
         CASE
           WHEN f.player1_name = $1 THEN f.player2_name
           ELSE f.player1_name
         END = g.player_name
       )
       WHERE f.player1_name = $1 OR f.player2_name = $1
       ORDER BY
         CASE
           WHEN COALESCE(ps.is_online, false) THEN 0
           ELSE 1
         END,
         f.created_at DESC`,
      [playerName]
    );

    return result.rows.map((row: FriendWithStatusRow) => ({
      player_name: row.player_name,
      is_online: row.is_online,
      status: row.status,
      game_id: row.game_id,
      friendship_date: row.friendship_date
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
