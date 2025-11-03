-- Migration 005: Add persistence_mode column to game_history
-- Purpose: Track whether games are persistent (ELO/ranked) or casual (memory-only)
-- This allows leaderboard and stats to only count ranked games

DO $$
BEGIN
    -- Add persistence_mode column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='persistence_mode') THEN
        ALTER TABLE game_history
        ADD COLUMN persistence_mode VARCHAR(10) DEFAULT 'elo'
        CHECK (persistence_mode IN ('elo', 'casual'));

        -- Add index for filtering by persistence mode
        CREATE INDEX IF NOT EXISTS idx_game_history_persistence
        ON game_history(persistence_mode, is_finished, created_at DESC);

        RAISE NOTICE 'Added persistence_mode column to game_history';
    END IF;
END $$;
