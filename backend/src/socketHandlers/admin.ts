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
import * as PersistenceManager from '../db/persistenceManager';
import { clearAllGameSnapshots } from '../db/index';
import * as Sentry from '@sentry/node';
import { OnlinePlayer } from '../utils/onlinePlayerManager';

/**
 * Dependencies needed by the admin handlers
 */
export interface AdminHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  playerSessions: Map<string, PlayerSession>;
  onlinePlayers: Map<string, OnlinePlayer>;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorBoundaries: import('../middleware/errorBoundary').ErrorBoundaries;
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
  // __test_sentry_error - Test Sentry error tracking (backend)
  // ============================================================================
  socket.on('__test_sentry_error', errorBoundaries.gameAction('__test_sentry_error')(({ message, gameId }: { message: string; gameId?: string }) => {
    logger.info('[SENTRY TEST] Triggering test error for Sentry integration');
    console.log('🧪 SENTRY TEST: Capturing test error to Sentry...');

    // Capture a test error to Sentry
    Sentry.captureException(new Error(message || '🧪 Test Error - Backend Sentry Integration'), {
      level: 'error',
      tags: {
        test: true,
        source: 'debug_panel',
        type: 'manual_test',
        socketId: socket.id,
      },
      extra: {
        gameId: gameId || 'none',
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        activeGames: games.size,
      },
    });

    console.log('✅ SENTRY TEST: Test error sent to Sentry successfully');
    socket.emit('sentry_test_success', {
      message: 'Test error sent to Sentry backend',
      timestamp: new Date().toISOString(),
    });
  }));

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
  // kick_player - Host removes player from game (works in all phases)
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

    // Find player
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    const kickedPlayer = game.players[playerIndex];

    // Clean up kicked player's sessions from database (conditional on persistence mode)
    await PersistenceManager.deletePlayerSessions(kickedPlayer.name, gameId, game.persistenceMode);

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
  // clear_specific_game - Clear a single game from memory
  // ============================================================================
  socket.on('clear_specific_game', errorBoundaries.gameAction('clear_specific_game')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Remove game
    games.delete(gameId);

    // Remove player sessions for this game
    for (const [token, session] of playerSessions.entries()) {
      if (session.gameId === gameId) {
        playerSessions.delete(token);
      }
    }

    logger.info(`[ADMIN] Cleared game ${gameId} from memory`);
    console.log(`✓ Game cleared: ${gameId}`);

    socket.emit('game_cleared', {
      gameId,
      message: `Successfully cleared game ${gameId}`,
    });
  }));

  // ============================================================================
  // clear_finished_games - Clear all games in game_over phase
  // ============================================================================
  socket.on('clear_finished_games', errorBoundaries.gameAction('clear_finished_games')(() => {
    let clearedCount = 0;

    for (const [gameId, game] of games.entries()) {
      if (game.phase === 'game_over') {
        games.delete(gameId);
        clearedCount++;

        // Remove player sessions for this game
        for (const [token, session] of playerSessions.entries()) {
          if (session.gameId === gameId) {
            playerSessions.delete(token);
          }
        }
      }
    }

    logger.info(`[ADMIN] Cleared ${clearedCount} finished games from memory`);
    console.log(`✓ Finished games cleared: ${clearedCount} games removed`);

    socket.emit('finished_games_cleared', {
      gamesCleared: clearedCount,
      message: `Successfully cleared ${clearedCount} finished games`,
    });
  }));

  // ============================================================================
  // clear_all_games - Admin tool to clear all games from memory (Debug Panel)
  // ============================================================================
  socket.on('clear_all_games', errorBoundaries.gameAction('clear_all_games')(async () => {
    const gameCount = games.size;
    const sessionCount = playerSessions.size;

    // Clear all games from memory
    games.clear();

    // Clear all player sessions
    playerSessions.clear();

    // Clear all online players
    onlinePlayers.clear();

    // IMPORTANT: Clear game snapshots from database to prevent restoration on restart
    const snapshotsCleared = await clearAllGameSnapshots();

    logger.info(`[ADMIN] Cleared ${gameCount} games and ${sessionCount} sessions from memory, ${snapshotsCleared} snapshots from database`);
    console.log(`✓ Memory cleared: ${gameCount} games, ${sessionCount} sessions, ${snapshotsCleared} DB snapshots removed`);

    // Notify the requester
    socket.emit('all_games_cleared', {
      gamesCleared: gameCount,
      sessionsCleared: sessionCount,
      snapshotsCleared,
      message: `Successfully cleared ${gameCount} games, ${sessionCount} sessions from memory, and ${snapshotsCleared} snapshots from database`,
    });

    // Broadcast online players update (now empty)
    broadcastOnlinePlayers();
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

    // Find player by name (stable identifier) - socket IDs are volatile
    const playerName = socket.data.playerName;
    const player = playerName
      ? game.players.find(p => p.name === playerName)
      : game.players.find(p => p.id === socket.id);
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

  // ============================================================================
  // debug_auto_play_card - Automatically play a valid card for current player
  // ============================================================================
  socket.on('debug_auto_play_card', errorBoundaries.gameAction('debug_auto_play_card')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Must be in playing phase
    if (game.phase !== 'playing') {
      socket.emit('error', { message: 'Not in playing phase' });
      return;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.hand.length === 0) {
      socket.emit('error', { message: 'Current player has no cards' });
      return;
    }

    // Find a valid card to play (first playable card)
    let cardToPlay = currentPlayer.hand[0];

    // If there's a led suit, try to follow it
    if (game.currentTrick.length > 0) {
      const ledSuit = game.currentTrick[0].card.color;
      const suitCards = currentPlayer.hand.filter(card => card.color === ledSuit);
      if (suitCards.length > 0) {
        cardToPlay = suitCards[0];
      }
    }

    // Emit play_card event (reuse existing handler)
    logger.info(`[DEBUG] Auto-playing card ${cardToPlay.color} ${cardToPlay.value} for ${currentPlayer.name}`);
    console.log(`🤖 DEBUG: Auto-playing ${cardToPlay.color} ${cardToPlay.value} for ${currentPlayer.name}`);

    // Find the socket for the current player and emit the event
    const playerSocket = io.sockets.sockets.get(currentPlayer.id);
    if (playerSocket) {
      playerSocket.emit('play_card', { gameId, card: cardToPlay });
    }
  }));

  // ============================================================================
  // debug_skip_trick - Complete current trick by auto-playing remaining cards
  // ============================================================================
  socket.on('debug_skip_trick', errorBoundaries.gameAction('debug_skip_trick')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'playing') {
      socket.emit('error', { message: 'Not in playing phase' });
      return;
    }

    logger.info(`[DEBUG] Skipping trick in game ${gameId}`);
    console.log(`⏭️ DEBUG: Skipping trick, auto-playing remaining ${4 - game.currentTrick.length} cards`);

    // Auto-play cards until trick is complete
    const interval = setInterval(() => {
      const currentGame = games.get(gameId);
      if (!currentGame || currentGame.phase !== 'playing' || currentGame.currentTrick.length >= 4) {
        clearInterval(interval);
        return;
      }

      const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.hand.length === 0) {
        clearInterval(interval);
        return;
      }

      // Find valid card
      let cardToPlay = currentPlayer.hand[0];
      if (currentGame.currentTrick.length > 0) {
        const ledSuit = currentGame.currentTrick[0].card.color;
        const suitCards = currentPlayer.hand.filter(card => card.color === ledSuit);
        if (suitCards.length > 0) {
          cardToPlay = suitCards[0];
        }
      }

      // Play the card via socket event
      const playerSocket = io.sockets.sockets.get(currentPlayer.id);
      if (playerSocket) {
        playerSocket.emit('play_card', { gameId, card: cardToPlay });
      }
    }, 300); // 300ms between each card play
  }));

  // ============================================================================
  // debug_skip_round - Complete entire round by auto-playing all remaining cards
  // ============================================================================
  socket.on('debug_skip_round', errorBoundaries.gameAction('debug_skip_round')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'playing') {
      socket.emit('error', { message: 'Not in playing phase' });
      return;
    }

    logger.info(`[DEBUG] Skipping entire round in game ${gameId}`);
    console.log(`⏭️⏭️ DEBUG: Skipping round, auto-playing all remaining cards`);

    // Auto-play cards until round is complete (all players have 0 cards)
    const interval = setInterval(() => {
      const currentGame = games.get(gameId);
      if (!currentGame || currentGame.phase !== 'playing') {
        clearInterval(interval);
        return;
      }

      // Check if all players have no cards (round complete)
      const allPlayersEmpty = currentGame.players.every(p => p.hand.length === 0);
      if (allPlayersEmpty) {
        clearInterval(interval);
        console.log(`✅ DEBUG: Round skipped successfully`);
        return;
      }

      const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.hand.length === 0) {
        clearInterval(interval);
        return;
      }

      // Find valid card
      let cardToPlay = currentPlayer.hand[0];
      if (currentGame.currentTrick.length > 0) {
        const ledSuit = currentGame.currentTrick[0].card.color;
        const suitCards = currentPlayer.hand.filter(card => card.color === ledSuit);
        if (suitCards.length > 0) {
          cardToPlay = suitCards[0];
        }
      }

      // Play the card via socket event
      const playerSocket = io.sockets.sockets.get(currentPlayer.id);
      if (playerSocket) {
        playerSocket.emit('play_card', { gameId, card: cardToPlay });
      }
    }, 200); // 200ms between each card play for faster round completion
  }));

  // ============================================================================
  // debug_auto_bet - Automatically place a valid bet for current player
  // ============================================================================
  socket.on('debug_auto_bet', errorBoundaries.gameAction('debug_auto_bet')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'betting') {
      socket.emit('error', { message: 'Not in betting phase' });
      return;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer) {
      socket.emit('error', { message: 'No current player' });
      return;
    }

    // Check if player already bet (use playerName for stable comparison)
    const existingBet = game.currentBets.find(b => b.playerName === currentPlayer.name);
    if (existingBet) {
      socket.emit('error', { message: 'Player already placed a bet' });
      return;
    }

    // Determine valid bet
    let betAmount = 7; // Minimum bet
    let withoutTrump = false;

    // If there's a highest bet, raise it
    if (game.highestBet && !game.highestBet.skipped) {
      betAmount = game.highestBet.amount + 1;
      if (betAmount > 12) {
        betAmount = 12; // Max bet
        withoutTrump = !game.highestBet.withoutTrump; // Toggle without trump
      }
    }

    logger.info(`[DEBUG] Auto-betting ${betAmount} (without trump: ${withoutTrump}) for ${currentPlayer.name}`);
    console.log(`💰 DEBUG: Auto-betting ${betAmount}${withoutTrump ? ' WITHOUT TRUMP' : ''} for ${currentPlayer.name}`);

    // Emit place_bet event
    const playerSocket = io.sockets.sockets.get(currentPlayer.id);
    if (playerSocket) {
      playerSocket.emit('place_bet', { gameId, amount: betAmount, withoutTrump });
    }
  }));

  // ============================================================================
  // debug_force_bet - Force a specific bet for current player
  // ============================================================================
  socket.on('debug_force_bet', errorBoundaries.gameAction('debug_force_bet')(({ gameId, amount, withoutTrump }: { gameId: string; amount: number; withoutTrump: boolean }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'betting') {
      socket.emit('error', { message: 'Not in betting phase' });
      return;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer) {
      socket.emit('error', { message: 'No current player' });
      return;
    }

    // Validate bet amount
    if (amount < 7 || amount > 12) {
      socket.emit('error', { message: 'Bet must be between 7 and 12' });
      return;
    }

    logger.info(`[DEBUG] Force betting ${amount} (without trump: ${withoutTrump}) for ${currentPlayer.name}`);
    console.log(`💎 DEBUG: Force bet ${amount}${withoutTrump ? ' WITHOUT TRUMP' : ''} for ${currentPlayer.name}`);

    // Emit place_bet event
    const playerSocket = io.sockets.sockets.get(currentPlayer.id);
    if (playerSocket) {
      playerSocket.emit('place_bet', { gameId, amount, withoutTrump });
    }
  }));

  // ============================================================================
  // debug_skip_betting - Complete betting phase by auto-betting for all players
  // ============================================================================
  socket.on('debug_skip_betting', errorBoundaries.gameAction('debug_skip_betting')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'betting') {
      socket.emit('error', { message: 'Not in betting phase' });
      return;
    }

    logger.info(`[DEBUG] Skipping betting phase in game ${gameId}`);
    console.log(`⏭️ DEBUG: Skipping betting, auto-betting for all players`);

    // Auto-bet for all players until betting is complete
    const interval = setInterval(() => {
      const currentGame = games.get(gameId);
      if (!currentGame || currentGame.phase !== 'betting') {
        clearInterval(interval);
        console.log(`✅ DEBUG: Betting skipped, moved to playing phase`);
        return;
      }

      const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
      if (!currentPlayer) {
        clearInterval(interval);
        return;
      }

      // Check if player already bet (use playerName for stable comparison)
      const existingBet = currentGame.currentBets.find(b => b.playerName === currentPlayer.name);
      if (existingBet) {
        clearInterval(interval);
        return;
      }

      // Determine valid bet
      let betAmount = 7;
      let withoutTrump = false;

      if (currentGame.highestBet && !currentGame.highestBet.skipped) {
        betAmount = currentGame.highestBet.amount + 1;
        if (betAmount > 12) {
          betAmount = 12;
          withoutTrump = !currentGame.highestBet.withoutTrump;
        }
      }

      // Emit place_bet
      const playerSocket = io.sockets.sockets.get(currentPlayer.id);
      if (playerSocket) {
        playerSocket.emit('place_bet', { gameId, amount: betAmount, withoutTrump });
      }
    }, 400); // 400ms between each bet
  }));
}
