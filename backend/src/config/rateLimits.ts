/**
 * Rate Limiting Configuration
 *
 * Defines rate limits for different Socket.IO events to prevent abuse
 * and ensure fair resource usage.
 */

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  message?: string;  // Error message when limit exceeded
}

/**
 * Rate limits for different event types
 *
 * Philosophy:
 * - Game creation: Low limit (prevent spam lobbies)
 * - Join actions: Medium limit (allow some retries)
 * - Gameplay actions: High limit (fast-paced game needs responsiveness)
 * - Chat: Medium limit (prevent spam but allow conversation)
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Game Management (per IP) - Increased limits
  create_game: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15, // Increased from 5
    message: 'Too many games created. Please wait before creating another.',
  },

  join_game: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // Increased from 10
    message: 'Too many join attempts. Please wait before trying again.',
  },

  spectate_game: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // Increased from 10
    message: 'Too many spectate attempts. Please wait.',
  },

  // Team Selection (per socket) - Increased limits
  select_team: {
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 50, // Increased from 20
    message: 'Too many team changes. Please slow down.',
  },

  swap_position: {
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 50, // Increased from 20
    message: 'Too many position swaps. Please slow down.',
  },

  // Gameplay Actions (per socket - need to be very responsive)
  place_bet: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // Increased from 30
    message: 'Too many betting actions. Please wait.',
  },

  play_card: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 150, // Increased from 50
    message: 'Too many card plays. Please slow down.',
  },

  // Chat (per socket) - Increased limits
  send_team_selection_chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // Increased from 20
    message: 'Too many chat messages. Please slow down.',
  },

  send_game_chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // Increased from 20
    message: 'Too many chat messages. Please slow down.',
  },

  // Game Control - Increased limits
  start_game: {
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 20, // Increased from 10
    message: 'Too many start game attempts.',
  },

  kick_player: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15, // Increased from 5
    message: 'Too many kick attempts. Please wait.',
  },

  vote_rematch: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15, // Increased from 5
    message: 'Too many rematch votes.',
  },

  // Database Queries (per socket) - Increased limits
  get_player_stats: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // Increased from 30
    message: 'Too many stats requests.',
  },

  get_leaderboard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // Increased from 30
    message: 'Too many leaderboard requests.',
  },

  get_player_history: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 40, // Increased from 20
    message: 'Too many history requests.',
  },

  // Session Management - Increased limits
  reconnect_to_game: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // Increased from 20
    message: 'Too many reconnection attempts.',
  },
};

/**
 * Global rate limit for all events (per socket)
 * Acts as a final safeguard against any type of abuse
 */
export const GLOBAL_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 500, // Increased from 200 - 500 total actions per minute per socket
  message: 'Too many actions. Please slow down.',
};

/**
 * Rate limit for HTTP endpoints (per IP)
 */
export const HTTP_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Increased from 1000 - 3000 requests per window per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
};
