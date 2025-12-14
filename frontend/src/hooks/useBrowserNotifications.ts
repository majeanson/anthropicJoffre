/**
 * Browser Notifications Hook
 *
 * Handles browser notification permission and display.
 * Shows notifications only when the page is not visible (user is on another tab).
 *
 * Features:
 * - Permission request on first interaction
 * - Click-to-focus behavior
 * - Respects user's notification preferences
 * - Graceful degradation when notifications not supported
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface NotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Optional icon URL */
  icon?: string;
  /** Optional tag for grouping/replacing notifications */
  tag?: string;
  /** Whether to require user interaction to dismiss */
  requireInteraction?: boolean;
  /** Optional click handler */
  onClick?: () => void;
}

interface UseBrowserNotificationsReturn {
  /** Current permission state */
  permission: NotificationPermission | 'unsupported';
  /** Request permission from user */
  requestPermission: () => Promise<boolean>;
  /** Show a notification (only if page not visible and permission granted) */
  showNotification: (options: NotificationOptions) => void;
  /** Whether the page is currently visible */
  isPageVisible: boolean;
}

/**
 * Hook for browser notifications
 * Notifications only appear when the page is not visible (tab in background)
 */
export function useBrowserNotifications(): UseBrowserNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

  // Track active notifications for cleanup
  const activeNotifications = useRef<Notification[]>([]);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);

      // Close all notifications when page becomes visible
      if (visible) {
        activeNotifications.current.forEach(n => n.close());
        activeNotifications.current = [];
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') {
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      // Safari fallback (callback-based)
      return new Promise((resolve) => {
        Notification.requestPermission((result) => {
          setPermission(result);
          resolve(result === 'granted');
        });
      });
    }
  }, []);

  // Show notification
  const showNotification = useCallback((options: NotificationOptions) => {
    // Don't show if page is visible - user can see the in-app notification
    if (isPageVisible) return;

    // Don't show if permission not granted
    if (permission !== 'granted') return;

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
      });

      // Track for cleanup
      activeNotifications.current.push(notification);

      // Handle click - focus the window and call custom handler
      notification.onclick = () => {
        window.focus();
        notification.close();
        options.onClick?.();
      };

      // Auto-cleanup after 10 seconds
      setTimeout(() => {
        notification.close();
        activeNotifications.current = activeNotifications.current.filter(n => n !== notification);
      }, 10000);

      // Remove from tracking when closed
      notification.onclose = () => {
        activeNotifications.current = activeNotifications.current.filter(n => n !== notification);
      };
    } catch (err) {
      console.warn('Failed to show notification:', err);
    }
  }, [isPageVisible, permission]);

  return {
    permission,
    requestPermission,
    showNotification,
    isPageVisible,
  };
}

export default useBrowserNotifications;
