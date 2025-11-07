/**
 * Per-User Rate Limiting Utility
 *
 * Implements sliding window rate limiting per player name + IP combination.
 * Prevents abuse by limiting actions per user, not just per IP or socket.
 *
 * Sprint 2 Task #4: Enhanced rate limiting
 */

import { Socket } from 'socket.io';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
}

interface RateLimitEntry {
  timestamps: number[]; // Array of request timestamps
  warnings: number; // Warning count (for progressive throttling)
}

export class SlidingWindowRateLimiter {
  private limitsMap: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private name: string;

  constructor(config: RateLimitConfig, name: string = 'RateLimiter') {
    this.config = config;
    this.name = name;
  }

  /**
   * Generate unique key for player + IP combination
   */
  private getKey(playerName: string, ipAddress: string): string {
    return `${playerName}:${ipAddress}`;
  }

  /**
   * Clean up expired timestamps from entry
   */
  private cleanExpiredTimestamps(entry: RateLimitEntry, now: number): void {
    const cutoff = now - this.config.windowMs;
    entry.timestamps = entry.timestamps.filter(ts => ts > cutoff);
  }

  /**
   * Check if request is allowed under rate limit
   *
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  checkLimit(playerName: string, ipAddress: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    isWarning: boolean;
  } {
    const key = this.getKey(playerName, ipAddress);
    const now = Date.now();

    // Get or create entry
    let entry = this.limitsMap.get(key);
    if (!entry) {
      entry = { timestamps: [], warnings: 0 };
      this.limitsMap.set(key, entry);
    }

    // Clean up old timestamps
    this.cleanExpiredTimestamps(entry, now);

    // Check if under limit
    const currentCount = entry.timestamps.length;
    const remaining = Math.max(0, this.config.maxRequests - currentCount);
    const allowed = currentCount < this.config.maxRequests;

    // Calculate reset time (when oldest timestamp expires)
    const resetAt = entry.timestamps.length > 0
      ? entry.timestamps[0] + this.config.windowMs
      : now + this.config.windowMs;

    // Warning threshold (80% of limit)
    const warningThreshold = Math.floor(this.config.maxRequests * 0.8);
    const isWarning = currentCount >= warningThreshold;

    if (!allowed) {
      entry.warnings++;

      console.warn(`⚠️ Rate limit exceeded for ${playerName} (${ipAddress})`, {
        limiter: this.name,
        count: currentCount,
        max: this.config.maxRequests,
        warnings: entry.warnings,
        resetAt: new Date(resetAt).toISOString(),
      });
    }

    return { allowed, remaining, resetAt, isWarning };
  }

  /**
   * Record a request (consume rate limit)
   */
  recordRequest(playerName: string, ipAddress: string): void {
    const key = this.getKey(playerName, ipAddress);
    const now = Date.now();

    let entry = this.limitsMap.get(key);
    if (!entry) {
      entry = { timestamps: [], warnings: 0 };
      this.limitsMap.set(key, entry);
    }

    // Add current timestamp
    entry.timestamps.push(now);
  }

  /**
   * Get current usage stats for a player
   */
  getUsage(playerName: string, ipAddress: string): {
    current: number;
    max: number;
    remaining: number;
    resetAt: number;
  } {
    const key = this.getKey(playerName, ipAddress);
    const now = Date.now();

    const entry = this.limitsMap.get(key);
    if (!entry) {
      return {
        current: 0,
        max: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetAt: now + this.config.windowMs,
      };
    }

    this.cleanExpiredTimestamps(entry, now);

    const current = entry.timestamps.length;
    const remaining = Math.max(0, this.config.maxRequests - current);
    const resetAt = entry.timestamps.length > 0
      ? entry.timestamps[0] + this.config.windowMs
      : now + this.config.windowMs;

    return { current, max: this.config.maxRequests, remaining, resetAt };
  }

  /**
   * Reset rate limit for a player (e.g., after manual intervention)
   */
  reset(playerName: string, ipAddress: string): void {
    const key = this.getKey(playerName, ipAddress);
    this.limitsMap.delete(key);
  }

  /**
   * Get all active rate limits (for monitoring)
   */
  getAllActive(): Array<{
    playerName: string;
    ipAddress: string;
    current: number;
    max: number;
    warnings: number;
  }> {
    const now = Date.now();
    const active: Array<{
      playerName: string;
      ipAddress: string;
      current: number;
      max: number;
      warnings: number;
    }> = [];

    for (const [key, entry] of this.limitsMap.entries()) {
      this.cleanExpiredTimestamps(entry, now);

      if (entry.timestamps.length > 0) {
        const [playerName, ipAddress] = key.split(':');
        active.push({
          playerName,
          ipAddress,
          current: entry.timestamps.length,
          max: this.config.maxRequests,
          warnings: entry.warnings,
        });
      }
    }

    return active.sort((a, b) => b.current - a.current); // Sort by usage (highest first)
  }

  /**
   * Cleanup expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.limitsMap.entries()) {
      this.cleanExpiredTimestamps(entry, now);

      // Delete entries with no recent activity
      if (entry.timestamps.length === 0) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.limitsMap.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired rate limit entries`);
    }
  }
}

/**
 * Pre-configured rate limiters for different action types
 */
export const rateLimiters = {
  // Game actions (play card, place bet, etc.)
  gameActions: new SlidingWindowRateLimiter(
    { windowMs: 60000, maxRequests: 15 }, // 15 actions per minute
    'GameActions'
  ),

  // Chat messages
  chat: new SlidingWindowRateLimiter(
    { windowMs: 60000, maxRequests: 30 }, // 30 messages per minute
    'Chat'
  ),

  // Game creation
  gameCreation: new SlidingWindowRateLimiter(
    { windowMs: 3600000, maxRequests: 5 }, // 5 games per hour
    'GameCreation'
  ),

  // Team/position changes
  teamChanges: new SlidingWindowRateLimiter(
    { windowMs: 60000, maxRequests: 20 }, // 20 changes per minute
    'TeamChanges'
  ),
};

/**
 * Start periodic cleanup (run every 5 minutes)
 */
export function startRateLimiterCleanup(): NodeJS.Timeout {
  const interval = setInterval(() => {
    Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
  }, 5 * 60 * 1000); // 5 minutes

  return interval;
}

/**
 * Get IP address from socket
 */
export function getSocketIP(socket: Socket): string {
  // Try handshake first (most reliable)
  const handshakeIP = socket.handshake?.address;
  if (handshakeIP) return handshakeIP;

  // Fallback to remote address
  const remoteIP = socket.conn?.remoteAddress || socket.request?.connection?.remoteAddress;
  if (remoteIP) return remoteIP;

  // Last resort
  return 'unknown';
}
