/**
 * Lounge Messages Database Operations
 *
 * Provides persistent storage for lounge chat messages with support for:
 * - Message CRUD operations
 * - Reactions management
 * - Media attachments
 * - Reply threading
 * - Full-text search
 * - Mention queries
 */

import { query, getPool } from './index.js';

// ============= Types =============

export interface LoungeMessage {
  message_id: number;
  player_name: string;
  message_text: string;
  media_type: 'gif' | 'image' | 'link' | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  media_alt_text: string | null;
  reply_to_id: number | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  mentions: string[];
  created_at: string;
}

export interface LoungeMessageWithReactions extends LoungeMessage {
  reactions: {
    emoji: string;
    count: number;
    players: string[];
  }[];
  reply_to?: {
    message_id: number;
    player_name: string;
    message_text: string;
  } | null;
}

export interface MessageReaction {
  reaction_id: number;
  message_id: number;
  player_name: string;
  emoji: string;
  created_at: string;
}

export interface CreateMessageParams {
  playerName: string;
  messageText: string;
  mediaType?: 'gif' | 'image' | 'link' | null;
  mediaUrl?: string | null;
  mediaThumbnailUrl?: string | null;
  mediaAltText?: string | null;
  replyToId?: number | null;
}

// ============= Message Operations =============

/**
 * Save a new lounge message
 */
export async function saveLoungeMessage(
  params: CreateMessageParams
): Promise<LoungeMessage | null> {
  try {
    const result = await query(
      `INSERT INTO lounge_messages (
        player_name, message_text, media_type, media_url,
        media_thumbnail_url, media_alt_text, reply_to_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.playerName,
        params.messageText,
        params.mediaType || null,
        params.mediaUrl || null,
        params.mediaThumbnailUrl || null,
        params.mediaAltText || null,
        params.replyToId || null,
      ]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error saving lounge message:', error);
    return null;
  }
}

/**
 * Get recent lounge messages with reactions and reply previews
 */
export async function getRecentLoungeMessages(
  limit: number = 100,
  beforeId?: number
): Promise<LoungeMessageWithReactions[]> {
  try {
    const whereClause = beforeId
      ? 'WHERE m.is_deleted = FALSE AND m.message_id < $2'
      : 'WHERE m.is_deleted = FALSE';

    const params = beforeId ? [limit, beforeId] : [limit];

    const result = await query(
      `SELECT
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
        ) as reactions,
        CASE
          WHEN m.reply_to_id IS NOT NULL THEN (
            SELECT jsonb_build_object(
              'message_id', rm.message_id,
              'player_name', rm.player_name,
              'message_text', CASE
                WHEN rm.is_deleted THEN '[deleted]'
                ELSE LEFT(rm.message_text, 100)
              END
            )
            FROM lounge_messages rm
            WHERE rm.message_id = m.reply_to_id
          )
          ELSE NULL
        END as reply_to
      FROM lounge_messages m
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $1`,
      params
    );

    // Parse JSONB fields and reverse to chronological order
    const messages = result.rows.map(row => ({
      ...row,
      reactions: typeof row.reactions === 'string'
        ? JSON.parse(row.reactions)
        : row.reactions || [],
      reply_to: row.reply_to
        ? (typeof row.reply_to === 'string' ? JSON.parse(row.reply_to) : row.reply_to)
        : null,
    }));

    return messages.reverse();
  } catch (error) {
    console.error('Error getting lounge messages:', error);
    return [];
  }
}

/**
 * Get a single message by ID
 */
export async function getLoungeMessage(
  messageId: number
): Promise<LoungeMessage | null> {
  try {
    const result = await query(
      'SELECT * FROM lounge_messages WHERE message_id = $1',
      [messageId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting lounge message:', error);
    return null;
  }
}

/**
 * Edit a message (only by original author, within time limit)
 */
export async function editLoungeMessage(
  messageId: number,
  playerName: string,
  newText: string,
  editWindowMinutes: number = 15
): Promise<LoungeMessage | null> {
  try {
    const result = await query(
      `UPDATE lounge_messages
       SET message_text = $3,
           is_edited = TRUE,
           edited_at = CURRENT_TIMESTAMP,
           original_text = COALESCE(original_text, message_text)
       WHERE message_id = $1
         AND player_name = $2
         AND is_deleted = FALSE
         AND created_at > NOW() - INTERVAL '1 minute' * $4
       RETURNING *`,
      [messageId, playerName, newText, editWindowMinutes]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error editing lounge message:', error);
    return null;
  }
}

/**
 * Soft delete a message
 */
export async function deleteLoungeMessage(
  messageId: number,
  playerName: string,
  isAdmin: boolean = false
): Promise<boolean> {
  try {
    // Regular users can only delete their own messages
    // Admin can delete any message but we still track who deleted it
    if (isAdmin) {
      const result = await query(
        `UPDATE lounge_messages
         SET is_deleted = TRUE,
             deleted_at = CURRENT_TIMESTAMP,
             deleted_by = $2
         WHERE message_id = $1
         RETURNING message_id`,
        [messageId, playerName]
      );
      return (result.rowCount || 0) > 0;
    } else {
      const result = await query(
        `UPDATE lounge_messages
         SET is_deleted = TRUE,
             deleted_at = CURRENT_TIMESTAMP,
             deleted_by = $2
         WHERE message_id = $1 AND player_name = $2
         RETURNING message_id`,
        [messageId, playerName]
      );
      return (result.rowCount || 0) > 0;
    }
  } catch (error) {
    console.error('Error deleting lounge message:', error);
    return false;
  }
}

// ============= Reaction Operations =============

/**
 * Add a reaction to a message
 */
export async function addReaction(
  messageId: number,
  playerName: string,
  emoji: string
): Promise<MessageReaction | null> {
  try {
    const result = await query(
      `INSERT INTO lounge_message_reactions (message_id, player_name, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, player_name, emoji) DO NOTHING
       RETURNING *`,
      [messageId, playerName, emoji]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error adding reaction:', error);
    return null;
  }
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(
  messageId: number,
  playerName: string,
  emoji: string
): Promise<boolean> {
  try {
    const result = await query(
      `DELETE FROM lounge_message_reactions
       WHERE message_id = $1 AND player_name = $2 AND emoji = $3`,
      [messageId, playerName, emoji]
    );

    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error removing reaction:', error);
    return false;
  }
}

/**
 * Toggle a reaction (add if not present, remove if present)
 */
export async function toggleReaction(
  messageId: number,
  playerName: string,
  emoji: string
): Promise<{ added: boolean; reaction?: MessageReaction }> {
  const pool = getPool();
  if (!pool) {
    return { added: false };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if reaction exists
    const existingResult = await client.query(
      `SELECT * FROM lounge_message_reactions
       WHERE message_id = $1 AND player_name = $2 AND emoji = $3`,
      [messageId, playerName, emoji]
    );

    if (existingResult.rows.length > 0) {
      // Remove existing reaction
      await client.query(
        `DELETE FROM lounge_message_reactions
         WHERE message_id = $1 AND player_name = $2 AND emoji = $3`,
        [messageId, playerName, emoji]
      );
      await client.query('COMMIT');
      return { added: false };
    } else {
      // Add new reaction
      const insertResult = await client.query(
        `INSERT INTO lounge_message_reactions (message_id, player_name, emoji)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [messageId, playerName, emoji]
      );
      await client.query('COMMIT');
      return { added: true, reaction: insertResult.rows[0] };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error toggling reaction:', error);
    return { added: false };
  } finally {
    client.release();
  }
}

/**
 * Get all reactions for a message
 */
export async function getMessageReactions(
  messageId: number
): Promise<{ emoji: string; count: number; players: string[] }[]> {
  try {
    const result = await query(
      `SELECT
        emoji,
        COUNT(*) as count,
        array_agg(player_name ORDER BY created_at) as players
       FROM lounge_message_reactions
       WHERE message_id = $1
       GROUP BY emoji
       ORDER BY COUNT(*) DESC`,
      [messageId]
    );

    return result.rows.map(row => ({
      emoji: row.emoji,
      count: parseInt(row.count, 10),
      players: row.players,
    }));
  } catch (error) {
    console.error('Error getting message reactions:', error);
    return [];
  }
}

// ============= Search Operations =============

/**
 * Search lounge messages by text
 */
export async function searchLoungeMessages(
  searchQuery: string,
  limit: number = 50
): Promise<LoungeMessage[]> {
  try {
    const result = await query(
      `SELECT *
       FROM lounge_messages
       WHERE is_deleted = FALSE
         AND to_tsvector('english', message_text) @@ plainto_tsquery('english', $1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [searchQuery, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error searching lounge messages:', error);
    return [];
  }
}

/**
 * Get messages mentioning a specific player
 */
export async function getMessagesMentioning(
  playerName: string,
  limit: number = 50
): Promise<LoungeMessage[]> {
  try {
    const result = await query(
      `SELECT *
       FROM lounge_messages
       WHERE is_deleted = FALSE
         AND $1 = ANY(mentions)
       ORDER BY created_at DESC
       LIMIT $2`,
      [playerName, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting messages mentioning player:', error);
    return [];
  }
}

/**
 * Get messages by a specific player
 */
export async function getMessagesByPlayer(
  playerName: string,
  limit: number = 50
): Promise<LoungeMessage[]> {
  try {
    const result = await query(
      `SELECT *
       FROM lounge_messages
       WHERE is_deleted = FALSE
         AND player_name = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [playerName, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting messages by player:', error);
    return [];
  }
}

// ============= Utility Operations =============

/**
 * Get message count for stats
 */
export async function getLoungeMessageCount(): Promise<number> {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM lounge_messages WHERE is_deleted = FALSE'
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
}

/**
 * Get messages for export (admin function)
 */
export async function exportLoungeMessages(
  startDate?: Date,
  endDate?: Date
): Promise<LoungeMessage[]> {
  try {
    let whereClause = 'WHERE is_deleted = FALSE';
    const params: unknown[] = [];

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    const result = await query(
      `SELECT * FROM lounge_messages ${whereClause} ORDER BY created_at ASC`,
      params
    );

    return result.rows;
  } catch (error) {
    console.error('Error exporting lounge messages:', error);
    return [];
  }
}
