/**
 * Chat Helper Functions
 * Sprint 4 Phase 4.3: Extract duplicated chat validation and rate limiting logic
 *
 * These helpers reduce code duplication across chat handlers by providing
 * reusable validation, rate limiting, and message sanitization functions.
 */

import { Socket } from 'socket.io';
import { Logger } from 'winston';
import { ZodSchema } from 'zod';
import { validateInput } from '../validation/schemas';

/**
 * Validate chat message input against a Zod schema
 * @returns { success: true, data } or { success: false, error }
 */
export function validateChatMessage<T>(
  schema: ZodSchema<T>,
  payload: unknown,
  socket: Socket,
  logger: Logger,
  eventName: string
): { success: true; data: T } | { success: false } {
  const validation = validateInput(schema, payload);

  if (!validation.success) {
    socket.emit('error', { message: `Invalid input: ${validation.error}` });
    logger.warn(`Invalid ${eventName} payload`, {
      payload,
      error: validation.error,
      socketId: socket.id
    });
    return { success: false };
  }

  return { success: true, data: validation.data };
}

/**
 * Rate limit check for chat messages
 * @returns { allowed: true } or { allowed: false }
 */
export function rateLimitChatMessage(
  playerName: string,
  ipAddress: string,
  rateLimiter: {
    checkLimit: (identifier: string, ipAddress: string) => { allowed: boolean };
    recordRequest: (identifier: string, ipAddress: string) => void;
  },
  socket: Socket,
  logger: Logger,
  eventName: string,
  gameId?: string
): { allowed: boolean } {
  const rateLimit = rateLimiter.checkLimit(playerName, ipAddress);

  if (!rateLimit.allowed) {
    socket.emit('error', {
      message: 'You are sending messages too fast. Please slow down.',
    });

    const logContext: Record<string, unknown> = {
      playerName,
      ipAddress,
      socketId: socket.id,
    };
    if (gameId) {
      logContext.gameId = gameId;
    }

    logger.warn(`Rate limit exceeded for ${eventName}`, logContext);
    return { allowed: false };
  }

  // Record the request
  rateLimiter.recordRequest(playerName, ipAddress);
  return { allowed: true };
}

/**
 * Sanitize and validate message content
 * @returns sanitized message or null if empty
 */
export function sanitizeChatMessage(message: string): string | null {
  const sanitized = message.trim();
  return sanitized.length > 0 ? sanitized : null;
}
