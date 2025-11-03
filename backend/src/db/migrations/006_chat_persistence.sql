-- Migration 006: Add chat_messages table for persistent chat across server restarts
-- Purpose: Store lobby and in-game chat messages in database
-- Allows chat history to persist across server restarts

DO $$
BEGIN
    -- Create chat_messages table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name='chat_messages') THEN
        CREATE TABLE chat_messages (
            message_id SERIAL PRIMARY KEY,
            room_type VARCHAR(10) NOT NULL CHECK (room_type IN ('lobby', 'game')),
            room_id VARCHAR(100), -- NULL for lobby, game_id for game chat
            player_name VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            team_id INTEGER, -- NULL for lobby, 1 or 2 for game chat
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Index for efficient retrieval of lobby messages
        CREATE INDEX idx_chat_lobby ON chat_messages(room_type, created_at DESC)
        WHERE room_type = 'lobby';

        -- Index for efficient retrieval of game messages
        CREATE INDEX idx_chat_game ON chat_messages(room_id, created_at DESC)
        WHERE room_type = 'game';

        -- Add TTL cleanup - automatically delete messages older than 7 days
        -- Note: This requires pg_cron extension or manual cleanup job
        -- For now, we'll keep all messages and add cleanup later if needed

        RAISE NOTICE 'Created chat_messages table with indexes';
    END IF;
END $$;
