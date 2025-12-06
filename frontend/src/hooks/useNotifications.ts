/**
 * Notifications Hook
 * Sprint 3 Phase 3.5
 *
 * Custom hook for managing notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Notification } from '../types/notifications';

export function useNotifications(socket: Socket | null, isAuthenticated: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestAchievement, setLatestAchievement] = useState<any>(null);

  // Request notifications when authenticated
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Request initial notifications
    socket.emit('get_notifications', 50);

    // Listen for notifications
    const handleNotificationsUpdated = (updatedNotifications: Notification[]) => {
      setNotifications(updatedNotifications);
      const unread = updatedNotifications.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    };

    const handleNotificationReceived = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.is_read) {
        setUnreadCount((prev) => prev + 1);
      }

      // Check if it's an achievement
      if (notification.notification_type === 'achievement_unlocked' && notification.data) {
        setLatestAchievement(notification.data);
      }
    };

    const handleCountUpdated = (count: number) => {
      setUnreadCount(count);
    };

    socket.on('notifications_updated', handleNotificationsUpdated);
    socket.on('notification_received', handleNotificationReceived);
    socket.on('notification_count_updated', handleCountUpdated);

    return () => {
      socket.off('notifications_updated', handleNotificationsUpdated);
      socket.off('notification_received', handleNotificationReceived);
      socket.off('notification_count_updated', handleCountUpdated);
    };
  }, [socket, isAuthenticated]);

  const markAsRead = useCallback(
    (notificationId: number) => {
      if (!socket) return;
      socket.emit('mark_notification_read', notificationId);

      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [socket]
  );

  const markAllAsRead = useCallback(() => {
    if (!socket) return;
    socket.emit('mark_all_notifications_read');

    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [socket]);

  const clearAll = useCallback(() => {
    if (!socket) return;
    socket.emit('clear_all_notifications');

    // Optimistically update UI
    setNotifications([]);
    setUnreadCount(0);
  }, [socket]);

  const dismissAchievement = useCallback(() => {
    setLatestAchievement(null);
  }, []);

  return {
    notifications,
    unreadCount,
    latestAchievement,
    markAsRead,
    markAllAsRead,
    clearAll,
    dismissAchievement,
  };
}
