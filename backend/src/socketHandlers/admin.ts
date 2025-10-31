/**
 * Admin Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all admin/management socket events:
 * - __test_set_scores: Test-only score manipulation
 * - kick_player: Host removes player during team selection
 * - vote_rematch: Vote to restart game after completion
 */

import { Socket, Server } from 'socket.io';
import { GameState, PlayerSession } from '../types/game';
import { Logger } from 'winston';

/**
 * Dependencies needed by the admin handlers
 */
export interface AdminHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  playerSessions: Map<string, PlayerSession>;
  onlinePlayers: Map<string, any>;

  // Socket.io
  io: Server;

  // Database functions
  deletePlayerSessions: (playerName: string, gameId: string) => Promise<void>;

  // Helper functions
  broadcastOnlinePlayers: () => void;

  // Emission helpers
  emitGameUpdate: (gameId: string, gameState: GameState, forceFull?: boolean) => void;

  // Utility
  logger: Logger;
  errorBoundaries: {
    gameAction: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
  };
}

/**
 * Register all admin-related Socket.io handlers
 */
export function registerAdminHandlers(socket: Socket, deps: AdminHandlersDependencies): void {
  const {
    games,
    playerSessions,
    onlinePlayers,
    io,
    deletePlayerSessions,
    broadcastOnlinePlayers,
    emitGameUpdate,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // __test_set_scores - Test-only score manipulation
  // ============================================================================
  socket.on('__test_set_scores', errorBoundaries.gameAction('__test_set_scores')(({ team1, team2 }: { team1: number; team2: number }) => {
    // Find game for this socket
    games.forEach((game) => {
      if (game.players.some(p => p.id === socket.id)) {
        game.teamScores.team1 = team1;
        game.teamScores.team2 = team2;
        console.log(`TEST: Set scores to Team1=${team1}, Team2=${team2}`);

        // Check if game should be over (team >= 41)
        if (team1 >= 41 || team2 >= 41) {
          game.phase = 'game_over';
          const winningTeam = team1 >= 41 ? 1 : 2;
          console.log(`TEST: Game over triggered, Team ${winningTeam} wins`);

          // Emit game_over event
          io.to(game.id).emit('game_over', {
            winningTeam,
            gameState: game
          });
        }

        emitGameUpdate(game.id, game);
      }
    });
  }));

  // ============================================================================
  // kick_player - Host removes player during team selection
  // ============================================================================
  socket.on('kick_player', errorBoundaries.gameAction('kick_player')(async ({ gameId, playerId }: { gameId: string; playerId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Only allow the game creator to kick players
    if (socket.id !== game.creatorId) {
      socket.emit('error', { message: 'Only the game creator can kick players' });
      return;
    }

    // Cannot kick yourself
    if (playerId === socket.id) {
      socket.emit('error', { message: 'Cannot kick yourself' });
      return;
    }

    // Only allow kicking during team selection phase
    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Can only kick players during team selection' });
      return;
    }

    // Find player
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    const kickedPlayer = game.players[playerIndex];

    // Clean up kicked player's sessions from database
    try {
      await deletePlayerSessions(kickedPlayer.name, gameId);
      console.log(`Deleted DB sessions for kicked player ${kickedPlayer.name} from game ${gameId}`);
    } catch (error) {
      console.error('Failed to delete kicked player sessions from DB:', error);
    }

    // Remove player from game
    game.players.splice(playerIndex, 1);

    // Notify the kicked player
    io.to(playerId).emit('kicked_from_game', {
      message: 'You have been removed from the game by the host',
      gameId
    });

    // Remove from socket room
    const kickedSocket = io.sockets.sockets.get(playerId);
    if (kickedSocket) {
      kickedSocket.leave(gameId);
    }

    // Remove player session if it exists
    for (const [token, session] of playerSessions.entries()) {
      if (session.playerId === playerId && session.gameId === gameId) {
        playerSessions.delete(token);
        break;
      }
    }

    // Update online player status
    onlinePlayers.delete(playerId);
    broadcastOnlinePlayers();

    // Broadcast updated game state
    io.to(gameId).emit('player_left', { playerId, gameState: game });
    console.log(`Player ${kickedPlayer.name} was kicked from game ${gameId} by host`);
  }));

  // ============================================================================
  // vote_rematch - Vote to restart game after completion
  // ============================================================================
  socket.on('vote_rematch', errorBoundaries.gameAction('vote_rematch')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Verify game is over
    if (game.phase !== 'game_over') {
      socket.emit('error', { message: 'Game is not over yet' });
      return;
    }

    // Verify player is in game
    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Initialize rematch votes if not exists
    if (!game.rematchVotes) {
      game.rematchVotes = [];
    }

    // Check if player already voted (by name for stability across reconnections)
    if (game.rematchVotes.includes(player.name)) {
      socket.emit('error', { message: 'You already voted for rematch' });
      return;
    }

    // Add vote using player name (stable across reconnections)
    game.rematchVotes.push(player.name);
    console.log(`Player ${player.name} voted for rematch. Votes: ${game.rematchVotes.length}/4`);

    // Broadcast updated vote count
    io.to(gameId).emit('rematch_vote_update', {
      votes: game.rematchVotes.length,
      totalPlayers: 4,
      voters: game.rematchVotes
    });

    // If all 4 players voted, start new game
    if (game.rematchVotes.length === 4) {
      console.log(`All players voted for rematch in game ${gameId}. Starting new game...`);

      // Reset game state
      game.phase = 'team_selection';
      game.currentBets = [];
      game.highestBet = null;
      game.trump = null;
      game.currentTrick = [];
      game.previousTrick = null;
      game.currentPlayerIndex = 0;
      game.dealerIndex = 0;
      game.teamScores = { team1: 0, team2: 0 };
      game.roundNumber = 0;
      game.roundHistory = [];
      game.currentRoundTricks = [];
      game.playersReady = [];
      game.rematchVotes = [];

      // Keep players but clear their hands and reset stats
      game.players.forEach(player => {
        player.hand = [];
        player.tricksWon = 0;
        player.pointsWon = 0;
      });

      // Broadcast game restarted
      io.to(gameId).emit('rematch_started', { gameState: game });
      console.log(`Rematch started for game ${gameId}`);
    }
  }));
}
