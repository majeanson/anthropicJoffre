/**
 * Lobby Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 * Improvement Plan Task 12: Further split into modular handlers
 *
 * Handles core lobby events:
 * - create_game: Create new game
 * - join_game: Join existing game
 * - fill_empty_seat: Fill an empty seat with new player
 *
 * Delegates to:
 * - teamSelection.ts: Team selection and position swapping
 * - gameLifecycle.ts: Game start and leave
 */

import { Socket, Server } from 'socket.io';
import { GameState, Player, PlayerSession, BotDifficulty } from '../types/game';
import { Logger } from 'winston';
import { registerTeamSelectionHandlers, TeamSelectionHandlersDependencies, SwapRequest } from './teamSelection';
import { registerGameLifecycleHandlers, GameLifecycleHandlersDependencies } from './gameLifecycle';

// Import validation schemas and functions
import {
  validateInput,
  createGamePayloadSchema,
  joinGamePayloadSchema,
  leaveGamePayloadSchema,
  fillEmptySeatPayloadSchema,
  CreateGamePayload,
  JoinGamePayload,
  LeaveGamePayload,
  FillEmptySeatPayload,
} from '../validation/schemas';
import { logValidationError } from '../utils/logger';

// Import conditional persistence manager
import * as PersistenceManager from '../db/persistenceManager';

// Re-export SwapRequest interface from teamSelection for backwards compatibility
export type { SwapRequest };

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
  pendingSwapRequests: Map<string, SwapRequest>;

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
  emitGameUpdate: (gameId: string, gameState: GameState, forceFull?: boolean) => void;
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
  errorBoundaries: import('../middleware/errorBoundary').ErrorBoundaries;

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
    pendingSwapRequests,
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
  // Register split handlers (Task 12: Handler Splitting)
  // ============================================================================

  // Team selection handlers (select_team, swap_position, request_swap, respond_to_swap)
  registerTeamSelectionHandlers(socket, {
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
  } as TeamSelectionHandlersDependencies);

  // Game lifecycle handlers (start_game, leave_game)
  registerGameLifecycleHandlers(socket, {
    games,
    gameDeletionTimeouts,
    io,
    updateOnlinePlayer,
    startNewRound,
    validateGameStart,
    logger,
    errorBoundaries,
  } as GameLifecycleHandlersDependencies);

  // ============================================================================
  // create_game - Create new game
  // ============================================================================
  socket.on('create_game', errorBoundaries.gameAction('create_game')(async (payload: CreateGamePayload) => {
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

    // Add game to in-memory cache (ALWAYS - required for gameplay)
    games.set(gameId, gameState);

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
  socket.on('join_game', errorBoundaries.gameAction('join_game')(async (payload: { gameId: string; playerName: string; isBot?: boolean; botDifficulty?: BotDifficulty }) => {
    // Sprint 14: Enhanced logging for debugging join failures
    console.log('[JOIN_GAME] Request received:', {
      socketId: socket.id,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString()
    });

    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(joinGamePayloadSchema, payload);
    if (!validation.success) {
      const errorMsg = `Invalid input: ${validation.error}`;
      console.error('[JOIN_GAME] VALIDATION FAILED:', {
        payload: JSON.stringify(payload),
        error: validation.error,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Emit error to client (this is critical - must not fail silently)
      try {
        socket.emit('error', { message: errorMsg });
        console.log('[JOIN_GAME] Error emitted to client:', errorMsg);
      } catch (emitError) {
        console.error('[JOIN_GAME] CRITICAL: Failed to emit error to client:', emitError);
      }

      logger.warn('Invalid join_game payload', { payload, error: validation.error });
      return;
    }

    console.log('[JOIN_GAME] Validation passed:', {
      gameId: validation.data.gameId,
      playerName: validation.data.playerName,
      isBot: validation.data.isBot,
      botDifficulty: validation.data.botDifficulty
    });

    const { gameId, playerName: validatedPlayerName, isBot, botDifficulty } = validation.data;

    // Player name is already validated and sanitized by Zod schema
    const sanitizedName = validatedPlayerName;

    const game = games.get(gameId);
    if (!game) {
      const errorMsg = `Game ${gameId} not found. It may have ended or the ID is incorrect.`;
      console.error('[JOIN_GAME] Game not found:', {
        gameId,
        playerName: sanitizedName,
        socketId: socket.id,
        availableGames: Array.from(games.keys())
      });
      socket.emit('error', { message: errorMsg });
      return;
    }

    console.log('[JOIN_GAME] Game found:', {
      gameId,
      gamePhase: game.phase,
      currentPlayers: game.players.length,
      maxPlayers: 4
    });

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
      // Check for empty seats first
      const emptySeatIndex = game.players.findIndex(p => p.isEmpty);
      if (emptySeatIndex !== -1) {
        // There's an empty seat - redirect to fill_empty_seat flow
        console.log(`Player ${sanitizedName} joining game ${gameId} via empty seat ${emptySeatIndex}`);

        const seat = game.players[emptySeatIndex];

        // Fill the empty seat
        game.players[emptySeatIndex] = {
          id: socket.id,
          name: sanitizedName,
          teamId: seat.teamId, // Preserve team assignment
          hand: [], // Will be dealt cards if in progress
          tricksWon: 0,
          pointsWon: 0,
          isBot: isBot || false,
          botDifficulty: isBot ? (botDifficulty || 'medium') : undefined,
          connectionStatus: 'connected',
        };

        socket.join(gameId);

        // Create session for reconnection
        const session = await PersistenceManager.createSession(
          sanitizedName,
          socket.id,
          gameId,
          game.persistenceMode,
          isBot || false
        );

        // Track online player status (only for human players)
        if (!isBot) {
          updateOnlinePlayer(socket.id, sanitizedName, game.phase === 'team_selection' ? 'in_team_selection' : 'in_game', gameId);
        }

        // Notify everyone
        io.to(gameId).emit('game_updated', game);

        // Confirm to the new player
        socket.emit('player_joined', { player: game.players[emptySeatIndex], gameState: game, session });

        console.log(`Player ${sanitizedName} successfully filled empty seat ${emptySeatIndex} in game ${gameId}`);
        return;
      }

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
      // Game is full with no bots or empty seats - cannot join
      socket.emit('error', { message: `Game is full (4/4 players). Try spectating or join a different game.` });
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
      botDifficulty: isBot ? (botDifficulty || 'medium') : undefined,
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

    console.log('[JOIN_GAME] SUCCESS:', {
      playerName: sanitizedName,
      gameId,
      socketId: socket.id,
      teamId: player.teamId,
      isBot: isBot || false,
      botDifficulty: player.botDifficulty,
      totalPlayers: game.players.length,
      gamePhase: game.phase
    });
  }));

  // ============================================================================
  // fill_empty_seat - Fill an empty seat with a new player or bot
  // ============================================================================
  socket.on('fill_empty_seat', errorBoundaries.gameAction('fill_empty_seat')(async (payload: FillEmptySeatPayload) => {
    // Validate input with Zod schema
    const validation = validateInput(fillEmptySeatPayloadSchema, payload);
    if (!validation.success) {
      logValidationError('fill_empty_seat', validation.error, payload, socket.id);
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      return;
    }

    const { gameId, playerName, emptySlotIndex } = validation.data;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Validate slot index
    if (emptySlotIndex < 0 || emptySlotIndex >= game.players.length) {
      socket.emit('error', { message: 'Invalid seat index' });
      return;
    }

    // Check if seat is actually empty
    const seat = game.players[emptySlotIndex];
    if (!seat.isEmpty) {
      socket.emit('error', { message: 'Seat is not empty' });
      return;
    }

    // Check if player is already in the game
    const existingPlayer = game.players.find(p => !p.isEmpty && (p.id === socket.id || p.name === playerName));
    if (existingPlayer) {
      socket.emit('error', { message: 'You are already in this game' });
      return;
    }

    console.log(`Player ${playerName} (${socket.id}) filling empty seat ${emptySlotIndex} in game ${gameId}`);

    // Fill the empty seat
    game.players[emptySlotIndex] = {
      id: socket.id,
      name: playerName,
      teamId: seat.teamId, // Preserve team assignment
      hand: [], // Will be dealt cards if in progress
      tricksWon: 0,
      pointsWon: 0,
      isBot: false,
      connectionStatus: 'connected',
      isEmpty: false,
      emptySlotName: undefined,
    };

    // Join the game room
    socket.join(gameId);

    // Update online player status
    updateOnlinePlayer(socket.id, playerName, 'in_game', gameId);

    // Create player session for reconnection
    const session = await PersistenceManager.createSession(
      playerName,
      socket.id,
      gameId,
      game.persistenceMode,
      false // isBot
    );

    // Notify all players
    io.to(gameId).emit('game_updated', game);

    // Confirm to the new player
    socket.emit('game_joined', { gameState: game, session });

    console.log(`Player ${playerName} successfully filled empty seat ${emptySlotIndex} in game ${gameId}`);
  }));
}
