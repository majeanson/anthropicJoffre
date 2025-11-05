/**
 * Achievement System Types (Frontend)
 * Sprint 2 Phase 1
 */

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'gameplay' | 'social' | 'milestone' | 'special';

export interface Achievement {
  achievement_id: number;
  achievement_key: string;
  achievement_name: string;
  description: string;
  icon: string; // Emoji
  tier: AchievementTier;
  points: number;
  is_secret: boolean;
  category: AchievementCategory;
  created_at: Date;
}

export interface PlayerAchievement {
  id: number;
  player_name: string;
  achievement_id: number;
  unlocked_at: Date;
  progress: number;
  max_progress: number;
}

export interface AchievementProgress extends Achievement {
  progress: number;
  max_progress: number;
  is_unlocked: boolean;
  unlocked_at?: Date;
}

export interface AchievementUnlockNotification {
  playerName: string;
  achievement: Achievement;
  isNewUnlock: boolean;
}
