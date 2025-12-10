/**
 * PlayerProfileModal Types
 */

import { Socket } from 'socket.io-client';
import { AchievementProgress } from '../../types/achievements';

export interface QuickStats {
  player_name: string;
  games_played: number;
  games_won: number;
  win_percentage: number;
  elo_rating: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  total_xp?: number;
  current_level?: number;
  cosmetic_currency?: number;
  // Side bet stats
  side_bets_won?: number;
  side_bets_lost?: number;
  side_bets_coins_won?: number;
  side_bets_coins_lost?: number;
  current_bet_streak?: number;
  best_bet_streak?: number;
}

export interface UserProfile {
  bio: string | null;
  country: string | null;
  favorite_team: 1 | 2 | null;
  visibility: 'public' | 'friends_only' | 'private';
  show_online_status: boolean;
  allow_friend_requests: boolean;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedByThem: boolean;
}

export type FriendStatus = 'none' | 'pending' | 'friends';

export interface PlayerProfileModalProps {
  playerName: string;
  socket: Socket | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullStats?: () => void;
  onShowWhyRegister?: () => void;
}

// Sub-component props
export interface ProfileHeaderProps {
  playerName: string;
  stats: QuickStats;
}

export interface XPDisplayProps {
  totalXp: number;
}

export interface ProfileInfoProps {
  profile: UserProfile;
}

export interface QuickStatsGridProps {
  stats: QuickStats;
}

export interface SideBetsSectionProps {
  stats: QuickStats;
}

export interface AchievementsShowcaseProps {
  achievements: AchievementProgress[];
  achievementPoints: number;
}

export interface MutualFriendsSectionProps {
  mutualFriends: string[];
}

export interface ProfileActionsProps {
  isAuthenticated: boolean;
  isOwnProfile: boolean;
  friendStatus: FriendStatus;
  blockStatus: BlockStatus;
  sendingRequest: boolean;
  blockingInProgress: boolean;
  onSendFriendRequest: () => void;
  onRemoveFriend: () => void;
  onBlockPlayer: () => void;
  onUnblockPlayer: () => void;
  onViewFullStats?: () => void;
  onShowWhyRegister?: () => void;
  onClose: () => void;
}
