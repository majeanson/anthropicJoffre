/**
 * Chat Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all chat-related socket events:
 * - send_team_selection_chat: Team selection phase chat
 * - send_game_chat: In-game chat (betting, playing, scoring phases)
 */

import { Socket, Server } from 'socket.io';
import { GameState } from '../types/game';
import { Logger } from 'winston';

// Import validation schemas
import {
  validateInput,
  teamChatPayloadSchema,
  gameChatPayloadSchema,
} from '../validation/schemas';

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
    io.to(gameId).emit('team_selection_chat_message', {
      playerId: socket.id,
      playerName: player.name,
      teamId: player.teamId,
      message: sanitizedMessage,
      timestamp: Date.now()
    });
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
    io.to(gameId).emit('game_chat_message', {
      playerId: socket.id,
      playerName: player.name,
      teamId: player.teamId,
      message: sanitizedMessage,
      timestamp: Date.now()
    });
  }));
}
