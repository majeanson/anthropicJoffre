/**
 * Notification Center Component
 * Sprint 3 Phase 3.5
 *
 * Displays notifications with a bell icon and badge
 * Shows dropdown with list of notifications when clicked
 */

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Notification } from '../types/notifications';
import { UICard, Button, EmptyState } from './ui';

interface NotificationCenterProps {
  socket: Socket | null;
  isAuthenticated: boolean;
  onJoinGame?: (gameId: string) => void;
}

export function NotificationCenter({
  socket,
  isAuthenticated,
  onJoinGame,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notifications when authenticated
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    socket.emit('get_notifications', 50);

    // Listen for notifications
    const handleNotificationsUpdated = (updatedNotifications: Notification[]) => {
      setNotifications(updatedNotifications);
    };

    const handleNotificationReceived = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
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

  const handleMarkAsRead = (notificationId: number) => {
    if (!socket) return;
    socket.emit('mark_notification_read', notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (!socket) return;
    socket.emit('mark_all_notifications_read');
  };

  const handleClearAll = () => {
    if (!socket) return;
    if (confirm('Clear all notifications?')) {
      socket.emit('clear_all_notifications');
      setNotifications([]);
      setIsOpen(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement_unlocked':
        return '🏆';
      case 'friend_request':
        return '👥';
      case 'friend_request_accepted':
        return '🤝';
      case 'friend_accepted':
        return '✅';
      case 'game_invite':
        return '🎮';
      case 'mention':
        return '💬';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  // Only show if authenticated and has notifications (either unread count > 0 OR has any notifications)
  const hasNotifications = unreadCount > 0 || notifications.length > 0;
  if (!isAuthenticated || !hasNotifications) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40" ref={dropdownRef}>
      {/* Floating Bell Button with Badge */}
      <Button
        variant="primary"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-full"
        title="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown - Positioned above the floating button */}
      {isOpen && (
        <UICard
          variant="elevated"
          size="md"
          className="absolute right-0 bottom-full mb-2 w-96 z-50 max-h-[600px] flex flex-col border-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
            <h3 className="font-bold text-lg text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="primary" size="sm" onClick={handleMarkAllAsRead}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="secondary" size="sm" onClick={handleClearAll}>
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 -mx-4">
            {notifications.length === 0 ? (
              <EmptyState icon="🔕" title="No notifications" compact />
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.notification_id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {formatTime(notification.created_at)}
                        </p>
                        {notification.notification_type === 'game_invite' &&
                          notification.data?.game_id &&
                          onJoinGame && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.notification_id);
                                onJoinGame(notification.data!.game_id);
                                setIsOpen(false);
                              }}
                            >
                              Join Game
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </UICard>
      )}
    </div>
  );
}
