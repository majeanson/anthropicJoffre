/**
 * NotificationCenter Component Stories
 *
 * Floating notification bell with dropdown showing all notifications.
 * Note: This component requires Socket.io - stories show static UI states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { UICard, Button, EmptyState } from '..';

const meta = {
  title: 'Social/NotificationCenter',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# NotificationCenter Component

A floating notification bell with dropdown showing all notifications.

## Features
- **Floating Bell**: Fixed position button in bottom-right corner
- **Badge Count**: Shows unread count (9+ for many)
- **Animated Badge**: Pulse animation draws attention
- **Dropdown Panel**: Expandable notification list
- **Notification Types**: Different icons per type
- **Mark as Read**: Click to mark notifications read
- **Clear All**: Option to remove all notifications
- **Time Formatting**: Relative timestamps (2m ago, 1h ago, etc.)

## Notification Types
- Achievement Unlocked
- Friend Request
- Friend Accepted
- Game Invite
- Mention
- System Message

## States
- Hidden (no unread)
- Bell with badge
- Dropdown open
- Empty notifications
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// MOCK DATA
// =============================================================================

interface MockNotification {
  id: number;
  type: 'achievement_unlocked' | 'friend_request' | 'friend_accepted' | 'game_invite' | 'mention' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const mockNotifications: MockNotification[] = [
  {
    id: 1,
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked!',
    message: 'You earned "First Win" - Win your first game',
    timestamp: '2 min ago',
    isRead: false,
  },
  {
    id: 2,
    type: 'friend_request',
    title: 'Friend Request',
    message: 'Alice wants to be your friend',
    timestamp: '15 min ago',
    isRead: false,
  },
  {
    id: 3,
    type: 'game_invite',
    title: 'Game Invite',
    message: 'Bob invited you to join their game',
    timestamp: '1 hour ago',
    isRead: false,
  },
  {
    id: 4,
    type: 'friend_accepted',
    title: 'Friend Accepted',
    message: 'Charlie accepted your friend request',
    timestamp: '3 hours ago',
    isRead: true,
  },
  {
    id: 5,
    type: 'mention',
    title: 'You were mentioned',
    message: 'Diana mentioned you in game chat',
    timestamp: 'Yesterday',
    isRead: true,
  },
  {
    id: 6,
    type: 'system',
    title: 'System Update',
    message: 'New features have been added! Check them out.',
    timestamp: '2 days ago',
    isRead: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'achievement_unlocked': return '🏆';
    case 'friend_request': return '👥';
    case 'friend_accepted': return '✅';
    case 'game_invite': return '🎮';
    case 'mention': return '💬';
    case 'system': return '📢';
    default: return '🔔';
  }
};

// =============================================================================
// BELL WITH BADGE
// =============================================================================

export const BellWithBadge: Story = {
  name: 'Bell Icon with Badge',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6 w-[300px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Badge Variants</h3>

      <div className="flex items-center gap-8 justify-center">
        {/* Low count */}
        <div className="text-center">
          <div className="relative inline-block">
            <Button variant="primary" size="lg" className="relative p-3 rounded-full">
              <span className="text-2xl">🔔</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                3
              </span>
            </Button>
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs mt-2">3 unread</p>
        </div>

        {/* High count (9+) */}
        <div className="text-center">
          <div className="relative inline-block">
            <Button variant="primary" size="lg" className="relative p-3 rounded-full">
              <span className="text-2xl">🔔</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                9+
              </span>
            </Button>
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs mt-2">Many unread</p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DROPDOWN OPEN
// =============================================================================

export const DropdownOpen: Story = {
  name: 'Dropdown Panel Open',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Notification Panel</h3>

      <UICard variant="elevated" size="md" className="w-full max-h-[500px] flex flex-col border-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-600">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            Notifications
          </h3>
          <div className="flex gap-2">
            <Button variant="primary" size="sm">
              Mark all read
            </Button>
            <Button variant="secondary" size="sm">
              Clear all
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 -mx-4">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer ${
                !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </UICard>
    </div>
  ),
};

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export const NotificationTypes: Story = {
  name: 'All Notification Types',
  render: () => {
    const notificationTypes = [
      { type: 'achievement_unlocked', title: 'Achievement Unlocked!', message: 'You earned a new badge' },
      { type: 'friend_request', title: 'Friend Request', message: 'Someone wants to be your friend' },
      { type: 'friend_accepted', title: 'Friend Accepted', message: 'Your request was accepted' },
      { type: 'game_invite', title: 'Game Invite', message: 'You\'ve been invited to a game' },
      { type: 'mention', title: 'Mentioned', message: 'Someone mentioned you' },
      { type: 'system', title: 'System Message', message: 'Important system update' },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Notification Icons</h3>

        <div className="space-y-2">
          {notificationTypes.map((n) => (
            <div
              key={n.type}
              className="p-3 rounded-lg bg-[var(--color-bg-secondary)] flex items-center gap-3"
            >
              <span className="text-2xl">{getNotificationIcon(n.type)}</span>
              <div>
                <p className="text-[var(--color-text-primary)] font-medium text-sm">{n.title}</p>
                <p className="text-[var(--color-text-secondary)] text-xs">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// =============================================================================
// READ VS UNREAD
// =============================================================================

export const ReadVsUnread: Story = {
  name: 'Read vs Unread States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Read Status</h3>

      <div className="space-y-2">
        {/* Unread */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏆</span>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  New Achievement!
                </p>
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This notification is unread
              </p>
              <p className="text-xs text-gray-500 mt-2">Just now</p>
            </div>
          </div>
        </div>

        {/* Read */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👥</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Friend Request Accepted
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This notification has been read
              </p>
              <p className="text-xs text-gray-500 mt-2">Yesterday</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[var(--color-text-tertiary)] text-xs mt-4 text-center">
        Blue background + dot indicator = unread
      </p>
    </div>
  ),
};

// =============================================================================
// EMPTY STATE
// =============================================================================

export const EmptyNotifications: Story = {
  name: 'No Notifications',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Empty State</h3>

      <UICard variant="elevated" size="md" className="w-full">
        <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-600">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            Notifications
          </h3>
        </div>

        <div className="py-8">
          <EmptyState icon="🔕" title="No notifications" compact />
        </div>
      </UICard>
    </div>
  ),
};

// =============================================================================
// TIME FORMATS
// =============================================================================

export const TimeFormats: Story = {
  name: 'Time Formatting',
  render: () => {
    const timeExamples = [
      { time: 'Just now', description: 'Less than 1 minute' },
      { time: '5m ago', description: '5 minutes ago' },
      { time: '2h ago', description: '2 hours ago' },
      { time: '1d ago', description: '1 day ago' },
      { time: '3d ago', description: '3 days ago' },
      { time: 'Nov 25', description: 'More than a week' },
    ];

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[350px]">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Timestamp Formats</h3>

        <div className="space-y-2">
          {timeExamples.map((t, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-between"
            >
              <span className="text-[var(--color-text-secondary)] text-sm">{t.description}</span>
              <span className="text-[var(--color-text-tertiary)] text-xs">{t.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// =============================================================================
// INTERACTIVE DEMO
// =============================================================================

function InteractiveDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px] h-[600px] relative">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Interactive Demo</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Click the bell to open/close, click notifications to mark as read
      </p>

      {/* Floating Button */}
      <div className="absolute bottom-4 right-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 rounded-full"
        >
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Dropdown */}
        {isOpen && (
          <UICard variant="elevated" size="md" className="absolute right-0 bottom-full mb-2 w-96 max-h-[400px] flex flex-col border-2">
            <div className="flex items-center justify-between pb-4 border-b border-gray-600">
              <h3 className="font-bold text-gray-100">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="primary" size="sm" onClick={handleMarkAllRead}>
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

            <div className="overflow-y-auto flex-1 -mx-4">
              {notifications.length === 0 ? (
                <EmptyState icon="🔕" title="No notifications" compact />
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    className={`p-4 border-b border-gray-700 hover:bg-gray-750 cursor-pointer ${
                      !n.isRead ? 'bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNotificationIcon(n.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-gray-100 text-sm">{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{n.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{n.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </UICard>
        )}
      </div>
    </div>
  );
}

export const Interactive: Story = {
  name: 'Interactive Demo',
  render: () => <InteractiveDemo />,
};
