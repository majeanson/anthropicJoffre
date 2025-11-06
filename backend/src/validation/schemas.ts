/**
 * Input Validation Schemas with Zod
 *
 * Comprehensive validation for all user inputs to prevent:
 * - XSS attacks
 * - SQL injection
 * - Data corruption
 * - Invalid game states
 *
 * Sprint 2 Task #5: Enhanced input validation
 */

import { z } from 'zod';
import type { CardColor, CardValue, BotDifficulty } from '../types/game';

// ============= PRIMITIVE SCHEMAS =============

/**
 * Player name validation
 * - 2-20 characters
 * - Alphanumeric + spaces only
 * - No HTML/XSS characters
 * - Trimmed automatically
 */
export const playerNameSchema = z
  .string()
  .min(2, 'Player name must be at least 2 characters')
  .max(20, 'Player name must be at most 20 characters')
  .regex(/^[a-zA-Z0-9\s]+$/, 'Player name can only contain letters, numbers, and spaces')
  .transform(str => str.trim())
  .refine(str => str.length >= 2, 'Player name must be at least 2 characters after trimming');

/**
 * Game ID validation
 * - UUID format or alphanumeric
 * - 8-64 characters
 */
export const gameIdSchema = z
  .string()
  .min(8, 'Game ID must be at least 8 characters')
  .max(64, 'Game ID must be at most 64 characters')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Game ID contains invalid characters');

/**
 * Chat message validation
 * - 1-200 characters
 * - No HTML tags
 * - Trimmed automatically
 */
export const chatMessageSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(200, 'Message must be at most 200 characters')
  .transform(str => str.trim())
  .transform(str => str.replace(/<[^>]*>/g, '')) // Strip HTML tags
  .refine(str => str.length > 0, 'Message cannot be empty after sanitization');

/**
 * Socket ID validation
 * - Alphanumeric + dashes/underscores
 * - 8-64 characters
 */
export const socketIdSchema = z
  .string()
  .min(8, 'Socket ID must be at least 8 characters')
  .max(64, 'Socket ID must be at most 64 characters');

/**
 * Team ID validation
 * - Must be 1 or 2
 */
export const teamIdSchema = z
  .union([z.literal(1), z.literal(2)])
  .describe('Team ID must be 1 or 2');

/**
 * Bet amount validation
 * - Must be 7-12 or -1 (skip)
 */
export const betAmountSchema = z
  .number()
  .int('Bet amount must be an integer')
  .refine(
    val => val === -1 || (val >= 7 && val <= 12),
    'Bet amount must be between 7-12 or -1 for skip'
  );

/**
 * Boolean flag validation
 */
export const booleanSchema = z.boolean();

// ============= GAME OBJECT SCHEMAS =============

/**
 * Card color validation
 */
export const cardColorSchema = z.enum(['red', 'brown', 'green', 'blue']);

/**
 * Card value validation
 */
export const cardValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

/**
 * Card object validation
 */
export const cardSchema = z.object({
  color: cardColorSchema,
  value: cardValueSchema,
}).strict(); // Reject extra properties

/**
 * Bot difficulty validation
 */
export const botDifficultySchema = z.enum(['easy', 'medium', 'hard']);

/**
 * Persistence mode validation
 * - 'elo': Full database persistence with stats and ranking
 * - 'casual': Memory-only, no database saves
 */
export const persistenceModeSchema = z.enum(['elo', 'casual']);

// ============= SOCKET EVENT PAYLOAD SCHEMAS =============

/**
 * Create game payload
 */
export const createGamePayloadSchema = z.object({
  playerName: playerNameSchema,
  persistenceMode: persistenceModeSchema.default('elo').optional(),
}).strict();

/**
 * Join game payload
 */
export const joinGamePayloadSchema = z.object({
  gameId: gameIdSchema,
  playerName: playerNameSchema,
  isBot: booleanSchema.optional(),
  botDifficulty: botDifficultySchema.optional(),
}).strict();

/**
 * Select team payload
 */
export const selectTeamPayloadSchema = z.object({
  gameId: gameIdSchema,
  teamId: teamIdSchema,
}).strict();

/**
 * Swap position payload
 */
export const swapPositionPayloadSchema = z.object({
  gameId: gameIdSchema,
  targetPlayerId: socketIdSchema,
}).strict();

/**
 * Start game payload
 */
export const startGamePayloadSchema = z.object({
  gameId: gameIdSchema,
}).strict();

/**
 * Place bet payload
 */
export const placeBetPayloadSchema = z.object({
  gameId: gameIdSchema,
  amount: betAmountSchema,
  withoutTrump: booleanSchema,
  skipped: booleanSchema.optional(),
}).strict();

/**
 * Play card payload
 */
export const playCardPayloadSchema = z.object({
  gameId: gameIdSchema,
  card: cardSchema,
}).strict();

/**
 * Chat message payload (lobby/global)
 */
export const lobbyChatPayloadSchema = z.object({
  playerName: playerNameSchema,
  message: chatMessageSchema,
}).strict();

/**
 * Chat message payload (team selection)
 */
export const teamChatPayloadSchema = z.object({
  gameId: gameIdSchema,
  message: chatMessageSchema,
}).strict();

/**
 * Chat message payload (in-game)
 */
export const gameChatPayloadSchema = z.object({
  gameId: gameIdSchema,
  message: chatMessageSchema,
}).strict();

/**
 * Player ready payload
 */
export const playerReadyPayloadSchema = z.object({
  gameId: gameIdSchema,
}).strict();

/**
 * Vote rematch payload
 */
export const voteRematchPayloadSchema = z.object({
  gameId: gameIdSchema,
}).strict();

/**
 * Kick player payload
 */
export const kickPlayerPayloadSchema = z.object({
  gameId: gameIdSchema,
  playerIdToKick: socketIdSchema,
}).strict();

/**
 * Leave game payload
 */
export const leaveGamePayloadSchema = z.object({
  gameId: gameIdSchema,
}).strict();

/**
 * Fill empty seat payload
 */
export const fillEmptySeatPayloadSchema = z.object({
  gameId: gameIdSchema,
  playerName: playerNameSchema,
  emptySlotIndex: z.number().int().min(0).max(3), // Index of the empty seat to fill (0-3)
}).strict();

/**
 * Spectate game payload
 */
export const spectateGamePayloadSchema = z.object({
  gameId: gameIdSchema,
  spectatorName: playerNameSchema.optional(),
}).strict();

/**
 * Leave spectate payload
 */
export const leaveSpectatePayloadSchema = z.object({
  gameId: gameIdSchema,
}).strict();

// ============= HELPER FUNCTIONS =============

/**
 * Validate input with schema and return typed result
 * @returns { success: true, data: T } | { success: false, error: string }
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors into user-friendly message
      const firstError = error.issues[0];
      const path = firstError.path.join('.');
      const message = firstError.message;
      return {
        success: false,
        error: path ? `${path}: ${message}` : message,
      };
    }
    return { success: false, error: 'Invalid input' };
  }
}

/**
 * Validate input and throw error if invalid (for use in try/catch blocks)
 */
export function validateInputOrThrow<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  context?: string
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      const path = firstError.path.join('.');
      const message = firstError.message;
      const errorMsg = context
        ? `${context}: ${path ? `${path}: ${message}` : message}`
        : path
        ? `${path}: ${message}`
        : message;
      throw new Error(errorMsg);
    }
    throw new Error(context ? `${context}: Invalid input` : 'Invalid input');
  }
}
