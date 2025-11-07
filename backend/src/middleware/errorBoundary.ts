/**
 * Error Boundary for Socket.IO Event Handlers
 *
 * Wraps socket event handlers with error catching and reporting.
 * Prevents uncaught exceptions from crashing the server.
 *
 * Sprint 6: Enhanced with correlation IDs and advanced error context
 */

import * as Sentry from '@sentry/node';
import { Socket } from 'socket.io';
import { generateCorrelationId, logError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { GameError } from '../types/errors.js';

/**
 * Metrics tracking for error boundaries
 */
interface ErrorMetrics {
  totalCalls: number;
  totalErrors: number;
  totalSuccess: number;
  errorsByType: Map<string, number>;
  lastError: Date | null;
  averageExecutionTime: number;
}

const errorMetrics = new Map<string, ErrorMetrics>();

/**
 * Get metrics for a specific handler
 */
export function getHandlerMetrics(handlerName: string): ErrorMetrics | undefined {
  return errorMetrics.get(handlerName);
}

/**
 * Get all error boundary metrics
 */
export function getAllMetrics(): Map<string, ErrorMetrics> {
  return new Map(errorMetrics);
}

/**
 * Reset metrics for a specific handler or all handlers
 */
export function resetMetrics(handlerName?: string): void {
  if (handlerName) {
    errorMetrics.delete(handlerName);
  } else {
    errorMetrics.clear();
  }
}

/**
 * Initialize metrics for a handler
 */
function initializeMetrics(handlerName: string): void {
  if (!errorMetrics.has(handlerName)) {
    errorMetrics.set(handlerName, {
      totalCalls: 0,
      totalErrors: 0,
      totalSuccess: 0,
      errorsByType: new Map(),
      lastError: null,
      averageExecutionTime: 0,
    });
  }
}

/**
 * Update metrics for a handler
 */
function updateMetrics(
  handlerName: string,
  success: boolean,
  executionTime: number,
  error?: Error
): void {
  initializeMetrics(handlerName);
  const metrics = errorMetrics.get(handlerName)!;

  metrics.totalCalls++;
  if (success) {
    metrics.totalSuccess++;
  } else {
    metrics.totalErrors++;
    metrics.lastError = new Date();

    if (error) {
      const errorType = error.constructor.name;
      const count = metrics.errorsByType.get(errorType) || 0;
      metrics.errorsByType.set(errorType, count + 1);
    }
  }

  // Calculate rolling average execution time
  metrics.averageExecutionTime =
    (metrics.averageExecutionTime * (metrics.totalCalls - 1) + executionTime) /
    metrics.totalCalls;
}

/**
 * Error boundary configuration
 */
interface ErrorBoundaryConfig {
  /** Function name for logging (e.g., "create_game") */
  handlerName: string;
  /** Whether to send error to client */
  sendToClient?: boolean;
  /** Custom error message for client */
  clientMessage?: string;
}

/**
 * Wrap a socket event handler with error boundary
 *
 * Features (Sprint 6 Enhanced):
 * - Catches all synchronous and asynchronous errors
 * - Generates correlation IDs for request tracking
 * - Reports to Sentry with context
 * - Uses enhanced error logging with ErrorContext
 * - Optionally notifies client with correlation ID
 * - Prevents server crashes
 * - Tracks execution metrics
 *
 * @example
 * ```typescript
 * socket.on('create_game', withErrorBoundary(
 *   async (playerName: string) => {
 *     // Handler logic that might throw
 *     const gameId = await createGame(playerName);
 *     socket.emit('game_created', { gameId });
 *   },
 *   { handlerName: 'create_game', sendToClient: true }
 * ));
 * ```
 */
export function withErrorBoundary<TArgs extends unknown[], TReturn = void>(
  handler: (this: Socket, ...args: TArgs) => TReturn | Promise<TReturn>,
  config: ErrorBoundaryConfig
): any {
  return async function (this: Socket, ...args: unknown[]): Promise<void> {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();
    let success = true;
    let caughtError: Error | undefined;

    // Extract context from socket and arguments
    const userId = this.data?.userId;
    const gameId = args.length > 0 && typeof args[0] === 'object' && args[0] !== null && 'gameId' in args[0] ? (args[0] as { gameId: string }).gameId : undefined;

    // Log request start (debug level)
    logger.debug('Socket handler started', {
      correlationId,
      handler: config.handlerName,
      socketId: this.id,
      userId,
      gameId,
    });

    try {
      const result = handler.apply(this, args as TArgs);

      // If handler returns a promise, await it to catch async errors
      if (result instanceof Promise) {
        await result;
      }

      // Log success (debug level)
      const duration = Date.now() - startTime;
      logger.debug('Socket handler completed', {
        correlationId,
        handler: config.handlerName,
        duration,
        success: true,
      });
    } catch (error) {
      success = false;
      caughtError = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      // Use enhanced error logging with full context
      logError(caughtError, {
        correlationId,
        action: config.handlerName,
        requestDuration: duration,
        userId,
        gameId,
        metadata: {
          socketId: this.id,
          rooms: Array.from(this.rooms),
          handshake: {
            address: this.handshake.address,
            time: this.handshake.time,
          },
          arguments: args.length > 0 && typeof args[0] === 'object' && args[0] !== null ? Object.keys(args[0]) : args,
        },
      });

      // Report to Sentry with enhanced context
      Sentry.captureException(error, {
        tags: {
          handler: config.handlerName,
          socketId: this.id,
          correlationId,
        },
        contexts: {
          socket: {
            id: this.id,
            rooms: Array.from(this.rooms),
            handshake: {
              address: this.handshake.address,
              time: this.handshake.time,
            },
          },
        },
        extra: {
          correlationId,
          arguments: args,
          userId,
          gameId,
          duration,
        },
      });

      // Send error to client with correlation ID
      if (config.sendToClient) {
        const message = caughtError instanceof GameError
          ? caughtError.message
          : config.clientMessage || 'An error occurred. Please try again.';

        const code = caughtError instanceof GameError ? caughtError.code : 'INTERNAL_ERROR';

        this.emit('error', {
          message,
          code,
          correlationId, // Client can report this for support
        });
      }
    } finally {
      // Update metrics
      const executionTime = Date.now() - startTime;
      updateMetrics(config.handlerName, success, executionTime, caughtError);
    }
  };
}

/**
 * Pre-configured error boundary for common scenarios
 */
export const errorBoundaries = {
  /**
   * For game actions (create, join, play card, etc.)
   * Sends errors to client
   */
  gameAction: (handlerName: string) =>
    <TArgs extends unknown[]>(handler: (this: Socket, ...args: TArgs) => void | Promise<void>): any =>
      withErrorBoundary(handler, {
        handlerName,
        sendToClient: true,
        clientMessage: 'Game action failed. Please try again.',
      }),

  /**
   * For read-only actions (get stats, get leaderboard, etc.)
   * Sends errors to client with custom message
   */
  readOnly: (handlerName: string) =>
    <TArgs extends unknown[]>(handler: (this: Socket, ...args: TArgs) => void | Promise<void>): any =>
      withErrorBoundary(handler, {
        handlerName,
        sendToClient: true,
        clientMessage: 'Failed to load data. Please try again.',
      }),

  /**
   * For background tasks (heartbeat, cleanup, etc.)
   * Does not send errors to client
   */
  background: (handlerName: string) =>
    <TArgs extends unknown[]>(handler: (this: Socket, ...args: TArgs) => void | Promise<void>): any =>
      withErrorBoundary(handler, {
        handlerName,
        sendToClient: false,
      }),
};

/**
 * Type-safe socket.on wrapper that handles error boundary wrapped handlers
 *
 * @example
 * ```typescript
 * safeSocketOn(socket, 'create_game', errorBoundaries.gameAction('create_game')((data) => {
 *   // handler logic
 * }));
 * ```
 */
export function safeSocketOn(
  socket: Socket,
  event: string,
  handler: any
): void {
  socket.on(event, handler);
}

/**
 * Error boundary for regular functions (non-socket handlers)
 *
 * @example
 * ```typescript
 * const safeFunction = withFunctionErrorBoundary(
 *   () => riskyOperation(),
 *   'riskyOperation'
 * );
 * ```
 */
export function withFunctionErrorBoundary<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn | Promise<TReturn>,
  functionName: string
): (...args: TArgs) => Promise<TReturn | undefined> {
  return async (...args: TArgs): Promise<TReturn | undefined> => {
    try {
      const result = fn(...args);
      return result instanceof Promise ? await result : result;
    } catch (error) {
      console.error(`[Error Boundary] ${functionName} failed:`, error);

      Sentry.captureException(error, {
        tags: { function: functionName },
        extra: { arguments: args },
      });

      return undefined;
    }
  };
}
