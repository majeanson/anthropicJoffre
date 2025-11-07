-- Migration 014: Performance Indexes
-- Sprint 6: Add indexes for 5-10x query performance improvement
-- Created: 2025-11-07

-- Game history queries (lobby, replay, stats)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_history') THEN
    CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_game_history_is_finished ON game_history(is_finished) WHERE is_finished = FALSE;
    CREATE INDEX IF NOT EXISTS idx_game_history_finished_at ON game_history(finished_at DESC) WHERE finished_at IS NOT NULL;
  END IF;
END $$;

-- Player stats queries (leaderboard, profile)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'player_stats') THEN
    CREATE INDEX IF NOT EXISTS idx_player_stats_games_won ON player_stats(games_won DESC);
    CREATE INDEX IF NOT EXISTS idx_player_stats_player_name ON player_stats(player_name);
    CREATE INDEX IF NOT EXISTS idx_player_stats_elo_rating ON player_stats(elo_rating DESC);
  END IF;
END $$;

-- Session queries (reconnection) - only if sessions table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'sessions') THEN
    CREATE INDEX IF NOT EXISTS idx_sessions_player_name ON sessions(player_name);
    CREATE INDEX IF NOT EXISTS idx_sessions_game_id ON sessions(game_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  END IF;
END $$;

-- Friends queries - only if friendships table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'friendships') THEN
    CREATE INDEX IF NOT EXISTS idx_friendships_player1 ON friendships(player1_name);
    CREATE INDEX IF NOT EXISTS idx_friendships_player2 ON friendships(player2_name);
  END IF;
END $$;

-- Game participants queries
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_participants') THEN
    CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_participants_player_name ON game_participants(player_name);
  END IF;
END $$;

-- Round history queries
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'round_history') THEN
    CREATE INDEX IF NOT EXISTS idx_round_history_game_id ON round_history(game_id);
    CREATE INDEX IF NOT EXISTS idx_round_history_round_number ON round_history(game_id, round_number);
  END IF;
END $$;
