/**
 * Authentication Types
 * Sprint 3 Phase 1
 */

export interface User {
  user_id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_banned: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds until access token expires
}

export interface PasswordReset {
  reset_id: number;
  user_id: number;
  reset_token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export interface EmailVerification {
  verification_id: number;
  user_id: number;
  verification_token: string;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginRequest {
  username: string; // Can also be email
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  reset_token: string;
  new_password: string;
}

export interface EmailVerifyRequest {
  verification_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface JWTPayload {
  user_id: number;
  username: string;
  type: 'access' | 'refresh';
  iat: number; // Issued at
  exp: number; // Expiration
}

/**
 * Express Request with authenticated user
 * Extends Express Request to include user property from JWT
 */
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}
