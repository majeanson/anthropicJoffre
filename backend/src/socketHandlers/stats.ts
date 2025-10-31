/**
 * Stats Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all stats/leaderboard socket events:
 * - get_player_stats: Get player statistics
 * - get_leaderboard: Get global leaderboard
 * - get_player_history: Get player game history
 * - get_game_replay: Get game replay data
 * - get_all_finished_games: Get all finished games for browsing
 */

import { Socket, Server } from 'socket.io';
import { Logger } from 'winston';

/**
 * Dependencies needed by the stats handlers
 */
export interface StatsHandlersDependencies {
  // Database functions
  getPlayerStats: (playerName: string) => Promise<any>;
  getLeaderboard: (limit: number, excludeBots: boolean) => Promise<any[]>;
  getPlayerGameHistory: (playerName: string, limit: number) => Promise<any[]>;
  getGameReplayData: (gameId: string) => Promise<any | null>;
  getAllFinishedGames: (limit: number, offset: number) => Promise<any[]>;

  // Utility
  logger: Logger;
  errorBoundaries: {
    readOnly: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
  };
}

/**
 * Register all stats-related Socket.io handlers
 */
export function registerStatsHandlers(socket: Socket, deps: StatsHandlersDependencies): void {
  const {
    getPlayerStats,
    getLeaderboard,
    getPlayerGameHistory,
    getGameReplayData,
    getAllFinishedGames,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // get_player_stats - Get player statistics
  // ============================================================================
  socket.on('get_player_stats', errorBoundaries.readOnly('get_player_stats')(async ({ playerName }: { playerName: string }) => {
    try {
      const stats = await getPlayerStats(playerName);
      socket.emit('player_stats_response', { stats, playerName });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      socket.emit('error', { message: 'Failed to fetch player statistics' });
    }
  }));

  // ============================================================================
  // get_leaderboard - Get global leaderboard
  // ============================================================================
  socket.on('get_leaderboard', errorBoundaries.readOnly('get_leaderboard')(async ({ limit = 100, excludeBots = true }: { limit?: number; excludeBots?: boolean }) => {
    try {
      const leaderboard = await getLeaderboard(limit, excludeBots);
      socket.emit('leaderboard_response', { players: leaderboard });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      socket.emit('error', { message: 'Failed to fetch leaderboard' });
    }
  }));

  // ============================================================================
  // get_player_history - Get player game history
  // ============================================================================
  socket.on('get_player_history', errorBoundaries.readOnly('get_player_history')(async ({ playerName, limit = 20 }: { playerName: string; limit?: number }) => {
    try {
      const history = await getPlayerGameHistory(playerName, limit);
      socket.emit('player_history_response', { games: history, playerName });
    } catch (error) {
      console.error('Error fetching player history:', error);
      socket.emit('error', { message: 'Failed to fetch player game history' });
    }
  }));

  // ============================================================================
  // get_game_replay - Get game replay data
  // ============================================================================
  socket.on('get_game_replay', errorBoundaries.readOnly('get_game_replay')(async ({ gameId }: { gameId: string }) => {
    try {
      const replayData = await getGameReplayData(gameId);

      if (!replayData) {
        socket.emit('error', { message: 'Game replay not found or game is not finished yet' });
        return;
      }

      socket.emit('game_replay_data', { replayData });
    } catch (error) {
      console.error('Error fetching game replay:', error);
      socket.emit('error', { message: 'Failed to fetch game replay data' });
    }
  }));

  // ============================================================================
  // get_all_finished_games - Get all finished games for browsing
  // ============================================================================
  socket.on('get_all_finished_games', errorBoundaries.readOnly('get_all_finished_games')(async ({ limit = 50, offset = 0 }: { limit?: number; offset?: number }) => {
    try {
      const games = await getAllFinishedGames(limit, offset);
      socket.emit('finished_games_list', { games });
    } catch (error) {
      console.error('Error fetching finished games:', error);
      socket.emit('error', { message: 'Failed to fetch finished games list' });
    }
  }));
}
