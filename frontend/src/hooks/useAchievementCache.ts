/**
 * Achievement Cache Hook
 *
 * Caches player achievements for efficient badge display during gameplay.
 * Achievements are fetched on-demand and cached for the session.
 */

import { useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { AchievementProgress } from '../types/achievements';

// Global cache for achievement data (persists across component mounts)
const achievementCache = new Map<
  string,
  {
    achievements: AchievementProgress[];
    topBadges: AchievementProgress[];
    timestamp: number;
  }
>();

// Cache expiry: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

export interface CachedAchievements {
  achievements: AchievementProgress[];
  topBadges: AchievementProgress[];
}

export function useAchievementCache(socket: Socket | null) {
  const pendingRequests = useRef(new Set<string>());

  /**
   * Get top 3 achievements for badge display
   * Prioritizes: Legendary > Epic > Rare > Common, then by unlock date
   */
  const getTopBadges = (achievements: AchievementProgress[]): AchievementProgress[] => {
    const unlocked = achievements.filter((a) => a.is_unlocked);

    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };

    return unlocked
      .sort((a, b) => {
        // Sort by rarity first
        const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
        if (rarityDiff !== 0) return rarityDiff;

        // Then by unlock date (most recent first)
        const aTime = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
        const bTime = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 3);
  };

  /**
   * Fetch achievements for a player (or return cached)
   */
  const fetchAchievements = useCallback(
    (playerName: string): Promise<CachedAchievements | null> => {
      return new Promise((resolve) => {
        // Check cache first
        const cached = achievementCache.get(playerName);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          resolve({ achievements: cached.achievements, topBadges: cached.topBadges });
          return;
        }

        // If no socket, return null
        if (!socket) {
          resolve(null);
          return;
        }

        // Prevent duplicate requests
        if (pendingRequests.current.has(playerName)) {
          // Wait a bit and check cache again
          setTimeout(() => {
            const rechecked = achievementCache.get(playerName);
            if (rechecked) {
              resolve({ achievements: rechecked.achievements, topBadges: rechecked.topBadges });
            } else {
              resolve(null);
            }
          }, 500);
          return;
        }

        pendingRequests.current.add(playerName);

        socket.emit(
          'get_player_achievements',
          { playerName },
          (response: {
            success: boolean;
            achievements?: AchievementProgress[];
            points?: number;
          }) => {
            pendingRequests.current.delete(playerName);

            if (response.success && response.achievements) {
              const topBadges = getTopBadges(response.achievements);
              const cacheEntry = {
                achievements: response.achievements,
                topBadges,
                timestamp: Date.now(),
              };
              achievementCache.set(playerName, cacheEntry);
              resolve({ achievements: response.achievements, topBadges });
            } else {
              resolve(null);
            }
          }
        );
      });
    },
    [socket]
  );

  /**
   * Get cached badges synchronously (returns empty if not cached)
   */
  const getCachedBadges = useCallback((playerName: string): AchievementProgress[] => {
    const cached = achievementCache.get(playerName);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.topBadges;
    }
    return [];
  }, []);

  /**
   * Update cache when achievements are viewed in profile
   */
  const updateCache = useCallback((playerName: string, achievements: AchievementProgress[]) => {
    const topBadges = getTopBadges(achievements);
    achievementCache.set(playerName, {
      achievements,
      topBadges,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    achievementCache.clear();
  }, []);

  return {
    fetchAchievements,
    getCachedBadges,
    updateCache,
    clearCache,
  };
}

/**
 * Rarity colors for achievement badges
 */
export const rarityColors = {
  common: 'var(--color-text-muted)',
  rare: 'var(--color-info)',
  epic: '#a855f7', // purple
  legendary: 'var(--color-warning)',
};

export const rarityGlow = {
  common: 'none',
  rare: '0 0 8px var(--color-info)',
  epic: '0 0 8px #a855f7',
  legendary: '0 0 12px var(--color-warning)',
};
