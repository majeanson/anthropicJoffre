/**
 * Match Card Component
 * Sprint 3 Phase 3.3
 *
 * Displays a single game history entry with win/loss, scores, stats, and replay button
 */

import { GameHistoryEntry } from '../types/game';
import { UICard } from './ui/UICard';
import { UIBadge } from './ui/UIBadge';
import { Button } from './ui/Button';

interface MatchCardProps {
  game: GameHistoryEntry;
  onViewReplay?: (gameId: string) => void;
  onViewDetails?: (gameId: string) => void;
}

export function MatchCard({ game, onViewReplay, onViewDetails }: MatchCardProps) {
  const isFinished = game.is_finished;
  const isWin = game.won_game;

  // Determine the gradient/status based on game state
  const getGradient = () => {
    if (!isFinished) return 'warning'; // Yellow/amber for in-progress
    return isWin ? 'success' : 'error';
  };

  // Get status text
  const getStatusText = () => {
    if (!isFinished) return '⏳ In Progress';
    return isWin ? '✓ Victory' : '✗ Defeat';
  };

  // Get status color class
  const getStatusColorClass = () => {
    if (!isFinished) return 'text-amber-700';
    return isWin ? 'text-green-700' : 'text-red-700';
  };

  return (
    <UICard
      variant="gradient"
      gradient={getGradient()}
      onClick={onViewDetails ? () => onViewDetails(game.game_id) : undefined}
      className={onViewDetails ? 'cursor-pointer' : ''}
    >
      {/* Header: Result + Date */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-bold ${getStatusColorClass()}`}>{getStatusText()}</span>
            {game.team_id && (
              <UIBadge
                variant="solid"
                color={game.team_id === 1 ? 'team1' : 'team2'}
                size="xs"
                shape="pill"
              >
                Team {game.team_id}
              </UIBadge>
            )}
          </div>
          <div className="text-sm text-skin-muted">
            {game.finished_at
              ? new Date(game.finished_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : game.created_at
                ? `Started ${new Date(game.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'In Progress'}
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-bold text-skin-primary">
            {game.team1_score ?? 0} - {game.team2_score ?? 0}
          </div>
          <div className="text-xs text-skin-muted">
            {game.rounds ?? 0} round{(game.rounds ?? 0) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Stats - Only show if we have data */}
      <div className="grid grid-cols-3 gap-3 text-sm mb-3 pt-3 border-t border-skin-default">
        <div>
          <p className="text-skin-muted">Tricks Won</p>
          <p className="font-bold text-skin-primary">{game.tricks_won ?? '-'}</p>
        </div>
        <div>
          <p className="text-skin-muted">Points Earned</p>
          <p className="font-bold text-skin-primary">{game.points_earned ?? '-'}</p>
        </div>
        {game.bet_amount !== null && game.bet_amount !== undefined ? (
          <div>
            <p className="text-skin-muted">Bet</p>
            <p className="font-bold text-skin-primary">
              {game.bet_amount} {game.bet_won === true ? '✓' : game.bet_won === false ? '✗' : ''}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-skin-muted">Status</p>
            <p className="font-bold text-skin-primary">{isFinished ? 'N/A' : 'Active'}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {game.is_finished ? (
        // View Replay for finished games
        onViewReplay && (
          <Button
            variant="secondary"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onViewReplay(game.game_id);
            }}
          >
            <span aria-hidden="true">📺</span> View Replay
          </Button>
        )
      ) : (
        // Resume button for unfinished games
        <Button
          variant="warning"
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement resume game functionality
          }}
          disabled
          title="Resume functionality coming soon"
        >
          <span aria-hidden="true">▶️</span> Resume Game (Coming Soon)
        </Button>
      )}
    </UICard>
  );
}
