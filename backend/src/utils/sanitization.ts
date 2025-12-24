/**
 * Input Sanitization & Validation Utilities
 *
 * Provides functions to sanitize and validate user inputs to prevent
 * XSS attacks, injection attacks, and ensure data integrity.
 */

import validator from 'validator';

/**
 * Strip HTML tags from text
 * Simple server-side HTML sanitization without requiring DOM
 */
function stripHtmlTags(text: string): string {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return cleaned;
}

/**
 * Sanitize player name
 * - Max length: 20 characters
 * - Removes HTML tags and special characters
 * - Trims whitespace
 */
export function sanitizePlayerName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Player name must be a non-empty string');
  }

  // Remove HTML tags and escape special characters
  const cleaned = stripHtmlTags(name);

  // Escape any remaining HTML entities
  const escaped = validator.escape(cleaned);

  // Trim and limit length
  const trimmed = escaped.trim().substring(0, 20);

  if (trimmed.length === 0) {
    throw new Error('Player name cannot be empty after sanitization');
  }

  // Only allow alphanumeric, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
    throw new Error('Player name can only contain letters, numbers, spaces, hyphens, and underscores');
  }

  return trimmed;
}

/**
 * Sanitize chat message
 * - Max length: 200 characters
 * - Removes dangerous HTML but allows basic formatting
 * - Trims whitespace
 */
export function sanitizeChatMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    throw new Error('Chat message must be a non-empty string');
  }

  // Remove all HTML tags
  const cleaned = stripHtmlTags(message);

  // Trim and limit length
  const trimmed = cleaned.trim().substring(0, 200);

  if (trimmed.length === 0) {
    throw new Error('Chat message cannot be empty');
  }

  return trimmed;
}

/**
 * Validate and sanitize bet amount
 * - Must be an integer between 7 and 12
 */
export function validateBetAmount(amount: unknown): number {
  // Convert to number
  const num = Number(amount);

  // Check if valid number
  if (!Number.isInteger(num)) {
    throw new Error('Bet amount must be an integer');
  }

  // Check range
  if (num < 7 || num > 12) {
    throw new Error('Bet amount must be between 7 and 12');
  }

  return num;
}

/**
 * Validate card value
 * - Must be an integer between 0 and 7
 */
export function validateCardValue(value: unknown): number {
  const num = Number(value);

  if (!Number.isInteger(num)) {
    throw new Error('Card value must be an integer');
  }

  if (num < 0 || num > 7) {
    throw new Error('Card value must be between 0 and 7');
  }

  return num;
}

/**
 * Validate card color
 * - Must be one of: yellow, blue, red, green, brown
 */
export function validateCardColor(color: unknown): string {
  const validColors = ['yellow', 'blue', 'red', 'green', 'brown'];

  if (typeof color !== 'string') {
    throw new Error('Card color must be a string');
  }

  const normalized = color.toLowerCase().trim();

  if (!validColors.includes(normalized)) {
    throw new Error(`Card color must be one of: ${validColors.join(', ')}`);
  }

  return normalized;
}

/**
 * Validate game ID format
 * - Must be a valid UUID or alphanumeric string
 */
export function validateGameId(gameId: unknown): string {
  if (typeof gameId !== 'string') {
    throw new Error('Game ID must be a string');
  }

  const trimmed = gameId.trim();

  // Check if it's a UUID or alphanumeric string
  if (!validator.isUUID(trimmed) && !/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
    throw new Error('Invalid game ID format');
  }

  return trimmed;
}

/**
 * Sanitize general text input (for descriptions, etc.)
 * - Max length: 500 characters
 * - Removes all HTML
 */
export function sanitizeTextInput(text: string, maxLength: number = 500): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const cleaned = stripHtmlTags(text);
  return cleaned.trim().substring(0, maxLength);
}

/**
 * Validate boolean value
 */
export function validateBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === '1' || value === 1) {
    return true;
  }

  if (value === 'false' || value === '0' || value === 0) {
    return false;
  }

  throw new Error('Value must be a boolean');
}

/**
 * Validate team ID
 * - Must be 1 or 2
 */
export function validateTeamId(teamId: unknown): 1 | 2 {
  const num = Number(teamId);

  if (!Number.isInteger(num) || (num !== 1 && num !== 2)) {
    throw new Error('Team ID must be 1 or 2');
  }

  return num as 1 | 2;
}

/**
 * Validate player index/position
 * - Must be 0, 1, 2, or 3
 */
export function validatePlayerIndex(index: unknown): number {
  const num = Number(index);

  if (!Number.isInteger(num) || num < 0 || num > 3) {
    throw new Error('Player index must be between 0 and 3');
  }

  return num;
}
