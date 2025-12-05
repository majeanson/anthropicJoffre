/**
 * Socket Handler Utilities
 * Sprint 10: Code Quality - Extraction utilities for common socket patterns
 *
 * These utilities reduce code duplication across socket handlers by providing
 * common patterns for validation, error handling, and response formatting.
 */

import { Socket } from 'socket.io';
import { GameState } from '../types/game';

/**
 * Standard response format for socket acknowledgments
 */
export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Wrapper for socket handlers with automatic error handling
 * Ensures consistent error responses and logging
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R> | R
) {
  return async (...args: T): Promise<SocketResponse<R>> => {
    try {
      const result = await handler(...args);
      return { success: true, data: result };
    } catch (error) {
      console.error('[Socket Error]', error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      return {
        success: false,
        error: message,
        code: (error as any).code || 'UNKNOWN_ERROR'
      };
    }
  };
}

/**
 * Validates that a game exists and returns it
 * @throws Error if game not found
 */
export function requireGame(games: Map<string, GameState>, gameId: string): GameState {
  const game = games.get(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }
  return game;
}

/**
 * Validates that a player exists in the game
 * @throws Error if player not found
 */
export function requirePlayer(game: GameState, playerId: string) {
  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found in game ${game.id}`);
  }
  return player;
}

/**
 * Find player in game by name from socket.data.playerName
 * IMPORTANT: Always use this instead of finding by socket.id - socket IDs are volatile
 */
export function findPlayerInGame(socket: Socket, game: GameState) {
  const playerName = socket.data?.playerName;
  if (!playerName) return undefined;
  return game.players.find(p => p.name === playerName);
}

/**
 * Get player name from socket - the stable identifier
 */
export function getPlayerName(socket: Socket): string | undefined {
  return socket.data?.playerName;
}

/**
 * Gets the player ID from socket data
 * Handles socket.data.playerId, playerName lookup, and socket ID fallback
 */
export function getPlayerId(socket: Socket, game?: GameState): string | null {
  // First check socket data for stored playerId
  if (socket.data?.playerId) {
    return socket.data.playerId;
  }

  // If game provided, try to find player by name (preferred - stable identifier)
  if (game && socket.data?.playerName) {
    const player = game.players.find(p => p.name === socket.data.playerName);
    if (player) {
      return player.id;
    }
  }

  // Fallback to socket.id (for backwards compatibility, but not reliable)
  if (game) {
    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      return player.id;
    }
  }

  return null;
}

/**
 * Standard game state validation
 * Validates game exists and player is in the game
 */
export function validateGameAction(
  games: Map<string, GameState>,
  gameId: string,
  playerId: string
): { game: GameState; player: NonNullable<ReturnType<typeof requirePlayer>> } {
  const game = requireGame(games, gameId);
  const player = requirePlayer(game, playerId);
  return { game, player };
}

/**
 * Emits an event to all players in a game
 */
export function emitToGame(
  io: any,
  gameId: string,
  event: string,
  data: unknown
): void {
  io.to(gameId).emit(event, data);
}

/**
 * Emits an event to all players in a game except the sender
 */
export function emitToOthers(
  socket: Socket,
  gameId: string,
  event: string,
  data: unknown
): void {
  socket.to(gameId).emit(event, data);
}

/**
 * Standard acknowledgment callback wrapper
 * Ensures callbacks are always called with proper response format
 */
export function withCallback<T>(
  callback?: (response: SocketResponse<T>) => void
) {
  return (response: SocketResponse<T>) => {
    if (callback && typeof callback === 'function') {
      callback(response);
    }
  };
}

/**
 * Validates required fields in request data
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: unknown,
  fields: (keyof T)[]
): T {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request data');
  }

  const obj = data as Record<string, unknown>;

  for (const field of fields) {
    if (!(field in obj)) {
      throw new Error(`Missing required field: ${String(field)}`);
    }
  }

  return obj as T;
}

/**
 * Rate limiting helper for socket actions
 */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX_ACTIONS = 10;

export function checkRateLimit(
  socketId: string,
  action: string,
  maxActions: number = RATE_LIMIT_MAX_ACTIONS,
  window: number = RATE_LIMIT_WINDOW
): boolean {
  const key = `${socketId}:${action}`;
  const now = Date.now();
  const lastAction = rateLimitMap.get(key) || 0;

  if (now - lastAction < window / maxActions) {
    return false; // Rate limit exceeded
  }

  rateLimitMap.set(key, now);

  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    const cutoff = now - window * 10;
    for (const [k, v] of rateLimitMap.entries()) {
      if (v < cutoff) {
        rateLimitMap.delete(k);
      }
    }
  }

  return true;
}

/**
 * Creates a standardized socket handler with common patterns
 */
export function createSocketHandler<TData extends Record<string, unknown>, TResponse>(
  config: {
    event: string;
    requiresGame?: boolean;
    requiresPlayer?: boolean;
    rateLimit?: { max: number; window: number };
    validate?: (keyof TData)[];
  },
  handler: (params: {
    socket: Socket;
    data: TData;
    game?: GameState;
    player?: ReturnType<typeof requirePlayer>;
    games?: Map<string, GameState>;
  }) => Promise<TResponse> | TResponse
) {
  return async (
    socket: Socket,
    data: unknown,
    games: Map<string, GameState>,
    callback?: (response: SocketResponse<TResponse>) => void
  ) => {
    const respond = withCallback(callback);

    try {
      // Rate limiting
      if (config.rateLimit && !checkRateLimit(socket.id, config.event, config.rateLimit.max, config.rateLimit.window)) {
        respond({ success: false, error: 'Rate limit exceeded', code: 'RATE_LIMIT' });
        return;
      }

      // Validation
      const validatedData = config.validate
        ? validateRequiredFields<TData>(data, config.validate)
        : data as TData;

      // Game and player validation
      let game: GameState | undefined;
      let player: ReturnType<typeof requirePlayer> | undefined;

      if (config.requiresGame || config.requiresPlayer) {
        const gameId = (validatedData as any).gameId;
        if (!gameId) {
          throw new Error('Game ID required');
        }
        game = requireGame(games, gameId);

        if (config.requiresPlayer) {
          const playerId = getPlayerId(socket, game);
          if (!playerId) {
            throw new Error('Player not found');
          }
          player = requirePlayer(game, playerId);
        }
      }

      // Execute handler
      const result = await handler({
        socket,
        data: validatedData,
        game,
        player,
        games
      });

      respond({ success: true, data: result });
    } catch (error) {
      console.error(`[${config.event}] Error:`, error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      respond({
        success: false,
        error: message,
        code: (error as any).code || 'HANDLER_ERROR'
      });
    }
  };
}

/**
 * Batch emit helper for sending multiple events efficiently
 */
export class BatchEmitter {
  private queue: Map<string, { event: string; data: unknown }[]> = new Map();
  private io: any;
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor(io: any, private flushDelay: number = 50) {
    this.io = io;
  }

  emit(room: string, event: string, data: unknown) {
    if (!this.queue.has(room)) {
      this.queue.set(room, []);
    }

    this.queue.get(room)!.push({ event, data });

    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.flushDelay);
    }
  }

  private flush() {
    for (const [room, events] of this.queue.entries()) {
      if (events.length === 1) {
        // Single event, emit normally
        this.io.to(room).emit(events[0].event, events[0].data);
      } else {
        // Multiple events, batch them
        this.io.to(room).emit('batch_update', events);
      }
    }

    this.queue.clear();
    this.flushTimeout = null;
  }

  forceFlush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.flush();
  }
}