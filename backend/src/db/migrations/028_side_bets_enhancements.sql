-- Migration 028: Side Bets Enhancements
-- Created: 2025-12-05
-- Adds resolution_timing, trick_number, and claimed_winner columns to side_bets table
-- Adds bet streak columns to player_stats table
-- Updates status enum to include 'pending_resolution'

-- Add resolution_timing column to side_bets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='side_bets' AND column_name='resolution_timing') THEN
        ALTER TABLE side_bets ADD COLUMN resolution_timing VARCHAR(20) DEFAULT 'manual';
    END IF;
END $$;

-- Add trick_number column to side_bets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='side_bets' AND column_name='trick_number') THEN
        ALTER TABLE side_bets ADD COLUMN trick_number INT;
    END IF;
END $$;

-- Add claimed_winner column for pending resolution flow
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='side_bets' AND column_name='claimed_winner') THEN
        ALTER TABLE side_bets ADD COLUMN claimed_winner VARCHAR(255);
    END IF;
END $$;

-- Add bet streak columns to player_stats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='current_bet_streak') THEN
        ALTER TABLE player_stats ADD COLUMN current_bet_streak INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='best_bet_streak') THEN
        ALTER TABLE player_stats ADD COLUMN best_bet_streak INTEGER DEFAULT 0;
    END IF;
END $$;
