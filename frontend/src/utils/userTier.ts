/**
 * User Tier System
 *
 * Defines 3 tiers of users with different permissions:
 * 1. GUEST - No localStorage name, can only spectate
 * 2. LOCAL - Has localStorage name but not authenticated, can play casual games
 * 3. AUTHENTICATED - Registered and logged in, has full access
 */

import { User } from '../types/auth';

export type UserTier = 'guest' | 'local' | 'authenticated';

export interface UserTierInfo {
  tier: UserTier;
  canCreateGame: boolean;
  canPlayRanked: boolean;
  canTrackStats: boolean;
  canSpectate: boolean;
  displayName: string | null;
}

/**
 * Determine user tier based on auth state and localStorage
 */
export function getUserTier(user: User | null, playerName: string): UserTier {
  if (user) {
    return 'authenticated';
  }

  // Check if they have a stored player name
  const storedName = playerName || localStorage.getItem('playerName');
  if (storedName && storedName.trim()) {
    return 'local';
  }

  return 'guest';
}

/**
 * Get full tier info including permissions
 */
export function getUserTierInfo(user: User | null, playerName: string): UserTierInfo {
  const tier = getUserTier(user, playerName);

  switch (tier) {
    case 'authenticated':
      return {
        tier: 'authenticated',
        canCreateGame: true,
        canPlayRanked: true,
        canTrackStats: true,
        canSpectate: true,
        displayName: user?.display_name || user?.username || null,
      };

    case 'local':
      return {
        tier: 'local',
        canCreateGame: true,
        canPlayRanked: false, // Can only play casual
        canTrackStats: false, // No stats for localStorage players
        canSpectate: true,
        displayName: playerName || localStorage.getItem('playerName'),
      };

    case 'guest':
    default:
      return {
        tier: 'guest',
        canCreateGame: false, // Guests cannot create games
        canPlayRanked: false,
        canTrackStats: false,
        canSpectate: true, // Guests can spectate
        displayName: null,
      };
  }
}

/**
 * Get a user-friendly message about what they need to do for a feature
 */
export function getUpgradeMessage(tier: UserTier, feature: string): string {
  switch (tier) {
    case 'guest':
      return `Enter a player name to ${feature}, or register for full access.`;
    case 'local':
      return `Register an account to ${feature} and track your stats.`;
    case 'authenticated':
      return ''; // No upgrade needed
    default:
      return '';
  }
}
