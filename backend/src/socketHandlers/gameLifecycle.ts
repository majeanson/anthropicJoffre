/**
 * Game Lifecycle Socket.io Handlers
 * Improvement Plan Task 12: Extracted from lobby.ts
 *
 * Handles game lifecycle events:
 * - start_game: Start the game from team selection
 * - leave_game: Leave the game (convert to empty seat)
 */

import { Socket, Server } from 'socket.io';
import { GameState } from '../types/game';
import { Logger } from 'winston';
import {
  validateInput,
  leaveGamePayloadSchema,
  LeaveGamePayload,
} from '../validation/schemas';
import { logValidationError } from '../utils/logger';
import * as PersistenceManager from '../db/persistenceManager';

/**
 * Dependencies needed by the game lifecycle handlers
 */
export interface GameLifecycleHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  gameDeletionTimeouts: Map<string, NodeJS.Timeout>;

  // Socket.io
  io: Server;

  // Online player tracking
  updateOnlinePlayer: (socketId: string, playerName: string, status: 'in_lobby' | 'in_game' | 'in_team_selection', gameId?: string) => void;

  // Game lifecycle
  startNewRound: (gameId: string) => void;

  // Validation functions
  validateGameStart: (game: GameState) => { success: boolean; error?: string };

  // Utility
  logger: Logger;
  errorBoundaries: import('../middleware/errorBoundary').ErrorBoundaries;
}

/**
 * Register all game lifecycle-related Socket.io handlers
 */
export function registerGameLifecycleHandlers(socket: Socket, deps: GameLifecycleHandlersDependencies): void {
  const {
    games,
    gameDeletionTimeouts,
    io,
    updateOnlinePlayer,
    startNewRound,
    validateGameStart,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // start_game - Start the game from team selection
  // ============================================================================
  socket.on('start_game', errorBoundaries.gameAction('start_game')(({ gameId }: { gameId: string }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validateGameStart(game);
    if (!validation.success) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // Side effects - Update online player statuses (only for human players, not bots)
    game.players.forEach(player => {
      if (!player.isBot) {
        updateOnlinePlayer(player.id, player.name, 'in_game', gameId);
      }
    });

    // Start the game (handles state transitions and I/O)
    startNewRound(gameId);
  }));

  // ============================================================================
  // leave_game - Leave the game
  // ============================================================================
  socket.on('leave_game', errorBoundaries.gameAction('leave_game')(async (payload: LeaveGamePayload) => {
    // Validate input with Zod schema
    const validation = validateInput(leaveGamePayloadSchema, payload);
    if (!validation.success) {
      logValidationError('leave_game', validation.error, payload, socket.id);
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      return;
    }

    const { gameId } = validation.data;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find player by name (stable identifier) - socket IDs are volatile
    const playerName = socket.data.playerName;
    const player = playerName
      ? game.players.find(p => p.name === playerName)
      : game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Clean up player sessions from database (conditional on persistence mode)
    await PersistenceManager.deletePlayerSessions(player.name, gameId, game.persistenceMode);

    // Instead of removing player, convert to empty seat
    const playerIndex = game.players.findIndex(p => p.id === player.id);
    if (playerIndex !== -1) {
      console.log(`Player ${player.name} (${socket.id}) leaving game ${gameId} - converting to empty seat`);

      // Convert player to empty seat (preserve team and position)
      game.players[playerIndex] = {
        ...player,
        id: `empty_${playerIndex}_${Date.now()}`, // Unique ID for empty seat
        name: `Empty Seat (${player.name})`, // Show who left
        hand: [], // Clear hand
        isEmpty: true,
        emptySlotName: `Empty Seat`,
        isBot: false,
        botDifficulty: undefined,
        connectionStatus: 'disconnected',
        tricksWon: 0, // Reset stats for new player
        pointsWon: 0,
      };

      // Leave the game room
      socket.leave(gameId);

      // Notify remaining players
      io.to(gameId).emit('player_left', { playerId: socket.id, gameState: game });

      // Check if all seats are empty - if so, schedule game deletion
      const allEmpty = game.players.every(p => p.isEmpty);
      if (allEmpty) {
        // For Quick Play games or games that had multiple human players, give more time for reconnection
        // Check if game ever had multiple human players (not counting bots)
        const hadMultipleHumans = game.isBotGame || game.players.filter(p => !p.isBot).length >= 2;
        const deletionDelay = hadMultipleHumans ? 15 * 60 * 1000 : 5 * 60 * 1000; // 15 min for multiplayer, 5 min for solo
        const deletionMinutes = hadMultipleHumans ? 15 : 5;

        console.log(`Game ${gameId} - all seats are now empty, scheduling deletion in ${deletionMinutes} minutes${hadMultipleHumans ? ' (multiplayer/Quick Play)' : ''}`);

        const deletionTimeout = setTimeout(() => {
          if (games.has(gameId)) {
            const currentGame = games.get(gameId);
            // Only delete if all seats still empty
            if (currentGame && currentGame.players.every(p => p.isEmpty)) {
              games.delete(gameId);
              gameDeletionTimeouts.delete(gameId);
              console.log(`Game ${gameId} deleted after timeout (all seats empty)`);
            }
          }
        }, deletionDelay);

        gameDeletionTimeouts.set(gameId, deletionTimeout);
      }

      // Confirm to the leaving player
      socket.emit('leave_game_success', { success: true });
    }
  }));
}
