/**
 * Structured Logging with Winston
 *
 * Provides centralized logging with:
 * - Structured JSON format for production
 * - Human-readable format for development
 * - Log levels: error, warn, info, http, verbose, debug
 * - Context metadata support
 * - Performance tracking
 */

import winston from 'winston';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Augment Express Request type to include logger
declare global {
  namespace Express {
    interface Request {
      log: winston.Logger;
    }
  }
}

// Custom format for development (colorized, human-readable)
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for production (structured JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create Winston logger
const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: {
    service: 'trick-card-game-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console output
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.resolve(__dirname, '../../logs');

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Helper to create a child logger with context
 */
export function createLogger(context: string | object) {
  if (typeof context === 'string') {
    return logger.child({ context });
  }
  return logger.child(context);
}

/**
 * Log levels:
 * - error: Critical errors that need immediate attention
 * - warn: Warning conditions that should be reviewed
 * - info: General informational messages
 * - http: HTTP request/response logging
 * - verbose: Detailed information for debugging
 * - debug: Very detailed debugging information
 */

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;
  private logger: winston.Logger;

  constructor(label: string, loggerInstance: winston.Logger = logger) {
    this.label = label;
    this.logger = loggerInstance;
    this.startTime = Date.now();
  }

  end(metadata?: object) {
    const duration = Date.now() - this.startTime;
    this.logger.debug(`${this.label} completed`, {
      duration: `${duration}ms`,
      ...metadata,
    });
    return duration;
  }

  checkpoint(checkpointName: string) {
    const elapsed = Date.now() - this.startTime;
    this.logger.debug(`${this.label} - ${checkpointName}`, {
      elapsed: `${elapsed}ms`,
    });
  }
}

/**
 * Request logger middleware for Express
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();

  // Create request-specific logger
  req.log = logger.child({
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  });

  // Log request
  req.log.http('Incoming request', {
    headers: req.headers,
    query: req.query,
    body: sanitizeBody(req.body),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    req.log.log(logLevel, 'Request completed', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

/**
 * Socket event logger wrapper
 */
export function logSocketEvent(
  eventName: string,
  socketId: string,
  data: unknown,
  metadata?: object
) {
  logger.debug(`Socket event: ${eventName}`, {
    socketId,
    eventName,
    data: sanitizeData(data),
    ...metadata,
  });
}

/**
 * Game action logger
 */
export function logGameAction(
  gameId: string,
  playerId: string,
  action: string,
  details?: object
) {
  logger.info(`Game action: ${action}`, {
    gameId,
    playerId,
    action,
    ...details,
  });
}

/**
 * Error logger with stack trace
 */
export function logError(
  error: Error,
  context: string,
  metadata?: object
) {
  logger.error(`Error in ${context}`, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
    ...metadata,
  });
}

/**
 * Database query logger
 */
export function logDatabaseQuery(
  query: string,
  duration: number,
  metadata?: object
) {
  const logLevel = duration > 1000 ? 'warn' : 'debug';

  logger.log(logLevel, 'Database query', {
    query: query.substring(0, 200), // Truncate long queries
    duration: `${duration}ms`,
    slow: duration > 1000,
    ...metadata,
  });
}

/**
 * Performance monitoring logger
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: object
) {
  const logLevel = duration > 5000 ? 'warn' : 'debug';

  logger.log(logLevel, `Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    slow: duration > 5000,
    ...metadata,
  });
}

/**
 * Validation error logger for socket events
 *
 * Logs validation failures with structured metadata for easy production monitoring:
 * - Searchable by event name via [VALIDATION_ERROR] prefix
 * - Includes full payload for debugging (sanitized)
 * - Contains socket and player context
 * - Tracks validation error types
 *
 * Production monitoring tips:
 * - Search logs for: "VALIDATION_ERROR"
 * - Filter by event: "eventName"="take_over_bot"
 * - Track error frequency by: "validationError" field
 * - Identify problematic clients by: "socketId" or "playerName"
 */
export function logValidationError(
  eventName: string,
  validationError: string,
  payload: unknown,
  socketId: string,
  playerName?: string,
  gameId?: string
) {
  logger.warn(`[VALIDATION_ERROR] ${eventName} - Invalid payload`, {
    // Error classification (for alerting/metrics)
    errorType: 'VALIDATION_ERROR',
    eventName,
    validationError,

    // Context for debugging
    socketId,
    playerName: playerName || 'unknown',
    gameId: gameId || 'none',

    // Full payload for investigation (sanitized)
    payload: sanitizeData(payload),

    // Timestamp for correlation
    timestamp: new Date().toISOString(),

    // Environment context
    environment: process.env.NODE_ENV || 'development',
  });

  // Also log to console in development for immediate visibility
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[VALIDATION_ERROR] ${eventName} failed:`, {
      error: validationError,
      payload: JSON.stringify(payload, null, 2),
      socketId,
      playerName,
      gameId,
    });
  }
}

// Utility functions

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeBody(body: unknown): unknown {
  if (!body) return undefined;

  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized = { ...body as Record<string, unknown> };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

function sanitizeData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.length > 500 ? data.substring(0, 500) + '...' : data;
  }
  if (typeof data === 'object' && data !== null) {
    return sanitizeBody(data);
  }
  return data;
}

export default logger;
