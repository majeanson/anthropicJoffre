/**
 * ReplayInfoBar Component
 * Displays game info like final scores, duration, and players
 */

import type { ReplayInfoBarProps } from './types';

export function ReplayInfoBar({ replayData }: ReplayInfoBarProps) {
  return (
    <div className="bg-skin-primary px-4 md:px-8 py-3 md:py-4 border-b-2 border-skin-default">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="grid grid-cols-2 md:flex gap-3 md:gap-6">
          {/* Final Score */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">🏆</span>
            <div>
              <p className="text-xs text-skin-muted">Final Score</p>
              <div
                className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2"
                data-testid="final-scores"
              >
                <span
                  className={`text-sm md:text-xl font-black ${replayData.winning_team === 1 ? 'text-green-600' : 'text-skin-muted'}`}
                  data-testid="team1-score"
                >
                  T1: {replayData.team1_score}
                </span>
                <span className="hidden md:inline text-skin-muted">vs</span>
                <span
                  className={`text-sm md:text-xl font-black ${replayData.winning_team === 2 ? 'text-green-600' : 'text-skin-muted'}`}
                  data-testid="team2-score"
                >
                  T2: {replayData.team2_score}
                </span>
              </div>
            </div>
          </div>

          {/* Game Duration */}
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl">⏱️</span>
            <div>
              <p className="text-xs text-skin-muted">Duration</p>
              <p className="text-sm md:text-lg font-bold text-skin-secondary">
                {Math.floor(replayData.game_duration_seconds / 60)}m{' '}
                {replayData.game_duration_seconds % 60}s
              </p>
            </div>
          </div>

          {/* Players - Hidden on mobile, shown on larger screens */}
          <div className="hidden md:flex items-center gap-2 col-span-2">
            <span className="text-xl">👥</span>
            <div>
              <p className="text-xs text-skin-muted">Players</p>
              <div className="flex flex-wrap gap-2">
                {replayData.player_names.map((name, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${
                      replayData.player_teams[idx] === 1
                        ? 'bg-team1/20 text-team1'
                        : 'bg-team2/20 text-team2'
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bot Game Indicator */}
        {replayData.is_bot_game && (
          <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-skin-info/20 rounded-lg self-start md:self-auto">
            <span className="text-lg md:text-xl">🤖</span>
            <span className="text-xs md:text-sm font-semibold text-skin-info">Bot Game</span>
          </div>
        )}
      </div>
    </div>
  );
}
