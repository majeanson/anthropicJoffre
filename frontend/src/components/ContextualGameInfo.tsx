import { CardColor } from '../types/game';

interface ContextualGameInfoProps {
  state: 'waiting' | 'in_progress' | 'trick_complete';
  currentPlayerName?: string;
  betAmount?: number;
  withoutTrump?: boolean;
  trumpColor?: CardColor;
  timeRemaining?: number;
  trickWinnerName?: string;
  trickPoints?: number;
}

export function ContextualGameInfo({
  state,
  currentPlayerName,
  betAmount,
  withoutTrump = false,
  trumpColor,
  timeRemaining,
  trickWinnerName,
  trickPoints
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

  // Waiting for first card in trick
  if (state === 'waiting' && currentPlayerName) {
    return (
      <div
        className="bg-parchment-100 dark:bg-gray-800 border-2 border-umber-700 dark:border-gray-600 rounded-lg px-4 py-3 text-center shadow-lg max-w-xs mx-auto"
        data-testid="contextual-info-waiting"
      >
        <div className="text-umber-900 dark:text-gray-100 font-semibold text-sm mb-1">
          Waiting for:
        </div>
        <div className="text-umber-900 dark:text-gray-100 font-bold text-lg flex items-center justify-center gap-2">
          <span>{currentPlayerName}</span>
          <span className="text-blue-500">🎯</span>
        </div>
        {timeRemaining !== undefined && (
          <div className="text-umber-700 dark:text-gray-400 text-xs mt-1">
            ⏱️ {timeRemaining}s
          </div>
        )}
        {/* Always show bet and trump info */}
        {(betAmount || trumpColor) && (
          <div className="mt-2 pt-2 border-t border-umber-300 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-xs">
              {betAmount && (
                <div className="flex items-center gap-1">
                  <span className="text-lg">🎲</span>
                  <span className="text-umber-900 dark:text-gray-100 font-bold">{betAmount}</span>
                  {withoutTrump && (
                    <span className="text-umber-700 dark:text-gray-400 text-xs">(No Trump)</span>
                  )}
                </div>
              )}
              {!withoutTrump && trumpColor && betAmount && <span className="text-umber-400">•</span>}
              {!withoutTrump && trumpColor && (
                <span className={`font-semibold ${colorClasses[trumpColor]}`}>
                  ({colorNames[trumpColor]})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Trick in progress
  if (state === 'in_progress' && betAmount) {
    return (
      <div
        className="bg-parchment-100 dark:bg-gray-800 border-2 border-umber-700 dark:border-gray-600 rounded-lg px-4 py-2 text-center shadow-lg max-w-xs mx-auto"
        data-testid="contextual-info-in-progress"
      >
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-lg">🎲</span>
            <span className="text-umber-900 dark:text-gray-100 font-bold">{betAmount}</span>
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
            <span>{currentPlayerName}</span>
            {timeRemaining !== undefined && <span>⏱️ {timeRemaining}s</span>}
          </div>
        )}
      </div>
    );
  }

  // Trick complete (temporary flash)
  if (state === 'trick_complete' && trickWinnerName) {
    return (
      <div
        className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-2 border-green-700 rounded-lg px-4 py-3 text-center shadow-lg max-w-xs mx-auto animate-fadeIn"
        data-testid="contextual-info-trick-complete"
      >
        <div className="text-white font-bold text-lg flex items-center justify-center gap-2">
          <span>🏆</span>
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
