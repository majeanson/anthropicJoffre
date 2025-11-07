/**
 * Session Manager Tests
 * Sprint 7 Task 2: Database Layer Tests - Authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSessionToken,
  createPlayerSession,
  validateSessionToken,
} from './sessionManager';
import type { PlayerSession } from '../types/game';

describe('sessionManager', () => {
  let playerSessions: Map<string, PlayerSession>;

  beforeEach(() => {
    playerSessions = new Map();
  });

  describe('generateSessionToken', () => {
    it('should generate unique session token', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      const token3 = generateSessionToken();

      expect(token1).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate 64 character hex string', () => {
      const token = generateSessionToken();

      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('createPlayerSession', () => {
    it('should create and store session', () => {
      const session = createPlayerSession(
        'game-123',
        'socket-456',
        'TestPlayer',
        playerSessions
      );

      expect(session).toBeDefined();
      expect(session.gameId).toBe('game-123');
      expect(session.playerId).toBe('socket-456');
      expect(session.playerName).toBe('TestPlayer');
      expect(session.token).toBeDefined();
      expect(session.timestamp).toBeDefined();
    });

    it('should store session in map', () => {
      const session = createPlayerSession(
        'game-123',
        'socket-456',
        'TestPlayer',
        playerSessions
      );

      expect(playerSessions.has(session.token)).toBe(true);
      expect(playerSessions.get(session.token)).toBe(session);
    });

    it('should return session object with correct properties', () => {
      const session = createPlayerSession(
        'game-123',
        'socket-456',
        'TestPlayer',
        playerSessions
      );

      expect(session).toHaveProperty('gameId');
      expect(session).toHaveProperty('playerId');
      expect(session).toHaveProperty('playerName');
      expect(session).toHaveProperty('token');
      expect(session).toHaveProperty('timestamp');
    });

    it('should generate unique tokens for multiple sessions', () => {
      const session1 = createPlayerSession('game-1', 'player-1', 'P1', playerSessions);
      const session2 = createPlayerSession('game-2', 'player-2', 'P2', playerSessions);
      const session3 = createPlayerSession('game-3', 'player-3', 'P3', playerSessions);

      expect(session1.token).not.toBe(session2.token);
      expect(session2.token).not.toBe(session3.token);
      expect(session1.token).not.toBe(session3.token);
    });
  });

  describe('validateSessionToken', () => {
    it('should return session for valid token', () => {
      const session = createPlayerSession(
        'game-123',
        'socket-456',
        'TestPlayer',
        playerSessions
      );

      const validated = validateSessionToken(session.token, playerSessions);

      expect(validated).toBeDefined();
      expect(validated).toBe(session);
    });

    it('should return null for non-existent token', () => {
      const validated = validateSessionToken('invalid-token', playerSessions);

      expect(validated).toBeNull();
    });

    it('should return null for expired session', () => {
      const session = createPlayerSession(
        'game-123',
        'socket-456',
        'TestPlayer',
        playerSessions
      );

      // Manually expire the session (15 minutes + 1ms)
      session.timestamp = Date.now() - (15 * 60 * 1000 + 1);

      const validated = validateSessionToken(session.token, playerSessions);

      expect(validated).toBeNull();
    });

    it('should delete expired session from map', () => {
      const session = createPlayerSession(
        'game-123',
        'socket-456',
        'TestPlayer',
        playerSessions
      );

      // Expire the session
      session.timestamp = Date.now() - (15 * 60 * 1000 + 1);

      expect(playerSessions.has(session.token)).toBe(true);

      validateSessionToken(session.token, playerSessions);

      expect(playerSessions.has(session.token)).toBe(false);
    });

    it('should accept session just before expiry', () => {
      const session = createPlayerSession(
        'game-123',
        'socket-456',
        'TestPlayer',
        playerSessions
      );

      // Session at 14:59 (just before 15 minute expiry)
      session.timestamp = Date.now() - (14 * 60 * 1000 + 59 * 1000);

      const validated = validateSessionToken(session.token, playerSessions);

      expect(validated).toBeDefined();
      expect(validated).toBe(session);
    });
  });
});
