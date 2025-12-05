-- Migration 025: Tutorial Progress Tracking
-- Created: 2025-12-04
-- Purpose: Track tutorial step completions and prevent double rewards

-- Table to track tutorial step completions per player
CREATE TABLE IF NOT EXISTS player_tutorial_progress (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    step_id VARCHAR(50) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_name, step_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_player ON player_tutorial_progress(player_name);
