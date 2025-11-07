/**
 * Comprehensive Error Handler with Verbose Debugging
 *
 * Provides detailed error context, correlation IDs, call chains,
 * and structured logging for production debugging
 */

import logger from './logger.js';
import {
  GameError,
  ErrorContext,
  ErrorSeverity,
  ErrorCategory,
  PlayerErrorContext,
} from '../types/errors.js';
import { GameState, CardColor } from '../types/game.js';
import { randomBytes } from 'crypto';

/**
 * Sanitized game state structure for logging
 */
interface SanitizedGameState {
  id?: string;
  phase?: string;
  currentPlayerIndex?: number;
  dealerIndex?: number;
  trump?: CardColor | null;
  currentTrick?: { length: number } | undefined;
  players?: Array<{
    id: string;
    name: string;
    teamId: 1 | 2;
    handSize: number;
    isBot?: boolean;
  }>;
}

/**
 * Generate unique correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Extract file name from stack trace
 */
export function extractFileFromStack(stack?: string): string {
  if (!stack) return 'unknown';

  const match = stack.match(/at .+ \((.+):\d+:\d+\)/);
  if (match && match[1]) {
    // Extract just the filename, not the full path
    const parts = match[1].split(/[\\/]/);
    return parts[parts.length - 1];
  }

  return 'unknown';
}

/**
 * Extract function name from stack trace
 */
export function extractFunctionFromStack(stack?: string): string {
  if (!stack) return 'unknown';

  const match = stack.match(/at ([^ ]+) \(/);
  if (match && match[1]) {
    return match[1];
  }

  return 'unknown';
}

/**
 * Extract line number from stack trace
 */
export function extractLineFromStack(stack?: string): number {
  if (!stack) return 0;

  const match = stack.match(/:(\d+):\d+\)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

/**
 * Extract call chain from stack trace
 */
export function extractCallChain(stack?: string): string[] {
  if (!stack) return [];

  const lines = stack.split('\n');
  const chain: string[] = [];

  for (const line of lines) {
    const match = line.match(/at ([^ ]+)/);
    if (match && match[1]) {
      chain.push(match[1]);
    }
  }

  return chain.slice(0, 10); // Limit to top 10
}

/**
 * Sanitize game state for logging (remove sensitive/large data)
 */
export function sanitizeGameState(gameState?: GameState | Partial<GameState>): SanitizedGameState | undefined {
  if (!gameState) return undefined;

  return {
    id: gameState.id,
    phase: gameState.phase,
    currentPlayerIndex: gameState.currentPlayerIndex,
    dealerIndex: gameState.dealerIndex,
    trump: gameState.trump,
    currentTrick: gameState.currentTrick?.length ? { length: gameState.currentTrick.length } : undefined,
    // Don't include full player hands (too much data)
    players: gameState.players?.map(p => ({
      id: p.id,
      name: p.name,
      teamId: p.teamId,
      handSize: p.hand?.length || 0,
      isBot: p.isBot,
    })),
  };
}

/**
 * Sanitize player context
 */
export function sanitizePlayerContext(
  playerId: string,
  gameState?: GameState
): PlayerErrorContext | undefined {
  if (!gameState) return undefined;

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return undefined;

  return {
    playerId: player.id,
    playerName: player.name,
    teamId: player.teamId,
    phase: gameState.phase,
    hand: player.hand?.length || 0,
    isBot: player.isBot,
  };
}

/**
 * Log error with full context
 */
export function logError(
  error: Error | GameError,
  context?: Partial<ErrorContext>
): void {
  const correlationId = context?.correlationId || generateCorrelationId();

  const errorLog = {
    timestamp: Date.now(),
    correlationId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as GameError).code,
      severity: (error as GameError).severity || 'medium',
      category: (error as GameError).category || 'unknown',
    },
    context: {
      file: context?.file || extractFileFromStack(error.stack),
      function: context?.function || extractFunctionFromStack(error.stack),
      line: context?.line || extractLineFromStack(error.stack),
      userId: context?.userId,
      gameId: context?.gameId,
      action: context?.action || 'unknown',
      gameState: context?.gameState ? sanitizeGameState(context.gameState) : undefined,
      playerContext: context?.playerContext,
      callChain: context?.callChain || extractCallChain(error.stack),
      requestDuration: context?.requestDuration,
      metadata: context?.metadata || {},
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
  };

  // Log to structured logger
  logger.error('Error occurred', errorLog);

  // Track error metrics
  trackErrorMetrics(errorLog.error.category, errorLog.error.severity);

  // Store in error database for analysis (optional)
  // await storeErrorForAnalysis(errorLog);
}

/**
 * Error metrics tracking
 */
const errorMetrics = {
  total: 0,
  byCategory: {} as Record<ErrorCategory, number>,
  bySeverity: {} as Record<ErrorSeverity, number>,
  lastReset: Date.now(),
};

function trackErrorMetrics(category: ErrorCategory, severity: ErrorSeverity): void {
  errorMetrics.total++;

  if (!errorMetrics.byCategory[category]) {
    errorMetrics.byCategory[category] = 0;
  }
  errorMetrics.byCategory[category]++;

  if (!errorMetrics.bySeverity[severity]) {
    errorMetrics.bySeverity[severity] = 0;
  }
  errorMetrics.bySeverity[severity]++;

  // Reset metrics every hour
  if (Date.now() - errorMetrics.lastReset > 3600000) {
    resetErrorMetrics();
  }
}

function resetErrorMetrics(): void {
  errorMetrics.total = 0;
  errorMetrics.byCategory = {} as Record<ErrorCategory, number>;
  errorMetrics.bySeverity = {} as Record<ErrorSeverity, number>;
  errorMetrics.lastReset = Date.now();
}

/**
 * Get error metrics (for monitoring dashboard)
 */
export function getErrorMetrics() {
  return {
    ...errorMetrics,
    period: {
      start: errorMetrics.lastReset,
      end: Date.now(),
      durationMs: Date.now() - errorMetrics.lastReset,
    },
  };
}

/**
 * Create error response with correlation ID
 */
export function createErrorResponse(
  message: string,
  code?: string,
  correlationId?: string
): { message: string; code?: string; correlationId?: string } {
  return {
    message,
    code,
    correlationId: correlationId || generateCorrelationId(),
  };
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context: { action: string; file?: string; function?: string }
): T {
  return (async (...args: unknown[]) => {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, {
        correlationId,
        action: context.action,
        file: context.file,
        function: context.function || fn.name,
        requestDuration: Date.now() - startTime,
        metadata: { args: args.length },
      });
      throw error;
    }
  }) as T;
}
