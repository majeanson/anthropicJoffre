/**
 * Lobby Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all lobby-related socket events:
 * - create_game: Create new game
 * - join_game: Join existing game
 * - select_team: Select team during team selection
 * - swap_position: Swap positions with another player
 * - start_game: Start the game from team selection
 * - leave_game: Leave the game
 */

import { Socket, Server } from 'socket.io';
import { GameState, Player, PlayerSession } from '../types/game';
import { Logger } from 'winston';

// Import validation schemas and functions
import {
  validateInput,
  createGamePayloadSchema,
  joinGamePayloadSchema,
} from '../validation/schemas';

// Import conditional persistence manager
import * as PersistenceManager from '../db/persistenceManager';

/**
 * Dependencies needed by the lobby handlers
 */
export interface LobbyHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  gameCreationTimes: Map<string, number>;
  activeTimeouts: Map<string, NodeJS.Timeout>;
  disconnectTimeouts: Map<string, NodeJS.Timeout>;
  gameDeletionTimeouts: Map<string, NodeJS.Timeout>;

  // Socket.io
  io: Server;

  // Database functions
  saveGame: (gameState: GameState) => Promise<void>;
  deletePlayerSessions: (playerName: string, gameId: string) => Promise<void>;
  updatePlayerPresence: (playerName: string, status: 'online' | 'offline', socketId?: string, gameId?: string) => Promise<void>;

  // Session management
  createDBSession: (playerName: string, socketId: string, gameId: string) => Promise<PlayerSession>;
  createPlayerSession: (gameId: string, playerId: string, playerName: string) => PlayerSession;

  // Connection management
  connectionManager: {
    associatePlayer: (socketId: string, playerName: string, playerId: string, gameId: string, isBot: boolean) => void;
  };

  // Online player tracking
  updateOnlinePlayer: (socketId: string, playerName: string, status: 'in_lobby' | 'in_game' | 'in_team_selection', gameId?: string) => void;

  // Timeout management
  startPlayerTimeout: (gameId: string, playerId: string, phase: 'betting' | 'playing') => void;
  clearPlayerTimeout: (gameId: string, playerId: string) => void;

  // Game lifecycle
  startNewRound: (gameId: string) => void;

  // Emission helpers
  emitGameUpdate: (gameId: string, gameState: GameState) => void;
  broadcastGameUpdate: (gameId: string, event: string, gameState: GameState) => void;

  // Validation functions
  validateTeamSelection: (game: GameState, playerId: string, teamId: 1 | 2) => { success: boolean; error?: string };
  validatePositionSwap: (game: GameState, playerId: string, targetPlayerId: string) => { success: boolean; error?: string };
  validateGameStart: (game: GameState) => { success: boolean; error?: string };

  // State transformation functions
  applyTeamSelection: (game: GameState, playerId: string, teamId: 1 | 2) => void;
  applyPositionSwap: (game: GameState, playerId: string, targetPlayerId: string) => void;

  // Utility
  logger: Logger;
  errorBoundaries: {
    gameAction: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
  };
}

/**
 * Register all lobby-related Socket.io handlers
 */
export function registerLobbyHandlers(socket: Socket, deps: LobbyHandlersDependencies): void {
  const {
    games,
    gameCreationTimes,
    activeTimeouts,
    disconnectTimeouts,
    gameDeletionTimeouts,
    io,
    saveGame,
    deletePlayerSessions,
    updatePlayerPresence,
    createDBSession,
    createPlayerSession,
    connectionManager,
    updateOnlinePlayer,
    startPlayerTimeout,
    startNewRound,
    emitGameUpdate,
    broadcastGameUpdate,
    validateTeamSelection,
    validatePositionSwap,
    validateGameStart,
    applyTeamSelection,
    applyPositionSwap,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // create_game - Create new game
  // ============================================================================
  socket.on('create_game', errorBoundaries.gameAction('create_game')(async (payload: unknown) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(createGamePayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid create_game payload', { payload, error: validation.error });
      return;
    }

    const { playerName: validatedPlayerName, persistenceMode = 'elo' } = validation.data;

    // Apply game creation rate limiting
    // Access remote address via socket.handshake (standard Socket.IO API)
    const clientIp = socket.handshake.address;

    // Player name is already validated and sanitized by Zod schema
    const sanitizedName = validatedPlayerName;

    // Generate 8-character game ID (matches validation schema minimum)
    const gameId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const player: Player = {
      id: socket.id,
      name: sanitizedName,
      teamId: 1,
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      isBot: false, // Game creator is always human
    };

    const gameState: GameState = {
      id: gameId,
      creatorId: socket.id, // Track who created the game
      persistenceMode, // ELO (default) or casual mode
      isBotGame: false, // Will be set to true when bots join
      phase: 'team_selection',
      players: [player],
      currentBets: [],
      highestBet: null,
      trump: null,
      currentTrick: [],
      previousTrick: null,
      currentPlayerIndex: 0,
      dealerIndex: 0, // First player is the initial dealer
      teamScores: { team1: 0, team2: 0 },
      roundNumber: 1,
      roundHistory: [],
      currentRoundTricks: [],
    };

    // Persist game to database (conditional on persistence mode)
    const createdAt = new Date();
    await PersistenceManager.saveOrUpdateGame(gameState, createdAt);
    gameCreationTimes.set(gameId, createdAt.getTime()); // Store actual creation timestamp
    socket.join(gameId);

    // Create session for reconnection (conditional on persistence mode)
    const session = await PersistenceManager.createSession(
      sanitizedName,
      socket.id,
      gameId,
      persistenceMode,
      false // isBot
    );

    // Track online player status
    updateOnlinePlayer(socket.id, sanitizedName, 'in_team_selection', gameId);

    // Update player presence in database (conditional on persistence mode)
    await PersistenceManager.updatePlayerPresence(
      sanitizedName,
      'online',
      persistenceMode,
      socket.id,
      gameId
    );

    socket.emit('game_created', { gameId, gameState, session });

    // Associate player with connection manager
    const creator = gameState.players.find(p => p.name === sanitizedName);
    if (creator) {
      connectionManager.associatePlayer(socket.id, sanitizedName, creator.id, gameId, false);
    }
  }));

  // ============================================================================
  // join_game - Join existing game
  // ============================================================================
  socket.on('join_game', errorBoundaries.gameAction('join_game')(async (payload: { gameId: string; playerName: string; isBot?: boolean }) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(joinGamePayloadSchema, payload);
    if (!validation.success) {
      console.error('[VALIDATION ERROR] join_game failed:', {
        payload: JSON.stringify(payload),
        error: validation.error,
        socketId: socket.id
      });
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid join_game payload', { payload, error: validation.error });
      return;
    }

    const { gameId, playerName: validatedPlayerName, isBot } = validation.data;

    // Player name is already validated and sanitized by Zod schema
    const sanitizedName = validatedPlayerName;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Check if player is trying to rejoin with same name
    const existingPlayer = game.players.find(p => p.name === sanitizedName);
    if (existingPlayer) {
      console.log(`Player ${sanitizedName} attempting to rejoin game ${gameId} (isBot: ${existingPlayer.isBot})`);

      // Allow rejoin - update socket ID
      const oldSocketId = existingPlayer.id;
      existingPlayer.id = socket.id;

      // IMPORTANT: Update player ID in currentTrick to fix card display after reconnection
      game.currentTrick.forEach(tc => {
        if (tc.playerId === oldSocketId) {
          tc.playerId = socket.id;
        }
      });

      // Join game room
      socket.join(gameId);

      // Create new session (conditional on persistence mode and player type)
      const session = await PersistenceManager.createSession(
        sanitizedName,
        socket.id,
        gameId,
        game.persistenceMode,
        existingPlayer.isBot || false
      );

      // Update timeout if this player had an active timeout
      const oldTimeoutKey = `${gameId}-${oldSocketId}`;
      const existingTimeout = activeTimeouts.get(oldTimeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        activeTimeouts.delete(oldTimeoutKey);
        console.log(`Cleared old timeout for ${oldSocketId}, restarting for ${socket.id}`);

        // Restart timeout with new socket ID if it's their turn
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer && currentPlayer.id === socket.id) {
          const phase = game.phase === 'betting' ? 'betting' : 'playing';
          startPlayerTimeout(gameId, socket.id, phase as 'betting' | 'playing');
        }
      }

      // Track online player status (only for human players)
      if (!existingPlayer.isBot) {
        updateOnlinePlayer(socket.id, sanitizedName, 'in_game', gameId);
      }

      // Emit appropriate response
      if (existingPlayer.isBot) {
        // For bots, emit player_joined (they don't need sessions)
        socket.emit('player_joined', { player: existingPlayer, gameState: game });

        // Broadcast game_updated to all players so bot knows to act if it's their turn
        emitGameUpdate(gameId, game);
      } else {
        // For humans, emit reconnection_successful
        socket.emit('reconnection_successful', { gameState: game, session });

        // Notify other players
        socket.to(gameId).emit('player_reconnected', {
          playerName: sanitizedName,
          playerId: socket.id,
          oldSocketId
        });

        // Broadcast game_updated to ensure all clients are synced
        emitGameUpdate(gameId, game);
      }

      console.log(`Player ${sanitizedName} successfully rejoined game ${gameId}`);
      return;
    }

    if (game.players.length >= 4) {
      // Check if there are bots that can be replaced
      const availableBots = game.players.filter(p => p.isBot);
      if (availableBots.length > 0) {
        // Game is full but has bots - offer takeover option
        socket.emit('game_full_with_bots', {
          gameId,
          availableBots: availableBots.map(bot => ({
            name: bot.name,
            teamId: bot.teamId,
            difficulty: bot.botDifficulty || 'hard'
          }))
        });
        return;
      }
      // Game is full with no bots - cannot join
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    const teamId = game.players.length % 2 === 0 ? 1 : 2;
    const player: Player = {
      id: socket.id,
      name: sanitizedName,
      teamId: teamId as 1 | 2,
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      isBot: isBot || false,
      connectionStatus: 'connected',
    };

    game.players.push(player);
    socket.join(gameId);

    // Mark game as bot game if a bot joins
    if (isBot) {
      game.isBotGame = true;
    }

    // Cancel any pending disconnect timeout for this socket
    const disconnectTimeout = disconnectTimeouts.get(socket.id);
    if (disconnectTimeout) {
      clearTimeout(disconnectTimeout);
      disconnectTimeouts.delete(socket.id);
      console.log(`Cancelled disconnect timeout for rejoining player ${socket.id}`);
    }

    // Create session for reconnection (conditional on persistence mode and player type)
    const session = await PersistenceManager.createSession(
      sanitizedName,
      socket.id,
      gameId,
      game.persistenceMode,
      isBot || false
    );

    // Track online player status
    updateOnlinePlayer(socket.id, sanitizedName, 'in_team_selection', gameId);

    // Update player presence in database (conditional on persistence mode, only for human players)
    if (!isBot) {
      await PersistenceManager.updatePlayerPresence(
        sanitizedName,
        'online',
        game.persistenceMode,
        socket.id,
        gameId
      );
    }

    // Send session only to the joining player (not broadcast to everyone)
    socket.emit('player_joined', { player, gameState: game, session });

    // Broadcast to other players without session info
    socket.to(gameId).emit('player_joined', { player, gameState: game });

    // Associate player with connection manager
    connectionManager.associatePlayer(socket.id, sanitizedName, player.id, gameId, isBot || false);
  }));

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
  // swap_position - Swap positions with another player
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

    // I/O - Emit updates
    emitGameUpdate(gameId, game);
  }));

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

    // Side effects - Update online player statuses
    game.players.forEach(player => {
      updateOnlinePlayer(player.id, player.name, 'in_game', gameId);
    });

    // Start the game (handles state transitions and I/O)
    startNewRound(gameId);
  }));

  // ============================================================================
  // leave_game - Leave the game
  // ============================================================================
  socket.on('leave_game', errorBoundaries.gameAction('leave_game')(async ({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Clean up player sessions from database (conditional on persistence mode)
    await PersistenceManager.deletePlayerSessions(player.name, gameId, game.persistenceMode);

    // Remove player from game
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      game.players.splice(playerIndex, 1);
      console.log(`Player ${player.name} (${socket.id}) left game ${gameId}`);

      // Leave the game room
      socket.leave(gameId);

      // Notify remaining players
      io.to(gameId).emit('player_left', { playerId: socket.id, gameState: game });

      // If game is empty, schedule deletion after 5 minutes (allows reconnection)
      if (game.players.length === 0) {
        console.log(`Game ${gameId} is now empty, scheduling deletion in 5 minutes`);

        const deletionTimeout = setTimeout(() => {
          if (games.has(gameId)) {
            const currentGame = games.get(gameId);
            // Only delete if still empty
            if (currentGame && currentGame.players.length === 0) {
              games.delete(gameId);
              gameDeletionTimeouts.delete(gameId);
              console.log(`Game ${gameId} deleted after timeout (no players returned)`);
            }
          }
        }, 5 * 60 * 1000); // 5 minutes

        gameDeletionTimeouts.set(gameId, deletionTimeout);
      }

      // Confirm to the leaving player
      socket.emit('leave_game_success', { success: true });
    }
  }));
}
