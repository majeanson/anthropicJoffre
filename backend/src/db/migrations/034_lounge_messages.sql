/**
 * Migration 034: Lounge Messages System
 *
 * Creates persistent storage for lounge chat messages with support for:
 * - Message persistence (survives server restarts)
 * - Message reactions (emoji reactions per message)
 * - Media attachments (GIFs, images)
 * - Message replies/threads
 * - Edit/delete functionality
 * - Full-text search
 *
 * Lounge messages are kept indefinitely (no TTL) per user request.
 */

-- Lounge messages table
CREATE TABLE IF NOT EXISTS lounge_messages (
  message_id SERIAL PRIMARY KEY,

  -- Sender info (player_name for both authenticated and anonymous users)
  player_name VARCHAR(100) NOT NULL,

  -- Message content
  message_text TEXT NOT NULL CHECK (LENGTH(message_text) > 0 AND LENGTH(message_text) <= 2000),

  -- Media/attachment support
  media_type VARCHAR(20) CHECK (media_type IN ('gif', 'image', 'link', NULL)),
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_alt_text VARCHAR(255),

  -- Reply support (self-referential)
  reply_to_id INTEGER REFERENCES lounge_messages(message_id) ON DELETE SET NULL,

  -- Edit tracking
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  original_text TEXT, -- Store original for audit if needed

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100), -- Who deleted (author or admin)

  -- Mentions (stored as array for efficient querying)
  mentions TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message reactions table (many-to-many: message-user-emoji)
CREATE TABLE IF NOT EXISTS lounge_message_reactions (
  reaction_id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES lounge_messages(message_id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  emoji VARCHAR(20) NOT NULL, -- Emoji character or shortcode
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- One reaction type per user per message
  UNIQUE(message_id, player_name, emoji)
);

-- Indexes for lounge_messages
CREATE INDEX IF NOT EXISTS idx_lounge_messages_created
  ON lounge_messages(created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_lounge_messages_player
  ON lounge_messages(player_name, created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_lounge_messages_reply
  ON lounge_messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL AND is_deleted = FALSE;

-- GIN index for mentions array for fast "find messages mentioning @user" queries
CREATE INDEX IF NOT EXISTS idx_lounge_messages_mentions
  ON lounge_messages USING GIN(mentions)
  WHERE is_deleted = FALSE;

-- Full-text search index for message content
CREATE INDEX IF NOT EXISTS idx_lounge_messages_search
  ON lounge_messages USING GIN(to_tsvector('english', message_text))
  WHERE is_deleted = FALSE;

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_lounge_reactions_message
  ON lounge_message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_lounge_reactions_player
  ON lounge_message_reactions(player_name);

-- View for messages with reaction counts (commonly needed)
CREATE OR REPLACE VIEW lounge_messages_with_reactions AS
SELECT
  m.*,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'emoji', r.emoji,
          'count', r.cnt,
          'players', r.players
        )
      )
      FROM (
        SELECT
          emoji,
          COUNT(*) as cnt,
          array_agg(player_name ORDER BY created_at) as players
        FROM lounge_message_reactions
        WHERE message_id = m.message_id
        GROUP BY emoji
      ) r
    ),
    '[]'::jsonb
  ) as reactions
FROM lounge_messages m
WHERE m.is_deleted = FALSE;

-- Function to extract mentions from message text
CREATE OR REPLACE FUNCTION extract_mentions(msg TEXT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT substring(match FROM 2)
    FROM regexp_matches(msg, '@([A-Za-z0-9_]+)', 'g') AS match
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-populate mentions array on insert/update
CREATE OR REPLACE FUNCTION update_mentions_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mentions := extract_mentions(NEW.message_text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lounge_messages_mentions_trigger ON lounge_messages;
CREATE TRIGGER lounge_messages_mentions_trigger
  BEFORE INSERT OR UPDATE OF message_text ON lounge_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_mentions_trigger();

COMMENT ON TABLE lounge_messages IS 'Persistent storage for lounge chat messages';
COMMENT ON TABLE lounge_message_reactions IS 'Emoji reactions on lounge messages';
COMMENT ON COLUMN lounge_messages.media_type IS 'Type of attached media: gif, image, or link preview';
COMMENT ON COLUMN lounge_messages.mentions IS 'Auto-extracted @mentions from message text';
COMMENT ON VIEW lounge_messages_with_reactions IS 'Messages with aggregated reaction data';
