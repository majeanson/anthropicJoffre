/**
 * Notification Socket.io Handlers
 * Sprint 3 Phase 3.5
 */

import { Socket, Server } from 'socket.io';
import { Logger } from 'winston';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification
} from '../db/notifications';
import { Notification } from '../types/notifications';

/**
 * Dependencies needed by notification handlers
 */
export interface NotificationHandlersDependencies {
  io: Server;
  logger: Logger;
  errorBoundaries: {
    gameAction: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
  };
}

/**
 * Register notification socket handlers
 */
export function registerNotificationHandlers(socket: Socket, deps: NotificationHandlersDependencies): void {
  const { io, logger, errorBoundaries } = deps;

  // Store userId in socket data when authenticated
  // (This would be set during authentication in auth handlers)
  const getUserId = (): number | null => {
    return (socket as any).userId || null;
  };

  /**
   * Get notifications for current user
   */
  socket.on('get_notifications', errorBoundaries.gameAction('get_notifications')(async (limit?: number) => {
    const userId = getUserId();
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const notifications = await getUserNotifications(userId, limit || 50);
      const unreadCount = await getUnreadNotificationCount(userId);

      socket.emit('notifications_updated', notifications);
      socket.emit('notification_count_updated', unreadCount);

      logger.debug('Sent notifications to user', { userId, count: notifications.length, unreadCount });
    } catch (error) {
      logger.error('Error getting notifications', { error, userId });
      socket.emit('error', { message: 'Failed to load notifications' });
    }
  }));

  /**
   * Mark notification as read
   */
  socket.on('mark_notification_read', errorBoundaries.gameAction('mark_notification_read')(async (notificationId: number) => {
    const userId = getUserId();
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const success = await markNotificationRead(notificationId, userId);
      if (success) {
        const unreadCount = await getUnreadNotificationCount(userId);
        socket.emit('notification_count_updated', unreadCount);
        logger.debug('Marked notification as read', { notificationId, userId });
      }
    } catch (error) {
      logger.error('Error marking notification as read', { error, notificationId, userId });
    }
  }));

  /**
   * Mark all notifications as read
   */
  socket.on('mark_all_notifications_read', errorBoundaries.gameAction('mark_all_notifications_read')(async () => {
    const userId = getUserId();
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const count = await markAllNotificationsRead(userId);
      socket.emit('notification_count_updated', 0);
      logger.debug('Marked all notifications as read', { userId, count });
    } catch (error) {
      logger.error('Error marking all notifications as read', { error, userId });
    }
  }));

  /**
   * Delete a notification
   */
  socket.on('delete_notification', errorBoundaries.gameAction('delete_notification')(async (notificationId: number) => {
    const userId = getUserId();
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const success = await deleteNotification(notificationId, userId);
      if (success) {
        const unreadCount = await getUnreadNotificationCount(userId);
        socket.emit('notification_count_updated', unreadCount);
        logger.debug('Deleted notification', { notificationId, userId });
      }
    } catch (error) {
      logger.error('Error deleting notification', { error, notificationId, userId });
    }
  }));

  /**
   * Clear all notifications
   */
  socket.on('clear_all_notifications', errorBoundaries.gameAction('clear_all_notifications')(async () => {
    const userId = getUserId();
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const count = await clearAllNotifications(userId);
      socket.emit('notification_count_updated', 0);
      socket.emit('notifications_updated', []);
      logger.debug('Cleared all notifications', { userId, count });
    } catch (error) {
      logger.error('Error clearing all notifications', { error, userId });
    }
  }));
}

/**
 * Helper function to send notification to a user (called from other parts of the app)
 */
export async function sendNotificationToUser(
  io: Server,
  userId: number,
  notification: Notification
): Promise<void> {
  try {
    // Find sockets for this user
    const sockets = await io.fetchSockets();
    const userSockets = sockets.filter((s: any) => s.userId === userId);

    // Emit to all user's sockets
    for (const userSocket of userSockets) {
      userSocket.emit('notification_received', notification);
    }

    // Also update unread count
    const unreadCount = await getUnreadNotificationCount(userId);
    for (const userSocket of userSockets) {
      userSocket.emit('notification_count_updated', unreadCount);
    }
  } catch (error) {
    console.error('[Notifications] Error sending notification to user:', error);
  }
}
