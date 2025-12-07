/**
 * OnlineStatusBadge Component
 *
 * Displays player online status with icon and text.
 * Extracted from FriendsPanel for reusability.
 *
 * Usage:
 * ```tsx
 * <OnlineStatusBadge status="in_game" />
 * <OnlineStatusBadge status="offline" showText={false} />
 * ```
 */

export type PlayerStatus = 'online' | 'in_game' | 'in_lobby' | 'in_team_selection' | 'offline';

interface OnlineStatusBadgeProps {
  /** Player's current status */
  status: PlayerStatus;
  /** Show status text alongside icon */
  showText?: boolean;
  /** Custom className */
  className?: string;
}

const statusConfig: Record<PlayerStatus, { icon: string; text: string; color: string }> = {
  in_game: {
    icon: '🎮',
    text: 'In Game',
    color: 'text-green-400',
  },
  in_lobby: {
    icon: '🏠',
    text: 'In Lobby',
    color: 'text-blue-400',
  },
  in_team_selection: {
    icon: '👥',
    text: 'Team Selection',
    color: 'text-purple-400',
  },
  offline: {
    icon: '⚫',
    text: 'Offline',
    color: 'text-skin-muted',
  },
  online: {
    icon: '🟢',
    text: 'Online',
    color: 'text-green-400',
  },
};

export function OnlineStatusBadge({
  status,
  showText = true,
  className = '',
}: OnlineStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.online;

  if (!showText) {
    return <span className={`text-2xl ${className}`}>{config.icon}</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-2xl">{config.icon}</span>
      <span className={`text-sm ${config.color}`}>{config.text}</span>
    </div>
  );
}
