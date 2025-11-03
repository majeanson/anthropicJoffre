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
  validateInput,
  lobbyChatPayloadSchema,
  teamChatPayloadSchema,
  gameChatPayloadSchema,
} from '../validation/schemas';

// Import chat persistence functions
import { saveChatMessage, getLobbyChat, getGameChat } from '../db/index';

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
  errorBoundaries: {
    gameAction: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
  };
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
    // Validate input
    const validation = validateInput(lobbyChatPayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid send_lobby_chat payload', { payload, error: validation.error });
      return;
    }

    const { playerName, message: validatedMessage } = validation.data;

    // Rate limiting: Check per-player rate limit
    const ipAddress = getSocketIP(socket);
    const rateLimit = rateLimiters.chat.checkLimit(playerName, ipAddress);
    if (!rateLimit.allowed) {
      socket.emit('error', {
        message: 'You are sending messages too fast. Please slow down.',
      });
      logger.warn('Rate limit exceeded for send_lobby_chat', {
        playerName,
        ipAddress,
      });
      return;
    }
    rateLimiters.chat.recordRequest(playerName, ipAddress);

    // Message is already validated and sanitized by Zod schema
    const sanitizedMessage = validatedMessage;
    if (!sanitizedMessage) {
      return;
    }

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
      const messages = await getLobbyChat(limit || 100);
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
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(teamChatPayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid send_team_selection_chat payload', { payload, error: validation.error });
      return;
    }

    const { gameId, message: validatedMessage } = validation.data;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Rate limiting: Check per-player rate limit (Sprint 2)
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;
    const ipAddress = getSocketIP(socket);
    const rateLimit = rateLimiters.chat.checkLimit(playerName, ipAddress);
    if (!rateLimit.allowed) {
      socket.emit('error', {
        message: 'You are sending messages too fast. Please slow down.',
      });
      logger.warn('Rate limit exceeded for send_team_selection_chat', {
        playerName,
        ipAddress,
        gameId,
      });
      return;
    }
    rateLimiters.chat.recordRequest(playerName, ipAddress);

    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Chat only available during team selection' });
      return;
    }

    // Message is already validated and sanitized by Zod schema
    const sanitizedMessage = validatedMessage;
    if (!sanitizedMessage) {
      return;
    }

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
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(gameChatPayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid send_game_chat payload', { payload, error: validation.error });
      return;
    }

    const { gameId, message: validatedMessage } = validation.data;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Rate limiting: Check per-player rate limit (Sprint 2)
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;
    const ipAddress = getSocketIP(socket);
    const rateLimit = rateLimiters.chat.checkLimit(playerName, ipAddress);
    if (!rateLimit.allowed) {
      socket.emit('error', {
        message: 'You are sending messages too fast. Please slow down.',
      });
      logger.warn('Rate limit exceeded for send_game_chat', {
        playerName,
        ipAddress,
        gameId,
      });
      return;
    }
    rateLimiters.chat.recordRequest(playerName, ipAddress);

    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    if (game.phase !== 'betting' && game.phase !== 'playing' && game.phase !== 'scoring') {
      socket.emit('error', { message: 'Chat only available during gameplay' });
      return;
    }

    // Message is already validated and sanitized by Zod schema
    const sanitizedMessage = validatedMessage;
    if (!sanitizedMessage) {
      return;
    }

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
}
