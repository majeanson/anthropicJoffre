/**
 * Friend Request Notification Component
 * Sprint 2 Phase 2
 *
 * Shows a toast notification when a friend request is received
 */

import { useEffect } from 'react';
import { FriendRequestNotification } from '../types/friends';

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
      <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg shadow-2xl border-2 border-purple-500/50 p-4 w-80">
        <div className="flex items-start gap-3">
          <span className="text-3xl">👥</span>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Friend Request</h3>
            <p className="text-gray-200 text-sm mt-1">
              <span className="font-semibold">{notification.from_player}</span> sent you a friend request
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  onView();
                  onClose();
                }}
                className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-semibold transition-colors"
              >
                View
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
