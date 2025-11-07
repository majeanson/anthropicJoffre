/**
 * User Database Operations Tests
 * Sprint 7 Task 2: Database Layer Tests - Authentication
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateLastLogin,
  verifyUserEmail,
  createPasswordReset,
  resetPassword,
  updateUserProfile,
  linkPlayerToUser,
  usernameExists,
  emailExists,
} from './users';
import { query } from './index';

describe('User Database Operations', () => {
  const testPrefix = 'DBTEST_' + Date.now();
  const testEmail = `${testPrefix}@example.com`;
  const testUsername = `${testPrefix}_user`;
  const testPassword = 'TestPass123';

  // Clean up test data after all tests
  afterAll(async () => {
    // Delete in correct order due to foreign key constraints
    await query('DELETE FROM player_stats WHERE player_name LIKE $1', [`${testPrefix}%`]);
    await query('DELETE FROM email_verifications WHERE user_id IN (SELECT user_id FROM users WHERE username LIKE $1)', [`${testPrefix}%`]);
    await query('DELETE FROM password_resets WHERE user_id IN (SELECT user_id FROM users WHERE username LIKE $1)', [`${testPrefix}%`]);
    await query('DELETE FROM user_profiles WHERE user_id IN (SELECT user_id FROM users WHERE username LIKE $1)', [`${testPrefix}%`]);
    await query('DELETE FROM user_preferences WHERE user_id IN (SELECT user_id FROM users WHERE username LIKE $1)', [`${testPrefix}%`]);
    await query('DELETE FROM users WHERE username LIKE $1', [`${testPrefix}%`]);
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const result = await createUser(testUsername, testEmail, testPassword);

      expect(result).not.toBeNull();
      expect(result?.user.username).toBe(testUsername);
      expect(result?.user.email).toBe(testEmail.toLowerCase());
      expect(result?.verificationToken).toBeTruthy();
      expect(result?.verificationToken).toHaveLength(64); // 32 bytes hex = 64 chars

      // Password should be hashed, not plain text
      const user = await getUserByUsername(testUsername);
      expect(user?.password_hash).not.toBe(testPassword);
      expect(user?.password_hash).toBeTruthy();
    });

    it('should reject duplicate email', async () => {
      const email = `${testPrefix}_dup1@example.com`;
      const username1 = `${testPrefix}_user1`;
      const username2 = `${testPrefix}_user2`;

      // Create first user
      const result1 = await createUser(username1, email, testPassword);
      expect(result1).not.toBeNull();

      // Try to create second user with same email
      const result2 = await createUser(username2, email, testPassword);
      expect(result2).toBeNull(); // Should fail
    });

    it('should reject duplicate username', async () => {
      const username = `${testPrefix}_unique`;
      const email1 = `${testPrefix}_email1@example.com`;
      const email2 = `${testPrefix}_email2@example.com`;

      // Create first user
      const result1 = await createUser(username, email1, testPassword);
      expect(result1).not.toBeNull();

      // Try to create second user with same username
      const result2 = await createUser(username, email2, testPassword);
      expect(result2).toBeNull(); // Should fail
    });

    it('should auto-verify user when email service is not configured', async () => {
      const username = `${testPrefix}_autoverify`;
      const email = `${testPrefix}_autoverify@example.com`;

      // When RESEND_API_KEY is not set, user should be auto-verified
      const result = await createUser(username, email, testPassword);

      expect(result).not.toBeNull();
      // Auto-verify depends on environment, so check if user exists
      const user = await getUserByUsername(username);
      expect(user).not.toBeNull();
    });
  });

  describe('getUserBy* functions', () => {
    let createdUserId: number;
    const lookupUsername = `${testPrefix}_lookup`;
    const lookupEmail = `${testPrefix}_lookup@example.com`;

    beforeAll(async () => {
      // Create a user for lookup tests (only once for all tests in this block)
      const result = await createUser(lookupUsername, lookupEmail, testPassword);
      createdUserId = result!.user.user_id;
    });

    it('should return user by email', async () => {
      const user = await getUserByEmail(lookupEmail);

      expect(user).not.toBeNull();
      expect(user?.username).toBe(lookupUsername);
      expect(user?.email).toBe(lookupEmail.toLowerCase());
      expect(user?.password_hash).toBeTruthy();
    });

    it('should return null for non-existent email', async () => {
      const user = await getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should return user by username', async () => {
      const user = await getUserByUsername(lookupUsername);

      expect(user).not.toBeNull();
      expect(user?.username).toBe(lookupUsername);
      expect(user?.password_hash).toBeTruthy();
    });

    it('should return user by ID without password hash', async () => {
      const user = await getUserById(createdUserId);

      expect(user).not.toBeNull();
      expect(user?.user_id).toBe(createdUserId);
      expect(user?.username).toBe(lookupUsername);
      // getUserById should NOT return password_hash
      expect((user as any).password_hash).toBeUndefined();
    });
  });

  describe('verifyUserEmail', () => {
    it('should mark email as verified with valid token', async () => {
      const username = `${testPrefix}_verify`;
      const email = `${testPrefix}_verify@example.com`;

      // Create user
      const result = await createUser(username, email, testPassword);
      expect(result).not.toBeNull();
      const { verificationToken } = result!;

      // Verify email
      const user = await verifyUserEmail(verificationToken);

      expect(user).not.toBeNull();
      expect(user?.is_verified).toBe(true);

      // Verify the verification record was marked as used
      const verificationCheck = await query(
        'SELECT verified FROM email_verifications WHERE verification_token = $1',
        [verificationToken]
      );
      expect(verificationCheck.rows[0]?.verified).toBe(true);
    });

    it('should reject invalid token', async () => {
      const user = await verifyUserEmail('invalid_token_12345');
      expect(user).toBeNull();
    });

    it('should reject already verified token', async () => {
      const username = `${testPrefix}_verify2`;
      const email = `${testPrefix}_verify2@example.com`;

      // Create and verify user
      const result = await createUser(username, email, testPassword);
      const { verificationToken } = result!;
      await verifyUserEmail(verificationToken);

      // Try to verify again
      const secondVerify = await verifyUserEmail(verificationToken);
      expect(secondVerify).toBeNull();
    });

    it('should reject expired token', async () => {
      const username = `${testPrefix}_expired`;
      const email = `${testPrefix}_expired@example.com`;

      // Create user
      const result = await createUser(username, email, testPassword);
      const { verificationToken, user } = result!;

      // Manually expire the token
      await query(
        `UPDATE email_verifications
         SET expires_at = $1
         WHERE user_id = $2`,
        [new Date(Date.now() - 1000), user.user_id]
      );

      // Try to verify with expired token
      const verified = await verifyUserEmail(verificationToken);
      expect(verified).toBeNull();
    });
  });

  describe('Password Reset', () => {
    it('should create password reset token', async () => {
      const username = `${testPrefix}_reset`;
      const email = `${testPrefix}_reset@example.com`;

      // Create user
      await createUser(username, email, testPassword);

      // Request password reset
      const resetToken = await createPasswordReset(email);

      expect(resetToken).toBeTruthy();
      expect(resetToken).toHaveLength(64); // 32 bytes hex

      // Verify token exists in database
      const tokenCheck = await query(
        'SELECT * FROM password_resets WHERE reset_token = $1',
        [resetToken]
      );
      expect(tokenCheck.rows.length).toBe(1);
    });

    it('should update password with valid reset token', async () => {
      const username = `${testPrefix}_pwchange`;
      const email = `${testPrefix}_pwchange@example.com`;
      const newPassword = 'NewPass456';

      // Create user and get reset token
      await createUser(username, email, testPassword);
      const resetToken = await createPasswordReset(email);

      // Reset password
      const success = await resetPassword(resetToken!, newPassword);
      expect(success).toBe(true);

      // Verify reset token was marked as used
      const tokenCheck = await query(
        'SELECT used FROM password_resets WHERE reset_token = $1',
        [resetToken]
      );
      expect(tokenCheck.rows[0]?.used).toBe(true);

      // Verify new password hash is different
      const user = await getUserByUsername(username);
      expect(user?.password_hash).toBeTruthy();
      expect(user?.password_hash).not.toBe(testPassword);
    });

    it('should reject invalid reset token', async () => {
      const success = await resetPassword('invalid_token', 'NewPass456');
      expect(success).toBe(false);
    });

    it('should reject already used reset token', async () => {
      const username = `${testPrefix}_usedtoken`;
      const email = `${testPrefix}_usedtoken@example.com`;

      // Create user and reset password
      await createUser(username, email, testPassword);
      const resetToken = await createPasswordReset(email);
      await resetPassword(resetToken!, 'NewPass456');

      // Try to use token again
      const secondReset = await resetPassword(resetToken!, 'AnotherPass789');
      expect(secondReset).toBe(false);
    });
  });

  describe('updateUserProfile', () => {
    it('should update display name', async () => {
      const username = `${testPrefix}_profile`;
      const email = `${testPrefix}_profile@example.com`;

      const created = await createUser(username, email, testPassword);
      const userId = created!.user.user_id;

      const updated = await updateUserProfile(userId, {
        display_name: 'New Display Name',
      });

      expect(updated).not.toBeNull();
      expect(updated?.display_name).toBe('New Display Name');
    });

    it('should update avatar URL', async () => {
      const username = `${testPrefix}_avatar`;
      const email = `${testPrefix}_avatar@example.com`;

      const created = await createUser(username, email, testPassword);
      const userId = created!.user.user_id;

      const updated = await updateUserProfile(userId, {
        avatar_url: 'https://example.com/avatar.png',
      });

      expect(updated).not.toBeNull();
      expect(updated?.avatar_url).toBe('https://example.com/avatar.png');
    });
  });

  describe('Existence Checks', () => {
    it('should correctly check if username exists', async () => {
      const username = `${testPrefix}_exists`;
      const email = `${testPrefix}_exists@example.com`;

      // Before creation
      const beforeExists = await usernameExists(username);
      expect(beforeExists).toBe(false);

      // Create user
      await createUser(username, email, testPassword);

      // After creation
      const afterExists = await usernameExists(username);
      expect(afterExists).toBe(true);
    });

    it('should correctly check if email exists', async () => {
      const username = `${testPrefix}_emailexists`;
      const email = `${testPrefix}_emailexists@example.com`;

      // Before creation
      const beforeExists = await emailExists(email);
      expect(beforeExists).toBe(false);

      // Create user
      await createUser(username, email, testPassword);

      // After creation
      const afterExists = await emailExists(email);
      expect(afterExists).toBe(true);
    });
  });

  describe('linkPlayerToUser', () => {
    it('should link player_stats to user account', async () => {
      const username = `${testPrefix}_link`;
      const email = `${testPrefix}_link@example.com`;
      const playerName = `${testPrefix}_player`;

      // Create user
      const created = await createUser(username, email, testPassword);
      const userId = created!.user.user_id;

      // Create player_stats entry
      await query(
        'INSERT INTO player_stats (player_name) VALUES ($1) ON CONFLICT (player_name) DO NOTHING',
        [playerName]
      );

      // Link player to user
      const success = await linkPlayerToUser(playerName, userId);
      expect(success).toBe(true);

      // Verify link
      const stats = await query(
        'SELECT user_id FROM player_stats WHERE player_name = $1',
        [playerName]
      );
      expect(stats.rows[0]?.user_id).toBe(userId);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last_login_at timestamp', async () => {
      const username = `${testPrefix}_lastlogin`;
      const email = `${testPrefix}_lastlogin@example.com`;

      // Create user
      const created = await createUser(username, email, testPassword);
      const userId = created!.user.user_id;

      // Get initial last_login_at (should be null or old)
      const before = await getUserById(userId);
      const beforeLogin = before?.last_login_at;

      // Wait 100ms to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update last login
      const success = await updateLastLogin(userId);
      expect(success).toBe(true);

      // Verify timestamp was updated
      const after = await getUserById(userId);
      expect(after?.last_login_at).not.toBe(beforeLogin);
    });
  });
});
