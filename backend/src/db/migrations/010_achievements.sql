-- Migration 010: Achievement System
-- Sprint 2 Phase 1: Add achievement tracking for players

-- Achievements table: Stores all available achievements
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id SERIAL PRIMARY KEY,
  achievement_key VARCHAR(50) UNIQUE NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL, -- Emoji icon
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points INTEGER DEFAULT 10,
  is_secret BOOLEAN DEFAULT FALSE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('gameplay', 'social', 'milestone', 'special')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player achievements table: Tracks which players have unlocked which achievements
CREATE TABLE IF NOT EXISTS player_achievements (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  achievement_id INTEGER REFERENCES achievements(achievement_id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INTEGER DEFAULT 0, -- For incremental achievements (e.g., "win 10 games")
  max_progress INTEGER DEFAULT 1, -- Max progress needed to unlock
  UNIQUE(player_name, achievement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements(player_name);
CREATE INDEX IF NOT EXISTS idx_player_achievements_unlocked ON player_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON achievements(tier);

-- Seed initial achievements
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  -- Bronze tier (10-15 points)
  ('first_win', 'First Victory', 'Win your first game', '🏆', 'bronze', 'milestone', 10, false),
  ('games_played_10', 'Dedicated Player', 'Play 10 games', '🎮', 'bronze', 'milestone', 10, false),
  ('first_bet_won', 'Lucky Bettor', 'Win your first bet', '🎲', 'bronze', 'gameplay', 10, false),

  -- Silver tier (20-30 points)
  ('perfect_bet', 'Perfect Prediction', 'Win a bet with exact points predicted', '🎯', 'silver', 'gameplay', 25, false),
  ('games_won_10', 'Rising Champion', 'Win 10 games', '⭐', 'silver', 'milestone', 25, false),
  ('red_zero_hunter', 'Red Zero Hunter', 'Collect 20 red zeros in total', '🔴', 'silver', 'gameplay', 30, false),
  ('trump_master', 'Trump Master', 'Win 5 bets with trump', '♠️', 'silver', 'gameplay', 20, false),

  -- Gold tier (40-60 points)
  ('no_trump_master', 'No Trump Master', 'Win 10 no-trump bets', '👑', 'gold', 'gameplay', 50, false),
  ('win_streak_5', 'Unstoppable', 'Win 5 games in a row', '🔥', 'gold', 'milestone', 50, false),
  ('games_won_50', 'Veteran Champion', 'Win 50 games', '🎖️', 'gold', 'milestone', 60, false),

  -- Platinum tier (80-100 points)
  ('comeback_king', 'Comeback King', 'Win a game after being down 30+ points', '💪', 'platinum', 'gameplay', 100, false),
  ('perfect_game', 'Flawless Victory', 'Win a game without losing a single bet', '💎', 'platinum', 'gameplay', 80, false),
  ('games_won_100', 'Legendary Master', 'Win 100 games', '👑', 'platinum', 'milestone', 100, false),

  -- Secret achievements
  ('brown_zero_avoider', 'Brown Zero Avoider', 'Win a game without collecting any brown zeros', '🚫', 'gold', 'special', 50, true),
  ('underdog_victory', 'Underdog Victory', 'Win a game after being the lowest scorer for 3+ rounds', '🐕', 'platinum', 'special', 90, true)
ON CONFLICT (achievement_key) DO NOTHING;

-- Add achievement points column to player_stats if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'achievement_points'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN achievement_points INTEGER DEFAULT 0;
  END IF;
END $$;
