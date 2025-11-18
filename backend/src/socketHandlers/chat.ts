/**
 * Chat Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all chat-related socket events:
 * - send_lobby_chat: Global lobby chat (social section)
 * - send_team_selection_chat: Team selection phase chat
 * - send_game_chat: In-game chat (betting, playing, scoring phases)
 */

import { Socket, Server } from 'socket.io';
import { GameState } from '../types/game';
import { Logger } from 'winston';

// Import validation schemas
import {
  lobbyChatPayloadSchema,
  teamChatPayloadSchema,
  gameChatPayloadSchema,
} from '../validation/schemas';

// Import chat persistence functions
import { saveChatMessage, getLobbyChat, getGameChat } from '../db/index';

// Import chat helper functions (Sprint 4 Phase 4.3)
import {
  validateChatMessage,
  rateLimitChatMessage,
  sanitizeChatMessage,
} from './chatHelpers';

// Constants
const MAX_MESSAGE_LENGTH = 500;

/**
 * Database chat message type (snake_case from database)
 */
interface DbChatMessage {
  player_name: string;
  message: string;
  created_at: Date;
}

/**
 * Dependencies needed by the chat handlers
 */
export interface ChatHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;

  // Socket.io
  io: Server;

  // Rate limiting
  rateLimiters: {
    chat: {
      checkLimit: (identifier: string, ipAddress: string) => { allowed: boolean };
      recordRequest: (identifier: string, ipAddress: string) => void;
    };
  };
  getSocketIP: (socket: Socket) => string;

  // Utility
  logger: Logger;
  errorBoundaries: any;

}

/**
 * Register all chat-related Socket.io handlers
 */
export function registerChatHandlers(socket: Socket, deps: ChatHandlersDependencies): void {
  const {
    games,
    io,
    rateLimiters,
    getSocketIP,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // send_lobby_chat - Global lobby chat (accessible to all connected clients)
  // ============================================================================
  socket.on('send_lobby_chat', errorBoundaries.gameAction('send_lobby_chat')((payload: { playerName: string; message: string }) => {
    // Validate input using helper
    const validation = validateChatMessage(lobbyChatPayloadSchema, payload, socket, logger, 'send_lobby_chat');
    if (!validation.success) return;

    const { playerName, message: validatedMessage } = validation.data;

    // Rate limiting using helper
    const ipAddress = getSocketIP(socket);
    const rateCheck = rateLimitChatMessage(
      playerName,
      ipAddress,
      rateLimiters.chat,
      socket,
      logger,
      'send_lobby_chat'
    );
    if (!rateCheck.allowed) return;

    // Sanitize message using helper
    const sanitizedMessage = sanitizeChatMessage(validatedMessage);
    if (!sanitizedMessage) return;

    // Broadcast message to all connected clients
    const timestamp = Date.now();
    io.emit('lobby_chat_message', {
      playerName,
      message: sanitizedMessage,
      timestamp
    });

    // Persist message to database (async, don't block)
    saveChatMessage('lobby', playerName, sanitizedMessage)
      .catch(err => logger.error('Failed to save lobby chat message to database', { error: err, playerName }));
  }));

  // ============================================================================
  // get_lobby_chat - Retrieve lobby chat history from database
  // ============================================================================
  socket.on('get_lobby_chat', errorBoundaries.gameAction('get_lobby_chat')(async (limit?: number) => {
    try {
      const dbMessages = await getLobbyChat(limit || 100);
      // Map snake_case DB fields to camelCase for frontend
      const messages = dbMessages.map((msg: DbChatMessage) => ({
        playerName: msg.player_name,
        message: msg.message,
        createdAt: msg.created_at
      }));
      socket.emit('lobby_chat_history', { messages });
      logger.debug('Sent lobby chat history', { socketId: socket.id, messageCount: messages.length });
    } catch (err) {
      logger.error('Failed to retrieve lobby chat history', { error: err, socketId: socket.id });
      socket.emit('error', { message: 'Failed to load chat history' });
    }
  }));

  // ============================================================================
  // send_team_selection_chat - Team selection phase chat
  // ============================================================================
  socket.on('send_team_selection_chat', errorBoundaries.gameAction('send_team_selection_chat')((payload: { gameId: string; message: string }) => {
    // Validate input using helper
    const validation = validateChatMessage(teamChatPayloadSchema, payload, socket, logger, 'send_team_selection_chat');
    if (!validation.success) return;

    const { gameId, message: validatedMessage } = validation.data;

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

    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Chat only available during team selection' });
      return;
    }

    // Rate limiting using helper
    const ipAddress = getSocketIP(socket);
    const rateCheck = rateLimitChatMessage(
      player.name,
      ipAddress,
      rateLimiters.chat,
      socket,
      logger,
      'send_team_selection_chat',
      gameId
    );
    if (!rateCheck.allowed) return;

    // Sanitize message using helper
    const sanitizedMessage = sanitizeChatMessage(validatedMessage);
    if (!sanitizedMessage) return;

    // Broadcast message to all players in the game
    const timestamp = Date.now();
    io.to(gameId).emit('team_selection_chat_message', {
      playerId: socket.id,
      playerName: player.name,
      teamId: player.teamId,
      message: sanitizedMessage,
      timestamp
    });

    // Persist message to database (async, don't block)
    saveChatMessage('game', player.name, sanitizedMessage, gameId, player.teamId)
      .catch(err => logger.error('Failed to save team selection chat message to database', { error: err, gameId, playerName: player.name }));
  }));

  // ============================================================================
  // send_game_chat - In-game chat (betting, playing, scoring phases)
  // ============================================================================
  socket.on('send_game_chat', errorBoundaries.gameAction('send_game_chat')((payload: { gameId: string; message: string }) => {
    // Validate input using helper
    const validation = validateChatMessage(gameChatPayloadSchema, payload, socket, logger, 'send_game_chat');
    if (!validation.success) return;

    const { gameId, message: validatedMessage } = validation.data;

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

    if (game.phase !== 'betting' && game.phase !== 'playing' && game.phase !== 'scoring') {
      socket.emit('error', { message: 'Chat only available during gameplay' });
      return;
    }

    // Rate limiting using helper
    const ipAddress = getSocketIP(socket);
    const rateCheck = rateLimitChatMessage(
      player.name,
      ipAddress,
      rateLimiters.chat,
      socket,
      logger,
      'send_game_chat',
      gameId
    );
    if (!rateCheck.allowed) return;

    // Sanitize message using helper
    const sanitizedMessage = sanitizeChatMessage(validatedMessage);
    if (!sanitizedMessage) return;

    // Broadcast message to all players in the game
    const timestamp = Date.now();
    io.to(gameId).emit('game_chat_message', {
      playerId: socket.id,
      playerName: player.name,
      teamId: player.teamId,
      message: sanitizedMessage,
      timestamp
    });

    // Persist message to database (async, don't block)
    saveChatMessage('game', player.name, sanitizedMessage, gameId, player.teamId)
      .catch(err => logger.error('Failed to save game chat message to database', { error: err, gameId, playerName: player.name }));
  }));

  // ============================================================================
  // load_lobby_chat - Load lobby chat history (on connect)
  // ============================================================================
  socket.on('load_lobby_chat', errorBoundaries.gameAction('load_lobby_chat')(async () => {
    try {
      const messages = await getLobbyChat(100); // Last 100 messages or 24 hours
      socket.emit('lobby_chat_history', { messages });
    } catch (err) {
      logger.error('Failed to load lobby chat history', { error: err, socketId: socket.id });
      socket.emit('error', { message: 'Failed to load chat history' });
    }
  }));

  // ============================================================================
  // load_game_chat - Load game chat history (when joining game)
  // ============================================================================
  socket.on('load_game_chat', errorBoundaries.gameAction('load_game_chat')(async (payload: { gameId: string }) => {
    const { gameId } = payload;
    if (!gameId) {
      socket.emit('error', { message: 'Game ID required' });
      return;
    }

    try {
      const messages = await getGameChat(gameId);
      socket.emit('game_chat_history', { gameId, messages });
    } catch (err) {
      logger.error('Failed to load game chat history', { error: err, gameId, socketId: socket.id });
      socket.emit('error', { message: 'Failed to load chat history' });
    }
  }));

  // ============================================================================
  // UNIFIED send_chat_message - Routes to appropriate chat handler based on context
  // Sprint 16 Day 3 Task 4.3 - Backward compatible unified handler
  // Note: The old events (send_lobby_chat, send_team_selection_chat, send_game_chat)
  // remain active for backward compatibility
  // ============================================================================
  socket.on('send_chat_message', errorBoundaries.gameAction('send_chat_message')(async (payload: {
    roomType: 'lobby' | 'team' | 'game';
    gameId?: string;
    message: string;
    playerName?: string; // For lobby chat
  }) => {
    const { roomType, gameId, message, playerName } = payload;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    const sanitizedMessage = message.trim().substring(0, MAX_MESSAGE_LENGTH);

    // Route to appropriate handler logic based on roomType
    switch (roomType) {
      case 'lobby':
        // Lobby chat logic
        if (!playerName || playerName.trim().length === 0) {
          socket.emit('error', { message: 'Player name is required for lobby chat' });
          return;
        }

        // Check rate limit
        const ipAddress = getSocketIP(socket);
        const lobbyRateCheck = rateLimitChatMessage(
          playerName.trim(),
          ipAddress,
          rateLimiters.chat,
          socket,
          logger,
          'send_lobby_chat'
        );
        if (!lobbyRateCheck.allowed) return;

        // Emit to all connected clients
        io.emit('lobby_chat_message', {
          playerName: playerName.trim(),
          message: sanitizedMessage,
          timestamp: Date.now()
        });

        // Save to database
        saveChatMessage('lobby', playerName.trim(), sanitizedMessage)
          .catch(err => logger.error('Failed to save lobby chat message', { error: err }));
        break;

      case 'team':
        // Team selection chat logic
        if (!gameId) {
          socket.emit('error', { message: 'Game ID is required for team chat' });
          return;
        }

        const teamGame = games.get(gameId);
        if (!teamGame) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const teamPlayer = teamGame.players.find(p => p.id === socket.id);
        if (!teamPlayer) {
          socket.emit('error', { message: 'You are not in this game' });
          return;
        }

        // Check rate limit
        const teamIpAddress = getSocketIP(socket);
        const teamRateCheck = rateLimitChatMessage(
          teamPlayer.name,
          teamIpAddress,
          rateLimiters.chat,
          socket,
          logger,
          'send_team_selection_chat'
        );
        if (!teamRateCheck.allowed) return;

        // Emit to room
        io.to(gameId).emit('team_selection_chat', {
          playerName: teamPlayer.name,
          message: sanitizedMessage,
          teamId: teamPlayer.teamId || 0,
          timestamp: Date.now()
        });

        // Save to database
        saveChatMessage('game', teamPlayer.name, sanitizedMessage, gameId, teamPlayer.teamId)
          .catch(err => logger.error('Failed to save team chat message', { error: err }));
        break;

      case 'game':
        // In-game chat logic
        if (!gameId) {
          socket.emit('error', { message: 'Game ID is required for game chat' });
          return;
        }

        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const gamePlayer = game.players.find(p => p.id === socket.id);
        if (!gamePlayer) {
          socket.emit('error', { message: 'You are not in this game' });
          return;
        }

        // Check rate limit
        const gameIpAddress = getSocketIP(socket);
        const gameRateCheck = rateLimitChatMessage(
          gamePlayer.name,
          gameIpAddress,
          rateLimiters.chat,
          socket,
          logger,
          'send_game_chat'
        );
        if (!gameRateCheck.allowed) return;

        // Emit to room
        io.to(gameId).emit('game_chat', {
          playerName: gamePlayer.name,
          message: sanitizedMessage,
          teamId: gamePlayer.teamId || 0,
          timestamp: Date.now()
        });

        // Save to database
        saveChatMessage('game', gamePlayer.name, sanitizedMessage, gameId, gamePlayer.teamId)
          .catch(err => logger.error('Failed to save game chat message', { error: err }));
        break;

      default:
        socket.emit('error', { message: `Unknown chat room type: ${roomType}` });
    }

    logger.debug('Unified chat message processed', {
      roomType,
      gameId,
      playerName,
      socketId: socket.id
    });
  }));
}
