-- Migration 031: Special Card Skins (Red 0 & Brown 0)
-- Created: 2025-12-05
-- Adds a dedicated skin system for the special +5 (Red 0) and -2 (Brown 0) cards

-- ============================================================================
-- SPECIAL CARD SKINS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS special_card_skins (
  skin_id VARCHAR(50) PRIMARY KEY,
  skin_name VARCHAR(100) NOT NULL,
  description TEXT,
  card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('red_zero', 'brown_zero')),
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_type VARCHAR(20) DEFAULT 'default' CHECK (unlock_type IN ('default', 'level', 'achievement', 'purchase')),
  unlock_requirement VARCHAR(100),  -- Achievement key, level number, or NULL for default/purchase
  price INTEGER DEFAULT 0,          -- Coin cost if purchasable
  center_icon VARCHAR(20),          -- Emoji displayed on card
  glow_color VARCHAR(50),           -- CSS color for glow effect
  animation_class VARCHAR(50),      -- CSS animation class name
  border_color VARCHAR(50),         -- Custom border color
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player's unlocked special card skins
CREATE TABLE IF NOT EXISTS player_special_card_skins (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  skin_id VARCHAR(50) NOT NULL REFERENCES special_card_skins(skin_id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_name, skin_id)
);

-- Player's currently equipped special card skins
CREATE TABLE IF NOT EXISTS player_equipped_special_skins (
  player_name VARCHAR(255) PRIMARY KEY,
  red_zero_skin VARCHAR(50) REFERENCES special_card_skins(skin_id) ON DELETE SET NULL,
  brown_zero_skin VARCHAR(50) REFERENCES special_card_skins(skin_id) ON DELETE SET NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_special_skins_player ON player_special_card_skins(player_name);
CREATE INDEX IF NOT EXISTS idx_special_card_skins_type ON special_card_skins(card_type);

-- ============================================================================
-- SEED DATA: RED ZERO SKINS (5)
-- ============================================================================

INSERT INTO special_card_skins (skin_id, skin_name, description, card_type, rarity, unlock_type, unlock_requirement, price, center_icon, glow_color, animation_class, border_color) VALUES
  -- Default (free, everyone has it) - Uses original artwork image
  ('red_zero_default', 'Original Art', 'The original red zero artwork - classic and iconic', 'red_zero', 'common', 'default', NULL, 0, NULL, NULL, NULL, NULL),

  -- Achievement unlock: Red Zero Hunter (collect 10 red zeros)
  ('red_zero_phoenix', 'Phoenix Rising', 'A majestic phoenix emerges from the flames of victory', 'red_zero', 'epic', 'achievement', 'red_zero_hunter', 0, '🦅', 'rgba(251, 146, 60, 0.7)', 'animate-pulse', '#f97316'),

  -- Achievement unlock: Games Won 100
  ('red_zero_sun', 'Solar Flare', 'The power of a thousand suns burns in your hands', 'red_zero', 'legendary', 'achievement', 'games_won_100', 0, '☀️', 'rgba(250, 204, 21, 0.8)', 'animate-glow-intense', '#fbbf24'),

  -- Purchase with coins (-35% price reduction)
  ('red_zero_dragon', 'Dragon Heart', 'Ancient dragon fire burns eternal within this card', 'red_zero', 'rare', 'purchase', NULL, 325, '🐉', 'rgba(220, 38, 38, 0.7)', 'animate-flicker', '#b91c1c'),

  -- Level unlock (level 15)
  ('red_zero_ruby', 'Ruby Essence', 'Crystallized fire compressed into gem form', 'red_zero', 'rare', 'level', '15', 0, '💎', 'rgba(239, 68, 68, 0.6)', 'animate-shimmer', '#ef4444')
ON CONFLICT (skin_id) DO NOTHING;

-- ============================================================================
-- SEED DATA: BROWN ZERO SKINS (5)
-- ============================================================================

INSERT INTO special_card_skins (skin_id, skin_name, description, card_type, rarity, unlock_type, unlock_requirement, price, center_icon, glow_color, animation_class, border_color) VALUES
  -- Default (free, everyone has it) - Uses original artwork image
  ('brown_zero_default', 'Original Art', 'The original brown zero artwork - classic and iconic', 'brown_zero', 'common', 'default', NULL, 0, NULL, NULL, NULL, NULL),

  -- Achievement unlock: Avoid brown zeros (new achievement to be added)
  ('brown_zero_skull', 'Memento Mori', 'A reminder that even the mightiest can fall', 'brown_zero', 'epic', 'achievement', 'no_brown_10', 0, '💀', 'rgba(107, 114, 128, 0.7)', 'animate-pulse', '#4b5563'),

  -- Achievement unlock: Perfect Game
  ('brown_zero_void', 'Void Walker', 'Darkness incarnate, drawn from the space between stars', 'brown_zero', 'legendary', 'achievement', 'perfect_game', 0, '🌑', 'rgba(17, 24, 39, 0.8)', 'animate-void-pulse', '#111827'),

  -- Purchase with coins (-35% price reduction)
  ('brown_zero_stone', 'Petrified', 'Turned to stone by ancient and terrible magic', 'brown_zero', 'rare', 'purchase', NULL, 325, '🪨', 'rgba(120, 113, 108, 0.6)', NULL, '#78716c'),

  -- Level unlock (level 15)
  ('brown_zero_shadow', 'Shadow Form', 'Consumed by shadows, yet wielding their power', 'brown_zero', 'rare', 'level', '15', 0, '👤', 'rgba(30, 41, 59, 0.7)', 'animate-shadow-drift', '#1e293b')
ON CONFLICT (skin_id) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE special_card_skins IS 'Defines all available skins for Red 0 (+5) and Brown 0 (-2) special cards';
COMMENT ON TABLE player_special_card_skins IS 'Tracks which special card skins each player has unlocked';
COMMENT ON TABLE player_equipped_special_skins IS 'Stores which special card skins each player has currently equipped';
COMMENT ON COLUMN special_card_skins.unlock_type IS 'How this skin is unlocked: default (free), level, achievement, or purchase';
COMMENT ON COLUMN special_card_skins.unlock_requirement IS 'Achievement key for achievement unlocks, or level number for level unlocks';
