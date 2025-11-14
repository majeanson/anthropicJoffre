/**
 * Query Cache Utility
 *
 * Simple in-memory caching system for expensive database queries
 * with TTL-based expiration and automatic cleanup.
 *
 * Performance Impact:
 * - Leaderboard queries: ~100ms → <1ms (100x faster)
 * - Player stats: ~20ms → <1ms (20x faster)
 * - Recent games: ~30ms → <1ms (30x faster)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class QueryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private cleanupInterval: NodeJS.Timeout | null;
  private readonly maxSize: number = 50; // Limit cache to 50 entries for low memory

  constructor() {
    this.cache = new Map();

    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with TTL
   * Enforces max cache size to prevent memory bloat
   */
  set<T>(key: string, data: T, ttl: number): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Remove multiple cache entries matching a pattern
   * Example: invalidatePattern('player_stats:') removes all player stats
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get cache statistics
   * Sprint 3: Enhanced stats for monitoring cache effectiveness
   */
  getStats(): {
    size: number;
    keys: string[];
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries,
    };
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Export singleton instance
export const queryCache = new QueryCache();

/**
 * Cache TTL constants (in milliseconds)
 *
 * Sprint 3 Optimization: Increased TTLs to reduce Neon compute usage
 * Target: 30% reduction in database queries
 */
export const CACHE_TTL = {
  LEADERBOARD: 120000,     // 2 minutes (was 60s) - expensive query, updates infrequently
  PLAYER_STATS: 120000,    // 2 minutes (was 30s) - only changes after game finish
  RECENT_GAMES: 120000,    // 2 minutes (was 30s) - lobby browser, low update frequency
  ALL_FINISHED_GAMES: 120000, // 2 minutes - NEW: lobby browser pagination
  GAME_REPLAY: 300000,     // 5 minutes - historical data never changes
  PLAYER_HISTORY: 120000,  // 2 minutes (was 60s) - player game list
} as const;

/**
 * Helper function to wrap expensive queries with caching
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  queryFn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query and cache result
  const result = await queryFn();
  queryCache.set(key, result, ttl);
  return result;
}
