-- Migration 029: User Blocking System
-- Allows players to block other players to prevent unwanted interactions

-- User blocks table: Stores one-way block relationships
CREATE TABLE IF NOT EXISTS user_blocks (
  id SERIAL PRIMARY KEY,
  blocker_name VARCHAR(255) NOT NULL,  -- The player doing the blocking
  blocked_name VARCHAR(255) NOT NULL,  -- The player being blocked
  reason VARCHAR(100),                  -- Optional reason (harassment, spam, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Prevent duplicate blocks
  UNIQUE(blocker_name, blocked_name),
  -- Prevent self-blocking
  CONSTRAINT no_self_block CHECK (blocker_name <> blocked_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_name);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_name);

-- Function to check if a player is blocked
-- Returns true if blocker_name has blocked blocked_name
CREATE OR REPLACE FUNCTION is_blocked(blocker_name TEXT, blocked_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE user_blocks.blocker_name = is_blocked.blocker_name
    AND user_blocks.blocked_name = is_blocked.blocked_name
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if either player has blocked the other (mutual check)
-- Useful for friend requests and direct messages
CREATE OR REPLACE FUNCTION is_blocked_either_way(player1 TEXT, player2 TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_name = player1 AND blocked_name = player2)
       OR (blocker_name = player2 AND blocked_name = player1)
  );
END;
$$ LANGUAGE plpgsql;
