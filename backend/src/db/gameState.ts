/**
 * Game State Persistence Layer
 *
 * Provides CRUD operations for storing and retrieving game state from PostgreSQL.
 * Games are stored as JSONB to preserve full state including hands, bets, tricks, etc.
 */

import { query } from './index';
import type { GameState } from '../types/game';

export interface GameListItem {
  gameId: string;
  phase: string;
  status: string;
  playerCount: number;
  creatorName: string;
  isPublic: boolean;
  createdAt: Date;
  playerNames: string[];
  teamAssignments: Record<string, number>;
}

/**
 * Save or update game state in database
 * Called after every state-changing operation
 */
export async function saveGameState(gameState: GameState): Promise<void> {
  const playerCount = gameState.players.length;
  const creatorName = gameState.players.find(p => p.id === gameState.creatorId)?.name || '';

  // Determine game status based on phase and player count
  let status = 'waiting';
  if (gameState.phase === 'game_over') {
    status = 'finished';
  } else if (gameState.phase === 'team_selection') {
    status = playerCount === 4 ? 'team_selection' : 'waiting';
  } else if (['betting', 'playing', 'scoring'].includes(gameState.phase)) {
    status = 'in_progress';
  }

  const text = `
    INSERT INTO active_games (
      game_id, game_state, phase, status, player_count,
      creator_name, is_public, last_updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (game_id) DO UPDATE SET
      game_state = EXCLUDED.game_state,
      phase = EXCLUDED.phase,
      status = EXCLUDED.status,
      player_count = EXCLUDED.player_count,
      last_updated_at = CURRENT_TIMESTAMP
  `;

  // Prepare game state for serialization (convert Maps to objects)
  const serializableGameState = {
    ...gameState,
    afkWarnings: gameState.afkWarnings ? Object.fromEntries(gameState.afkWarnings) : undefined
  };

  const values = [
    gameState.id,
    JSON.stringify(serializableGameState),
    gameState.phase,
    status,
    playerCount,
    creatorName,
    true // is_public (default true for now)
  ];

  await query(text, values);
}

/**
 * Load game state from database by game ID
 * Returns null if game not found
 */
export async function loadGameState(gameId: string): Promise<GameState | null> {
  const text = `
    SELECT game_state
    FROM active_games
    WHERE game_id = $1
  `;

  const result = await query(text, [gameId]);

  if (result.rows.length === 0) {
    return null;
  }

  const rawGameState = result.rows[0].game_state;

  // Deep clone to prevent mutations to the DB-loaded object
  const clonedGameState = JSON.parse(JSON.stringify(rawGameState));

  // Restore Map objects that were serialized as plain objects
  if (clonedGameState.afkWarnings && typeof clonedGameState.afkWarnings === 'object' && !Array.isArray(clonedGameState.afkWarnings)) {
    clonedGameState.afkWarnings = new Map(Object.entries(clonedGameState.afkWarnings));
  }

  console.log(`✅ Loaded game ${gameId} from DB - Phase: ${clonedGameState.phase}, Players: ${clonedGameState.players.length}, Round: ${clonedGameState.roundNumber}`);

  return clonedGameState as GameState;
}

/**
 * Delete game from active games table
 * Called when game is finished or abandoned
 */
export async function deleteGameState(gameId: string): Promise<void> {
  const text = `
    DELETE FROM active_games
    WHERE game_id = $1
  `;

  await query(text, [gameId]);
}

/**
 * List all active games (for lobby browser)
 * Optionally filter by status or public/private
 */
export async function listActiveGames(options?: {
  status?: string;
  isPublic?: boolean;
  limit?: number;
}): Promise<GameListItem[]> {
  let text = `
    SELECT
      game_id,
      phase,
      status,
      player_count,
      creator_name,
      is_public,
      created_at,
      game_state
    FROM active_games
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (options?.status) {
    text += ` AND status = $${paramCount}`;
    values.push(options.status);
    paramCount++;
  }

  if (options?.isPublic !== undefined) {
    text += ` AND is_public = $${paramCount}`;
    values.push(options.isPublic);
    paramCount++;
  }

  // Sort: joinable games first, then by creation time
  text += ` ORDER BY
    CASE
      WHEN status = 'waiting' THEN 1
      WHEN status = 'team_selection' THEN 2
      WHEN status = 'in_progress' THEN 3
      ELSE 4
    END,
    created_at DESC
  `;

  if (options?.limit) {
    text += ` LIMIT $${paramCount}`;
    values.push(options.limit);
  }

  const result = await query(text, values);

  return result.rows.map(row => {
    const gameState: GameState = row.game_state;
    const playerNames = gameState.players.map(p => p.name);
    const teamAssignments = gameState.players.reduce((acc, p) => {
      acc[p.name] = p.teamId;
      return acc;
    }, {} as Record<string, number>);

    return {
      gameId: row.game_id,
      phase: row.phase,
      status: row.status,
      playerCount: row.player_count,
      creatorName: row.creator_name,
      isPublic: row.is_public,
      createdAt: row.created_at,
      playerNames,
      teamAssignments,
    };
  });
}

/**
 * Get all games a specific player is participating in
 * Useful for "My Games" view and preventing duplicate joins
 */
export async function getPlayerGames(playerName: string): Promise<GameListItem[]> {
  const text = `
    SELECT
      game_id,
      phase,
      status,
      player_count,
      creator_name,
      is_public,
      created_at,
      game_state
    FROM active_games
    WHERE game_state @> jsonb_build_object('players',
      jsonb_build_array(jsonb_build_object('name', $1))
    )
    ORDER BY created_at DESC
  `;

  const result = await query(text, [playerName]);

  return result.rows.map(row => {
    const gameState: GameState = row.game_state;
    const playerNames = gameState.players.map(p => p.name);
    const teamAssignments = gameState.players.reduce((acc, p) => {
      acc[p.name] = p.teamId;
      return acc;
    }, {} as Record<string, number>);

    return {
      gameId: row.game_id,
      phase: row.phase,
      status: row.status,
      playerCount: row.player_count,
      creatorName: row.creator_name,
      isPublic: row.is_public,
      createdAt: row.created_at,
      playerNames,
      teamAssignments,
    };
  });
}

/**
 * Check if a game exists in the database
 */
export async function gameExists(gameId: string): Promise<boolean> {
  const text = `
    SELECT 1 FROM active_games WHERE game_id = $1 LIMIT 1
  `;
  const result = await query(text, [gameId]);
  return result.rows.length > 0;
}

/**
 * Cleanup abandoned games (called periodically)
 * Removes games that haven't been updated in 2 hours
 */
export async function cleanupAbandonedGamesDB(): Promise<number> {
  const text = `SELECT cleanup_abandoned_games()`;
  const result = await query(text);
  return result.rows[0].cleanup_abandoned_games;
}
