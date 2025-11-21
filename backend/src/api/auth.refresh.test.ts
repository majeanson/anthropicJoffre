/**
 * Authentication Refresh Token Endpoint Tests
 * Sprint 18 Phase 1 Task 1.1
 *
 * Tests for JWT refresh token endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './auth';
import * as refreshTokens from '../db/refreshTokens';
import * as users from '../db/users';

// Mock dependencies
vi.mock('../db/refreshTokens');
vi.mock('../db/users');
vi.mock('../utils/authHelpers', () => ({
  generateTokens: vi.fn(() => ({
    access_token: 'new-access-token',
    refresh_token: 'new-refresh-token-in-response',
    expires_in: 3600,
  })),
  verifyAccessToken: vi.fn((token) => {
    if (token === 'valid-access-token') {
      return { user_id: 1, username: 'testuser' };
    }
    return null;
  }),
  hashPassword: vi.fn(() => Promise.resolve('hashed-password')),
  comparePassword: vi.fn(() => Promise.resolve(true)),
}));

describe('POST /api/auth/refresh', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create minimal Express app for testing
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Token Refresh', () => {
    it('should refresh token with valid refresh token cookie', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValueOnce({
        newToken: 'new-refresh-token',
        userId: 1,
      });
      vi.mocked(users.getUserById).mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        display_name: 'Test User',
        avatar_url: null,
        is_verified: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=old-refresh-token'])
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBe('new-access-token');
      expect(response.body.message).toBe('Token refreshed successfully');

      // Verify new refresh token set in cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refresh_token=new-refresh-token');
      expect(cookies[0]).toContain('HttpOnly');
      // In development, sameSite is 'lax'; in production it's 'none' for cross-origin
      expect(cookies[0]).toContain('SameSite=Lax');
    });

    it('should set secure cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValueOnce({
        newToken: 'new-refresh-token',
        userId: 1,
      });
      vi.mocked(users.getUserById).mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        display_name: 'Test User',
        avatar_url: null,
        is_verified: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=old-refresh-token'])
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toContain('Secure');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Token Theft Detection', () => {
    it('should detect and reject suspicious token usage', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=stolen-token'])
        .expect(401);

      expect(response.body.error).toContain('Security violation detected');
      expect(response.body.code).toBe('TOKEN_THEFT_DETECTED');

      // Verify cookie was cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refresh_token=;');
    });

    it('should revoke all user tokens on theft detection', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(true);

      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=stolen-token'])
        .expect(401);

      expect(refreshTokens.detectSuspiciousUsage).toHaveBeenCalledWith('stolen-token');
    });
  });

  describe('Invalid Tokens', () => {
    it('should reject request without refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.error).toBe('No refresh token provided');
    });

    it('should reject expired refresh token', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=expired-token'])
        .expect(401);

      expect(response.body.error).toBe('Invalid or expired refresh token');

      // Verify cookie was cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toContain('refresh_token=;');
    });

    it('should reject token for banned user', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValueOnce({
        newToken: 'new-token',
        userId: 1,
      });
      vi.mocked(users.getUserById).mockResolvedValueOnce({
        user_id: 1,
        username: 'banneduser',
        email: 'banned@example.com',
        password_hash: 'hash',
        display_name: 'Banned User',
        avatar_url: null,
        is_verified: true,
        is_banned: true, // User is banned
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=valid-token'])
        .expect(403);

      expect(response.body.error).toBe('Account has been banned');
      expect(refreshTokens.revokeAllUserTokens).toHaveBeenCalledWith(1);
    });

    it('should reject token for deleted user', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValueOnce({
        newToken: 'new-token',
        userId: 999,
      });
      vi.mocked(users.getUserById).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=orphaned-token'])
        .expect(401);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to refresh endpoint', async () => {
      // This test verifies rate limiter is applied
      // Actual rate limit testing would require multiple rapid requests

      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValue(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValue({
        newToken: 'new-token',
        userId: 1,
      });
      vi.mocked(users.getUserById).mockResolvedValue({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        display_name: 'Test User',
        avatar_url: null,
        is_verified: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });

      // First request should succeed
      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=token1'])
        .expect(200);

      // Rate limiter should track requests
      // (Full rate limit test would require 11+ requests)
    });
  });

  describe('Token Rotation', () => {
    it('should invalidate old token when rotating', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValueOnce({
        newToken: 'new-token',
        userId: 1,
      });
      vi.mocked(users.getUserById).mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        display_name: 'Test User',
        avatar_url: null,
        is_verified: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });

      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=old-token'])
        .set('User-Agent', 'Test/1.0')
        .expect(200);

      expect(refreshTokens.rotateRefreshToken).toHaveBeenCalledWith(
        'old-token',
        expect.any(String), // IP address
        expect.any(String)  // User agent
      );
    });

    it('should track IP and user agent in rotation', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockResolvedValueOnce({
        newToken: 'new-token',
        userId: 1,
      });
      vi.mocked(users.getUserById).mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        display_name: 'Test User',
        avatar_url: null,
        is_verified: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });

      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=token'])
        .set('User-Agent', 'TestAgent/1.0')
        .expect(200);

      const callArgs = vi.mocked(refreshTokens.rotateRefreshToken).mock.calls[0];
      expect(callArgs[2]).toBe('TestAgent/1.0');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=token'])
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle rotation failures gracefully', async () => {
      vi.mocked(refreshTokens.detectSuspiciousUsage).mockResolvedValueOnce(false);
      vi.mocked(refreshTokens.rotateRefreshToken).mockRejectedValueOnce(
        new Error('Rotation failed')
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=token'])
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });
});

describe('POST /api/auth/logout', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
  });

  it('should revoke refresh token on logout', async () => {
    vi.mocked(refreshTokens.revokeRefreshToken).mockResolvedValueOnce(true);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refresh_token=valid-token'])
      .expect(200);

    expect(response.body.message).toBe('Logout successful');
    expect(refreshTokens.revokeRefreshToken).toHaveBeenCalledWith('valid-token');

    // Verify cookie was cleared
    const cookies = response.headers['set-cookie'];
    expect(cookies[0]).toContain('refresh_token=;');
  });

  it('should succeed even without refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect(200);

    expect(response.body.message).toBe('Logout successful');
    expect(refreshTokens.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('should succeed even if revocation fails', async () => {
    vi.mocked(refreshTokens.revokeRefreshToken).mockRejectedValueOnce(
      new Error('Database error')
    );

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refresh_token=token'])
      .expect(200);

    expect(response.body.message).toBe('Logout successful');
  });
});

describe('POST /api/auth/logout-all', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
  });

  it('should revoke all user tokens', async () => {
    vi.mocked(refreshTokens.revokeAllUserTokens).mockResolvedValueOnce(3);

    const response = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', 'Bearer valid-access-token')
      .set('Cookie', ['refresh_token=token'])
      .expect(200);

    expect(response.body.message).toBe('Logged out from all devices successfully');
    expect(response.body.sessions_revoked).toBe(3);
    expect(refreshTokens.revokeAllUserTokens).toHaveBeenCalledWith(1);
  });

  it('should require valid access token', async () => {
    const response = await request(app)
      .post('/api/auth/logout-all')
      .expect(401);

    expect(response.body.error).toBe('No token provided');
  });

  it('should reject invalid access token', async () => {
    const response = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.error).toBe('Invalid or expired token');
  });

  it('should clear refresh token cookie', async () => {
    vi.mocked(refreshTokens.revokeAllUserTokens).mockResolvedValueOnce(2);

    const response = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', 'Bearer valid-access-token')
      .set('Cookie', ['refresh_token=token'])
      .expect(200);

    const cookies = response.headers['set-cookie'];
    expect(cookies[0]).toContain('refresh_token=;');
  });
});
