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
  onView,
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
          <span className="text-3xl" aria-hidden="true">
            👥
          </span>
          <div className="flex-1">
            <h3 className="text-skin-primary font-bold text-lg">Friend Request</h3>
            <p className="text-skin-secondary text-sm mt-1">
              <span className="font-semibold">{notification.from_player}</span> sent you a friend
              request
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onView();
                  onClose();
                }}
                className="flex-1 bg-team2/20 hover:bg-team2/30 text-team2"
              >
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="bg-skin-tertiary hover:bg-skin-tertiary/80 text-skin-primary"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-team2 hover:text-team2/80 text-xl font-bold p-0 w-6 h-6"
          >
            ×
          </Button>
        </div>
      </UICard>
    </div>
  );
}
