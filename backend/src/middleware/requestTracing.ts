/**
 * Request Tracing Middleware for Socket.io
 *
 * Adds correlation IDs, timing, and error handling to all Socket.io events
 */

import { Socket } from 'socket.io';
import { generateCorrelationId, logError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { GameError } from '../types/errors.js';

/**
 * Request metadata interface
 */
interface RequestMetadata {
  correlationId: string;
  startTime: number;
  action: string;
  socketId: string;
  userId?: string;
  gameId?: string;
}

/**
 * Socket handler function type
 */
type SocketHandler<TData = unknown> = (socket: Socket, data: TData, metadata: RequestMetadata) => Promise<void> | void;

/**
 * Wrap socket handler with request tracing
 *
 * Adds:
 * - Correlation ID generation
 * - Request timing
 * - Automatic error handling
 * - Structured logging
 *
 * @example
 * socket.on('create_game', withRequestTracing(async (socket, data, ctx) => {
 *   // ctx.correlationId is available
 *   // Errors are automatically logged with full context
 *   const game = await createGame(data.playerName);
 *   socket.emit('game_created', { game, correlationId: ctx.correlationId });
 * }));
 */
export function withRequestTracing<TData = unknown>(
  handler: SocketHandler<TData>,
  options?: {
    action?: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  }
): (socket: Socket, data: TData) => Promise<void> {
  return async (socket: Socket, data: TData) => {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    const action = options?.action || handler.name || 'unknown_action';

    // Create metadata
    const metadata: RequestMetadata = {
      correlationId,
      startTime,
      action,
      socketId: socket.id,
      userId: socket.data.userId,
      gameId: (data && typeof data === 'object' && 'gameId' in data) ? (data as { gameId?: string }).gameId : undefined,
    };

    // Log request start
    if (options?.logLevel !== 'error') {
      logger.debug('Socket request started', {
        correlationId,
        action,
        socketId: socket.id,
        userId: socket.data.userId,
        gameId: metadata.gameId,
      });
    }

    try {
      // Execute handler
      await handler(socket, data, metadata);

      // Log success
      const duration = Date.now() - startTime;
      if (options?.logLevel === 'info' || options?.logLevel === 'debug') {
        logger.info('Socket request completed', {
          correlationId,
          action,
          duration,
          success: true,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error with full context
      logError(error as Error, {
        correlationId,
        action,
        requestDuration: duration,
        userId: socket.data.userId,
        gameId: metadata.gameId,
        metadata: {
          socketId: socket.id,
          data: typeof data === 'object' && data !== null ? Object.keys(data) : data,
        },
      });

      // Send error response to client with correlation ID
      const errorMessage = error instanceof GameError ? error.message : 'An error occurred';
      const errorCode = error instanceof GameError ? error.code : 'INTERNAL_ERROR';

      socket.emit('error', {
        message: errorMessage,
        code: errorCode,
        correlationId, // Client can report this for support
      });

      // Re-throw for error boundary to catch
      throw error;
    }
  };
}

/**
 * Socket middleware to add correlation ID to all events
 *
 * Attaches correlation ID to socket.data for use throughout request lifecycle
 */
export function correlationIdMiddleware(socket: Socket, next: (err?: Error) => void) {
  // Add correlation ID to socket data
  socket.data.correlationId = generateCorrelationId();

  logger.debug('New socket connection', {
    socketId: socket.id,
    correlationId: socket.data.correlationId,
  });

  next();
}

/**
 * Track request metrics
 */
interface RequestMetrics {
  total: number;
  byAction: Record<string, number>;
  avgDuration: Record<string, number>;
  lastReset: number;
}

const requestMetrics: RequestMetrics = {
  total: 0,
  byAction: {},
  avgDuration: {},
  lastReset: Date.now(),
};

/**
 * Update request metrics
 */
export function trackRequestMetrics(action: string, duration: number): void {
  requestMetrics.total++;

  if (!requestMetrics.byAction[action]) {
    requestMetrics.byAction[action] = 0;
    requestMetrics.avgDuration[action] = 0;
  }

  requestMetrics.byAction[action]++;

  // Update average duration (rolling average)
  const count = requestMetrics.byAction[action];
  const currentAvg = requestMetrics.avgDuration[action];
  requestMetrics.avgDuration[action] = (currentAvg * (count - 1) + duration) / count;

  // Reset metrics every hour
  if (Date.now() - requestMetrics.lastReset > 3600000) {
    resetRequestMetrics();
  }
}

function resetRequestMetrics(): void {
  requestMetrics.total = 0;
  requestMetrics.byAction = {};
  requestMetrics.avgDuration = {};
  requestMetrics.lastReset = Date.now();
}

/**
 * Get request metrics (for monitoring)
 */
export function getRequestMetrics() {
  return {
    ...requestMetrics,
    period: {
      start: requestMetrics.lastReset,
      end: Date.now(),
      durationMs: Date.now() - requestMetrics.lastReset,
    },
  };
}
