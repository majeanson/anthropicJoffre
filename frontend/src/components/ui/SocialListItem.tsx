/**
 * SocialListItem Component
 *
 * Reusable list item for displaying friends, players, or social connections.
 * Extracted from FriendsPanel for use across multiple social features.
 *
 * Features:
 * - Avatar with online status indicator
 * - Player name and metadata
 * - Flexible action buttons
 * - Hover effects
 *
 * Usage:
 * ```tsx
 * <SocialListItem
 *   playerName="JohnDoe"
 *   status="in_game"
 *   metadata="Level 25"
 *   actions={
 *     <>
 *       <Button size="sm" variant="primary">Message</Button>
 *       <Button size="sm" variant="secondary">Remove</Button>
 *     </>
 *   }
 * />
 * ```
 */

import { ReactNode } from 'react';
import { OnlineStatusBadge, PlayerStatus } from './OnlineStatusBadge';

interface SocialListItemProps {
  /** Player's username */
  playerName: string;
  /** Player's online status */
  status?: PlayerStatus;
  /** Additional metadata to display (e.g., "Level 25", "10 games played") */
  metadata?: string;
  /** Action buttons or elements */
  actions?: ReactNode;
  /** Custom avatar element (replaces default status icon) */
  avatar?: ReactNode;
  /** Click handler for the item itself */
  onClick?: () => void;
  /** Custom className */
  className?: string;
}

export function SocialListItem({
  playerName,
  status = 'online',
  metadata,
  actions,
  avatar,
  onClick,
  className = '',
}: SocialListItemProps) {
  return (
    <div
      className={`
        bg-parchment-200 dark:bg-gray-800/50 rounded-lg p-4
        flex items-center justify-between
        hover:bg-parchment-300 dark:hover:bg-gray-700
        transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {avatar || <OnlineStatusBadge status={status} showText={false} />}

        <div className="min-w-0 flex-1">
          <p className="text-gray-900 dark:text-white font-semibold truncate">{playerName}</p>
          {metadata && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{metadata}</p>
          )}
          {status && !avatar && (
            <p
              className={`text-sm ${status === 'offline' ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}`}
            >
              {status === 'in_game' && 'In Game'}
              {status === 'in_lobby' && 'In Lobby'}
              {status === 'in_team_selection' && 'Team Selection'}
              {status === 'offline' && 'Offline'}
              {status === 'online' && 'Online'}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
    </div>
  );
}
