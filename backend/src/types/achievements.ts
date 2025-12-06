/**
 * Achievement System Types
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

export interface AchievementUnlockPayload {
  playerName: string;
  achievement: Achievement;
  isNewUnlock: boolean;
}

/**
 * Event data for different achievement triggers
 */
export interface GameWonEventData {
  wasComeback?: boolean;
  perfectGame?: boolean;
  winStreak?: number;
  // Sprint 21: Clean game tracking
  noBrownZeros?: boolean;
}

export interface BetWonEventData {
  hadTrump?: boolean;
  // Sprint 21: Track bet amount for max bet achievement
  betAmount?: number;
}

// Sprint 21: Red zero event data
export interface RedZeroEventData {
  redZerosThisRound?: number;
}

export interface GameEndData {
  won: boolean;
  brownZerosCollected: number;
  roundsAsLowestScorer: number;
  // Sprint 21: Secret achievement data
  lastCardSecuredVictory?: boolean;
  trumpCardsPlayedInRound?: number;
}

export type AchievementEventData = GameWonEventData | BetWonEventData | Record<string, never>;

// Achievement check context - data passed to achievement checkers
export interface AchievementCheckContext {
  playerName: string;
  gameId?: string;
  gameState?: import('./game').GameState;
  eventType: AchievementEventType;
  eventData?: AchievementEventData;
}

export type AchievementEventType =
  | 'game_won'
  | 'game_lost'
  | 'bet_won'
  | 'bet_lost'
  | 'red_zero_collected'
  | 'brown_zero_collected'
  | 'game_completed'
  | 'round_ended'
  | 'perfect_bet'
  | 'no_trump_bet_won';

// Result type for achievement checks
export interface AchievementCheckResult {
  unlocked: Achievement[];
  progress: Array<{
    achievement: Achievement;
    progress: number;
    max_progress: number;
  }>;
}
