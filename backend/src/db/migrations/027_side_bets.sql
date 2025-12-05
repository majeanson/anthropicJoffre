-- Migration 027: Side Bets System
-- Created: 2025-12-05
-- Adds side_bets table and related columns to player_stats

-- Create side_bets table
CREATE TABLE IF NOT EXISTS side_bets (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    bet_type VARCHAR(50) NOT NULL CHECK (bet_type IN ('preset', 'custom')),
    preset_type VARCHAR(50),  -- 'red_zero_winner', 'brown_zero_victim', 'tricks_over_under', 'bet_made', etc.
    custom_description TEXT,  -- Free-text description for custom bets
    creator_name VARCHAR(255) NOT NULL,
    acceptor_name VARCHAR(255),  -- NULL until someone accepts the bet
    amount INT NOT NULL CHECK (amount >= 1 AND amount <= 1000),
    prediction VARCHAR(255),  -- The bet prediction (e.g., 'team1', '>=5', 'true')
    target_player VARCHAR(255),  -- Who the bet is about (if applicable)
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'active', 'resolved', 'cancelled', 'expired', 'disputed')),
    result BOOLEAN,  -- NULL until resolved, TRUE if creator won
    resolved_by VARCHAR(20) CHECK (resolved_by IN ('auto', 'manual', 'expired', 'refunded')),
    round_number INT,  -- Which round the bet applies to (NULL = whole game)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes for side_bets
CREATE INDEX IF NOT EXISTS idx_side_bets_game ON side_bets(game_id, status);
CREATE INDEX IF NOT EXISTS idx_side_bets_creator ON side_bets(creator_name, status);
CREATE INDEX IF NOT EXISTS idx_side_bets_acceptor ON side_bets(acceptor_name, status);
CREATE INDEX IF NOT EXISTS idx_side_bets_active ON side_bets(game_id, status) WHERE status = 'active';

-- Add cosmetic_currency column to player_stats (for coin balance)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='cosmetic_currency') THEN
        ALTER TABLE player_stats ADD COLUMN cosmetic_currency INTEGER DEFAULT 100;
    END IF;
END $$;

-- Add side bet stats columns to player_stats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='side_bets_won') THEN
        ALTER TABLE player_stats ADD COLUMN side_bets_won INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='side_bets_lost') THEN
        ALTER TABLE player_stats ADD COLUMN side_bets_lost INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='side_bets_coins_won') THEN
        ALTER TABLE player_stats ADD COLUMN side_bets_coins_won INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='side_bets_coins_lost') THEN
        ALTER TABLE player_stats ADD COLUMN side_bets_coins_lost INTEGER DEFAULT 0;
    END IF;
END $$;
