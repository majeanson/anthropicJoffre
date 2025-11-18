/**
 * Direct Messages Database Operations
 * Sprint 16 Day 4
 */

import { query, getPool } from './index.js';

export interface DirectMessage {
  message_id: number;
  sender_id: number;
  recipient_id: number;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  is_deleted_by_sender: boolean;
  is_deleted_by_recipient: boolean;
  created_at: string;
}

export interface DirectMessageWithUser extends DirectMessage {
  sender_username: string;
  sender_avatar_url: string | null;
  recipient_username: string;
  recipient_avatar_url: string | null;
}

export interface Conversation {
  user1_id: number;
  user2_id: number;
  user1_username: string;
  user1_avatar_url: string | null;
  user2_username: string;
  user2_avatar_url: string | null;
  last_message_at: string;
  unread_count: number;
  last_message_preview: string;
}

/**
 * Send a direct message
 */
export async function sendDirectMessage(
  senderUsername: string,
  recipientUsername: string,
  messageText: string
): Promise<DirectMessage | null> {
  try {
    const result = await query(
      `INSERT INTO direct_messages (sender_id, recipient_id, message_text)
       SELECT
         (SELECT user_id FROM users WHERE username = $1),
         (SELECT user_id FROM users WHERE username = $2),
         $3
       RETURNING *`,
      [senderUsername, recipientUsername, messageText]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error sending direct message:', error);
    return null;
  }
}

/**
 * Get conversation between two users
 */
export async function getConversation(
  username1: string,
  username2: string,
  limit: number = 50,
  offset: number = 0
): Promise<DirectMessageWithUser[]> {
  try {
    const result = await query(
      `SELECT
         dm.*,
         u1.username AS sender_username,
         u1.avatar_url AS sender_avatar_url,
         u2.username AS recipient_username,
         u2.avatar_url AS recipient_avatar_url
       FROM direct_messages dm
       JOIN users u1 ON dm.sender_id = u1.user_id
       JOIN users u2 ON dm.recipient_id = u2.user_id
       WHERE (
         (u1.username = $1 AND u2.username = $2 AND dm.is_deleted_by_sender = FALSE)
         OR (u1.username = $2 AND u2.username = $1 AND dm.is_deleted_by_recipient = FALSE)
       )
       ORDER BY dm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [username1, username2, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return [];
  }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(username: string): Promise<Conversation[]> {
  try {
    const result = await query(
      `SELECT
         conv.*,
         u1.username AS user1_username,
         u1.avatar_url AS user1_avatar_url,
         u2.username AS user2_username,
         u2.avatar_url AS user2_avatar_url
       FROM dm_conversations conv
       JOIN users u1 ON conv.user1_id = u1.user_id
       JOIN users u2 ON conv.user2_id = u2.user_id
       WHERE u1.username = $1 OR u2.username = $1
       ORDER BY conv.last_message_at DESC`,
      [username]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  recipientUsername: string,
  senderUsername: string
): Promise<number> {
  try {
    const result = await query(
      `UPDATE direct_messages
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE recipient_id = (SELECT user_id FROM users WHERE username = $1)
         AND sender_id = (SELECT user_id FROM users WHERE username = $2)
         AND is_read = FALSE
       RETURNING message_id`,
      [recipientUsername, senderUsername]
    );

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return 0;
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(username: string): Promise<number> {
  try {
    const result = await query(
      `SELECT COUNT(*) AS count
       FROM direct_messages
       WHERE recipient_id = (SELECT user_id FROM users WHERE username = $1)
         AND is_read = FALSE
         AND is_deleted_by_recipient = FALSE`,
      [username]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Soft delete a message for sender
 */
export async function deleteMessageForSender(
  messageId: number,
  senderUsername: string
): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE direct_messages
       SET is_deleted_by_sender = TRUE
       WHERE message_id = $1
         AND sender_id = (SELECT user_id FROM users WHERE username = $2)`,
      [messageId, senderUsername]
    );

    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error deleting message for sender:', error);
    return false;
  }
}

/**
 * Soft delete a message for recipient
 */
export async function deleteMessageForRecipient(
  messageId: number,
  recipientUsername: string
): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE direct_messages
       SET is_deleted_by_recipient = TRUE
       WHERE message_id = $1
         AND recipient_id = (SELECT user_id FROM users WHERE username = $2)`,
      [messageId, recipientUsername]
    );

    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error deleting message for recipient:', error);
    return false;
  }
}

/**
 * Delete entire conversation for a user (soft delete all messages)
 */
export async function deleteConversationForUser(
  username: string,
  otherUsername: string
): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete messages where user is sender
    const result1 = await client.query(
      `UPDATE direct_messages
       SET is_deleted_by_sender = TRUE
       WHERE sender_id = (SELECT user_id FROM users WHERE username = $1)
         AND recipient_id = (SELECT user_id FROM users WHERE username = $2)`,
      [username, otherUsername]
    );

    // Delete messages where user is recipient
    const result2 = await client.query(
      `UPDATE direct_messages
       SET is_deleted_by_recipient = TRUE
       WHERE recipient_id = (SELECT user_id FROM users WHERE username = $1)
         AND sender_id = (SELECT user_id FROM users WHERE username = $2)`,
      [username, otherUsername]
    );

    await client.query('COMMIT');

    return (result1.rowCount || 0) + (result2.rowCount || 0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting conversation:', error);
    return 0;
  } finally {
    client.release();
  }
}

/**
 * Search messages by text
 */
export async function searchMessages(
  username: string,
  searchQuery: string,
  limit: number = 20
): Promise<DirectMessageWithUser[]> {
  try {
    const result = await query(
      `SELECT
         dm.*,
         u1.username AS sender_username,
         u1.avatar_url AS sender_avatar_url,
         u2.username AS recipient_username,
         u2.avatar_url AS recipient_avatar_url
       FROM direct_messages dm
       JOIN users u1 ON dm.sender_id = u1.user_id
       JOIN users u2 ON dm.recipient_id = u2.user_id
       WHERE (
         (u1.username = $1 AND dm.is_deleted_by_sender = FALSE)
         OR (u2.username = $1 AND dm.is_deleted_by_recipient = FALSE)
       )
       AND dm.message_text ILIKE $2
       ORDER BY dm.created_at DESC
       LIMIT $3`,
      [username, `%${searchQuery}%`, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
}
