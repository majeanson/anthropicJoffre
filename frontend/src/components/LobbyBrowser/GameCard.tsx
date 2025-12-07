import { Button, ElegantButton } from '../ui/Button';
import { LobbyGame } from './types';
import { getPhaseColor, getPhaseLabel } from './utils';

interface GameCardProps {
  game: LobbyGame;
  isSelected: boolean;
  onJoin: () => void;
  onSpectate: () => void;
}

export function GameCard({ game, isSelected, onJoin, onSpectate }: GameCardProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-lg)]
        border-2
        p-4
        transition-all duration-[var(--duration-fast)]
        ${
          isSelected
            ? 'border-[var(--color-text-accent)] bg-[var(--color-text-accent)]/10'
            : 'border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-accent)]'
        }
      `}
      style={isSelected ? { boxShadow: '0 0 15px var(--color-glow)' } : {}}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Game ID and badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-display text-lg sm:text-xl uppercase tracking-wider text-skin-primary drop-shadow-[0_0_5px_var(--color-glow)]">
              Game {game.gameId}
            </span>
            <span
              className="
                px-2 py-0.5
                rounded-full
                text-xs font-display uppercase
              "
              style={{
                backgroundColor: getPhaseColor(game.phase),
                color: 'var(--color-text-inverse)',
                boxShadow: `0 0 8px ${getPhaseColor(game.phase)}`,
              }}
            >
              {getPhaseLabel(game.phase)}
            </span>
            <span
              className={`
                px-2 py-0.5
                rounded-full
                text-xs font-display uppercase
                ${
                  game.persistenceMode === 'elo'
                    ? 'bg-skin-status-warning text-black shadow-badge-warning'
                    : 'bg-skin-secondary text-skin-muted'
                }
              `}
            >
              {game.persistenceMode === 'elo' ? '🏆 Ranked' : '🎲 Casual'}
            </span>
          </div>
          {/* Player info */}
          <div className="text-sm text-skin-muted font-body flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              👥 {game.humanPlayerCount} player
              {game.humanPlayerCount !== 1 ? 's' : ''}
            </span>
            {game.botPlayerCount > 0 && (
              <span>
                🤖 {game.botPlayerCount} bot{game.botPlayerCount !== 1 ? 's' : ''}
              </span>
            )}
            {game.isInProgress && <span>📊 Round {game.roundNumber}</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 sm:flex-shrink-0">
          {(game.isJoinable || (game.isInProgress && game.botPlayerCount > 0)) && (
            <Button onClick={onJoin} variant="success" size="sm" className="flex-1 sm:flex-none">
              Join
            </Button>
          )}
          {game.isInProgress && (
            <ElegantButton onClick={onSpectate} size="sm" className="flex-1 sm:flex-none">
              <span>👁️</span>
              Spectate
            </ElegantButton>
          )}
        </div>
      </div>
    </div>
  );
}
