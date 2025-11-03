-- Game history table with enhanced fields for incremental saves
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    winning_team INTEGER CHECK (winning_team IN (1, 2)),
    team1_score INTEGER NOT NULL,
    team2_score INTEGER NOT NULL,
    rounds INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns if they don't exist (migration-safe)
DO $$
BEGIN
    -- Add player_names column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='player_names') THEN
        ALTER TABLE game_history ADD COLUMN player_names TEXT[];
    END IF;

    -- Add player_teams column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='player_teams') THEN
        ALTER TABLE game_history ADD COLUMN player_teams INTEGER[];
    END IF;

    -- Add round_history column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='round_history') THEN
        ALTER TABLE game_history ADD COLUMN round_history JSONB;
    END IF;

    -- Add game_duration_seconds column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='game_duration_seconds') THEN
        ALTER TABLE game_history ADD COLUMN game_duration_seconds INTEGER;
    END IF;

    -- Add trump_suit column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='trump_suit') THEN
        ALTER TABLE game_history ADD COLUMN trump_suit VARCHAR(20);
    END IF;

    -- Add is_finished column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='is_finished') THEN
        ALTER TABLE game_history ADD COLUMN is_finished BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_bot_game column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='is_bot_game') THEN
        ALTER TABLE game_history ADD COLUMN is_bot_game BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add last_updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='last_updated_at') THEN
        ALTER TABLE game_history ADD COLUMN last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add finished_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='finished_at') THEN
        ALTER TABLE game_history ADD COLUMN finished_at TIMESTAMP;
    END IF;

    -- Add game_state_snapshot column for crash recovery
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='game_history' AND column_name='game_state_snapshot') THEN
        ALTER TABLE game_history ADD COLUMN game_state_snapshot JSONB;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_history_finished ON game_history(is_finished, created_at);
CREATE INDEX IF NOT EXISTS idx_game_history_last_updated ON game_history(is_finished, last_updated_at);
CREATE INDEX IF NOT EXISTS idx_game_history_game_id ON game_history(game_id);

-- Player statistics table with comprehensive metrics
CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) UNIQUE NOT NULL,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_tricks_won INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to player_stats if they don't exist (migration-safe)
DO $$
BEGIN
    -- Add games_lost column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='games_lost') THEN
        ALTER TABLE player_stats ADD COLUMN games_lost INTEGER DEFAULT 0;
    END IF;

    -- Add games_abandoned column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='games_abandoned') THEN
        ALTER TABLE player_stats ADD COLUMN games_abandoned INTEGER DEFAULT 0;
    END IF;

    -- Add win_percentage column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='win_percentage') THEN
        ALTER TABLE player_stats ADD COLUMN win_percentage DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Add total_points_earned column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='total_points_earned') THEN
        ALTER TABLE player_stats ADD COLUMN total_points_earned INTEGER DEFAULT 0;
    END IF;

    -- Add avg_tricks_per_game column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='avg_tricks_per_game') THEN
        ALTER TABLE player_stats ADD COLUMN avg_tricks_per_game DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Add total_bets_made column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='total_bets_made') THEN
        ALTER TABLE player_stats ADD COLUMN total_bets_made INTEGER DEFAULT 0;
    END IF;

    -- Add bets_won column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='bets_won') THEN
        ALTER TABLE player_stats ADD COLUMN bets_won INTEGER DEFAULT 0;
    END IF;

    -- Add bets_lost column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='bets_lost') THEN
        ALTER TABLE player_stats ADD COLUMN bets_lost INTEGER DEFAULT 0;
    END IF;

    -- Add avg_bet_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='avg_bet_amount') THEN
        ALTER TABLE player_stats ADD COLUMN avg_bet_amount DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Add highest_bet column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='highest_bet') THEN
        ALTER TABLE player_stats ADD COLUMN highest_bet INTEGER DEFAULT 0;
    END IF;

    -- Add without_trump_bets column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='without_trump_bets') THEN
        ALTER TABLE player_stats ADD COLUMN without_trump_bets INTEGER DEFAULT 0;
    END IF;

    -- Add trump_cards_played column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='trump_cards_played') THEN
        ALTER TABLE player_stats ADD COLUMN trump_cards_played INTEGER DEFAULT 0;
    END IF;

    -- Add red_zeros_collected column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='red_zeros_collected') THEN
        ALTER TABLE player_stats ADD COLUMN red_zeros_collected INTEGER DEFAULT 0;
    END IF;

    -- Add brown_zeros_received column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='brown_zeros_received') THEN
        ALTER TABLE player_stats ADD COLUMN brown_zeros_received INTEGER DEFAULT 0;
    END IF;

    -- Add elo_rating column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='elo_rating') THEN
        ALTER TABLE player_stats ADD COLUMN elo_rating INTEGER DEFAULT 1200;
    END IF;

    -- Add highest_rating column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='highest_rating') THEN
        ALTER TABLE player_stats ADD COLUMN highest_rating INTEGER DEFAULT 1200;
    END IF;

    -- Add is_bot column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='is_bot') THEN
        ALTER TABLE player_stats ADD COLUMN is_bot BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add total_bet_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='total_bet_amount') THEN
        ALTER TABLE player_stats ADD COLUMN total_bet_amount INTEGER DEFAULT 0;
    END IF;
END $$;

-- Game participants junction table
CREATE TABLE IF NOT EXISTS game_participants (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    team_id INTEGER CHECK (team_id IN (1, 2)),
    tricks_won INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    rounds_played INTEGER DEFAULT 0,
    bet_amount INTEGER,
    bet_won BOOLEAN,
    is_bot BOOLEAN DEFAULT FALSE
);

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name='fk_game' AND table_name='game_participants') THEN
        ALTER TABLE game_participants
        ADD CONSTRAINT fk_game FOREIGN KEY (game_id)
        REFERENCES game_history(game_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Chat messages table for lobby and game chat
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id SERIAL PRIMARY KEY,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('lobby', 'game')),
    room_id VARCHAR(255),
    player_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    team_id INTEGER CHECK (team_id IN (1, 2)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_finished ON game_history(is_finished, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_elo ON player_stats(is_bot, elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_win_pct ON player_stats(is_bot, win_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_game_participants_player ON game_participants(player_name);
CREATE INDEX IF NOT EXISTS idx_game_participants_game ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lobby ON chat_messages(room_type, created_at DESC) WHERE room_type = 'lobby';
CREATE INDEX IF NOT EXISTS idx_chat_messages_game ON chat_messages(room_type, room_id, created_at ASC) WHERE room_type = 'game';
