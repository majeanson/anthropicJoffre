/**
 * User Database Operations
 * Sprint 3 Phase 1
 */

import { query, getPool } from './index';
import { User, UserWithPassword, PasswordReset, EmailVerification } from '../types/auth';
import { hashPassword, generateSecureToken } from '../utils/authHelpers';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService';

/**
 * Create a new user account
 */
export async function createUser(
  username: string,
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User; verificationToken: string } | null> {
  const pool = getPool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Hash password
    const passwordHash = await hashPassword(password);

    // Auto-verify users when email service is not configured (development mode)
    const autoVerify = !process.env.RESEND_API_KEY;

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, display_name, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email, display_name, avatar_url, is_verified, is_banned, created_at, last_login_at`,
      [username, email.toLowerCase(), passwordHash, displayName || username, autoVerify]
    );

    const user = userResult.rows[0];

    // Create email verification token
    const verificationToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await client.query(
      `INSERT INTO email_verifications (user_id, verification_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, verificationToken, expiresAt]
    );

    // Initialize user profile and preferences
    await client.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [user.user_id]
    );

    await client.query(
      'INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [user.user_id]
    );

    await client.query('COMMIT');

    // Send verification email only if email service is configured
    if (!autoVerify) {
      await sendVerificationEmail(email, username, verificationToken);
    } else {
      console.log(`[DEV MODE] User ${username} auto-verified (email service not configured)`);
    }

    return { user, verificationToken };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Get user by username (with password hash)
 */
export async function getUserByUsername(username: string): Promise<UserWithPassword | null> {
  try {
    const result = await query(
      `SELECT user_id, username, email, password_hash, display_name, avatar_url,
              is_verified, is_banned, created_at, last_login_at
       FROM users
       WHERE username = $1`,
      [username]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

/**
 * Get user by email (with password hash)
 */
export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  try {
    const result = await query(
      `SELECT user_id, username, email, password_hash, display_name, avatar_url,
              is_verified, is_banned, created_at, last_login_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID (without password hash)
 */
export async function getUserById(userId: number): Promise<User | null> {
  try {
    const result = await query(
      `SELECT user_id, username, email, display_name, avatar_url,
              is_verified, is_banned, created_at, last_login_at
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: number): Promise<boolean> {
  try {
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
    return true;
  } catch (error) {
    console.error('Error updating last login:', error);
    return false;
  }
}

/**
 * Verify user's email
 */
export async function verifyUserEmail(verificationToken: string): Promise<User | null> {
  const pool = getPool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find verification record
    const verificationResult = await client.query(
      `SELECT user_id, expires_at, verified
       FROM email_verifications
       WHERE verification_token = $1`,
      [verificationToken]
    );

    if (verificationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const verification = verificationResult.rows[0];

    // Check if already verified
    if (verification.verified) {
      await client.query('ROLLBACK');
      return null;
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return null;
    }

    // Mark verification as used
    await client.query(
      'UPDATE email_verifications SET verified = TRUE WHERE verification_token = $1',
      [verificationToken]
    );

    // Update user
    const userResult = await client.query(
      `UPDATE users SET is_verified = TRUE WHERE user_id = $1
       RETURNING user_id, username, email, display_name, avatar_url, is_verified, is_banned, created_at, last_login_at`,
      [verification.user_id]
    );

    await client.query('COMMIT');
    return userResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error verifying email:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Create password reset token
 */
export async function createPasswordReset(email: string): Promise<string | null> {
  try {
    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_resets (user_id, reset_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, resetToken, expiresAt]
    );

    // Send password reset email
    await sendPasswordResetEmail(email, user.username, resetToken);

    return resetToken;
  } catch (error) {
    console.error('Error creating password reset:', error);
    return null;
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(resetToken: string, newPassword: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find reset record
    const resetResult = await client.query(
      `SELECT user_id, expires_at, used
       FROM password_resets
       WHERE reset_token = $1`,
      [resetToken]
    );

    if (resetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const reset = resetResult.rows[0];

    // Check if already used
    if (reset.used) {
      await client.query('ROLLBACK');
      return false;
    }

    // Check if expired
    if (new Date(reset.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return false;
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [passwordHash, reset.user_id]
    );

    // Mark reset as used
    await client.query(
      'UPDATE password_resets SET used = TRUE WHERE reset_token = $1',
      [resetToken]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting password:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: {
    display_name?: string;
    avatar_url?: string;
  }
): Promise<User | null> {
  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.display_name !== undefined) {
      setClauses.push(`display_name = $${paramIndex++}`);
      values.push(updates.display_name);
    }

    if (updates.avatar_url !== undefined) {
      setClauses.push(`avatar_url = $${paramIndex++}`);
      values.push(updates.avatar_url);
    }

    if (setClauses.length === 0) {
      return getUserById(userId);
    }

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${setClauses.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING user_id, username, email, display_name, avatar_url, is_verified, is_banned, created_at, last_login_at`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

/**
 * Link player_stats to user account
 */
export async function linkPlayerToUser(playerName: string, userId: number): Promise<boolean> {
  try {
    await query(
      'UPDATE player_stats SET user_id = $1 WHERE player_name = $2',
      [userId, playerName]
    );
    return true;
  } catch (error) {
    console.error('Error linking player to user:', error);
    return false;
  }
}

/**
 * Check if username exists
 */
export async function usernameExists(username: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT 1 FROM users WHERE username = $1',
      [username]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT 1 FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}
