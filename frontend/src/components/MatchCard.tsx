/**
 * Match Card Component
 * Sprint 3 Phase 3.3
 *
 * Displays a single game history entry with win/loss, scores, stats, and replay button
 */

import { GameHistoryEntry } from '../types/game';

interface MatchCardProps {
  game: GameHistoryEntry;
  onViewReplay?: (gameId: string) => void;
  onViewDetails?: (gameId: string) => void;
}

export function MatchCard({ game, onViewReplay, onViewDetails }: MatchCardProps) {
  const isWin = game.won_game;

  return (
    <div
      onClick={() => onViewDetails?.(game.game_id)}
      className={`rounded-lg p-4 border-2 transition-all hover:shadow-lg ${
        onViewDetails ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${
        isWin
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
          : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600'
      }`}
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
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              game.team_id === 1
                ? 'bg-orange-500 text-white'
                : 'bg-purple-500 text-white'
            }`}>
              Team {game.team_id}
            </span>
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewReplay(game.game_id);
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-bold transition-all"
        >
          📺 View Replay
        </button>
      )}
    </div>
  );
}
