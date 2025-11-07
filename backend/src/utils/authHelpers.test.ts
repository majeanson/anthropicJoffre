/**
 * Authentication Helpers Tests
 * Sprint 7 Task 2: Database Layer Tests - Authentication
 */

import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  validatePassword,
  validateEmail,
} from './authHelpers';

describe('authHelpers', () => {
  describe('hashPassword & comparePassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('should generate different hash for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt makes each hash unique
    });

    it('should return true for correct password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('WrongPassword', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(1, 'testuser');

      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
      expect(tokens).toHaveProperty('expires_in');
      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();
      expect(tokens.expires_in).toBe(15 * 60); // 15 minutes in seconds
    });

    it('should create valid JWT tokens', () => {
      const tokens = generateTokens(1, 'testuser');

      // JWT format: header.payload.signature
      const accessParts = tokens.access_token.split('.');
      const refreshParts = tokens.refresh_token.split('.');

      expect(accessParts).toHaveLength(3);
      expect(refreshParts).toHaveLength(3);
    });

    it('should include user data in payload', () => {
      const userId = 123;
      const username = 'testuser';
      const tokens = generateTokens(userId, username);

      const accessToken = verifyAccessToken(tokens.access_token);
      expect(accessToken).toBeDefined();
      expect(accessToken?.user_id).toBe(userId);
      expect(accessToken?.username).toBe(username);
      expect(accessToken?.type).toBe('access');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = generateTokens(1, 'testuser');
      const payload = verifyAccessToken(tokens.access_token);

      expect(payload).toBeDefined();
      expect(payload?.user_id).toBe(1);
      expect(payload?.username).toBe('testuser');
      expect(payload?.type).toBe('access');
    });

    it('should reject refresh token as access token', () => {
      const tokens = generateTokens(1, 'testuser');
      const payload = verifyAccessToken(tokens.refresh_token);

      expect(payload).toBeNull();
    });

    it('should reject invalid token', () => {
      const payload = verifyAccessToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should reject malformed token', () => {
      const payload = verifyAccessToken('not-even-a-jwt');
      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = generateTokens(1, 'testuser');
      const payload = verifyRefreshToken(tokens.refresh_token);

      expect(payload).toBeDefined();
      expect(payload?.user_id).toBe(1);
      expect(payload?.username).toBe('testuser');
      expect(payload?.type).toBe('refresh');
    });

    it('should reject access token as refresh token', () => {
      const tokens = generateTokens(1, 'testuser');
      const payload = verifyRefreshToken(tokens.access_token);

      expect(payload).toBeNull();
    });

    it('should reject invalid token', () => {
      const payload = verifyRefreshToken('invalid.token.here');
      expect(payload).toBeNull();
    });
  });

  describe('generateSecureToken', () => {
    it('should generate random token', () => {
      const token = generateSecureToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      const token3 = generateSecureToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate hex string', () => {
      const token = generateSecureToken();
      const isHex = /^[0-9a-f]+$/.test(token);

      expect(isHex).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const valid = ['Password123', 'Test1234', 'MyPass99'];

      for (const password of valid) {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should reject password too short', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject password without number', () => {
      const result = validatePassword('PasswordOnly');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const valid = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@example.co.uk',
      ];

      for (const email of valid) {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should reject invalid email formats', () => {
      const invalid = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'no-at-sign.com',
      ];

      for (const email of invalid) {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('valid email');
      }
    });
  });
});
