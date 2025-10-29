-- Performance Optimization: Additional Database Indexes
-- Migration 004: Add composite and covering indexes for frequently accessed query patterns

-- Composite index for game_participants lookups (game_id + player_name)
-- Optimizes queries that filter by both game_id and player_name
-- Common in: getGameReplayData, saveGameParticipants, player history queries
CREATE INDEX IF NOT EXISTS idx_game_participants_game_player
ON game_participants(game_id, player_name);

-- Composite index for player_stats leaderboard queries
-- Optimizes: getLeaderboard with is_bot filter and elo_rating sorting
CREATE INDEX IF NOT EXISTS idx_player_stats_leaderboard
ON player_stats(is_bot, elo_rating DESC, games_played DESC)
WHERE games_played > 0;

-- Composite index for game_history active game queries
-- Optimizes: Recent unfinished games, active game listings
CREATE INDEX IF NOT EXISTS idx_game_history_active
ON game_history(is_finished, last_updated_at DESC, created_at DESC);

-- Index for player_stats name lookups (case-insensitive)
-- Optimizes: Player search, profile lookups
CREATE INDEX IF NOT EXISTS idx_player_stats_name_lower
ON player_stats(LOWER(player_name));

-- Composite index for game_participants with bet_won
-- Optimizes: Win rate calculations, betting statistics
CREATE INDEX IF NOT EXISTS idx_game_participants_stats
ON game_participants(player_name, bet_won, points_earned);

-- Index for game_history finished games by date
-- Optimizes: Recent game listings, history pagination
CREATE INDEX IF NOT EXISTS idx_game_history_finished_date
ON game_history(finished_at DESC)
WHERE is_finished = TRUE;

-- Composite index for player game history
-- Optimizes: Player-specific game history queries
CREATE INDEX IF NOT EXISTS idx_game_participants_player_date
ON game_participants(player_name, game_id);

-- Add covering index for online player queries (if player_presence table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'player_presence') THEN
        CREATE INDEX IF NOT EXISTS idx_player_presence_online
        ON player_presence(status, last_seen_at DESC, player_name);
    END IF;
END $$;

-- Statistics for query planner
ANALYZE game_history;
ANALYZE player_stats;
ANALYZE game_participants;
