/**
 * Centralized Configuration Constants
 *
 * Single source of truth for all app-wide configuration.
 * Environment variables take precedence over defaults.
 */

// API and Socket URLs
export const CONFIG = {
  // Base URLs
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',

  // WebSocket Configuration
  WS_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_DELAY: 1000, // ms
  WS_TIMEOUT: 10000, // ms

  // Game Configuration
  MAX_CHAT_MESSAGE_LENGTH: 200,
  GAME_TIMEOUT_MS: 60000, // 60 seconds
  TRICK_DISPLAY_DURATION: 3000, // ms

  // Limits
  MAX_PLAYERS: 4,
  MIN_BET: 7,
  MAX_BET: 12,
  WINNING_SCORE: 41,

  // UI Configuration
  TOAST_DURATION: 3000, // ms
  DEBOUNCE_DELAY: 300, // ms
  ANIMATION_DURATION: 300, // ms
} as const;

// Environment check helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// API endpoint builders
export const API_ENDPOINTS = {
  // Health & Status
  health: () => `${CONFIG.API_BASE_URL}/api/health`,

  // Games
  gamesLobby: () => `${CONFIG.API_BASE_URL}/api/games/lobby`,
  gameDetails: (gameId: string) => `${CONFIG.API_BASE_URL}/api/games/${gameId}`,
  recentGames: () => `${CONFIG.API_BASE_URL}/api/games/recent`,

  // Stats & Leaderboard
  leaderboard: (params?: { limit?: number; excludeBots?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.excludeBots) query.append('excludeBots', 'true');
    const queryString = query.toString();
    return `${CONFIG.API_BASE_URL}/api/leaderboard${queryString ? `?${queryString}` : ''}`;
  },
  playerStats: (playerName: string) => `${CONFIG.API_BASE_URL}/api/stats/${encodeURIComponent(playerName)}`,
  playerHistory: (playerName: string) => `${CONFIG.API_BASE_URL}/api/player-history/${encodeURIComponent(playerName)}`,

  // Auth
  authRegister: () => `${CONFIG.API_BASE_URL}/api/auth/register`,
  authLogin: () => `${CONFIG.API_BASE_URL}/api/auth/login`,
  authLogout: () => `${CONFIG.API_BASE_URL}/api/auth/logout`,
  authVerifyEmail: (token: string) => `${CONFIG.API_BASE_URL}/api/auth/verify-email?token=${token}`,
  authForgotPassword: () => `${CONFIG.API_BASE_URL}/api/auth/forgot-password`,
  authResetPassword: (token: string) => `${CONFIG.API_BASE_URL}/api/auth/reset-password?token=${token}`,
  authRefresh: () => `${CONFIG.API_BASE_URL}/api/auth/refresh`,
  authProfile: () => `${CONFIG.API_BASE_URL}/api/auth/me`,

  // CSRF
  csrfToken: () => `${CONFIG.API_BASE_URL}/api/csrf-token`,

  // Admin/Debug (development only)
  debugCleanup: () => `${CONFIG.API_BASE_URL}/api/debug/cleanup`,
  debugReset: () => `${CONFIG.API_BASE_URL}/api/debug/reset`,
} as const;

// Type exports for type safety
export type ApiEndpoint = keyof typeof API_ENDPOINTS;
