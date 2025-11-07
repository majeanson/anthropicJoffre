/**
 * Notification Types
 * Sprint 3 Phase 3.5
 */

export type NotificationType =
  | 'achievement_unlocked'
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invite'
  | 'mention'
  | 'system';

export interface Notification {
  notification_id: number;
  user_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
}

export interface CreateNotificationData {
  user_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  expires_at?: Date;
}

export interface NotificationSocketEvents {
  // Server → Client
  'notification_received': (notification: Notification) => void;
  'notifications_updated': (notifications: Notification[]) => void;
  'notification_count_updated': (count: number) => void;

  // Client → Server
  'get_notifications': (limit?: number) => void;
  'mark_notification_read': (notificationId: number) => void;
  'mark_all_notifications_read': () => void;
  'delete_notification': (notificationId: number) => void;
  'clear_all_notifications': () => void;
}
