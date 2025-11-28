/**
 * ConversationItem Component
 *
 * List item for message conversations with preview and unread count.
 * Extracted from DirectMessagesPanel for reusability.
 *
 * Features:
 * - Avatar display
 * - Message preview
 * - Timestamp
 * - Unread count badge
 * - Selection state
 *
 * Usage:
 * ```tsx
 * <ConversationItem
 *   username="JohnDoe"
 *   avatarUrl={null}
 *   lastMessage="Hey, how are you?"
 *   timestamp="2024-01-15T10:30:00Z"
 *   unreadCount={3}
 *   isSelected={false}
 *   onClick={() => selectConversation('JohnDoe')}
 * />
 * ```
 */

import { ReactNode } from 'react';

interface ConversationItemProps {
  /** Other user's username */
  username: string;
  /** Other user's avatar URL or component */
  avatar?: ReactNode;
  /** avatarUrl for default Avatar component */
  avatarUrl?: string | null;
  /** Preview of last message */
  lastMessage: string;
  /** Timestamp of last message */
  timestamp: string | Date;
  /** Number of unread messages */
  unreadCount?: number;
  /** Whether this conversation is selected */
  isSelected?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (hours < 24) {
    return `${Math.floor(hours)}h ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function ConversationItem({
  username,
  avatar,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isSelected = false,
  onClick,
  className = '',
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 flex items-start gap-3
        hover:bg-gray-700/50 dark:hover:bg-gray-700/50
        transition-colors text-left
        ${isSelected ? 'bg-blue-900/30 border-l-2 border-blue-500' : ''}
        ${className}
      `}
    >
      {/* Avatar */}
      {avatar && <div className="flex-shrink-0">{avatar}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-white truncate">{username}</span>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
            {formatTime(timestamp)}
          </span>
        </div>
        <p className="text-sm text-gray-400 truncate">{lastMessage}</p>
        {unreadCount > 0 && (
          <div className="mt-1">
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
