-- Game history table with enhanced fields for incremental saves
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    winning_team INTEGER CHECK (winning_team IN (1, 2)),
    team1_score INTEGER NOT NULL,
    team2_score INTEGER NOT NULL,
    rounds INTEGER NOT NULL,
    player_names TEXT[],
    player_teams INTEGER[],
    round_history JSONB,
    game_duration_seconds INTEGER,
    trump_suit VARCHAR(20),
    is_finished BOOLEAN DEFAULT FALSE,
    is_bot_game BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

-- Player statistics table with comprehensive metrics
CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) UNIQUE NOT NULL,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_abandoned INTEGER DEFAULT 0,
    win_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_tricks_won INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    avg_tricks_per_game DECIMAL(5,2) DEFAULT 0.00,
    total_bets_made INTEGER DEFAULT 0,
    bets_won INTEGER DEFAULT 0,
    bets_lost INTEGER DEFAULT 0,
    avg_bet_amount DECIMAL(5,2) DEFAULT 0.00,
    highest_bet INTEGER DEFAULT 0,
    without_trump_bets INTEGER DEFAULT 0,
    trump_cards_played INTEGER DEFAULT 0,
    red_zeros_collected INTEGER DEFAULT 0,
    brown_zeros_received INTEGER DEFAULT 0,
    elo_rating INTEGER DEFAULT 1200,
    highest_rating INTEGER DEFAULT 1200,
    is_bot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    is_bot BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES game_history(game_id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_finished ON game_history(is_finished, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_elo ON player_stats(is_bot, elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_win_pct ON player_stats(is_bot, win_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_game_participants_player ON game_participants(player_name);
CREATE INDEX IF NOT EXISTS idx_game_participants_game ON game_participants(game_id);
