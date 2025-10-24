/**
 * Player Presence Tracking
 *
 * Tracks online/away/offline status of players
 */

import { query } from './index';

export type PlayerStatus = 'online' | 'away' | 'offline';

export interface PlayerPresence {
  playerName: string;
  status: PlayerStatus;
  currentGameId?: string;
  socketId?: string;
  lastSeenAt: Date;
}

/**
 * Update player presence in database
 */
export async function updatePlayerPresence(
  playerName: string,
  status: PlayerStatus,
  socketId?: string,
  gameId?: string
): Promise<void> {
  const text = `
    INSERT INTO player_presence (
      player_name, status, socket_id, current_game_id,
      last_seen_at, updated_at
    )
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (player_name) DO UPDATE SET
      status = EXCLUDED.status,
      socket_id = EXCLUDED.socket_id,
      current_game_id = EXCLUDED.current_game_id,
      last_seen_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `;

  await query(text, [playerName, status, socketId || null, gameId || null]);
}

/**
 * Get all online players
 */
export async function getOnlinePlayers(): Promise<PlayerPresence[]> {
  const text = `
    SELECT
      player_name,
      status,
      current_game_id,
      socket_id,
      last_seen_at
    FROM player_presence
    WHERE status IN ('online', 'away')
    ORDER BY last_seen_at DESC
  `;

  const result = await query(text);

  return result.rows.map(row => ({
    playerName: row.player_name,
    status: row.status,
    currentGameId: row.current_game_id,
    socketId: row.socket_id,
    lastSeenAt: new Date(row.last_seen_at),
  }));
}

/**
 * Get presence for specific player
 */
export async function getPlayerPresence(playerName: string): Promise<PlayerPresence | null> {
  const text = `
    SELECT
      player_name,
      status,
      current_game_id,
      socket_id,
      last_seen_at
    FROM player_presence
    WHERE player_name = $1
  `;

  const result = await query(text, [playerName]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    playerName: row.player_name,
    status: row.status,
    currentGameId: row.current_game_id,
    socketId: row.socket_id,
    lastSeenAt: new Date(row.last_seen_at),
  };
}

/**
 * Mark player as offline
 */
export async function markPlayerOffline(playerName: string): Promise<void> {
  const text = `
    UPDATE player_presence
    SET
      status = 'offline',
      socket_id = NULL,
      last_seen_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE player_name = $1
  `;

  await query(text, [playerName]);
}

/**
 * Cleanup stale presence (offline players who haven't been seen in 24 hours)
 */
export async function cleanupStalePresence(): Promise<number> {
  const text = `
    DELETE FROM player_presence
    WHERE status = 'offline'
      AND last_seen_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
  `;

  const result = await query(text);
  return result.rowCount || 0;
}
