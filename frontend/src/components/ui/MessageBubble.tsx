/**
 * MessageBubble Component
 *
 * Reusable message display for chat interfaces.
 * Extracted from DirectMessagesPanel for reusability.
 *
 * Features:
 * - Sent vs received styling
 * - Timestamp display
 * - Read status indicator
 * - Auto text wrapping
 *
 * Usage:
 * ```tsx
 * <MessageBubble
 *   text="Hello there!"
 *   isSent={false}
 *   timestamp="2024-01-15T10:30:00Z"
 * />
 *
 * <MessageBubble
 *   text="Hey! How are you?"
 *   isSent={true}
 *   timestamp="2024-01-15T10:31:00Z"
 *   isRead={true}
 * />
 * ```
 */

interface MessageBubbleProps {
  /** Message text content */
  text: string;
  /** Whether this message was sent by the current user */
  isSent: boolean;
  /** Message timestamp (ISO string or Date) */
  timestamp: string | Date;
  /** Whether the message has been read (only for sent messages) */
  isRead?: boolean;
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

export function MessageBubble({
  text,
  isSent,
  timestamp,
  isRead,
  className = '',
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isSent
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 dark:bg-gray-700 text-gray-100'
          }`}
        >
          <p className="break-words">{text}</p>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-2">
          {formatTime(timestamp)}
          {isSent && isRead && ' • Read'}
        </span>
      </div>
    </div>
  );
}
