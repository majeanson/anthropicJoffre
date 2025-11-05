-- Migration 013: User Profiles and Preferences
-- Created: 2025-11-05
-- Sprint 3, Phase 3.2: Enhanced User Profiles

-- User profiles table: Extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  profile_id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  bio TEXT,
  country VARCHAR(2), -- ISO 3166-1 alpha-2 country code
  favorite_team INTEGER CHECK (favorite_team IN (1, 2)),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only', 'private')),
  show_online_status BOOLEAN DEFAULT TRUE,
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bio_length CHECK (char_length(bio) <= 200)
);

-- User preferences table: Settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_volume DECIMAL(3,2) DEFAULT 0.30,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'en',
  autoplay_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sound_volume_range CHECK (sound_volume >= 0 AND sound_volume <= 1)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_visibility ON user_profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Trigger to update updated_at timestamp on profile changes
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
COMMENT ON COLUMN user_profiles.bio IS 'User biography (max 200 characters)';
COMMENT ON COLUMN user_profiles.country IS 'ISO 3166-1 alpha-2 country code (e.g., US, FR, JP)';
COMMENT ON COLUMN user_profiles.favorite_team IS 'Preferred team number (1 or 2)';
COMMENT ON COLUMN user_profiles.visibility IS 'Profile visibility: public, friends_only, or private';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme preference: light, dark, or auto';
COMMENT ON COLUMN user_preferences.sound_volume IS 'Sound volume (0.00 to 1.00)';
