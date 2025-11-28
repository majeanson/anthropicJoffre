import { CardColor } from '../types/game';
import { colors } from '../design-system';

interface ContextualGameInfoProps {
  state: 'waiting' | 'in_progress' | 'trick_complete';
  currentPlayerName?: string;
  betAmount?: number;
  withoutTrump?: boolean;
  trumpColor?: CardColor;
  timeRemaining?: number;
  trickWinnerName?: string;
  trickPoints?: number;
  bettingTeamId?: 1 | 2;
}

export function ContextualGameInfo({
  state,
  currentPlayerName,
  betAmount,
  withoutTrump = false,
  trumpColor,
  timeRemaining,
  trickWinnerName,
  trickPoints,
  bettingTeamId
}: ContextualGameInfoProps) {
  const colorNames: Record<CardColor, string> = {
    red: 'Red',
    brown: 'Brown',
    green: 'Green',
    blue: 'Blue'
  };

  const colorClasses: Record<CardColor, string> = {
    red: 'text-red-600 dark:text-red-400',
    brown: 'text-amber-800 dark:text-amber-600',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400'
  };

  // Waiting or in progress - unified display with consistent height
  if ((state === 'waiting' || state === 'in_progress') && (betAmount || trumpColor)) {
    const teamColorClass = bettingTeamId === 1
      ? 'text-orange-600 dark:text-orange-400'
      : bettingTeamId === 2
      ? 'text-purple-600 dark:text-purple-400'
      : 'text-umber-900 dark:text-gray-100';

    return (
      <div
        className="bg-parchment-100 dark:bg-gray-800 border-2 border-umber-700 dark:border-gray-600 rounded-lg px-4 py-2 text-center shadow-lg max-w-xs mx-auto"
        data-testid={state === 'waiting' ? 'contextual-info-waiting' : 'contextual-info-in-progress'}
      >
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-lg" aria-hidden="true">🎲</span>
            <span className={`font-bold ${teamColorClass}`}>{betAmount}</span>
            {withoutTrump && (
              <span className="text-umber-700 dark:text-gray-400 text-xs">(No Trump)</span>
            )}
            {!withoutTrump && trumpColor && (
              <span className={`font-semibold ${colorClasses[trumpColor]}`}>
                ({colorNames[trumpColor]})
              </span>
            )}
          </div>
        </div>
        {currentPlayerName && (
          <div className="text-umber-700 dark:text-gray-400 text-xs mt-1 flex items-center justify-center gap-1">
            {state === 'waiting' && <span className="font-semibold">(Waiting...)</span>}
            <span>{currentPlayerName}</span>
            {timeRemaining !== undefined && <span><span aria-hidden="true">⏱️</span> {timeRemaining}s</span>}
          </div>
        )}
      </div>
    );
  }

  // Trick complete (temporary flash)
  if (state === 'trick_complete' && trickWinnerName) {
    return (
      <div
        style={{
          background: `linear-gradient(to bottom right, ${colors.success.start}, ${colors.success.end})`,
          borderColor: colors.success.border
        }}
        className="border-2 rounded-lg px-4 py-3 text-center shadow-lg max-w-xs mx-auto animate-fadeIn"
        data-testid="contextual-info-trick-complete"
      >
        <div className="text-white font-bold text-lg flex items-center justify-center gap-2">
          <span aria-hidden="true">🏆</span>
          <span>{trickWinnerName} wins!</span>
        </div>
        {trickPoints !== undefined && (
          <div className="text-white text-sm mt-1">
            +{trickPoints} points
          </div>
        )}
      </div>
    );
  }

  return null;
}
