/**
 * Migration 016: Direct Messages System
 * Sprint 16 Day 4
 *
 * Creates tables for 1-on-1 direct messaging between users.
 *
 * Features:
 * - Direct message storage with read/unread status
 * - Message threads/conversations
 * - Soft delete support
 * - Indexing for fast retrieval
 */

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  message_id SERIAL PRIMARY KEY,

  -- Sender and recipient (user IDs, not socket IDs)
  sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  -- Message content
  message_text TEXT NOT NULL CHECK (LENGTH(message_text) > 0 AND LENGTH(message_text) <= 2000),

  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_recipient BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent self-messaging
  CHECK (sender_id != recipient_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_dm_recipient_unread
  ON direct_messages(recipient_id, is_read, created_at DESC)
  WHERE is_deleted_by_recipient = FALSE;

CREATE INDEX IF NOT EXISTS idx_dm_sender_created
  ON direct_messages(sender_id, created_at DESC)
  WHERE is_deleted_by_sender = FALSE;

CREATE INDEX IF NOT EXISTS idx_dm_conversation
  ON direct_messages(sender_id, recipient_id, created_at DESC)
  WHERE is_deleted_by_sender = FALSE OR is_deleted_by_recipient = FALSE;

-- Composite index for conversation threads
CREATE INDEX IF NOT EXISTS idx_dm_thread
  ON direct_messages(
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id),
    created_at DESC
  )
  WHERE is_deleted_by_sender = FALSE OR is_deleted_by_recipient = FALSE;

-- View for active conversations with last message preview
CREATE OR REPLACE VIEW dm_conversations AS
SELECT
  user1_id,
  user2_id,
  last_message_at,
  unread_count,
  (
    SELECT message_text
    FROM direct_messages dm2
    WHERE (dm2.sender_id = user1_id AND dm2.recipient_id = user2_id)
       OR (dm2.sender_id = user2_id AND dm2.recipient_id = user1_id)
    ORDER BY created_at DESC
    LIMIT 1
  ) AS last_message_preview
FROM (
  SELECT
    LEAST(sender_id, recipient_id) AS user1_id,
    GREATEST(sender_id, recipient_id) AS user2_id,
    MAX(created_at) AS last_message_at,
    COUNT(*) FILTER (WHERE is_read = FALSE) AS unread_count
  FROM direct_messages dm1
  WHERE is_deleted_by_sender = FALSE OR is_deleted_by_recipient = FALSE
  GROUP BY LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id)
) conversations;

COMMENT ON TABLE direct_messages IS 'Stores 1-on-1 direct messages between users';
COMMENT ON VIEW dm_conversations IS 'Shows active conversations with last message preview and unread count';
