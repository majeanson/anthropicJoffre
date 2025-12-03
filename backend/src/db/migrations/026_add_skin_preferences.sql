-- Migration 026: Add Skin Preferences
-- Created: 2025-12-03
-- Adds skin_id and card_skin_id columns to user_preferences table

-- Add skin_id column for UI theme skin preference
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS skin_id VARCHAR(50) DEFAULT 'tavern-noir';

-- Add card_skin_id column for card display skin preference
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS card_skin_id VARCHAR(50) DEFAULT 'classic';

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.skin_id IS 'UI theme skin ID (e.g., tavern-noir, classic-parchment)';
COMMENT ON COLUMN user_preferences.card_skin_id IS 'Card display skin ID (e.g., classic, roman, elemental)';
