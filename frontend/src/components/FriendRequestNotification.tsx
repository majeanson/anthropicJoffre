/**
 * Friend Request Notification Component
 * Sprint 2 Phase 2
 *
 * Shows a toast notification when a friend request is received
 */

import { useEffect } from 'react';
import { FriendRequestNotification } from '../types/friends';
import { UICard } from './ui/UICard';
import { Button } from './ui/Button';

interface FriendRequestNotificationProps {
  notification: FriendRequestNotification | null;
  onClose: () => void;
  onView: () => void;
}

export default function FriendRequestNotificationComponent({
  notification,
  onClose,
  onView
}: FriendRequestNotificationProps) {
  // Early return BEFORE hooks
  if (!notification) return null;

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <UICard variant="gradient" gradient="team2" size="md" className="w-80 border-2">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">👥</span>
          <div className="flex-1">
            <h3 className="text-purple-900 dark:text-white font-bold text-lg">Friend Request</h3>
            <p className="text-purple-800 dark:text-white/90 text-sm mt-1">
              <span className="font-semibold">{notification.from_player}</span> sent you a friend request
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onView();
                  onClose();
                }}
                className="flex-1 bg-purple-200 hover:bg-purple-300 text-purple-900 dark:bg-white/20 dark:hover:bg-white/30 dark:text-white"
              >
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800/50 dark:hover:bg-gray-800/70 dark:text-white"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-purple-700 hover:text-purple-900 dark:text-white/80 dark:hover:text-white text-xl font-bold p-0 w-6 h-6"
          >
            ×
          </Button>
        </div>
      </UICard>
    </div>
  );
}
