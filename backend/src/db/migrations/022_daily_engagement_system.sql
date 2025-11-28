-- Migration 022: Daily Engagement System (Sprint 19)
-- Created: 2025-11-27
-- Purpose: Add daily quests, login streaks, and rewards calendar for player retention

-- ============================================================================
-- Daily Quest Templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS quest_templates (
  id SERIAL PRIMARY KEY,
  quest_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  quest_type VARCHAR(20) NOT NULL CHECK (quest_type IN ('easy', 'medium', 'hard')),
  objective_type VARCHAR(50) NOT NULL CHECK (objective_type IN ('wins', 'games_played', 'tricks_won', 'bets_made', 'special_cards', 'bet_amount', 'comeback')),
  target_value INTEGER NOT NULL,
  reward_xp INTEGER DEFAULT 10,
  reward_currency INTEGER DEFAULT 5,
  icon VARCHAR(10) DEFAULT '🎯',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default quest templates (10 quests for rotation)
INSERT INTO quest_templates (quest_key, name, description, quest_type, objective_type, target_value, reward_xp, reward_currency, icon) VALUES
  -- Easy quests (quick wins)
  ('play_3_games', 'Card Enthusiast', 'Play 3 games', 'easy', 'games_played', 3, 10, 5, '🎮'),
  ('win_1_game', 'First Victory', 'Win 1 game', 'easy', 'wins', 1, 15, 10, '🏆'),
  ('win_5_tricks', 'Trick Collector', 'Win 5 tricks in any game', 'easy', 'tricks_won', 5, 10, 5, '🃏'),

  -- Medium quests (moderate challenge)
  ('win_3_games', 'Triple Threat', 'Win 3 games', 'medium', 'wins', 3, 30, 20, '💪'),
  ('make_5_bets', 'Bold Bidder', 'Place 5 bets', 'medium', 'bets_made', 5, 25, 15, '🎲'),
  ('win_red_zero', 'Red Zero Hunter', 'Win a trick with Red 0 card', 'medium', 'special_cards', 1, 35, 25, '🔴'),
  ('win_brown_zero', 'Brown Zero Master', 'Use Brown 0 card defensively', 'medium', 'special_cards', 1, 35, 25, '🟤'),

  -- Hard quests (daily challenge)
  ('win_5_games', 'Champion of the Day', 'Win 5 games in one day', 'hard', 'wins', 5, 50, 40, '👑'),
  ('big_bet', 'High Roller', 'Make a bet of 11+ points and win', 'hard', 'bet_amount', 11, 45, 35, '💎'),
  ('comeback_win', 'Comeback Kid', 'Win after being behind by 10+ points', 'hard', 'comeback', 1, 60, 50, '🔥')
ON CONFLICT (quest_key) DO NOTHING;

-- ============================================================================
-- Player Daily Quests (assigned quests per player)
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_daily_quests (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  quest_template_id INTEGER REFERENCES quest_templates(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  date_assigned DATE DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP,
  reward_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  UNIQUE(player_name, quest_template_id, date_assigned)
);

-- Index for fast quest lookups
CREATE INDEX IF NOT EXISTS idx_player_quests_active
  ON player_daily_quests(player_name, date_assigned, completed);

-- ============================================================================
-- Login Streaks
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_streaks (
  player_name VARCHAR(255) PRIMARY KEY,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  last_login_date DATE DEFAULT CURRENT_DATE,
  streak_freeze_available BOOLEAN DEFAULT TRUE, -- Allow 1 missed day per week
  streak_freeze_used_at DATE,
  total_logins INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Daily Rewards Calendar (30-day progressive rewards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_rewards_calendar (
  id SERIAL PRIMARY KEY,
  day_number INTEGER UNIQUE NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('xp', 'currency', 'card_back', 'title', 'badge')),
  reward_amount INTEGER,
  reward_item_id INTEGER, -- References unlockables table for card backs/titles
  is_special BOOLEAN DEFAULT FALSE, -- Days 7, 14, 21, 30 are special
  icon VARCHAR(10) DEFAULT '🎁',
  description TEXT
);

-- Insert 30-day reward progression
INSERT INTO daily_rewards_calendar (day_number, reward_type, reward_amount, is_special, icon, description) VALUES
  -- Days 1-6: Basic rewards
  (1, 'xp', 10, FALSE, '⭐', '10 XP bonus'),
  (2, 'currency', 5, FALSE, '💰', '5 coins'),
  (3, 'xp', 15, FALSE, '⭐⭐', '15 XP bonus'),
  (4, 'currency', 10, FALSE, '💰', '10 coins'),
  (5, 'xp', 20, FALSE, '⭐⭐⭐', '20 XP bonus'),
  (6, 'currency', 15, FALSE, '💰', '15 coins'),

  -- Day 7: Special reward
  (7, 'currency', 50, TRUE, '🎁', '50 coins + special card back'),

  -- Days 8-13: Increasing rewards
  (8, 'xp', 25, FALSE, '⭐', '25 XP bonus'),
  (9, 'currency', 20, FALSE, '💰', '20 coins'),
  (10, 'xp', 30, FALSE, '⭐⭐', '30 XP bonus'),
  (11, 'currency', 25, FALSE, '💰', '25 coins'),
  (12, 'xp', 35, FALSE, '⭐⭐⭐', '35 XP bonus'),
  (13, 'currency', 30, FALSE, '💰', '30 coins'),

  -- Day 14: Special reward
  (14, 'currency', 100, TRUE, '🎁✨', '100 coins + title'),

  -- Days 15-20: Higher rewards
  (15, 'xp', 40, FALSE, '⭐', '40 XP bonus'),
  (16, 'currency', 35, FALSE, '💰', '35 coins'),
  (17, 'xp', 45, FALSE, '⭐⭐', '45 XP bonus'),
  (18, 'currency', 40, FALSE, '💰', '40 coins'),
  (19, 'xp', 50, FALSE, '⭐⭐⭐', '50 XP bonus'),
  (20, 'currency', 45, FALSE, '💰', '45 coins'),

  -- Day 21: Special reward
  (21, 'currency', 150, TRUE, '🎁💎', '150 coins + badge'),

  -- Days 22-29: Premium rewards
  (22, 'xp', 60, FALSE, '⭐', '60 XP bonus'),
  (23, 'currency', 50, FALSE, '💰', '50 coins'),
  (24, 'xp', 70, FALSE, '⭐⭐', '70 XP bonus'),
  (25, 'currency', 55, FALSE, '💰', '55 coins'),
  (26, 'xp', 80, FALSE, '⭐⭐⭐', '80 XP bonus'),
  (27, 'currency', 60, FALSE, '💰', '60 coins'),
  (28, 'xp', 90, FALSE, '⭐⭐⭐', '90 XP bonus'),
  (29, 'currency', 70, FALSE, '💰', '70 coins'),

  -- Day 30: Ultimate reward
  (30, 'currency', 500, TRUE, '🎁👑💎', '500 coins + exclusive card back + title')
ON CONFLICT (day_number) DO NOTHING;

-- ============================================================================
-- Player Calendar Progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_calendar_progress (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  current_day INTEGER DEFAULT 1 CHECK (current_day BETWEEN 1 AND 30),
  rewards_claimed INTEGER[] DEFAULT '{}', -- Array of day numbers claimed
  month_start_date DATE DEFAULT CURRENT_DATE,
  last_claimed_date DATE,
  calendar_resets INTEGER DEFAULT 0, -- Track how many times completed full 30 days
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_name, month_start_date)
);

-- Index for calendar lookups
CREATE INDEX IF NOT EXISTS idx_player_calendar_active
  ON player_calendar_progress(player_name, month_start_date);

-- ============================================================================
-- Player Progression (XP and Leveling System)
-- ============================================================================
-- Will be implemented in Sprint 20, but needs XP tracking from quests
DO $$
BEGIN
  -- Add XP columns to player_stats if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='player_stats' AND column_name='total_xp') THEN
    ALTER TABLE player_stats ADD COLUMN total_xp INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='player_stats' AND column_name='current_level') THEN
    ALTER TABLE player_stats ADD COLUMN current_level INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='player_stats' AND column_name='cosmetic_currency') THEN
    ALTER TABLE player_stats ADD COLUMN cosmetic_currency INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- Quest Progress Tracking Events
-- ============================================================================
-- Table to log quest progress events (for analytics and debugging)
CREATE TABLE IF NOT EXISTS quest_progress_events (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  quest_template_id INTEGER REFERENCES quest_templates(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'progress', 'completed', 'claimed'
  progress_delta INTEGER, -- How much progress was added
  game_id VARCHAR(255), -- Which game triggered this progress
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quest analytics
CREATE INDEX IF NOT EXISTS idx_quest_events_player
  ON quest_progress_events(player_name, created_at DESC);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to auto-assign daily quests to a player
CREATE OR REPLACE FUNCTION assign_daily_quests(p_player_name VARCHAR)
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
  existing_count INTEGER;
BEGIN
  -- Check if player already has quests for today
  SELECT COUNT(*) INTO existing_count
  FROM player_daily_quests
  WHERE player_name = p_player_name
    AND date_assigned = today;

  -- Only assign if no quests exist for today
  IF existing_count = 0 THEN
    -- Assign 3 quests: 1 easy, 1 medium, 1 hard
    INSERT INTO player_daily_quests (player_name, quest_template_id, date_assigned)
    SELECT p_player_name, id, today
    FROM quest_templates
    WHERE is_active = TRUE
      AND quest_type = 'easy'
    ORDER BY RANDOM()
    LIMIT 1;

    INSERT INTO player_daily_quests (player_name, quest_template_id, date_assigned)
    SELECT p_player_name, id, today
    FROM quest_templates
    WHERE is_active = TRUE
      AND quest_type = 'medium'
    ORDER BY RANDOM()
    LIMIT 1;

    INSERT INTO player_daily_quests (player_name, quest_template_id, date_assigned)
    SELECT p_player_name, id, today
    FROM quest_templates
    WHERE is_active = TRUE
      AND quest_type = 'hard'
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak(p_player_name VARCHAR)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER, freeze_used BOOLEAN) AS $$
DECLARE
  last_login DATE;
  curr_streak INTEGER;
  longest INTEGER;
  days_since_login INTEGER;
  freeze_available BOOLEAN;
  freeze_used_date DATE;
BEGIN
  -- Get or create streak record
  INSERT INTO login_streaks (player_name, last_login_date)
  VALUES (p_player_name, CURRENT_DATE)
  ON CONFLICT (player_name) DO NOTHING;

  -- Get current streak data
  SELECT ls.last_login_date, ls.current_streak, ls.longest_streak,
         ls.streak_freeze_available, ls.streak_freeze_used_at
  INTO last_login, curr_streak, longest, freeze_available, freeze_used_date
  FROM login_streaks ls
  WHERE ls.player_name = p_player_name;

  days_since_login := CURRENT_DATE - last_login;

  -- Update streak logic
  IF days_since_login = 0 THEN
    -- Same day login, no change
    NULL;
  ELSIF days_since_login = 1 THEN
    -- Consecutive day, increment streak
    curr_streak := curr_streak + 1;
    longest := GREATEST(longest, curr_streak);
  ELSIF days_since_login = 2 AND freeze_available THEN
    -- Missed 1 day but can use freeze
    freeze_available := FALSE;
    freeze_used_date := CURRENT_DATE;
    -- Streak continues
  ELSE
    -- Streak broken
    curr_streak := 1;
  END IF;

  -- Reset freeze weekly (every Sunday)
  IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN -- Sunday
    freeze_available := TRUE;
  END IF;

  -- Update streak record
  UPDATE login_streaks
  SET current_streak = curr_streak,
      longest_streak = longest,
      last_login_date = CURRENT_DATE,
      streak_freeze_available = freeze_available,
      streak_freeze_used_at = freeze_used_date,
      total_logins = total_logins + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE player_name = p_player_name;

  -- Return updated values
  RETURN QUERY
  SELECT curr_streak, longest, (days_since_login = 2 AND NOT freeze_available);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration adds:
-- - 10 quest templates (easy/medium/hard)
-- - Player quest tracking
-- - Login streak system with freeze mechanic
-- - 30-day reward calendar with special milestone rewards
-- - XP tracking for future leveling system (Sprint 20)
-- - Quest progress events for analytics
-- - Helper functions for quest assignment and streak updates
