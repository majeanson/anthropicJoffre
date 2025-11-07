/**
 * Socket.IO Rate Limiting Middleware
 *
 * Implements in-memory rate limiting for Socket.IO events to prevent abuse.
 * Tracks requests per socket ID and per event type.
 */

import { Socket } from 'socket.io';
import { RATE_LIMITS, GLOBAL_RATE_LIMIT, RateLimitConfig } from '../config/rateLimits';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit tracking
 * Structure: Map<socketId, Map<eventName, RateLimitEntry>>
 */
const rateLimitStore = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Global rate limit store (tracks total actions per socket)
 * Structure: Map<socketId, RateLimitEntry>
 */
const globalRateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup interval (remove expired entries every 5 minutes)
 */
setInterval(() => {
  const now = Date.now();

  // Clean up event-specific rate limits
  for (const [socketId, eventMap] of rateLimitStore.entries()) {
    for (const [eventName, entry] of eventMap.entries()) {
      if (now > entry.resetTime) {
        eventMap.delete(eventName);
      }
    }
    if (eventMap.size === 0) {
      rateLimitStore.delete(socketId);
    }
  }

  // Clean up global rate limits
  for (const [socketId, entry] of globalRateLimitStore.entries()) {
    if (now > entry.resetTime) {
      globalRateLimitStore.delete(socketId);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

/**
 * Check if a request should be rate limited
 */
function checkRateLimit(
  socketId: string,
  eventName: string,
  config: RateLimitConfig
): { limited: boolean; message?: string } {
  const now = Date.now();

  // Get or create socket's event map
  let eventMap = rateLimitStore.get(socketId);
  if (!eventMap) {
    eventMap = new Map();
    rateLimitStore.set(socketId, eventMap);
  }

  // Get or create rate limit entry for this event
  let entry = eventMap.get(eventName);
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    eventMap.set(eventName, entry);
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      limited: true,
      message: config.message || 'Rate limit exceeded. Please try again later.',
    };
  }

  return { limited: false };
}

/**
 * Check global rate limit (total actions per socket)
 */
function checkGlobalRateLimit(socketId: string): { limited: boolean; message?: string } {
  const now = Date.now();

  // Get or create global entry
  let entry = globalRateLimitStore.get(socketId);
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + GLOBAL_RATE_LIMIT.windowMs,
    };
    globalRateLimitStore.set(socketId, entry);
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > GLOBAL_RATE_LIMIT.maxRequests) {
    return {
      limited: true,
      message: GLOBAL_RATE_LIMIT.message || 'Too many actions. Please slow down.',
    };
  }

  return { limited: false };
}

/**
 * Rate limiting middleware for Socket.IO events
 *
 * Usage:
 * ```typescript
 * socket.on('create_game', rateLimitMiddleware('create_game', (playerName) => {
 *   // Handle create_game
 * }));
 * ```
 */
export function rateLimitMiddleware(eventName: string, handler: (...args: unknown[]) => void) {
  return function (this: Socket, ...args: unknown[]) {
    const socketId = this.id;

    // Check global rate limit first
    const globalCheck = checkGlobalRateLimit(socketId);
    if (globalCheck.limited) {
      this.emit('rate_limit_exceeded', {
        event: eventName,
        message: globalCheck.message,
        global: true,
      });
      return;
    }

    // Check event-specific rate limit
    const config = RATE_LIMITS[eventName];
    if (config) {
      const check = checkRateLimit(socketId, eventName, config);
      if (check.limited) {
        this.emit('rate_limit_exceeded', {
          event: eventName,
          message: check.message,
        });
        return;
      }
    }

    // Rate limit passed, execute handler
    handler.apply(this, args);
  };
}

/**
 * Get current rate limit status for a socket (useful for debugging)
 */
export function getRateLimitStatus(socketId: string): {
  events: Record<string, { count: number; limit: number; resetIn: number }>;
  global: { count: number; limit: number; resetIn: number };
} {
  const now = Date.now();
  const events: Record<string, { count: number; limit: number; resetIn: number }> = {};

  const eventMap = rateLimitStore.get(socketId);
  if (eventMap) {
    for (const [eventName, entry] of eventMap.entries()) {
      const config = RATE_LIMITS[eventName];
      if (config && now <= entry.resetTime) {
        events[eventName] = {
          count: entry.count,
          limit: config.maxRequests,
          resetIn: Math.ceil((entry.resetTime - now) / 1000), // seconds
        };
      }
    }
  }

  const globalEntry = globalRateLimitStore.get(socketId);
  const global = globalEntry && now <= globalEntry.resetTime
    ? {
        count: globalEntry.count,
        limit: GLOBAL_RATE_LIMIT.maxRequests,
        resetIn: Math.ceil((globalEntry.resetTime - now) / 1000),
      }
    : {
        count: 0,
        limit: GLOBAL_RATE_LIMIT.maxRequests,
        resetIn: 0,
      };

  return { events, global };
}

/**
 * Clear rate limits for a socket (useful when socket disconnects)
 */
export function clearRateLimits(socketId: string): void {
  rateLimitStore.delete(socketId);
  globalRateLimitStore.delete(socketId);
}

/**
 * Get statistics about rate limiting (for monitoring)
 */
export function getRateLimitStats(): {
  totalSockets: number;
  totalEvents: number;
  storeSize: number;
} {
  let totalEvents = 0;
  for (const eventMap of rateLimitStore.values()) {
    totalEvents += eventMap.size;
  }

  return {
    totalSockets: rateLimitStore.size,
    totalEvents,
    storeSize: rateLimitStore.size + globalRateLimitStore.size,
  };
}
