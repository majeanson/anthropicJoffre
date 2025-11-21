/**
 * Team Selection Socket.io Handlers
 * Improvement Plan Task 12: Extracted from lobby.ts
 *
 * Handles all team selection-related socket events:
 * - select_team: Select team during team selection
 * - swap_position: Swap positions with another player (immediate, for bots)
 * - request_swap: Request position swap (for human players with confirmation)
 * - respond_to_swap: Accept or reject swap request
 */

import { Socket, Server } from 'socket.io';
import { GameState } from '../types/game';
import { Logger } from 'winston';

/**
 * Swap request tracking interface
 */
export interface SwapRequest {
  gameId: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  timeout: NodeJS.Timeout;
}

/**
 * Dependencies needed by the team selection handlers
 */
export interface TeamSelectionHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  pendingSwapRequests: Map<string, SwapRequest>;

  // Socket.io
  io: Server;

  // Emission helpers
  emitGameUpdate: (gameId: string, gameState: GameState, forceFull?: boolean) => void;

  // Validation functions
  validateTeamSelection: (game: GameState, playerId: string, teamId: 1 | 2) => { success: boolean; error?: string };
  validatePositionSwap: (game: GameState, playerId: string, targetPlayerId: string) => { success: boolean; error?: string };

  // State transformation functions
  applyTeamSelection: (game: GameState, playerId: string, teamId: 1 | 2) => void;
  applyPositionSwap: (game: GameState, playerId: string, targetPlayerId: string) => void;

  // Utility
  logger: Logger;
  errorBoundaries: import('../middleware/errorBoundary').ErrorBoundaries;
}

/**
 * Register all team selection-related Socket.io handlers
 */
export function registerTeamSelectionHandlers(socket: Socket, deps: TeamSelectionHandlersDependencies): void {
  const {
    games,
    pendingSwapRequests,
    io,
    emitGameUpdate,
    validateTeamSelection,
    validatePositionSwap,
    applyTeamSelection,
    applyPositionSwap,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // select_team - Select team during team selection
  // ============================================================================
  socket.on('select_team', errorBoundaries.gameAction('select_team')(({ gameId, teamId }: { gameId: string; teamId: 1 | 2 }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validateTeamSelection(game, socket.id, teamId);
    if (!validation.success) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // STATE TRANSFORMATION - Use pure state function
    applyTeamSelection(game, socket.id, teamId);

    // I/O - Emit updates
    emitGameUpdate(gameId, game);
  }));

  // ============================================================================
  // swap_position - Swap positions with another player (immediate, for bots)
  // ============================================================================
  socket.on('swap_position', errorBoundaries.gameAction('swap_position')(({ gameId, targetPlayerId }: { gameId: string; targetPlayerId: string }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validatePositionSwap(game, socket.id, targetPlayerId);
    if (!validation.success) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // STATE TRANSFORMATION - Use pure state function
    applyPositionSwap(game, socket.id, targetPlayerId);

    // I/O - Emit updates (force full update to ensure hands are synced)
    emitGameUpdate(gameId, game, true);
  }));

  // ============================================================================
  // request_swap - Request position swap (for human players)
  // ============================================================================
  socket.on('request_swap', errorBoundaries.gameAction('request_swap')(({ gameId, targetPlayerId }: { gameId: string; targetPlayerId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION
    const validation = validatePositionSwap(game, socket.id, targetPlayerId);
    if (!validation.success) {
      socket.emit('error', { message: validation.error });
      return;
    }

    const requester = game.players.find(p => p.id === socket.id);
    const target = game.players.find(p => p.id === targetPlayerId);

    if (!requester || !target) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    // If target is a bot, execute swap immediately
    if (target.isBot) {
      applyPositionSwap(game, socket.id, targetPlayerId);
      emitGameUpdate(gameId, game);
      return;
    }

    // Cancel any existing request from this requester (1 request per player limit)
    const existingRequestKey = Array.from(pendingSwapRequests.keys()).find(key => {
      const request = pendingSwapRequests.get(key);
      return request && request.requesterId === socket.id;
    });
    if (existingRequestKey) {
      const existingRequest = pendingSwapRequests.get(existingRequestKey);
      if (existingRequest) {
        clearTimeout(existingRequest.timeout);
        pendingSwapRequests.delete(existingRequestKey);
      }
    }

    // Determine if swap will change teams
    const requesterIndex = game.players.findIndex(p => p.id === socket.id);
    const targetIndex = game.players.findIndex(p => p.id === targetPlayerId);
    const requesterTeam = requesterIndex % 2 === 0 ? 1 : 2;
    const targetTeam = targetIndex % 2 === 0 ? 1 : 2;
    const willChangeTeams = requesterTeam !== targetTeam;

    // Create timeout for auto-rejection (30 seconds)
    const timeout = setTimeout(() => {
      const requestKey = `${gameId}-${targetPlayerId}`;
      pendingSwapRequests.delete(requestKey);

      // Notify requester that request expired
      io.to(socket.id).emit('swap_rejected', {
        message: `${target.name} didn't respond to your swap request`
      });
    }, 30000);

    // Store pending request
    const requestKey = `${gameId}-${targetPlayerId}`;
    pendingSwapRequests.set(requestKey, {
      gameId,
      requesterId: socket.id,
      requesterName: requester.name,
      targetId: targetPlayerId,
      timeout
    });

    // Notify target player
    io.to(targetPlayerId).emit('swap_request_received', {
      fromPlayerId: socket.id,
      fromPlayerName: requester.name,
      willChangeTeams
    });
  }));

  // ============================================================================
  // respond_to_swap - Accept or reject swap request
  // ============================================================================
  socket.on('respond_to_swap', errorBoundaries.gameAction('respond_to_swap')(({ gameId, requesterId, accepted }: { gameId: string; requesterId: string; accepted: boolean }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find and validate pending request
    const requestKey = `${gameId}-${socket.id}`;
    const swapRequest = pendingSwapRequests.get(requestKey);

    if (!swapRequest || swapRequest.requesterId !== requesterId) {
      socket.emit('error', { message: 'No pending swap request found' });
      return;
    }

    // Clear timeout and remove request
    clearTimeout(swapRequest.timeout);
    pendingSwapRequests.delete(requestKey);

    const requester = game.players.find(p => p.id === requesterId);
    const target = game.players.find(p => p.id === socket.id);

    if (!requester || !target) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    if (accepted) {
      // Execute the swap
      applyPositionSwap(game, requesterId, socket.id);

      // Notify both players
      io.to(requesterId).emit('swap_accepted', {
        message: `${target.name} accepted your swap request`
      });
      io.to(socket.id).emit('swap_accepted', {
        message: `You swapped positions with ${requester.name}`
      });

      // Update all players with new game state (force full update to ensure hands are synced)
      emitGameUpdate(gameId, game, true);
    } else {
      // Notify requester of rejection
      io.to(requesterId).emit('swap_rejected', {
        message: `${target.name} rejected your swap request`
      });
    }
  }));
}
