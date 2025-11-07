/**
 * Error Types and Interfaces for Verbose Error Handling
 *
 * Provides comprehensive error context for debugging and monitoring
 */

import { GameState } from './game.js';

/**
 * Player context for error tracking
 */
export interface PlayerErrorContext {
  playerId: string;
  playerName: string;
  teamId?: number;
  phase?: string;
  hand?: number; // Number of cards in hand
  isBot?: boolean;
}

/**
 * Comprehensive error context
 */
export interface ErrorContext {
  // Source tracking
  file: string;
  function: string;
  line: number;

  // Request context
  correlationId: string;
  userId?: string;
  gameId?: string;
  action: string;

  // State context (sanitized for logging)
  gameState?: Partial<GameState>;
  playerContext?: PlayerErrorContext;

  // Call chain
  stackTrace: string;
  callChain: string[];

  // Timing
  timestamp: number;
  requestDuration?: number;

  // Additional data
  metadata: Record<string, any>;
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for aggregation
 */
export type ErrorCategory =
  | 'validation'
  | 'database'
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'game_logic'
  | 'socket_io'
  | 'unknown';

/**
 * Enhanced error class with full context
 */
export class GameError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;

  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext>,
    severity: ErrorSeverity = 'medium',
    category: ErrorCategory = 'unknown'
  ) {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.severity = severity;
    this.category = category;

    // Build full context with defaults
    this.context = {
      file: context.file || 'unknown',
      function: context.function || 'unknown',
      line: context.line || 0,
      correlationId: context.correlationId || '',
      action: context.action || 'unknown',
      stackTrace: context.stackTrace || this.stack || '',
      callChain: context.callChain || [],
      timestamp: context.timestamp || Date.now(),
      metadata: context.metadata || {},
      ...context,
    };

    // Capture stack trace
    Error.captureStackTrace(this, GameError);
  }

  /**
   * Convert to loggable JSON object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation result type
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Structured error response
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    correlationId?: string;
    details?: ValidationError[];
  };
}

/**
 * Success response
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * API response type (success or error)
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
