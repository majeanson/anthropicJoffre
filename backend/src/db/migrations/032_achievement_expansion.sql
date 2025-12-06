-- Migration 032: Achievement Expansion
-- Sprint 21: Add 12 new achievements with skin unlock rewards

-- ============================================================================
-- NEW ACHIEVEMENTS
-- ============================================================================

-- Red Zero Collection Achievements
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('red_zero_50', 'Flame Collector', 'Collect 50 red zeros in total', '🔥', 'gold', 'gameplay', 50, false),
  ('red_zero_100', 'Inferno Master', 'Collect 100 red zeros in total', '🌋', 'platinum', 'gameplay', 100, false),
  ('double_red_zero', 'Double Flame', 'Collect 2 red zeros in a single round', '🔥🔥', 'silver', 'gameplay', 30, false)
ON CONFLICT (achievement_key) DO NOTHING;

-- Brown Zero Avoidance Achievements
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('no_brown_10', 'Curse Dodger', 'Win 10 games without collecting any brown zeros', '🛡️', 'gold', 'gameplay', 60, false),
  ('no_brown_streak', 'Untouchable', 'Win 5 consecutive games without any brown zeros', '✨', 'platinum', 'gameplay', 90, false)
ON CONFLICT (achievement_key) DO NOTHING;

-- Betting Excellence Achievements
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('perfect_bets_5', 'Oracle', 'Win 5 bets with exact point prediction', '🔮', 'gold', 'gameplay', 50, false),
  ('bet_12_won', 'Maximum Confidence', 'Win a 12-point bet', '💯', 'gold', 'gameplay', 60, false)
ON CONFLICT (achievement_key) DO NOTHING;

-- Milestone Achievements
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('games_played_100', 'Veteran', 'Play 100 games', '🎖️', 'gold', 'milestone', 50, false),
  ('win_streak_10', 'Unstoppable Force', 'Win 10 games in a row', '⚡', 'platinum', 'milestone', 100, false)
ON CONFLICT (achievement_key) DO NOTHING;

-- Secret Achievements (hidden until unlocked)
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('last_card_wins', 'Clutch Master', 'Win the final trick of a game with your last card, securing victory', '🎯', 'platinum', 'special', 80, true),
  ('comeback_30', 'Legendary Comeback', 'Win a game after being down by 30+ points', '🦸', 'platinum', 'special', 100, true),
  ('all_trump_round', 'Trump Emperor', 'Play all 4 trump cards in a single round', '👑', 'platinum', 'special', 90, true)
ON CONFLICT (achievement_key) DO NOTHING;

-- ============================================================================
-- ACHIEVEMENT → SKIN UNLOCKS TABLE
-- ============================================================================

-- Create table to link achievements to skin rewards
CREATE TABLE IF NOT EXISTS achievement_skin_unlocks (
  achievement_key VARCHAR(50) NOT NULL,
  skin_id VARCHAR(50) NOT NULL,
  skin_type VARCHAR(20) NOT NULL CHECK (skin_type IN ('special', 'card', 'ui')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (achievement_key, skin_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_achievement_skin_unlocks_key ON achievement_skin_unlocks(achievement_key);
CREATE INDEX IF NOT EXISTS idx_achievement_skin_unlocks_skin ON achievement_skin_unlocks(skin_id);

-- ============================================================================
-- LINK ACHIEVEMENTS TO SPECIAL CARD SKINS
-- ============================================================================

-- Red Zero Skins from achievements
INSERT INTO achievement_skin_unlocks (achievement_key, skin_id, skin_type) VALUES
  ('red_zero_hunter', 'red_zero_phoenix', 'special'),    -- Phoenix Rising (20 red zeros)
  ('games_won_100', 'red_zero_sun', 'special'),          -- Solar Flare (100 wins - existing achievement)
  ('red_zero_100', 'red_zero_dragon', 'special')         -- Dragon Heart (100 red zeros - new achievement)
ON CONFLICT (achievement_key, skin_id) DO NOTHING;

-- Brown Zero Skins from achievements
INSERT INTO achievement_skin_unlocks (achievement_key, skin_id, skin_type) VALUES
  ('no_brown_10', 'brown_zero_skull', 'special'),        -- Memento Mori (10 clean wins)
  ('perfect_game', 'brown_zero_void', 'special')         -- Void Walker (perfect game - existing achievement)
ON CONFLICT (achievement_key, skin_id) DO NOTHING;

-- Card Skins from achievements (if any)
INSERT INTO achievement_skin_unlocks (achievement_key, skin_id, skin_type) VALUES
  ('red_zero_50', 'elemental', 'card')                   -- Elemental card skin (50 red zeros)
ON CONFLICT (achievement_key, skin_id) DO NOTHING;

-- ============================================================================
-- ADD TRACKING COLUMNS TO PLAYER_STATS
-- ============================================================================

-- Add columns for new achievement tracking if they don't exist
DO $$
BEGIN
  -- Perfect bets counter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'perfect_bets_won'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN perfect_bets_won INTEGER DEFAULT 0;
  END IF;

  -- Clean games won (no brown zeros)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'clean_games_won'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN clean_games_won INTEGER DEFAULT 0;
  END IF;

  -- Clean game streak (consecutive wins without brown zeros)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'clean_game_streak'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN clean_game_streak INTEGER DEFAULT 0;
  END IF;

  -- Max bet amount won
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'max_bet_won'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN max_bet_won INTEGER DEFAULT 0;
  END IF;

  -- Double red zeros in a round
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'double_red_zeros'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN double_red_zeros INTEGER DEFAULT 0;
  END IF;
END $$;
