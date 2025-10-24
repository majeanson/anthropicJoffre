-- Migration 003: Game Persistence and Session Management
-- Purpose: Add tables for persistent game state, player sessions, and presence tracking

-- Game sessions table (persistent player sessions for reconnection)
CREATE TABLE IF NOT EXISTS game_sessions (
    session_token VARCHAR(64) PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    player_id VARCHAR(255) NOT NULL,
    game_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes')
);

-- Active games table (full game state stored as JSONB)
CREATE TABLE IF NOT EXISTS active_games (
    game_id VARCHAR(255) PRIMARY KEY,
    game_state JSONB NOT NULL,
    phase VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'waiting', -- waiting, team_selection, in_progress, finished
    player_count INTEGER DEFAULT 0,
    creator_name VARCHAR(255),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player presence table (online/away/offline status)
CREATE TABLE IF NOT EXISTS player_presence (
    player_name VARCHAR(255) PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'online', -- online, away, offline
    current_game_id VARCHAR(255),
    socket_id VARCHAR(255),
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_name ON game_sessions(player_name);
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_active_games_status ON active_games(status, is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_games_phase ON active_games(phase);
CREATE INDEX IF NOT EXISTS idx_player_presence_status ON player_presence(status, last_seen_at);

-- Cleanup function for expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM game_sessions
    WHERE expires_at < CURRENT_TIMESTAMP
    OR (is_active = FALSE AND last_active_at < CURRENT_TIMESTAMP - INTERVAL '1 day');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for abandoned games (run periodically)
CREATE OR REPLACE FUNCTION cleanup_abandoned_games()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete games that haven't been updated in 2 hours and are not finished
    DELETE FROM active_games
    WHERE status != 'finished'
    AND last_updated_at < CURRENT_TIMESTAMP - INTERVAL '2 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
