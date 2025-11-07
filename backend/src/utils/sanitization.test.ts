/**
 * Sanitization & Validation Tests
 * Sprint 7 Task 4: Utility Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizePlayerName,
  sanitizeChatMessage,
  validateBetAmount,
  validateCardValue,
  validateCardColor,
  validateGameId,
  sanitizeTextInput,
  validateBoolean,
  validateTeamId,
  validatePlayerIndex,
} from './sanitization';

describe('sanitization utilities', () => {
  describe('sanitizePlayerName', () => {
    it('should accept valid player names', () => {
      expect(sanitizePlayerName('Player1')).toBe('Player1');
      expect(sanitizePlayerName('Test_User-123')).toBe('Test_User-123');
      expect(sanitizePlayerName('  SpacedName  ')).toBe('SpacedName');
    });

    it('should reject empty names', () => {
      expect(() => sanitizePlayerName('')).toThrow('Player name must be a non-empty string');
      expect(() => sanitizePlayerName('   ')).toThrow('Player name cannot be empty after sanitization');
    });

    it('should remove HTML tags', () => {
      // DOMPurify removes script tags completely
      expect(sanitizePlayerName('<script>alert("xss")</script>Player')).toBe('Player');
      expect(sanitizePlayerName('<b>Bold</b>Name')).toBe('BoldName');
    });

    it('should enforce max length of 20 characters', () => {
      const longName = 'a'.repeat(30);
      expect(sanitizePlayerName(longName)).toHaveLength(20);
    });

    it('should reject invalid characters', () => {
      expect(() => sanitizePlayerName('Player@#$%')).toThrow('can only contain letters, numbers');
    });
  });

  describe('sanitizeChatMessage', () => {
    it('should accept valid messages', () => {
      expect(sanitizeChatMessage('Hello world')).toBe('Hello world');
      expect(sanitizeChatMessage('  Spaced message  ')).toBe('Spaced message');
    });

    it('should reject empty messages', () => {
      expect(() => sanitizeChatMessage('')).toThrow('Chat message must be a non-empty string');
    });

    it('should remove HTML tags', () => {
      const result = sanitizeChatMessage('<b>Bold text</b>');
      expect(result).toBe('Bold text');
    });

    it('should enforce max length of 200 characters', () => {
      const longMessage = 'a'.repeat(300);
      expect(sanitizeChatMessage(longMessage)).toHaveLength(200);
    });
  });

  describe('validateBetAmount', () => {
    it('should accept valid bet amounts (7-12)', () => {
      expect(validateBetAmount(7)).toBe(7);
      expect(validateBetAmount(10)).toBe(10);
      expect(validateBetAmount(12)).toBe(12);
    });

    it('should reject amounts outside range', () => {
      expect(() => validateBetAmount(6)).toThrow('must be between 7 and 12');
      expect(() => validateBetAmount(13)).toThrow('must be between 7 and 12');
    });

    it('should reject non-integers', () => {
      expect(() => validateBetAmount(7.5)).toThrow('must be an integer');
      expect(() => validateBetAmount('invalid')).toThrow('must be an integer');
    });
  });

  describe('validateCardValue', () => {
    it('should accept valid card values (0-7)', () => {
      expect(validateCardValue(0)).toBe(0);
      expect(validateCardValue(5)).toBe(5);
      expect(validateCardValue(7)).toBe(7);
    });

    it('should reject values outside range', () => {
      expect(() => validateCardValue(-1)).toThrow('must be between 0 and 7');
      expect(() => validateCardValue(8)).toThrow('must be between 0 and 7');
    });

    it('should reject non-integers', () => {
      expect(() => validateCardValue(3.5)).toThrow('must be an integer');
    });
  });

  describe('validateCardColor', () => {
    it('should accept valid colors', () => {
      expect(validateCardColor('yellow')).toBe('yellow');
      expect(validateCardColor('BLUE')).toBe('blue');
      expect(validateCardColor('  red  ')).toBe('red');
    });

    it('should reject invalid colors', () => {
      expect(() => validateCardColor('purple')).toThrow('must be one of');
      expect(() => validateCardColor(123)).toThrow('must be a string');
    });
  });

  describe('validateGameId', () => {
    it('should accept valid game IDs', () => {
      expect(validateGameId('game-123')).toBe('game-123');
      expect(validateGameId('abc-def-ghi')).toBe('abc-def-ghi');
    });

    it('should reject invalid formats', () => {
      expect(() => validateGameId('game@#$')).toThrow('Invalid game ID format');
      expect(() => validateGameId(123)).toThrow('must be a string');
    });
  });

  describe('sanitizeTextInput', () => {
    it('should sanitize text and enforce max length', () => {
      expect(sanitizeTextInput('Clean text')).toBe('Clean text');
      expect(sanitizeTextInput('<script>xss</script>Hello')).toBe('Hello');

      const longText = 'a'.repeat(600);
      expect(sanitizeTextInput(longText)).toHaveLength(500);
    });

    it('should handle empty input', () => {
      expect(sanitizeTextInput('')).toBe('');
    });
  });

  describe('validateBoolean', () => {
    it('should accept boolean values', () => {
      expect(validateBoolean(true)).toBe(true);
      expect(validateBoolean(false)).toBe(false);
    });

    it('should convert truthy values', () => {
      expect(validateBoolean('true')).toBe(true);
      expect(validateBoolean(1)).toBe(true);
      expect(validateBoolean('1')).toBe(true);
    });

    it('should convert falsy values', () => {
      expect(validateBoolean('false')).toBe(false);
      expect(validateBoolean(0)).toBe(false);
      expect(validateBoolean('0')).toBe(false);
    });

    it('should reject invalid values', () => {
      expect(() => validateBoolean('invalid')).toThrow('must be a boolean');
    });
  });

  describe('validateTeamId', () => {
    it('should accept valid team IDs', () => {
      expect(validateTeamId(1)).toBe(1);
      expect(validateTeamId(2)).toBe(2);
      expect(validateTeamId('1')).toBe(1);
      expect(validateTeamId('2')).toBe(2);
    });

    it('should reject invalid team IDs', () => {
      expect(() => validateTeamId(0)).toThrow('must be 1 or 2');
      expect(() => validateTeamId(3)).toThrow('must be 1 or 2');
    });
  });

  describe('validatePlayerIndex', () => {
    it('should accept valid player indices', () => {
      expect(validatePlayerIndex(0)).toBe(0);
      expect(validatePlayerIndex(1)).toBe(1);
      expect(validatePlayerIndex(2)).toBe(2);
      expect(validatePlayerIndex(3)).toBe(3);
    });

    it('should reject invalid indices', () => {
      expect(() => validatePlayerIndex(-1)).toThrow('must be between 0 and 3');
      expect(() => validatePlayerIndex(4)).toThrow('must be between 0 and 3');
    });
  });
});
