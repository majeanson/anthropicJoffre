/**
 * ScoreDisplay Component
 *
 * Team score boxes with animated score changes.
 * Shows +/- floating indicators when scores change.
 */

import { memo } from 'react';

interface ScoreDisplayProps {
  /** Team 1 animated score value */
  team1Score: number;
  /** Team 2 animated score value */
  team2Score: number;
  /** Team 1 score change (+/-) or null */
  team1ScoreChange: number | null;
  /** Team 2 score change (+/-) or null */
  team2ScoreChange: number | null;
  /** Team 1 flash color or null */
  team1Flash: 'green' | 'red' | null;
  /** Team 2 flash color or null */
  team2Flash: 'green' | 'red' | null;
  /** Which team has the current bet (for glow highlight) */
  bettingTeamId?: 1 | 2 | null;
  /** Mobile variant with smaller text */
  mobile?: boolean;
}

function ScoreDisplayComponent({
  team1Score,
  team2Score,
  team1ScoreChange,
  team2ScoreChange,
  team1Flash,
  team2Flash,
  bettingTeamId,
  mobile = false,
}: ScoreDisplayProps) {
  const floatClass = mobile
    ? 'absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap z-[9999]'
    : 'absolute -top-8 left-1/2 -translate-x-1/2 text-lg font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap z-[9999]';

  return (
    <div className="flex items-center gap-1" data-testid="team-scores">
      <span className="sr-only">
        Team 1: {team1Score} Team 2: {team2Score}
      </span>

      {/* Team 1 Score */}
      <div
        className={`relative px-2 py-1 rounded-[var(--radius-md)] shadow-md flex items-center gap-1 flex-shrink-0 transition-all bg-skin-team1-primary ${
          team1Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''
        } ${team1Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}
        style={{
          boxShadow:
            bettingTeamId === 1
              ? mobile
                ? '0 0 0 2px var(--color-warning)'
                : '0 0 0 2px var(--color-warning), 0 0 10px var(--color-warning)'
              : undefined,
        }}
      >
        <p className="text-xs font-semibold text-skin-team1-text opacity-90">T1</p>
        <p className="text-base font-black text-skin-team1-text">{team1Score}</p>
        {team1ScoreChange !== null && (
          <div className={floatClass}>
            <span className={team1ScoreChange > 0 ? 'text-skin-success' : 'text-skin-error'}>
              {team1ScoreChange > 0 ? '+' : ''}
              {team1ScoreChange}
            </span>
          </div>
        )}
      </div>

      <div className="font-bold text-sm flex-shrink-0 text-skin-primary">:</div>

      {/* Team 2 Score */}
      <div
        className={`relative px-2 py-1 rounded-[var(--radius-md)] shadow-md flex items-center gap-1 flex-shrink-0 transition-all bg-skin-team2-primary ${
          team2Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''
        } ${team2Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}
        style={{
          boxShadow:
            bettingTeamId === 2
              ? mobile
                ? '0 0 0 2px var(--color-warning)'
                : '0 0 0 2px var(--color-warning), 0 0 10px var(--color-warning)'
              : undefined,
        }}
      >
        <p className="text-xs font-semibold text-skin-team2-text opacity-90">T2</p>
        <p className="text-base font-black text-skin-team2-text">{team2Score}</p>
        {team2ScoreChange !== null && (
          <div className={floatClass}>
            <span className={team2ScoreChange > 0 ? 'text-skin-success' : 'text-skin-error'}>
              {team2ScoreChange > 0 ? '+' : ''}
              {team2ScoreChange}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export const ScoreDisplay = memo(ScoreDisplayComponent);
