/**
 * TableCard - Individual table preview card
 *
 * Shows table name, host, seats, and status.
 * Allows joining or viewing the table.
 */

import { LoungeTable } from '../../types/game';
import { Button } from '../ui/Button';

interface TableCardProps {
  table: LoungeTable;
  onJoin: () => void;
  onView: () => void;
  isJoinable: boolean;
  isCurrentTable?: boolean;
  playerName: string;
}

export function TableCard({
  table,
  onJoin,
  onView,
  isJoinable,
  isCurrentTable,
  playerName,
}: TableCardProps) {
  const humanCount = table.seats.filter(s => s.playerName !== null && !s.isBot).length;
  const botCount = table.seats.filter(s => s.isBot).length;

  const statusColors = {
    gathering: 'text-green-500',
    ready: 'text-yellow-500',
    in_game: 'text-blue-500',
    post_game: 'text-purple-500',
  };

  const statusLabels = {
    gathering: 'Gathering',
    ready: 'Ready to Start',
    in_game: 'Playing',
    post_game: 'Post-Game',
  };

  return (
    <div
      className={`
        bg-skin-tertiary rounded-lg p-3 border-2 transition-all
        ${isCurrentTable
          ? 'border-skin-accent ring-2 ring-skin-accent/30'
          : 'border-skin-default hover:border-skin-accent/50'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-display text-skin-primary text-sm truncate">
              {table.name}
            </h4>
            {table.settings.isPrivate && (
              <span className="text-xs" title="Private table - Invite only">
                🔒
              </span>
            )}
          </div>
          <p className="text-xs text-skin-muted truncate">
            Host: {table.hostName}
          </p>
        </div>
        <span className={`text-xs font-medium ${statusColors[table.status]}`}>
          {statusLabels[table.status]}
        </span>
      </div>

      {/* Seats visualization */}
      <div className="flex gap-1 mb-3">
        {table.seats.map((seat, i) => (
          <div
            key={i}
            className={`
              flex-1 h-8 rounded flex items-center justify-center text-xs
              ${seat.playerName
                ? seat.isBot
                  ? 'bg-skin-muted text-skin-secondary'
                  : seat.playerName === playerName
                    ? 'bg-skin-accent text-skin-inverse'
                    : 'bg-skin-info text-skin-inverse'
                : 'bg-skin-primary border border-dashed border-skin-default text-skin-muted'
              }
            `}
            title={seat.playerName || 'Empty'}
          >
            {seat.playerName ? (
              seat.isBot ? '🤖' : seat.playerName.slice(0, 2).toUpperCase()
            ) : (
              '+'
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-skin-muted">
          {humanCount} player{humanCount !== 1 ? 's' : ''}
          {botCount > 0 && `, ${botCount} bot${botCount !== 1 ? 's' : ''}`}
        </div>

        {isCurrentTable ? (
          <Button variant="primary" size="xs" onClick={onView}>
            Open
          </Button>
        ) : isJoinable ? (
          <Button variant="secondary" size="xs" onClick={onJoin}>
            Join
          </Button>
        ) : table.status === 'in_game' ? (
          <Button variant="ghost" size="xs" onClick={onView}>
            Spectate
          </Button>
        ) : (
          <Button variant="ghost" size="xs" onClick={onView}>
            View
          </Button>
        )}
      </div>
    </div>
  );
}

export default TableCard;
