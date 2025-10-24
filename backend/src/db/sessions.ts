/**
 * Session Management Layer
 *
 * Provides CRUD operations for player sessions stored in PostgreSQL.
 * Sessions enable reconnection after disconnect/refresh.
 */

import crypto from 'crypto';
import { query } from './index';
import type { PlayerSession } from '../types/game';

/**
 * Create a new player session and store in database
 * Returns session object with token
 */
export async function createSession(
  playerName: string,
  playerId: string,
  gameId: string
): Promise<PlayerSession> {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');

  const text = `
    INSERT INTO game_sessions (
      session_token, player_name, player_id, game_id,
      is_active, created_at, last_active_at,
      expires_at
    )
    VALUES (
      $1, $2, $3, $4,
      TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + INTERVAL '15 minutes'
    )
    RETURNING *
  `;

  const values = [token, playerName, playerId, gameId];
  const result = await query(text, values);

  const row = result.rows[0];
  return {
    token: row.session_token,
    playerId: row.player_id,
    playerName: row.player_name,
    gameId: row.game_id,
    timestamp: new Date(row.created_at).getTime(),
  };
}

/**
 * Validate session token and return session if valid
 * Returns null if token invalid or expired
 */
export async function validateSession(token: string): Promise<PlayerSession | null> {
  const text = `
    SELECT *
    FROM game_sessions
    WHERE session_token = $1
      AND is_active = TRUE
      AND expires_at > CURRENT_TIMESTAMP
  `;

  const result = await query(text, [token]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    token: row.session_token,
    playerId: row.player_id,
    playerName: row.player_name,
    gameId: row.game_id,
    timestamp: new Date(row.last_active_at).getTime(),
  };
}

/**
 * Update session with new socket ID and refresh activity timestamp
 * Extends expiration time by 15 minutes
 */
export async function updateSessionActivity(
  token: string,
  newSocketId: string
): Promise<void> {
  const text = `
    UPDATE game_sessions
    SET player_id = $2,
        last_active_at = CURRENT_TIMESTAMP,
        expires_at = CURRENT_TIMESTAMP + INTERVAL '15 minutes'
    WHERE session_token = $1
  `;

  await query(text, [token, newSocketId]);
}

/**
 * Mark session as inactive (soft delete)
 * Called when player explicitly leaves game
 */
export async function revokeSession(token: string): Promise<void> {
  const text = `
    UPDATE game_sessions
    SET is_active = FALSE,
        last_active_at = CURRENT_TIMESTAMP
    WHERE session_token = $1
  `;

  await query(text, [token]);
}

/**
 * Delete all sessions for a specific player in a game
 * Called when player is kicked or game ends
 */
export async function deletePlayerSessions(playerName: string, gameId: string): Promise<void> {
  const text = `
    DELETE FROM game_sessions
    WHERE player_name = $1 AND game_id = $2
  `;

  await query(text, [playerName, gameId]);
}

/**
 * Get all active sessions for a specific game
 * Useful for debugging and admin purposes
 */
export async function getGameSessions(gameId: string): Promise<PlayerSession[]> {
  const text = `
    SELECT *
    FROM game_sessions
    WHERE game_id = $1
      AND is_active = TRUE
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at ASC
  `;

  const result = await query(text, [gameId]);

  return result.rows.map(row => ({
    token: row.session_token,
    playerId: row.player_id,
    playerName: row.player_name,
    gameId: row.game_id,
    timestamp: new Date(row.last_active_at).getTime(),
  }));
}

/**
 * Cleanup expired sessions (called periodically)
 * Returns number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const text = `SELECT cleanup_expired_sessions()`;
  const result = await query(text);
  return result.rows[0].cleanup_expired_sessions;
}

/**
 * Find active session by player name and game ID
 * Used to check if player already has a session before creating new one
 */
export async function findSessionByPlayer(
  playerName: string,
  gameId: string
): Promise<PlayerSession | null> {
  const text = `
    SELECT *
    FROM game_sessions
    WHERE player_name = $1
      AND game_id = $2
      AND is_active = TRUE
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await query(text, [playerName, gameId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    token: row.session_token,
    playerId: row.player_id,
    playerName: row.player_name,
    gameId: row.game_id,
    timestamp: new Date(row.last_active_at).getTime(),
  };
}
