-- Migration 033: Login Streak Achievements
-- Sprint 21: Add achievements for login streak milestones and enhanced celebration

-- ============================================================================
-- LOGIN STREAK ACHIEVEMENTS
-- ============================================================================

-- Daily Login Streak Achievements
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('login_streak_3', 'Committed Player', 'Maintain a 3-day login streak', '🌟', 'bronze', 'milestone', 15, false),
  ('login_streak_7', 'Weekly Warrior', 'Maintain a 7-day login streak', '🔥', 'silver', 'milestone', 30, false),
  ('login_streak_14', 'Fortnight Fighter', 'Maintain a 14-day login streak', '💪', 'gold', 'milestone', 60, false),
  ('login_streak_30', 'Monthly Master', 'Maintain a 30-day login streak', '👑', 'platinum', 'milestone', 120, false)
ON CONFLICT (achievement_key) DO NOTHING;

-- Total Logins Achievement
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('total_logins_50', 'Regular Visitor', 'Log in 50 times total', '📅', 'silver', 'milestone', 25, false),
  ('total_logins_100', 'Dedicated Player', 'Log in 100 times total', '🏠', 'gold', 'milestone', 50, false),
  ('total_logins_365', 'Year-Round Player', 'Log in 365 times total', '🎂', 'platinum', 'milestone', 150, false)
ON CONFLICT (achievement_key) DO NOTHING;

-- Secret Login Achievement
INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('login_streak_freeze_save', 'Saved by the Bell', 'Have your streak saved by the freeze mechanic', '🛡️', 'bronze', 'special', 10, true)
ON CONFLICT (achievement_key) DO NOTHING;

-- ============================================================================
-- LINK LOGIN STREAK ACHIEVEMENTS TO SKIN REWARDS
-- ============================================================================

-- Weekly streak unlocks a UI skin
INSERT INTO achievement_skin_unlocks (achievement_key, skin_id, skin_type) VALUES
  ('login_streak_7', 'sakura-spring', 'ui')
ON CONFLICT (achievement_key, skin_id) DO NOTHING;

-- Monthly streak unlocks a premium UI skin
INSERT INTO achievement_skin_unlocks (achievement_key, skin_id, skin_type) VALUES
  ('login_streak_30', 'ocean-depths', 'ui')
ON CONFLICT (achievement_key, skin_id) DO NOTHING;

-- Year-round player gets exclusive skin
INSERT INTO achievement_skin_unlocks (achievement_key, skin_id, skin_type) VALUES
  ('total_logins_365', 'forest-enchanted', 'ui')
ON CONFLICT (achievement_key, skin_id) DO NOTHING;

-- ============================================================================
-- UPDATE DAILY ENGAGEMENT: ADD STREAK BONUS XP
-- ============================================================================

-- Add streak bonus columns to login_streaks if they don't exist
DO $$
BEGIN
  -- Streak bonus multiplier (increases with streak length)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'login_streaks' AND column_name = 'streak_bonus_xp'
  ) THEN
    ALTER TABLE login_streaks ADD COLUMN streak_bonus_xp INTEGER DEFAULT 0;
  END IF;
END $$;
