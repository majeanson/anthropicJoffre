-- Migration 021: Add Beginner Mode Preference
-- Created: 2025-11-27
-- Add beginner_mode setting to user_preferences with default=true for new users

DO $$
BEGIN
  -- Add beginner_mode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'beginner_mode'
  ) THEN
    ALTER TABLE user_preferences
    ADD COLUMN beginner_mode BOOLEAN DEFAULT TRUE;

    -- Update existing users to have beginner_mode = true (new feature, should be enabled by default)
    UPDATE user_preferences SET beginner_mode = TRUE WHERE beginner_mode IS NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.beginner_mode IS 'Enable beginner mode: move suggestions, tutorial tips, and 2x action timeout';
