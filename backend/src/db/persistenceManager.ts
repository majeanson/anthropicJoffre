/**
 * Persistence Manager
 * Phase 2: Conditional Database Persistence
 *
 * Provides wrapper functions that conditionally save to database based on:
 * - Game persistence mode ('elo' vs 'casual')
 * - Database availability
 *
 * **ELO Mode**: Full database persistence with stats, rankings, and reconnection
 * **Casual Mode**: Memory-only, no database operations (reduces Neon usage to 0)
 */

import { GameState, Player } from '../types/game';
import {
  saveOrUpdateGame as dbSaveOrUpdateGame,
  saveGameParticipants as dbSaveGameParticipants,
  markGameFinished as dbMarkGameFinished,
  updateRoundStats as dbUpdateRoundStats,
  updateGameStats as dbUpdateGameStats,
  getPlayerStats,
  calculateEloChange,
} from './index';
import {
  createSession as dbCreateSession,
  deletePlayerSessions as dbDeletePlayerSessions,
} from './sessions';
import {
  updatePlayerPresence as dbUpdatePlayerPresence,
} from './presence';

/**
 * Save or update game state (conditional on persistence mode)
 */
export async function saveOrUpdateGame(
  gameState: GameState,
  createdAt: Date
): Promise<void> {
  if (gameState.persistenceMode === 'casual') {
    // Casual mode: Skip database save
    console.log(`[Casual] Skipped game save for ${gameState.id}`);
    return;
  }

  // ELO mode: Full database persistence
  try {
    await dbSaveOrUpdateGame(gameState, createdAt);
  } catch (error) {
    console.error(`[DB] Failed to save game ${gameState.id}:`, error);
    // Don't throw - allow game to continue in memory-only mode
  }
}

/**
 * Save game participants (conditional on persistence mode)
 */
export async function saveGameParticipants(
  gameId: string,
  players: Player[],
  persistenceMode: 'elo' | 'casual'
): Promise<void> {
  if (persistenceMode === 'casual') {
    console.log(`[Casual] Skipped participants save for ${gameId}`);
    return;
  }

  try {
    await dbSaveGameParticipants(gameId, players);
  } catch (error) {
    console.error(`[DB] Failed to save participants for ${gameId}:`, error);
  }
}

/**
 * Mark game as finished (conditional on persistence mode)
 */
export async function markGameFinished(
  gameId: string,
  winningTeam: 1 | 2,
  persistenceMode: 'elo' | 'casual'
): Promise<void> {
  if (persistenceMode === 'casual') {
    console.log(`[Casual] Skipped finish marker for ${gameId}`);
    return;
  }

  try {
    await dbMarkGameFinished(gameId, winningTeam);
  } catch (error) {
    console.error(`[DB] Failed to mark game finished ${gameId}:`, error);
  }
}

/**
 * Update round-level statistics (conditional on persistence mode)
 */
export async function updateRoundStats(
  playerName: string,
  stats: Parameters<typeof dbUpdateRoundStats>[1],
  persistenceMode: 'elo' | 'casual'
): Promise<void> {
  if (persistenceMode === 'casual') {
    console.log(`[Casual] Skipped round stats for ${playerName}`);
    return;
  }

  try {
    await dbUpdateRoundStats(playerName, stats);
  } catch (error) {
    console.error(`[DB] Failed to update round stats for ${playerName}:`, error);
  }
}

/**
 * Update game-level statistics with ELO (conditional on persistence mode)
 */
export async function updateGameStats(
  playerName: string,
  stats: Parameters<typeof dbUpdateGameStats>[1],
  eloChange: number,
  persistenceMode: 'elo' | 'casual'
): Promise<void> {
  if (persistenceMode === 'casual') {
    console.log(`[Casual] Skipped game stats for ${playerName}`);
    return;
  }

  try {
    await dbUpdateGameStats(playerName, stats, eloChange);
  } catch (error) {
    console.error(`[DB] Failed to update game stats for ${playerName}:`, error);
  }
}

/**
 * Create player session (conditional on persistence mode and player type)
 */
export async function createSession(
  playerName: string,
  socketId: string,
  gameId: string,
  persistenceMode: 'elo' | 'casual',
  isBot: boolean
): Promise<any> {
  // Never create sessions for bots
  if (isBot) {
    console.log(`[Session] Skipped session for bot ${playerName}`);
    return null;
  }

  // Skip sessions for casual games (no reconnection support)
  if (persistenceMode === 'casual') {
    console.log(`[Casual] Skipped session for ${playerName}`);
    return null;
  }

  // ELO mode: Create database session for reconnection
  try {
    return await dbCreateSession(playerName, socketId, gameId);
  } catch (error) {
    console.error(`[DB] Failed to create session for ${playerName}:`, error);
    return null;
  }
}

/**
 * Delete player sessions (conditional on persistence mode)
 */
export async function deletePlayerSessions(
  playerName: string,
  gameId: string,
  persistenceMode: 'elo' | 'casual'
): Promise<void> {
  if (persistenceMode === 'casual') {
    console.log(`[Casual] Skipped session deletion for ${playerName}`);
    return;
  }

  try {
    await dbDeletePlayerSessions(playerName, gameId);
  } catch (error) {
    console.error(`[DB] Failed to delete sessions for ${playerName}:`, error);
  }
}

/**
 * Update player online presence (conditional on persistence mode)
 */
export async function updatePlayerPresence(
  playerName: string,
  status: 'online' | 'offline',
  persistenceMode: 'elo' | 'casual',
  socketId?: string,
  gameId?: string
): Promise<void> {
  if (persistenceMode === 'casual') {
    // Casual mode: Skip presence tracking
    return;
  }

  try {
    await dbUpdatePlayerPresence(playerName, status, socketId, gameId);
  } catch (error) {
    console.error(`[DB] Failed to update presence for ${playerName}:`, error);
  }
}

/**
 * Calculate ELO changes for all players after game completion
 * Returns map of playerName -> eloChange
 */
export async function calculateEloChangesForGame(
  players: Player[],
  winningTeam: 1 | 2,
  persistenceMode: 'elo' | 'casual'
): Promise<Map<string, number>> {
  const eloChanges = new Map<string, number>();

  // Casual mode: No ELO changes
  if (persistenceMode === 'casual') {
    players.forEach(p => eloChanges.set(p.name, 0));
    return eloChanges;
  }

  // ELO mode: Calculate real ELO changes
  const humanPlayers = players.filter(p => !p.isBot);

  for (const player of humanPlayers) {
    const won = player.teamId === winningTeam;

    // Get current player stats to calculate ELO
    try {
      const currentStats = await getPlayerStats(player.name);
      const currentElo = currentStats?.elo_rating || 1200;

      // Calculate opponent average ELO (opposing team's average)
      const opposingTeam = humanPlayers.filter(p => p.teamId !== player.teamId);
      const opponentElos = await Promise.all(
        opposingTeam.map(async (opp) => {
          const stats = await getPlayerStats(opp.name);
          return stats?.elo_rating || 1200;
        })
      );
      const avgOpponentElo = opponentElos.length > 0
        ? opponentElos.reduce((sum, elo) => sum + elo, 0) / opponentElos.length
        : 1200;

      // Calculate ELO change
      const eloChange = calculateEloChange(currentElo, avgOpponentElo, won);
      eloChanges.set(player.name, eloChange);
    } catch (error) {
      console.error(`[DB] Failed to calculate ELO for ${player.name}:`, error);
      eloChanges.set(player.name, 0);
    }
  }

  return eloChanges;
}
