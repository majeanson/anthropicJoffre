/**
 * Centralized Error Messages
 * Week 2 Task 9: Standardize error messages across frontend
 *
 * Benefits:
 * - Consistent user-facing error messages
 * - Easy to update error text in one place
 * - Reduces duplication
 * - Facilitates i18n/localization in the future
 */

export const ERROR_MESSAGES = {
  // Network & Connection
  CONNECTION_FAILED: 'Cannot connect to server. Is the backend running?',
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  SERVER_UNAVAILABLE: 'The server may be temporarily unavailable.',
  SOCKET_NOT_CONNECTED: 'Socket not connected. Cannot communicate with server.',

  // Data Loading
  FETCH_FAILED: 'Failed to fetch data from server',
  LOAD_FAILED: 'Failed to load',
  HEALTH_CHECK_FAILED: 'Failed to fetch health data',
  HEALTH_CHECK_UNAVAILABLE: 'Unable to fetch server health',

  // Game-specific
  GAMES_LOAD_FAILED: 'Failed to load games',
  ACTIVE_GAMES_LOAD_FAILED: 'Failed to load active games',
  RECENT_GAMES_LOAD_FAILED: 'Failed to load recent games',
  GAME_REPLAY_FAILED: 'Failed to load game replay',
  REPLAY_UNAVAILABLE: 'Failed to load replay',
  REPLAY_CORRUPTED:
    'Failed to load or play the game replay. The replay data may be corrupted or unavailable.',

  // Player & Profile
  PLAYER_STATS_FAILED: 'Failed to load player statistics',
  PLAYER_PROFILE_FAILED: 'Failed to load player profile',
  PROFILE_DATA_FAILED: 'Failed to load profile data',
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  PROFILE_FETCH_FAILED: 'Failed to fetch profile',
  GAME_HISTORY_FAILED: 'Failed to load game history',
  STATS_UNAVAILABLE: 'Failed to load player statistics. The data may be temporarily unavailable.',

  // Authentication
  PASSWORD_RESET_FAILED: 'Failed to request password reset',

  // Generic
  UNKNOWN_ERROR: 'Unknown error',
  OPERATION_FAILED: 'Operation failed',

  // Clipboard
  COPY_FAILED: 'Failed to copy link',

  // Database
  CLEANUP_FAILED: 'Failed to run cleanup',

  // Lobby
  LOBBY_LOAD_FAILED: 'Failed to load the game lobby. The server may be temporarily unavailable.',
} as const;

// Type-safe error message keys
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Get error message from Error object or string
 * Provides fallback to unknown error
 */
export function getErrorMessage(
  error: unknown,
  fallback: ErrorMessageKey = 'UNKNOWN_ERROR'
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES[fallback];
}

/**
 * Format error message with additional context
 */
export function formatErrorMessage(messageKey: ErrorMessageKey, context?: string): string {
  const baseMessage = ERROR_MESSAGES[messageKey];
  return context ? `${baseMessage}: ${context}` : baseMessage;
}
