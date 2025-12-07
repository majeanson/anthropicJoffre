import { ElegantButton } from '../ui/Button';
import { RecentGame } from './types';
import { getTimeAgo } from './utils';

interface RecentGameCardProps {
  game: RecentGame;
  isSelected: boolean;
  onWatchReplay: () => void;
}

export function RecentGameCard({ game, isSelected, onWatchReplay }: RecentGameCardProps) {
  const durationMinutes = Math.floor(game.game_duration_seconds / 60);
  const finishedDate = new Date(game.finished_at);
  const timeAgo = getTimeAgo(finishedDate);

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
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-display text-lg sm:text-xl uppercase tracking-wider text-skin-primary text-shadow-glow-sm">
              Game {game.game_id}
            </span>
            <span
              className={`
                px-2 py-0.5 rounded-full text-xs font-display uppercase text-white
                ${game.winning_team === 1 ? 'bg-team1 shadow-team1' : 'bg-team2 shadow-team2'}
              `}
            >
              🏆 Team {game.winning_team} Won
            </span>
          </div>
          <div className="text-sm text-skin-muted font-body flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              📊 Score: {game.team1_score} - {game.team2_score}
            </span>
            <span>🎯 {game.rounds} rounds</span>
            <span>⏱️ {durationMinutes}m</span>
            <span>🕒 {timeAgo}</span>
          </div>
        </div>

        <ElegantButton onClick={onWatchReplay} size="sm" glow>
          <span aria-hidden="true">📺</span>
          Watch Replay
        </ElegantButton>
      </div>
    </div>
  );
}
