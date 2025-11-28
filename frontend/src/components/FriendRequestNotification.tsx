/**
 * Friend Request Notification Component
 * Sprint 2 Phase 2
 *
 * Shows a toast notification when a friend request is received
 */

import { useEffect } from 'react';
import { FriendRequestNotification } from '../types/friends';
import { colors } from '../design-system';

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
      <div
        style={{
          background: `linear-gradient(to bottom right, ${colors.secondary.start}, ${colors.secondary.end})`,
          borderColor: colors.secondary.border
        }}
        className="rounded-lg shadow-2xl border-2 p-4 w-80"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">👥</span>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Friend Request</h3>
            <p className="text-white/90 text-sm mt-1">
              <span className="font-semibold">{notification.from_player}</span> sent you a friend request
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  onView();
                  onClose();
                }}
                className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded font-semibold transition-all focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                View
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800/70 text-white text-sm rounded transition-all focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
