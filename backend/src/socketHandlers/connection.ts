/**
 * Connection Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all connection-related socket events:
 * - reconnect_to_game: Reconnect to a game using session token
 * - disconnect: Handle player disconnection with grace period
 */

import { Socket, Server } from 'socket.io';
import { GameState, PlayerSession, Player } from '../types/game';
import { Logger } from 'winston';
import * as PersistenceManager from '../db/persistenceManager';

/**
 * Dependencies needed by the connection handlers
 */
export interface ConnectionHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  playerSessions: Map<string, PlayerSession>;
  activeTimeouts: Map<string, NodeJS.Timeout>;
  disconnectTimeouts: Map<string, NodeJS.Timeout>;
  gameDeletionTimeouts: Map<string, NodeJS.Timeout>;
  countdownIntervals: Map<string, NodeJS.Timeout>;
  onlinePlayers: Map<string, any>;
  socketRateLimiters: {
    chat: Map<string, any>;
    bet: Map<string, any>;
    card: Map<string, any>;
  };

  // Socket.io
  io: Server;

  // Database functions
  validateDBSession: (token: string) => Promise<PlayerSession | null>;
  updateSessionActivity: (token: string, socketId: string) => Promise<void>;
  deletePlayerSessions: (playerName: string, gameId: string) => Promise<void>;
  markPlayerOffline: (playerName: string) => Promise<void>;

  // Session management
  validateSessionToken: (token: string) => PlayerSession | null;

  // Game functions
  getGame: (gameId: string) => Promise<GameState | undefined>;

  // Timeout management
  startPlayerTimeout: (gameId: string, playerId: string, phase: 'betting' | 'playing') => void;

  // Emission helpers
  emitGameUpdate: (gameId: string, gameState: GameState, forceFull?: boolean) => void;

  // Utility
  logger: Logger;
  errorBoundaries: {
    gameAction: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
    background: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
  };
}

/**
 * Register all connection-related Socket.io handlers
 */
export function registerConnectionHandlers(socket: Socket, deps: ConnectionHandlersDependencies): void {
  const {
    games,
    playerSessions,
    activeTimeouts,
    disconnectTimeouts,
    gameDeletionTimeouts,
    countdownIntervals,
    onlinePlayers,
    socketRateLimiters,
    io,
    validateDBSession,
    updateSessionActivity,
    deletePlayerSessions,
    markPlayerOffline,
    validateSessionToken,
    getGame,
    startPlayerTimeout,
    emitGameUpdate,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // reconnect_to_game - Reconnect to a game using session token
  // ============================================================================
  socket.on('reconnect_to_game', errorBoundaries.gameAction('reconnect_to_game')(async ({ token }: { token: string }) => {
    console.log('Reconnection attempt with token:', token.substring(0, 10) + '...');

    // Validate session from database
    let session: PlayerSession | null;
    try {
      session = await validateDBSession(token);
    } catch (error) {
      console.error('DB session validation error, trying in-memory:', error);
      session = validateSessionToken(token);
    }

    if (!session) {
      socket.emit('reconnection_failed', { message: 'Invalid or expired session token' });
      return;
    }

    console.log('Session found for player:', session.playerName, 'in game:', session.gameId);

    // Load game from database (with cache fallback)
    const game = await getGame(session.gameId);
    if (!game) {
      socket.emit('reconnection_failed', { message: 'Game no longer exists' });
      // Clean up invalid session from DB (default to 'elo' for cleanup of orphaned sessions)
      await PersistenceManager.deletePlayerSessions(session.playerName, session.gameId, 'elo');
      playerSessions.delete(token);
      return;
    }

    // Check if game is finished
    if (game.phase === 'game_over') {
      socket.emit('reconnection_failed', { message: 'Game has finished' });
      return;
    }

    // Find player in game
    const player = game.players.find(p => p.name === session.playerName);
    if (!player) {
      socket.emit('reconnection_failed', { message: 'Player no longer in game' });
      // Clean up invalid session (conditional on persistence mode)
      await PersistenceManager.deletePlayerSessions(session.playerName, session.gameId, game.persistenceMode);
      playerSessions.delete(token);
      return;
    }

    // Don't allow reconnection to bot players (safety check)
    if (player.isBot) {
      socket.emit('reconnection_failed', { message: 'Cannot reconnect as bot player' });
      // Clean up bot session (conditional on persistence mode)
      await PersistenceManager.deletePlayerSessions(session.playerName, session.gameId, game.persistenceMode);
      playerSessions.delete(token);
      return;
    }

    // Update player's socket ID
    const oldSocketId = player.id;
    player.id = socket.id;

    // Reset connection status
    player.connectionStatus = 'connected';
    player.disconnectedAt = undefined;
    player.reconnectTimeLeft = undefined;

    // Clear countdown interval if it exists
    const countdownInterval = countdownIntervals.get(oldSocketId);
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownIntervals.delete(oldSocketId);
    }

    // IMPORTANT: Update player ID in currentTrick to fix card display after reconnection
    game.currentTrick.forEach(tc => {
      if (tc.playerId === oldSocketId) {
        tc.playerId = socket.id;
      }
    });

    // Update session with new socket ID and timestamp in database
    try {
      await updateSessionActivity(token, socket.id);
    } catch (error) {
      console.error('Failed to update session activity in DB:', error);
      // Update in-memory as fallback
      session.playerId = socket.id;
      session.timestamp = Date.now();
    }

    // Join game room
    socket.join(session.gameId);

    // Cancel game deletion timeout if it exists (player returned)
    const deletionTimeout = gameDeletionTimeouts.get(session.gameId);
    if (deletionTimeout) {
      clearTimeout(deletionTimeout);
      gameDeletionTimeouts.delete(session.gameId);
      console.log(`Cancelled deletion timeout for game ${session.gameId} (player returned)`);
    }

    // Update timeout if this player had an active timeout
    // This fixes the bug where a reconnecting player on their turn gets stuck
    const oldTimeoutKey = `${session.gameId}-${oldSocketId}`;
    const existingTimeout = activeTimeouts.get(oldTimeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      activeTimeouts.delete(oldTimeoutKey);
      console.log(`Cleared old timeout for ${oldSocketId}, restarting for ${socket.id}`);

      // Restart timeout with new socket ID if it's their turn
      const currentPlayer = game.players[game.currentPlayerIndex];
      if (currentPlayer && currentPlayer.id === socket.id) {
        const phase = game.phase === 'betting' ? 'betting' : 'playing';
        startPlayerTimeout(session.gameId, socket.id, phase as 'betting' | 'playing');
      }
    }

    // Migrate rematch votes from old socket ID to player name (for backward compatibility)
    if (game.rematchVotes && game.rematchVotes.includes(oldSocketId)) {
      const index = game.rematchVotes.indexOf(oldSocketId);
      game.rematchVotes[index] = player.name;
      console.log(`Migrated rematch vote from socket ID to player name: ${player.name}`);
    }

    // Migrate playersReady from old socket ID to player name (for backward compatibility)
    if (game.playersReady && game.playersReady.includes(oldSocketId)) {
      const index = game.playersReady.indexOf(oldSocketId);
      game.playersReady[index] = player.name;
      console.log(`Migrated player ready status from socket ID to player name: ${player.name}`);
    }

    // Update bets with old socket ID to new socket ID
    game.currentBets.forEach(bet => {
      if (bet.playerId === oldSocketId) {
        bet.playerId = socket.id;
        console.log(`Updated bet playerId from ${oldSocketId} to ${socket.id}`);
      }
    });
    if (game.highestBet && game.highestBet.playerId === oldSocketId) {
      game.highestBet.playerId = socket.id;
      console.log(`Updated highestBet playerId from ${oldSocketId} to ${socket.id}`);
    }

    // Update current trick with old socket ID to new socket ID
    game.currentTrick.forEach(trickCard => {
      if (trickCard.playerId === oldSocketId) {
        trickCard.playerId = socket.id;
        console.log(`Updated trick card playerId from ${oldSocketId} to ${socket.id}`);
      }
    });

    console.log(`Player ${session.playerName} reconnected to game ${session.gameId}`);

    // Send updated game state to reconnected player
    socket.emit('reconnection_successful', { gameState: game, session });

    // Notify other players
    io.to(session.gameId).emit('player_reconnected', {
      playerId: socket.id,
      playerName: session.playerName,
      oldSocketId
    });
  }));

  // ============================================================================
  // disconnect - Handle player disconnection with grace period
  // ============================================================================
  socket.on('disconnect', errorBoundaries.background('disconnect')(async () => {
    console.log('Client disconnected:', socket.id);

    // Clean up rate limiters
    socketRateLimiters.chat.delete(socket.id);
    socketRateLimiters.bet.delete(socket.id);
    socketRateLimiters.card.delete(socket.id);

    // Remove from online players
    const onlinePlayer = onlinePlayers.get(socket.id);
    onlinePlayers.delete(socket.id);

    // Find player's game and session
    let playerGame: GameState | null = null;
    let playerGameId: string | null = null;
    let playerName: string | null = null;

    games.forEach((game, gameId) => {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        playerGame = game;
        playerGameId = gameId;
        playerName = player.name;
      }
    });

    if (!playerGame || !playerGameId) {
      // Player not in any game - mark as offline immediately if we know their name
      if (onlinePlayer) {
        try {
          await markPlayerOffline(onlinePlayer.playerName);
        } catch (error) {
          console.error('Failed to mark player offline:', error);
        }
      }
      return;
    }

    // TypeScript type guard - playerGame is definitely not null here
    const game: GameState = playerGame;
    const gameId: string = playerGameId;

    // Don't immediately remove player - give 15 minutes grace period for reconnection (mobile AFK)
    console.log(`Player ${socket.id} disconnected. Waiting for reconnection...`);

    // Update player connection status
    const player = game.players.find((p: Player) => p.id === socket.id);
    if (player) {
      player.connectionStatus = 'disconnected';
      player.disconnectedAt = Date.now();
      player.reconnectTimeLeft = 900; // 15 minutes = 900 seconds
    }

    // Start countdown timer that updates every second
    const countdownInterval = setInterval(() => {
      const currentGame = games.get(gameId);
      if (!currentGame) {
        const interval = countdownIntervals.get(socket.id);
        if (interval) {
          clearInterval(interval);
          countdownIntervals.delete(socket.id);
        }
        return;
      }

      const player = currentGame.players.find(p => p.id === socket.id);
      if (player && player.connectionStatus === 'disconnected' && player.reconnectTimeLeft) {
        player.reconnectTimeLeft = Math.max(0, player.reconnectTimeLeft - 1);

        // Emit connection status update every 5 seconds to reduce bandwidth
        if (player.reconnectTimeLeft % 5 === 0 || player.reconnectTimeLeft < 5) {
          io.to(gameId).emit('connection_status_update', {
            playerId: socket.id,
            playerName: player.name,
            status: 'disconnected',
            reconnectTimeLeft: player.reconnectTimeLeft
          });
        }

        // Clear interval when timer reaches 0
        if (player.reconnectTimeLeft === 0) {
          const interval = countdownIntervals.get(socket.id);
          if (interval) {
            clearInterval(interval);
            countdownIntervals.delete(socket.id);
          }
        }
      } else {
        const interval = countdownIntervals.get(socket.id);
        if (interval) {
          clearInterval(interval);
          countdownIntervals.delete(socket.id);
        }
      }
    }, 1000); // Update every second

    // Store the countdown interval
    countdownIntervals.set(socket.id, countdownInterval);

    // Notify other players of disconnection
    io.to(gameId).emit('player_disconnected', {
      playerId: socket.id,
      playerName: playerName,
      waitingForReconnection: true,
      reconnectTimeLeft: 900
    });

    // Update game state for all players with persistence
    emitGameUpdate(gameId, game);

    // Set timeout to remove player if they don't reconnect
    const disconnectTimeout = setTimeout(async () => {
      const currentGame = games.get(gameId);
      if (!currentGame) {
        disconnectTimeouts.delete(socket.id);
        return;
      }

      const player = currentGame.players.find((p) => p.id === socket.id);
      if (player) {
        // Player didn't reconnect - remove them
        const playerIndex = currentGame.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          currentGame.players.splice(playerIndex, 1);
          io.to(gameId).emit('player_left', { playerId: socket.id, gameState: currentGame });
          console.log(`Player ${socket.id} removed from game ${gameId} (no reconnection)`);

          // Mark player as offline in database
          if (playerName) {
            try {
              await markPlayerOffline(playerName);
            } catch (error) {
              console.error('Failed to mark player offline:', error);
            }
          }
        }
      }
      disconnectTimeouts.delete(socket.id);
    }, 900000); // 15 minutes

    // Store the timeout so it can be cancelled on reconnection
    disconnectTimeouts.set(socket.id, disconnectTimeout);
  }));
}
