/**
 * Error Boundary for Socket.IO Event Handlers
 *
 * Wraps socket event handlers with error catching and reporting.
 * Prevents uncaught exceptions from crashing the server.
 */

import * as Sentry from '@sentry/node';
import { Socket } from 'socket.io';

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
 * Features:
 * - Catches all synchronous and asynchronous errors
 * - Reports to Sentry with context
 * - Optionally notifies client
 * - Prevents server crashes
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
export function withErrorBoundary<TArgs extends any[], TReturn = void>(
  handler: (this: Socket, ...args: TArgs) => TReturn | Promise<TReturn>,
  config: ErrorBoundaryConfig
): (this: Socket, ...args: TArgs) => Promise<void> {
  return async function (this: Socket, ...args: TArgs): Promise<void> {
    const startTime = Date.now();
    let success = true;
    let caughtError: Error | undefined;

    try {
      const result = handler.apply(this, args);

      // If handler returns a promise, await it to catch async errors
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      success = false;
      caughtError = error instanceof Error ? error : new Error(String(error));

      // Log error
      console.error(`[Error Boundary] ${config.handlerName} failed:`, error);

      // Report to Sentry with context
      Sentry.captureException(error, {
        tags: {
          handler: config.handlerName,
          socketId: this.id,
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
          arguments: args,
        },
      });

      // Optionally send error to client
      if (config.sendToClient) {
        const message = config.clientMessage || 'An error occurred. Please try again.';
        this.emit('error', { message });
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
    <TArgs extends any[]>(handler: (this: Socket, ...args: TArgs) => void | Promise<void>) =>
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
    <TArgs extends any[]>(handler: (this: Socket, ...args: TArgs) => void | Promise<void>) =>
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
    <TArgs extends any[]>(handler: (this: Socket, ...args: TArgs) => void | Promise<void>) =>
      withErrorBoundary(handler, {
        handlerName,
        sendToClient: false,
      }),
};

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
export function withFunctionErrorBoundary<TArgs extends any[], TReturn>(
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
