/**
 * Notification Database Functions
 * Sprint 3 Phase 3.5
 */

import { query, getPool } from './index';
import { Notification, CreateNotificationData } from '../types/notifications';

/**
 * Create a new notification
 */
export async function createNotification(data: CreateNotificationData): Promise<Notification | null> {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, notification_type, title, message, data, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.user_id,
        data.notification_type,
        data.title,
        data.message,
        data.data ? JSON.stringify(data.data) : null,
        data.expires_at || null
      ]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    return null;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: number,
  limit: number = 50,
  includeRead: boolean = true
): Promise<Notification[]> {
  try {
    const whereClause = includeRead
      ? 'user_id = $1'
      : 'user_id = $1 AND is_read = FALSE';

    const result = await query(
      `SELECT * FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('[Notifications] Error getting notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    console.error('[Notifications] Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: number, userId: number): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id`,
      [notificationId, userId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[Notifications] Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: number): Promise<number> {
  try {
    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING notification_id`,
      [userId]
    );

    return result.rowCount ?? 0;
  } catch (error) {
    console.error('[Notifications] Error marking all notifications as read:', error);
    return 0;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number, userId: number): Promise<boolean> {
  try {
    const result = await query(
      `DELETE FROM notifications
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id`,
      [notificationId, userId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[Notifications] Error deleting notification:', error);
    return false;
  }
}

/**
 * Clear all notifications for a user
 */
export async function clearAllNotifications(userId: number): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM notifications
       WHERE user_id = $1
       RETURNING notification_id`,
      [userId]
    );

    return result.rowCount ?? 0;
  } catch (error) {
    console.error('[Notifications] Error clearing all notifications:', error);
    return 0;
  }
}

/**
 * Delete expired notifications (cleanup task)
 */
export async function deleteExpiredNotifications(): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM notifications
       WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
       RETURNING notification_id`
    );

    return result.rowCount ?? 0;
  } catch (error) {
    console.error('[Notifications] Error deleting expired notifications:', error);
    return 0;
  }
}
