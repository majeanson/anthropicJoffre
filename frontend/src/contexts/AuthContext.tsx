/**
 * Authentication Context
 * Sprint 3 Phase 1
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, LoginData, RegisterData, ProfileUpdateData } from '../types/auth';
import { fetchWithCsrf, initializeCsrf, clearCsrfToken } from '../utils/csrf';
import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load access token from localStorage
  // Sprint 18: Refresh token now stored in httpOnly cookie (not localStorage)
  const getAccessToken = () => localStorage.getItem('access_token');
  const setAccessToken = (token: string) => {
    localStorage.setItem('access_token', token);
  };
  const clearTokens = () => {
    localStorage.removeItem('access_token');
    // Refresh token is in httpOnly cookie, cleared server-side on logout
  };

  // Fetch current user info
  const fetchCurrentUser = useCallback(async (isRetry = false) => {
    const token = getAccessToken();
    if (!token) {
      logger.debug('[Auth] No access token found, user is guest');
      setIsLoading(false);
      return;
    }

    try {
      logger.debug('[Auth] Fetching current user with token');
      const response = await fetch(API_ENDPOINTS.authProfile(), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include' // Ensure cookies are sent
      });

      if (!response.ok) {
        if (response.status === 401 && !isRetry) {
          // Token expired, try to refresh
          logger.debug('[Auth] Access token expired, attempting refresh');
          const refreshed = await refreshTokenInternal();
          if (refreshed) {
            // Retry with new token
            await fetchCurrentUser(true);
          }
          return;
        }
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      logger.debug('[Auth] User authenticated:', data.user?.username);
      setUser(data.user);
    } catch (err) {
      logger.error('[Auth] Error fetching current user', err);
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Internal refresh function (no circular dependency)
  const refreshTokenInternal = useCallback(async (): Promise<boolean> => {
    try {
      logger.debug('[Auth] Attempting to refresh access token');
      const response = await fetch(API_ENDPOINTS.authRefresh(), {
        method: 'POST',
        credentials: 'include', // Send httpOnly cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Security violation or invalid token
        const data = await response.json().catch(() => ({}));
        if (data.code === 'TOKEN_THEFT_DETECTED') {
          logger.warn('[Auth] Token theft detected! User must re-login', { code: data.code });
        }
        logger.debug('[Auth] Refresh failed:', { status: response.status, error: data.error || 'Unknown error' });
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      logger.debug('[Auth] Token refreshed successfully');
      setAccessToken(data.access_token);
      return true;
    } catch (err) {
      logger.error('[Auth] Refresh token error', err);
      clearTokens();
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Public refresh function that also fetches user
  const refreshToken = useCallback(async () => {
    const success = await refreshTokenInternal();
    if (success) {
      await fetchCurrentUser(true);
    }
    return success;
  }, [refreshTokenInternal, fetchCurrentUser]);

  // Login
  // Sprint 18: Refresh token in httpOnly cookie + CSRF protection
  const login = useCallback(async (data: LoginData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetchWithCsrf(API_ENDPOINTS.authLogin(), {
        method: 'POST',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Only store access token (refresh is in httpOnly cookie)
      setAccessToken(result.access_token);
      setUser(result.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  // Sprint 18: CSRF protection
  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetchWithCsrf(API_ENDPOINTS.authRegister(), {
        method: 'POST',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Registration successful, but user needs to verify email
      // Don't set user or tokens yet
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  // Sprint 18: Revoke refresh token on server + clear CSRF token
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    clearCsrfToken(); // Clear CSRF token cache

    // Call logout endpoint to revoke refresh token
    fetchWithCsrf(API_ENDPOINTS.authLogout(), {
      method: 'POST'
    }).catch(err => logger.error('Failed to revoke refresh token on logout', err));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get user profile
  const getUserProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(API_ENDPOINTS.authProfile(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      logger.error('Error fetching profile', err);
      return null;
    }
  }, []);

  // Update user profile
  // Sprint 18: CSRF protection
  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    try {
      const response = await fetchWithCsrf(API_ENDPOINTS.authProfile(), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update profile');
      }

      // Always refresh current user after profile update to show latest data
      await fetchCurrentUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  }, [fetchCurrentUser]);

  // Load user on mount and initialize CSRF
  // Sprint 18: Initialize CSRF token cache on app load
  useEffect(() => {
    // Initialize CSRF token in parallel with user fetch
    initializeCsrf().catch(err => logger.error('Failed to initialize CSRF token', err));

    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Auto-refresh token before expiry
  // Sprint 18: JWT expires in 1 hour, refresh 5 minutes before expiration
  useEffect(() => {
    if (!user) return;

    // Check token expiration and schedule refresh
    const scheduleRefresh = () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        // Decode JWT to get expiration time
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Refresh 5 minutes before expiration (or immediately if < 5 min left)
        const refreshIn = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

        const timeout = setTimeout(() => {
          refreshToken();
        }, refreshIn);

        return timeout;
      } catch (err) {
        return null;
      }
    };

    const timeout = scheduleRefresh();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [user, refreshToken]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    error,
    clearError,
    updateProfile,
    getUserProfile,
    getAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
