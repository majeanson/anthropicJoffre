/**
 * Refresh Token Database Operations Tests
 * Sprint 18 Phase 1 Task 1.1
 *
 * Tests for secure refresh token management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  detectSuspiciousUsage,
  hashRefreshToken,
  cleanupExpiredTokens,
  getUserActiveTokens,
} from './refreshTokens';
import { query, getPool } from './index';

// Mock the database module
vi.mock('./index', () => ({
  query: vi.fn(),
  getPool: vi.fn(() => ({
    connect: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn(),
    })),
  })),
}));

describe('Refresh Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRefreshToken', () => {
    it('should create a new refresh token successfully', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const token = await createRefreshToken(1, '192.168.1.1', 'Mozilla/5.0');

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token!.length).toBeGreaterThan(40); // Base64url encoded 32 bytes
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refresh_tokens'),
        expect.arrayContaining([1, expect.any(String), expect.any(Date), '192.168.1.1', 'Mozilla/5.0'])
      );
    });

    it('should create token with default expiry of 30 days', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await createRefreshToken(1);

      const callArgs = mockQuery.mock.calls[0][1] as any[];
      const expiresAt = callArgs[2] as Date;
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      expect(expiresAt.getTime()).toBeGreaterThan(now + thirtyDaysMs - 1000);
      expect(expiresAt.getTime()).toBeLessThan(now + thirtyDaysMs + 1000);
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const token = await createRefreshToken(1);

      expect(token).toBeNull();
    });

    it('should return null when pool is not available', async () => {
      const mockGetPool = vi.mocked(getPool);
      mockGetPool.mockReturnValueOnce(null);

      const token = await createRefreshToken(1);

      expect(token).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid token successfully', async () => {
      const mockQuery = vi.mocked(query);
      const mockToken = {
        token_id: 1,
        user_id: 1,
        token_hash: 'hash123',
        expires_at: new Date(Date.now() + 1000000),
        created_at: new Date(),
        last_used_at: null,
        revoked: false,
        revoked_at: null,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        rotation_count: 0,
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockToken], rowCount: 1 } as any);

      const result = await verifyRefreshToken('valid-token');

      expect(result).toEqual(mockToken);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM refresh_tokens'),
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('should return null for expired token', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await verifyRefreshToken('expired-token');

      expect(result).toBeNull();
    });

    it('should return null for revoked token', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await verifyRefreshToken('revoked-token');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await verifyRefreshToken('test-token');

      expect(result).toBeNull();
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate token successfully', async () => {
      const mockGetPool = vi.mocked(getPool);
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
          .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE (revoke old)
          .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT (new token)
          .mockResolvedValueOnce({ rows: [], rowCount: 1 }), // COMMIT
        release: vi.fn(),
      };

      mockGetPool.mockReturnValueOnce({
        connect: vi.fn().mockResolvedValueOnce(mockClient),
      } as any);

      // Mock verifyRefreshToken to return valid token
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          token_id: 1,
          user_id: 1,
          token_hash: 'old-hash',
          rotation_count: 0,
        }],
        rowCount: 1,
      } as any);

      const result = await rotateRefreshToken('old-token', '192.168.1.1', 'Mozilla/5.0');

      expect(result).toBeTruthy();
      expect(result!.newToken).toBeTruthy();
      expect(result!.userId).toBe(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const mockGetPool = vi.mocked(getPool);
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
          .mockRejectedValueOnce(new Error('Database error')), // UPDATE fails
        release: vi.fn(),
      };

      mockGetPool.mockReturnValueOnce({
        connect: vi.fn().mockResolvedValueOnce(mockClient),
      } as any);

      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ user_id: 1, rotation_count: 0 }],
        rowCount: 1,
      } as any);

      const result = await rotateRefreshToken('old-token');

      expect(result).toBeNull();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null for invalid old token', async () => {
      const mockGetPool = vi.mocked(getPool);
      const mockClient = {
        query: vi.fn().mockResolvedValueOnce({ rows: [], rowCount: 1 }), // BEGIN
        release: vi.fn(),
      };

      mockGetPool.mockReturnValueOnce({
        connect: vi.fn().mockResolvedValueOnce(mockClient),
      } as any);

      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // Invalid token

      const result = await rotateRefreshToken('invalid-token');

      expect(result).toBeNull();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke token successfully', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [{ token_id: 1 }], rowCount: 1 } as any);

      const result = await revokeRefreshToken('valid-token');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens'),
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('should return false for already revoked token', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await revokeRefreshToken('already-revoked');

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await revokeRefreshToken('test-token');

      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for user', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ token_id: 1 }, { token_id: 2 }, { token_id: 3 }],
        rowCount: 3,
      } as any);

      const result = await revokeAllUserTokens(1);

      expect(result).toBe(3);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens'),
        expect.arrayContaining([1])
      );
    });

    it('should return 0 when user has no tokens', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await revokeAllUserTokens(999);

      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await revokeAllUserTokens(1);

      expect(result).toBe(0);
    });
  });

  describe('detectSuspiciousUsage', () => {
    it('should detect revoked token reuse', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ token_id: 1, revoked: true, user_id: 1 }],
        rowCount: 1,
      } as any);

      // Mock revokeAllUserTokens
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await detectSuspiciousUsage('revoked-token');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(2); // Check token + revoke all
    });

    it('should return false for valid token', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ token_id: 1, revoked: false, user_id: 1 }],
        rowCount: 1,
      } as any);

      const result = await detectSuspiciousUsage('valid-token');

      expect(result).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await detectSuspiciousUsage('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('hashRefreshToken', () => {
    it('should hash token consistently', () => {
      const token = 'test-token-123';
      const hash1 = hashRefreshToken(token);
      const hash2 = hashRefreshToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashRefreshToken('token-1');
      const hash2 = hashRefreshToken('token-2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ token_id: 1 }, { token_id: 2 }],
        rowCount: 2,
      } as any);

      const result = await cleanupExpiredTokens();

      expect(result).toBe(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM refresh_tokens')
      );
    });

    it('should return 0 when no expired tokens', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await cleanupExpiredTokens();

      expect(result).toBe(0);
    });
  });

  describe('getUserActiveTokens', () => {
    it('should return active tokens for user', async () => {
      const mockQuery = vi.mocked(query);
      const mockTokens = [
        {
          token_id: 1,
          created_at: new Date(),
          last_used_at: new Date(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          expires_at: new Date(Date.now() + 1000000),
        },
        {
          token_id: 2,
          created_at: new Date(),
          last_used_at: null,
          ip_address: '192.168.1.2',
          user_agent: 'Chrome/100',
          expires_at: new Date(Date.now() + 1000000),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockTokens, rowCount: 2 } as any);

      const result = await getUserActiveTokens(1);

      expect(result).toEqual(mockTokens);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no active tokens', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await getUserActiveTokens(999);

      expect(result).toEqual([]);
    });
  });

  describe('Token Security', () => {
    it('should generate cryptographically secure tokens', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      const token1 = await createRefreshToken(1);
      const token2 = await createRefreshToken(1);

      expect(token1).not.toBe(token2); // Must be unique
      expect(token1!.length).toBeGreaterThan(40); // Base64url encoding adds length
    });

    it('should hash tokens before database storage', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await createRefreshToken(1);

      const callArgs = mockQuery.mock.calls[0][1] as any[];
      const storedHash = callArgs[1];

      expect(storedHash).toHaveLength(64); // SHA-256 hash
      expect(storedHash).toMatch(/^[a-f0-9]{64}$/); // Hex string
    });
  });

  describe('Edge Cases', () => {
    it('should handle null IP address', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const token = await createRefreshToken(1, undefined, 'Mozilla/5.0');

      expect(token).toBeTruthy();
      const callArgs = mockQuery.mock.calls[0][1] as any[];
      expect(callArgs[3]).toBeNull();
    });

    it('should handle null user agent', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const token = await createRefreshToken(1, '192.168.1.1', undefined);

      expect(token).toBeTruthy();
      const callArgs = mockQuery.mock.calls[0][1] as any[];
      expect(callArgs[4]).toBeNull();
    });

    it('should handle concurrent token rotations gracefully', async () => {
      // This test simulates race conditions
      const mockGetPool = vi.mocked(getPool);
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
          .mockRejectedValueOnce({ code: '40001' }), // Serialization failure
        release: vi.fn(),
      };

      mockGetPool.mockReturnValueOnce({
        connect: vi.fn().mockResolvedValueOnce(mockClient),
      } as any);

      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ user_id: 1, rotation_count: 0 }],
        rowCount: 1,
      } as any);

      const result = await rotateRefreshToken('token');

      expect(result).toBeNull(); // Should fail gracefully
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
