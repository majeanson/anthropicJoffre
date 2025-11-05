-- Migration 011: Friends List System
-- Sprint 2 Phase 2: Add friend list and friend request functionality

-- Friendships table: Stores confirmed friendships
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  player1_name VARCHAR(255) NOT NULL,
  player2_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure alphabetical ordering to prevent duplicates (A-B is same as B-A)
  CONSTRAINT friendship_unique CHECK (player1_name < player2_name),
  UNIQUE(player1_name, player2_name)
);

-- Friend requests table: Stores pending friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  from_player VARCHAR(255) NOT NULL,
  to_player VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  UNIQUE(from_player, to_player)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendships_player1 ON friendships(player1_name);
CREATE INDEX IF NOT EXISTS idx_friendships_player2 ON friendships(player2_name);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_player);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_player);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- Add friends count column to player_stats if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'friends_count'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN friends_count INTEGER DEFAULT 0;
  END IF;
END $$;
