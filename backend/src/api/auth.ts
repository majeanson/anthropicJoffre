/**
 * Authentication REST API Endpoints
 * Sprint 3 Phase 1
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateLastLogin,
  verifyUserEmail,
  createPasswordReset,
  resetPassword,
  usernameExists,
  emailExists,
  linkPlayerToUser
} from '../db/users';
import {
  comparePassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  validatePassword,
  validateUsername,
  validateEmail,
  sanitizeDisplayName
} from '../utils/authHelpers';
import {
  RegisterRequest,
  LoginRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerifyRequest,
  RefreshTokenRequest
} from '../types/auth';

const router = Router();

// Rate limiting: 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { username, email, password, display_name }: RegisterRequest = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if username exists
    if (await usernameExists(username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Check if email exists
    if (await emailExists(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Sanitize display name
    const displayName = display_name ? sanitizeDisplayName(display_name) : username;

    // Create user and get verification token
    const result = await createUser(username, email, password, displayName);

    if (!result || !result.user) {
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    const { user, verificationToken } = result;

    // Return user info (without sensitive data)
    // In development, include verification token for testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const emailServiceConfigured = !!process.env.RESEND_API_KEY;

    const message = user.is_verified
      ? 'Account created successfully. You can now log in.'
      : 'Account created successfully. Please check your email to verify your account.';

    return res.status(201).json({
      message,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        is_verified: user.is_verified
      },
      // Only include token in development for manual testing
      ...(isDevelopment && !emailServiceConfigured && { verificationToken })
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Try to find user by username or email
    let user = await getUserByUsername(username);
    if (!user) {
      user = await getUserByEmail(username);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({ error: 'Account has been banned' });
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    // Update last login
    await updateLastLogin(user.user_id);

    // Generate tokens
    const tokens = generateTokens(user.user_id, user.username);

    // Return user info and tokens
    return res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified
      },
      tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token }: RefreshTokenRequest = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refresh_token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user to ensure they still exist and aren't banned
    const user = await getUserById(payload.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account has been banned' });
    }

    // Generate new tokens
    const tokens = generateTokens(user.user_id, user.username);

    return res.status(200).json({
      message: 'Token refreshed successfully',
      tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { verification_token }: EmailVerifyRequest = req.body;

    if (!verification_token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await verifyUserEmail(verification_token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    return res.status(200).json({
      message: 'Email verified successfully',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/request-password-reset
 * Request password reset email
 */
router.post('/request-password-reset', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email }: PasswordResetRequest = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always return success even if email doesn't exist (security)
    await createPasswordReset(email);

    return res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { reset_token, new_password }: PasswordResetConfirm = req.body;

    if (!reset_token || !new_password) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    // Validate new password
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const success = await resetPassword(reset_token, new_password);

    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    return res.status(200).json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user
    const user = await getUserById(payload.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account has been banned' });
    }

    return res.status(200).json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        created_at: user.created_at,
        last_login_at: user.last_login_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, placeholder for future session management)
 */
router.post('/logout', async (req: Request, res: Response) => {
  // In a JWT-based system, logout is primarily client-side
  // Future enhancement: Add token blacklisting or session management
  return res.status(200).json({ message: 'Logout successful' });
});

export default router;
