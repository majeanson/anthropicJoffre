-- Migration 024: Weekly Calendar System (Sprint 20)
-- Created: 2025-12-02
-- Purpose: Replace 30-day calendar with simpler 7-day weekly calendar (Mon-Sun)

-- ============================================================================
-- Drop old 30-day calendar tables (replaced by weekly system)
-- ============================================================================
DROP TABLE IF EXISTS player_calendar_progress CASCADE;
DROP TABLE IF EXISTS daily_rewards_calendar CASCADE;

-- ============================================================================
-- Weekly Rewards Calendar (7-day Mon-Sun cycle)
-- ============================================================================
CREATE TABLE weekly_rewards_calendar (
  day_number INTEGER PRIMARY KEY CHECK (day_number BETWEEN 1 AND 7),
  day_name VARCHAR(10) NOT NULL,
  reward_xp INTEGER DEFAULT 10,
  reward_currency INTEGER DEFAULT 5,
  is_special BOOLEAN DEFAULT FALSE,
  icon VARCHAR(10) DEFAULT '📅'
);

-- Insert 7-day weekly rewards (Sunday is the big day)
INSERT INTO weekly_rewards_calendar (day_number, day_name, reward_xp, reward_currency, is_special, icon) VALUES
  (1, 'Monday', 10, 5, FALSE, '📅'),
  (2, 'Tuesday', 15, 8, FALSE, '📅'),
  (3, 'Wednesday', 20, 10, FALSE, '📅'),
  (4, 'Thursday', 25, 12, FALSE, '📅'),
  (5, 'Friday', 30, 15, FALSE, '🎉'),
  (6, 'Saturday', 35, 20, FALSE, '🎉'),
  (7, 'Sunday', 50, 50, TRUE, '🏆')
ON CONFLICT (day_number) DO NOTHING;

-- ============================================================================
-- Player Weekly Progress
-- ============================================================================
CREATE TABLE player_weekly_progress (
  player_name VARCHAR(255) PRIMARY KEY,
  week_start_date DATE NOT NULL DEFAULT (DATE_TRUNC('week', CURRENT_DATE + INTERVAL '1 day')::DATE - INTERVAL '1 day')::DATE,
  days_claimed INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for weekly lookups
CREATE INDEX IF NOT EXISTS idx_player_weekly_progress
  ON player_weekly_progress(player_name, week_start_date);

-- ============================================================================
-- Skin Unlock Requirements
-- ============================================================================
CREATE TABLE skin_requirements (
  skin_id VARCHAR(50) PRIMARY KEY,
  required_level INTEGER DEFAULT 0,
  unlock_description VARCHAR(255),
  display_order INTEGER DEFAULT 0
);

-- Insert skin requirements (2 free, 5 locked behind levels)
INSERT INTO skin_requirements (skin_id, required_level, unlock_description, display_order) VALUES
  ('midnight-alchemy', 0, 'Default skin - Available to all players', 1),
  ('classic-parchment', 0, 'Default light skin - Available to all players', 2),
  ('modern-minimal', 3, 'Clean minimalist design - Reach level 3', 3),
  ('tavern-noir', 5, 'Dark moody candlelit atmosphere - Reach level 5', 4),
  ('modern-minimal-dark', 8, 'Clean dark interface - Reach level 8', 5),
  ('luxury-casino', 12, 'Sophisticated casino elegance - Reach level 12', 6),
  ('cyberpunk-neon', 15, 'High-contrast neon style - Reach level 15', 7)
ON CONFLICT (skin_id) DO NOTHING;

-- ============================================================================
-- Player Skin Unlocks (for tracking and achievements)
-- ============================================================================
CREATE TABLE player_skin_unlocks (
  player_name VARCHAR(255) NOT NULL,
  skin_id VARCHAR(50) NOT NULL REFERENCES skin_requirements(skin_id),
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_name, skin_id)
);

-- Index for unlock lookups
CREATE INDEX IF NOT EXISTS idx_player_skin_unlocks
  ON player_skin_unlocks(player_name);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get current week's Monday (ISO week starts Monday)
CREATE OR REPLACE FUNCTION get_week_monday(check_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Returns the Monday of the week for the given date
  RETURN check_date - ((EXTRACT(ISODOW FROM check_date) - 1) * INTERVAL '1 day')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get day number (1=Mon, 7=Sun) from a date
CREATE OR REPLACE FUNCTION get_day_of_week(check_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  -- Returns 1-7 where 1=Monday, 7=Sunday (ISO format)
  RETURN EXTRACT(ISODOW FROM check_date)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to claim weekly reward
CREATE OR REPLACE FUNCTION claim_weekly_reward(p_player_name VARCHAR, p_day_number INTEGER)
RETURNS TABLE(
  success BOOLEAN,
  reward_xp INTEGER,
  reward_currency INTEGER,
  message VARCHAR
) AS $$
DECLARE
  current_day INTEGER;
  week_monday DATE;
  claimed_days INTEGER[];
  r_xp INTEGER;
  r_currency INTEGER;
BEGIN
  -- Get current day of week
  current_day := get_day_of_week(CURRENT_DATE);
  week_monday := get_week_monday(CURRENT_DATE);

  -- Can only claim today's reward
  IF p_day_number != current_day THEN
    RETURN QUERY SELECT FALSE, 0, 0, 'Can only claim today''s reward'::VARCHAR;
    RETURN;
  END IF;

  -- Get or create player progress
  INSERT INTO player_weekly_progress (player_name, week_start_date, days_claimed)
  VALUES (p_player_name, week_monday, '{}')
  ON CONFLICT (player_name) DO UPDATE
  SET week_start_date = CASE
    WHEN player_weekly_progress.week_start_date < week_monday
    THEN week_monday
    ELSE player_weekly_progress.week_start_date
  END,
  days_claimed = CASE
    WHEN player_weekly_progress.week_start_date < week_monday
    THEN '{}' -- Reset for new week
    ELSE player_weekly_progress.days_claimed
  END,
  updated_at = CURRENT_TIMESTAMP;

  -- Get claimed days
  SELECT pwp.days_claimed INTO claimed_days
  FROM player_weekly_progress pwp
  WHERE pwp.player_name = p_player_name;

  -- Check if already claimed
  IF p_day_number = ANY(claimed_days) THEN
    RETURN QUERY SELECT FALSE, 0, 0, 'Already claimed today''s reward'::VARCHAR;
    RETURN;
  END IF;

  -- Get rewards
  SELECT wrc.reward_xp, wrc.reward_currency INTO r_xp, r_currency
  FROM weekly_rewards_calendar wrc
  WHERE wrc.day_number = p_day_number;

  -- Update player progress
  UPDATE player_weekly_progress
  SET days_claimed = days_claimed || p_day_number,
      updated_at = CURRENT_TIMESTAMP
  WHERE player_name = p_player_name;

  -- Award XP and currency to player stats
  UPDATE player_stats
  SET total_xp = total_xp + r_xp,
      cosmetic_currency = cosmetic_currency + r_currency
  WHERE player_name = p_player_name;

  RETURN QUERY SELECT TRUE, r_xp, r_currency, 'Reward claimed!'::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock skins based on player level
CREATE OR REPLACE FUNCTION check_skin_unlocks(p_player_name VARCHAR)
RETURNS TABLE(
  newly_unlocked VARCHAR[],
  player_level INTEGER
) AS $$
DECLARE
  p_level INTEGER;
  unlocked VARCHAR[];
  new_skins VARCHAR[];
BEGIN
  -- Get player level
  SELECT ps.current_level INTO p_level
  FROM player_stats ps
  WHERE ps.player_name = p_player_name;

  IF p_level IS NULL THEN
    p_level := 1;
  END IF;

  -- Get already unlocked skins
  SELECT ARRAY_AGG(skin_id) INTO unlocked
  FROM player_skin_unlocks
  WHERE player_name = p_player_name;

  IF unlocked IS NULL THEN
    unlocked := '{}';
  END IF;

  -- Find skins that should be unlocked but aren't
  SELECT ARRAY_AGG(sr.skin_id) INTO new_skins
  FROM skin_requirements sr
  WHERE sr.required_level <= p_level
    AND sr.skin_id != ALL(unlocked);

  -- Unlock new skins
  IF new_skins IS NOT NULL AND array_length(new_skins, 1) > 0 THEN
    INSERT INTO player_skin_unlocks (player_name, skin_id)
    SELECT p_player_name, unnest(new_skins)
    ON CONFLICT DO NOTHING;
  END IF;

  IF new_skins IS NULL THEN
    new_skins := '{}';
  END IF;

  RETURN QUERY SELECT new_skins, p_level;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration:
-- - Replaces 30-day calendar with 7-day weekly calendar (Mon-Sun)
-- - Sunday is the special big reward day
-- - Adds skin unlock requirements table
-- - Tracks player skin unlocks
-- - Auto-resets weekly progress each Monday
-- - No penalty for missed days (just skip them)
