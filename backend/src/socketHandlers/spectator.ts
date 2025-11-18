/**
 * Spectator Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all spectator-related socket events:
 * - spectate_game: Join game as observer
 * - leave_spectate: Leave spectator mode
 */

import { Socket, Server } from 'socket.io';
import { GameState } from '../types/game';
import { Logger } from 'winston';

/**
 * Dependencies needed by the spectator handlers
 */
export interface SpectatorHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;

  // Socket.io
  io: Server;

  // Utility
  logger: Logger;
  errorBoundaries: any;

}

/**
 * Register all spectator-related Socket.io handlers
 */
export function registerSpectatorHandlers(socket: Socket, deps: SpectatorHandlersDependencies): void {
  const {
    games,
    io,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // spectate_game - Join game as observer
  // ============================================================================
  socket.on('spectate_game', errorBoundaries.gameAction('spectate_game')(({ gameId, spectatorName }: { gameId: string; spectatorName?: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Join spectator room
    socket.join(`${gameId}-spectators`);
    console.log(`Spectator ${socket.id} (${spectatorName || 'Anonymous'}) joined game ${gameId}`);

    // Create spectator game state (hide player hands)
    const spectatorGameState = {
      ...game,
      players: game.players.map(player => ({
        id: player.id,
        name: player.name,
        teamId: player.teamId,
        hand: [], // Hide hands from spectators
        tricksWon: player.tricksWon,
        pointsWon: player.pointsWon,
      }))
    };

    // Send spectator game state
    socket.emit('spectator_joined', {
      gameState: spectatorGameState,
      isSpectator: true
    });

    // Notify other players that a spectator joined
    io.to(gameId).emit('spectator_update', {
      message: `${spectatorName || 'A spectator'} is now watching`,
      spectatorCount: io.sockets.adapter.rooms.get(`${gameId}-spectators`)?.size || 0
    });
  }));

  // ============================================================================
  // leave_spectate - Leave spectator mode
  // ============================================================================
  socket.on('leave_spectate', errorBoundaries.gameAction('leave_spectate')(({ gameId }: { gameId: string }) => {
    socket.leave(`${gameId}-spectators`);
    console.log(`Spectator ${socket.id} left game ${gameId}`);

    // Notify remaining players
    io.to(gameId).emit('spectator_update', {
      message: 'A spectator left',
      spectatorCount: io.sockets.adapter.rooms.get(`${gameId}-spectators`)?.size || 0
    });

    socket.emit('spectator_left', { success: true });
  }));
}
