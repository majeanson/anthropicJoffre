/**
 * LiveGamesView - Spectatable games in progress
 *
 * Shows games currently being played that users can spectate.
 */

import { LiveGame } from '../../types/game';
import { Button } from '../ui/Button';

interface LiveGamesViewProps {
  games: LiveGame[];
  onSpectate: (gameId: string) => void;
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'team_selection': return 'Starting';
    case 'betting': return 'Betting';
    case 'playing': return 'Playing';
    case 'scoring': return 'Scoring';
    case 'game_over': return 'Finished';
    default: return phase;
  }
}

export function LiveGamesView({
  games,
  onSpectate,
}: LiveGamesViewProps) {
  return (
    <div className="bg-skin-secondary rounded-xl border-2 border-skin-default p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👁️</span>
          <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
            Live Games
          </h3>
        </div>
        {games.length > 0 && (
          <span className="text-xs text-skin-muted">
            {games.length} game{games.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Games List */}
      {games.length === 0 ? (
        <div className="text-center py-6 text-skin-muted text-sm">
          <div className="text-2xl mb-2">🎴</div>
          <p>No games in progress</p>
          <p className="text-xs mt-1">Start a table!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[250px] overflow-y-auto">
          {games.map((game) => (
            <div
              key={game.gameId}
              className="bg-skin-tertiary rounded-lg p-3"
            >
              {/* Teams */}
              <div className="flex items-center justify-between mb-2">
                {/* Team 1 */}
                <div className="flex-1 text-center">
                  <div className="text-xs text-skin-muted mb-1">Team 1</div>
                  <div className="text-sm text-skin-primary truncate">
                    {game.team1Players.slice(0, 2).join(' & ')}
                  </div>
                </div>

                {/* Score */}
                <div className="px-3 text-center">
                  <div className="text-lg font-display text-skin-primary">
                    <span className="text-orange-500">{game.team1Score}</span>
                    <span className="text-skin-muted mx-1">-</span>
                    <span className="text-purple-500">{game.team2Score}</span>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex-1 text-center">
                  <div className="text-xs text-skin-muted mb-1">Team 2</div>
                  <div className="text-sm text-skin-primary truncate">
                    {game.team2Players.slice(0, 2).join(' & ')}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-skin-muted">
                  {getPhaseLabel(game.phase)}
                  {game.phase === 'playing' && ` • Trick ${game.currentTrick}/${game.totalTricks}`}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-skin-muted">
                    👁️ {game.spectatorCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onSpectate(game.gameId)}
                  >
                    Watch
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveGamesView;
