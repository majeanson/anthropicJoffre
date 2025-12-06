/**
 * PlayerAvatar Component
 * Sprint 16 Task 3.3
 *
 * In-game player avatar display that combines avatar, name, and optional indicators.
 * Designed for use in game boards, player lists, and lobby displays.
 *
 * Features:
 * - Avatar display (using Avatar component)
 * - Player name (optionally clickable via PlayerNameButton)
 * - Team indicator badge
 * - Online/offline status dot
 * - Bot indicator
 * - Current turn highlight
 * - Dealer indicator
 * - Compact and full variants
 *
 * Usage:
 * ```tsx
 * <PlayerAvatar
 *   playerName="Alice"
 *   teamId={1}
 *   isBot={false}
 *   isCurrentTurn={true}
 *   isDealer={false}
 *   variant="full"
 *   onClickName={() => openProfile("Alice")}
 * />
 * ```
 */

import Avatar from './Avatar';
import { PlayerNameButton } from './PlayerNameButton';

interface PlayerAvatarProps {
  playerName: string;
  avatarUrl?: string | null;
  teamId?: 1 | 2 | null;
  isBot?: boolean;
  isOnline?: boolean;
  isCurrentTurn?: boolean;
  isDealer?: boolean;
  variant?: 'compact' | 'full'; // compact = avatar only, full = avatar + name
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean; // Make name clickable
  onClickName?: () => void;
  className?: string;
}

export function PlayerAvatar({
  playerName,
  avatarUrl,
  teamId,
  isBot = false,
  isOnline = true,
  isCurrentTurn = false,
  isDealer = false,
  variant = 'full',
  size = 'md',
  clickable = false,
  onClickName,
  className = '',
}: PlayerAvatarProps) {
  // Team colors
  const teamBadgeColor =
    teamId === 1
      ? 'bg-orange-600 text-white border-orange-400'
      : teamId === 2
        ? 'bg-purple-600 text-white border-purple-400'
        : 'bg-gray-600 text-white border-gray-400';

  // Current turn highlight
  const turnHighlight = isCurrentTurn
    ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900'
    : '';

  // Size mappings
  const containerPadding = variant === 'full' ? 'p-2' : 'p-1';

  return (
    <div className={`relative inline-flex items-center gap-2 ${containerPadding} ${className}`}>
      {/* Avatar with indicators */}
      <div className="relative">
        <Avatar username={playerName} avatarUrl={avatarUrl} size={size} className={turnHighlight} />

        {/* Online status dot (top-right) */}
        {!isBot && (
          <div
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
            title={isOnline ? 'Online' : 'Offline'}
          />
        )}

        {/* Bot indicator (bottom-right) */}
        {isBot && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-600 border-2 border-gray-900 flex items-center justify-center text-xs"
            title="Bot Player"
          >
            🤖
          </div>
        )}

        {/* Dealer indicator (bottom-left) */}
        {isDealer && (
          <div
            className="absolute -bottom-0.5 -left-0.5 w-5 h-5 rounded-full bg-yellow-600 border-2 border-gray-900 flex items-center justify-center text-xs"
            title="Dealer"
          >
            ♦️
          </div>
        )}

        {/* Team badge (top-left) */}
        {teamId && variant === 'compact' && (
          <div
            className={`absolute -top-1 -left-1 w-5 h-5 rounded-full ${teamBadgeColor} border-2 flex items-center justify-center text-xs font-bold`}
            title={`Team ${teamId}`}
          >
            {teamId}
          </div>
        )}
      </div>

      {/* Player info (full variant only) */}
      {variant === 'full' && (
        <div className="flex flex-col min-w-0">
          {/* Player name */}
          <div className="flex items-center gap-1">
            {clickable && onClickName ? (
              <PlayerNameButton
                playerName={playerName}
                onClick={onClickName}
                variant="inline"
                className="text-sm font-semibold truncate"
              />
            ) : (
              <span className="text-sm font-semibold text-white truncate">{playerName}</span>
            )}
            {isBot && <span className="text-xs text-blue-400">🤖</span>}
          </div>

          {/* Team badge */}
          {teamId && (
            <div className="flex items-center gap-1">
              <div className={`px-2 py-0.5 rounded ${teamBadgeColor} border text-xs font-semibold`}>
                Team {teamId}
              </div>
              {isDealer && (
                <span className="text-xs text-yellow-400" title="Dealer">
                  ♦️ Dealer
                </span>
              )}
            </div>
          )}

          {/* Current turn indicator */}
          {isCurrentTurn && (
            <span className="text-xs text-green-400 font-semibold">▶ Your Turn</span>
          )}
        </div>
      )}
    </div>
  );
}
