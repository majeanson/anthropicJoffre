import { CardColor } from '../types/game';
import { UICard } from './ui/UICard';

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
  bettingTeamId,
}: ContextualGameInfoProps) {
  const colorNames: Record<CardColor, string> = {
    red: 'Red',
    brown: 'Brown',
    green: 'Green',
    blue: 'Blue',
  };

  const colorClasses: Record<CardColor, string> = {
    red: 'text-skin-error',
    brown: 'text-amber-700',
    green: 'text-skin-success',
    blue: 'text-skin-info',
  };

  // Waiting or in progress - unified display with consistent height
  if ((state === 'waiting' || state === 'in_progress') && (betAmount || trumpColor)) {
    const teamColorClass =
      bettingTeamId === 1
        ? 'text-team1'
        : bettingTeamId === 2
          ? 'text-team2'
          : 'text-skin-primary';

    return (
      <UICard
        variant="bordered"
        size="sm"
        className="bg-skin-secondary border-skin-default text-center max-w-xs mx-auto"
        data-testid={
          state === 'waiting' ? 'contextual-info-waiting' : 'contextual-info-in-progress'
        }
      >
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-lg" aria-hidden="true">
              🎲
            </span>
            <span className={`font-bold ${teamColorClass}`}>{betAmount}</span>
            {withoutTrump && (
              <span className="text-skin-muted text-xs">(No Trump)</span>
            )}
            {!withoutTrump && trumpColor && (
              <span className={`font-semibold ${colorClasses[trumpColor]}`}>
                ({colorNames[trumpColor]})
              </span>
            )}
          </div>
        </div>
        {currentPlayerName && (
          <div className="text-skin-muted text-xs mt-1 flex items-center justify-center gap-1">
            {state === 'waiting' && <span className="font-semibold">(Waiting...)</span>}
            <span>{currentPlayerName}</span>
            {timeRemaining !== undefined && (
              <span>
                <span aria-hidden="true">⏱️</span> {timeRemaining}s
              </span>
            )}
          </div>
        )}
      </UICard>
    );
  }

  // Trick complete (temporary flash)
  if (state === 'trick_complete' && trickWinnerName) {
    return (
      <UICard
        variant="gradient"
        gradient="success"
        size="sm"
        className="text-center max-w-xs mx-auto animate-fadeIn"
        data-testid="contextual-info-trick-complete"
      >
        <div className="text-white font-bold text-lg flex items-center justify-center gap-2">
          <span aria-hidden="true">🏆</span>
          <span>{trickWinnerName} wins!</span>
        </div>
        {trickPoints !== undefined && (
          <div className="text-white text-sm mt-1">+{trickPoints} points</div>
        )}
      </UICard>
    );
  }

  return null;
}
