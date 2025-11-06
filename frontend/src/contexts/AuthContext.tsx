/**
 * Authentication Context
 * Sprint 3 Phase 1
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthTokens, AuthContextType, LoginData, RegisterData, ProfileUpdateData } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load tokens from localStorage
  const getAccessToken = () => localStorage.getItem('access_token');
  const getRefreshToken = () => localStorage.getItem('refresh_token');
  const setTokens = (tokens: AuthTokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  };
  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  // Fetch current user info
  const fetchCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await refreshToken();
          return;
        }
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching current user:', err);
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh access token
  const refreshToken = useCallback(async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refresh })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      setTokens(data.tokens);

      // Fetch user info with new token
      await fetchCurrentUser();
    } catch (err) {
      console.error('Error refreshing token:', err);
      clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  // Login
  const login = useCallback(async (data: LoginData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      setTokens(result.tokens);
      setUser(result.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Registration successful, but user needs to verify email
      // Don't set user or tokens yet
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);

    // Optional: Call logout endpoint
    fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST'
    }).catch(console.error);
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
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
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
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update profile');
      }

      // If avatar was updated, refresh current user
      if (data.avatar_id) {
        await fetchCurrentUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  }, [fetchCurrentUser]);

  // Load user on mount
  useEffect(() => {
    console.log('[AuthContext] Initial load - fetching current user');
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Auto-refresh token before expiry (every 10 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
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
