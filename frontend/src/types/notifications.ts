/**
 * Notification Types (Frontend)
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
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
}
