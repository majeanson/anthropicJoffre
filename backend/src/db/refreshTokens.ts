/**
 * Refresh Token Database Operations
 * Sprint 18 Phase 1 Task 1.1
 *
 * Implements secure refresh token management with rotation
 * following OAuth 2.0 best practices
 */

import { query, getPool } from './index';
import crypto from 'crypto';

export interface RefreshToken {
  token_id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  last_used_at: Date | null;
  revoked: boolean;
  revoked_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
  rotation_count: number;
}

/**
 * Generate a cryptographically secure refresh token
 * Returns both the token (to send to client) and hash (to store in DB)
 */
export function generateRefreshToken(): { token: string; hash: string } {
  // Generate 32-byte random token (256 bits)
  const token = crypto.randomBytes(32).toString('base64url');

  // Hash token using SHA-256 for database storage
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  return { token, hash };
}

/**
 * Hash a refresh token for database lookup
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new refresh token for a user
 *
 * @param userId - User ID
 * @param ipAddress - Client IP address (optional)
 * @param userAgent - Client user agent (optional)
 * @param expiryDays - Days until expiration (default: 30)
 * @returns Token string to send to client
 */
export async function createRefreshToken(
  userId: number,
  ipAddress?: string,
  userAgent?: string,
  expiryDays: number = 30
): Promise<string | null> {
  const pool = getPool();
  if (!pool) return null;

  try {
    const { token, hash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, hash, expiresAt, ipAddress || null, userAgent || null]
    );

    return token;
  } catch (error) {
    console.error('Error creating refresh token:', error);
    return null;
  }
}

/**
 * Verify and retrieve a refresh token
 *
 * @param token - Raw token string
 * @returns RefreshToken object if valid, null otherwise
 */
export async function verifyRefreshToken(token: string): Promise<RefreshToken | null> {
  const pool = getPool();
  if (!pool) return null;

  try {
    const hash = hashRefreshToken(token);

    const result = await query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1
         AND revoked = FALSE
         AND expires_at > NOW()
       LIMIT 1`,
      [hash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
}

/**
 * Rotate a refresh token (invalidate old, create new)
 * Implements OAuth 2.0 refresh token rotation for enhanced security
 *
 * @param oldToken - Current refresh token
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @returns New refresh token, or null if rotation failed
 */
export async function rotateRefreshToken(
  oldToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ newToken: string; userId: number } | null> {
  const pool = getPool();
  if (!pool) return null;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify old token
    const oldTokenData = await verifyRefreshToken(oldToken);
    if (!oldTokenData) {
      await client.query('ROLLBACK');
      return null;
    }

    // Revoke old token
    const oldHash = hashRefreshToken(oldToken);
    await client.query(
      `UPDATE refresh_tokens
       SET revoked = TRUE,
           revoked_at = NOW(),
           rotation_count = rotation_count + 1
       WHERE token_hash = $1`,
      [oldHash]
    );

    // Generate new token
    const { token: newToken, hash: newHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent, rotation_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [oldTokenData.user_id, newHash, expiresAt, ipAddress || null, userAgent || null, oldTokenData.rotation_count + 1]
    );

    await client.query('COMMIT');

    return { newToken, userId: oldTokenData.user_id };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rotating refresh token:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Revoke a specific refresh token
 *
 * @param token - Token to revoke
 * @returns True if revoked successfully
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  try {
    const hash = hashRefreshToken(token);

    const result = await query(
      `UPDATE refresh_tokens
       SET revoked = TRUE, revoked_at = NOW()
       WHERE token_hash = $1 AND revoked = FALSE
       RETURNING token_id`,
      [hash]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 * Useful for logout all devices, security incidents, password changes
 *
 * @param userId - User ID
 * @returns Number of tokens revoked
 */
export async function revokeAllUserTokens(userId: number): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  try {
    const result = await query(
      `UPDATE refresh_tokens
       SET revoked = TRUE, revoked_at = NOW()
       WHERE user_id = $1 AND revoked = FALSE
       RETURNING token_id`,
      [userId]
    );

    return result.rows.length;
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
    return 0;
  }
}

/**
 * Update last_used_at timestamp for a refresh token
 * Call this when validating a token to track usage
 *
 * @param token - Token that was used
 */
export async function updateTokenLastUsed(token: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    const hash = hashRefreshToken(token);

    await query(
      `UPDATE refresh_tokens
       SET last_used_at = NOW()
       WHERE token_hash = $1`,
      [hash]
    );
  } catch (error) {
    console.error('Error updating token last used:', error);
  }
}

/**
 * Clean up expired refresh tokens
 * Should be called periodically (e.g., daily cron job)
 * Removes tokens expired more than 30 days ago
 *
 * @returns Number of tokens deleted
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  try {
    const result = await query(
      `DELETE FROM refresh_tokens
       WHERE expires_at < NOW() - INTERVAL '30 days'
       RETURNING token_id`
    );

    console.log(`🧹 Cleaned up ${result.rows.length} expired refresh tokens`);
    return result.rows.length;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Get active refresh tokens for a user (for admin/security purposes)
 *
 * @param userId - User ID
 * @returns Array of active refresh tokens (without token values)
 */
export async function getUserActiveTokens(userId: number): Promise<Array<{
  token_id: number;
  created_at: Date;
  last_used_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
}>> {
  const pool = getPool();
  if (!pool) return [];

  try {
    const result = await query(
      `SELECT token_id, created_at, last_used_at, ip_address, user_agent, expires_at
       FROM refresh_tokens
       WHERE user_id = $1 AND revoked = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting user active tokens:', error);
    return [];
  }
}

/**
 * Detect suspicious token usage (potential token theft)
 * Returns true if a revoked token is being reused (indicates compromise)
 *
 * @param token - Token to check
 * @returns True if suspicious usage detected
 */
export async function detectSuspiciousUsage(token: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  try {
    const hash = hashRefreshToken(token);

    const result = await query(
      `SELECT token_id, revoked, user_id
       FROM refresh_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [hash]
    );

    if (result.rows.length === 0) {
      return false; // Token doesn't exist
    }

    const tokenData = result.rows[0];

    // If token is revoked but being used, it's suspicious
    // Could indicate token theft or replay attack
    if (tokenData.revoked) {
      console.warn(`⚠️  SECURITY ALERT: Revoked refresh token reused for user ${tokenData.user_id}`);

      // Revoke ALL tokens for this user as security measure
      await revokeAllUserTokens(tokenData.user_id);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error detecting suspicious usage:', error);
    return false;
  }
}
