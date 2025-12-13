/**
 * ActivityFeed - Real-time social stream
 *
 * Shows what's happening in the lounge:
 * - Players joining/leaving
 * - Tables being created
 * - Games finishing
 * - People looking for games
 * - Social interactions (waves)
 */

import { LoungeActivity } from '../../types/game';

interface ActivityFeedProps {
  activities: LoungeActivity[];
  onPlayerClick: (playerName: string) => void;
  onTableClick: (tableId: string) => void;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return 'earlier';
}

function getActivityConfig(type: LoungeActivity['type']): { icon: string; color: string } {
  switch (type) {
    case 'player_joined_lounge':
      return { icon: '👋', color: 'bg-green-500/20 border-green-500/30' };
    case 'player_left_lounge':
      return { icon: '🚪', color: 'bg-skin-tertiary border-skin-default' };
    case 'table_created':
      return { icon: '🎴', color: 'bg-yellow-500/20 border-yellow-500/30' };
    case 'table_started':
      return { icon: '🎮', color: 'bg-blue-500/20 border-blue-500/30' };
    case 'game_finished':
      return { icon: '🏆', color: 'bg-purple-500/20 border-purple-500/30' };
    case 'player_looking_for_game':
      return { icon: '🔍', color: 'bg-orange-500/20 border-orange-500/30' };
    case 'player_waved':
      return { icon: '✋', color: 'bg-pink-500/20 border-pink-500/30' };
    case 'achievement_unlocked':
      return { icon: '🎖️', color: 'bg-amber-500/20 border-amber-500/30' };
    default:
      return { icon: '📢', color: 'bg-skin-tertiary border-skin-default' };
  }
}

function getActivityMessage(activity: LoungeActivity): React.ReactNode {
  const { type, playerName, data } = activity;

  switch (type) {
    case 'player_joined_lounge':
      return <><strong className="text-green-400">{playerName}</strong> joined the lounge</>;
    case 'player_left_lounge':
      return <><strong className="text-skin-muted">{playerName}</strong> left</>;
    case 'table_created':
      return <><strong className="text-yellow-400">{playerName}</strong> started <strong className="text-skin-primary">{data.tableName}</strong></>;
    case 'table_started':
      return <>Game started at <strong className="text-blue-400">{data.tableName}</strong></>;
    case 'game_finished':
      return <>Game ended: <strong className="text-purple-400">{data.gameResult?.score}</strong></>;
    case 'player_looking_for_game':
      return <><strong className="text-orange-400">{playerName}</strong> is looking for a game</>;
    case 'player_waved':
      return <><strong className="text-pink-400">{playerName}</strong> waved at <strong className="text-skin-primary">{data.targetPlayer}</strong></>;
    case 'achievement_unlocked':
      return <><strong className="text-amber-400">{playerName}</strong> earned <strong className="text-skin-primary">{data.achievementName}</strong></>;
    default:
      return <>{playerName}</>;
  }
}

export function ActivityFeed({
  activities,
  onPlayerClick,
  onTableClick,
}: ActivityFeedProps) {
  return (
    <div
      className="bg-skin-secondary rounded-xl border-2 border-skin-default overflow-hidden"
      role="log"
      aria-label="Activity feed"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Header */}
      <div className="
        bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent
        border-b border-skin-default
        px-4 py-3
      ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
              Activity
            </h3>
          </div>
          {activities.length > 0 && (
            <span className="text-xs text-skin-muted">
              {activities.length} recent
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="
              w-16 h-16 mx-auto mb-3 rounded-2xl
              bg-gradient-to-br from-skin-tertiary to-skin-primary
              flex items-center justify-center
              border-2 border-dashed border-skin-default
            ">
              <span className="text-3xl opacity-40">🦗</span>
            </div>
            <p className="text-sm text-skin-primary mb-1">Nothing happening yet</p>
            <p className="text-xs text-skin-muted">Start a table or invite friends!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {activities.slice(0, 20).map((activity, index) => {
              const config = getActivityConfig(activity.type);
              const isNew = Date.now() - activity.timestamp < 10000;

              return (
                <div
                  key={activity.id}
                  className={`
                    flex items-start gap-3 p-2.5 rounded-xl border
                    ${config.color}
                    hover:scale-[1.01] hover:shadow-sm
                    transition-all duration-200 cursor-pointer
                    ${isNew ? 'animate-pulse' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                  onClick={() => {
                    if (activity.data.tableId) {
                      onTableClick(activity.data.tableId);
                    } else {
                      onPlayerClick(activity.playerName);
                    }
                  }}
                >
                  <span className="
                    text-lg flex-shrink-0
                    w-8 h-8 rounded-lg
                    bg-skin-primary/50
                    flex items-center justify-center
                  ">
                    {config.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-skin-secondary line-clamp-2">
                      {getActivityMessage(activity)}
                    </p>
                    <p className="text-[10px] text-skin-muted mt-0.5">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;
