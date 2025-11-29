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
  const isWin = game.won_game;

  return (
    <UICard
      variant="gradient"
      gradient={isWin ? 'success' : 'error'}
      onClick={onViewDetails ? () => onViewDetails(game.game_id) : undefined}
      className={onViewDetails ? 'cursor-pointer' : ''}
    >
      {/* Header: Result + Date */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-bold ${
              isWin
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {isWin ? '✓ Victory' : '✗ Defeat'}
            </span>
            <UIBadge variant="solid" color={game.team_id === 1 ? 'team1' : 'team2'} size="xs" shape="pill">
              Team {game.team_id}
            </UIBadge>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {game.finished_at ? new Date(game.finished_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'In Progress'}
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {game.team1_score} - {game.team2_score}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {game.rounds} rounds
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-sm mb-3 pt-3 border-t border-gray-300 dark:border-gray-600">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Tricks Won</p>
          <p className="font-bold text-gray-900 dark:text-gray-100">{game.tricks_won}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Points Earned</p>
          <p className="font-bold text-gray-900 dark:text-gray-100">{game.points_earned}</p>
        </div>
        {game.bet_amount !== null && (
          <div>
            <p className="text-gray-600 dark:text-gray-400">Bet</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {game.bet_amount} {game.bet_won === true ? '✓' : game.bet_won === false ? '✗' : ''}
            </p>
          </div>
        )}
      </div>

      {/* View Replay Button */}
      {onViewReplay && game.is_finished && (
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
      )}
    </UICard>
  );
}
