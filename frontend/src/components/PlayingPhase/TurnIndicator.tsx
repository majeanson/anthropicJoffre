/**
 * TurnIndicator Component
 *
 * Displays whose turn it is during the playing phase.
 * Shows different states: waiting, your turn, trick collecting, trick won.
 */

import { memo } from 'react';
import { Player } from '../../types/game';

interface TurnIndicatorProps {
  /** Whether it's the current player's turn */
  isCurrentTurn: boolean;
  /** Whether trick is being collected */
  isTrickCollecting: boolean;
  /** Name of the last trick winner */
  lastTrickWinnerName: string | null;
  /** Current player's ID */
  currentPlayerId: string;
  /** All players in the game */
  players: Player[];
  /** Index of the player whose turn it is */
  currentPlayerIndex: number;
  /** Number of cards in the current trick */
  currentTrickLength: number;
}

function TurnIndicatorComponent({
  isCurrentTurn,
  isTrickCollecting,
  lastTrickWinnerName,
  currentPlayerId,
  players,
  currentPlayerIndex,
  currentTrickLength,
}: TurnIndicatorProps) {
  // During trick collection, show who won
  if (isTrickCollecting) {
    const winnerName = lastTrickWinnerName || 'Player';
    const isMyWin =
      winnerName === currentPlayerId ||
      players.find((p) => p.name === winnerName)?.id === currentPlayerId;

    return (
      <div
        className="absolute top-0 right-0 z-50"
        role="status"
        aria-live="polite"
        aria-label={`${winnerName} won the trick`}
      >
        <div
          className={`
            rounded-[var(--radius-md)] px-3 py-1.5 sm:px-4 sm:py-2
            border transition-all duration-[var(--duration-fast)]
            ${isMyWin ? 'bg-[var(--color-success)]/20 border-[var(--color-success)] shadow-[0_0_10px_rgba(74,156,109,0.3)]' : 'bg-skin-tertiary/90 border-skin-border-default'}
          `}
          data-testid="turn-indicator-collecting"
        >
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg" aria-hidden="true">
              {isMyWin ? '🏆' : '📥'}
            </span>
            <p
              className={`
                text-xs sm:text-sm font-display uppercase tracking-wider
                ${isMyWin ? 'text-[var(--color-success)] font-bold' : 'text-skin-secondary'}
              `}
            >
              {isMyWin ? 'You won!' : `${winnerName} won`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const turnMessage = isCurrentTurn
    ? 'Your Turn - Play a card!'
    : `Waiting for ${players[currentPlayerIndex]?.name}...`;
  const compactMessage = isCurrentTurn
    ? 'Your Turn'
    : `${players[currentPlayerIndex]?.name}'s turn`;

  // Large centered indicator when no cards in trick
  if (currentTrickLength === 0) {
    return (
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-50"
        role="status"
        aria-live="polite"
        aria-label={turnMessage}
      >
        <div
          className={`
            relative rounded-[var(--radius-xl)] px-6 py-4 lg:px-8 lg:py-6
            border-2 transition-all duration-[var(--duration-fast)]
            bg-skin-tertiary
            ${isCurrentTurn ? 'border-skin-text-accent shadow-[var(--shadow-glow)]' : 'border-skin-border-default shadow-[var(--shadow-lg)]'}
          `}
          data-testid="turn-indicator"
        >
          {isCurrentTurn && (
            <div className="mb-2" aria-hidden="true">
              <span className="text-4xl animate-bounce">👇</span>
            </div>
          )}
          <p
            className="text-lg md:text-2xl lg:text-3xl font-display uppercase tracking-wider text-skin-primary"
            data-testid="current-turn-player"
          >
            {turnMessage}
          </p>
          <div className="mt-2 flex gap-1 justify-center" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 lg:w-3 lg:h-3 rounded-full animate-bounce bg-skin-text-accent"
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Compact indicator when cards are in play (top-right corner)
  return (
    <div
      className="absolute top-1 right-1 sm:top-0 sm:right-0 z-50"
      role="status"
      aria-live="polite"
      aria-label={compactMessage}
    >
      <div
        className={`
          rounded-[var(--radius-md)] px-2 py-1 sm:px-4 sm:py-2
          border-2 transition-all duration-[var(--duration-fast)]
          ${isCurrentTurn ? 'bg-[var(--color-warning)]/30 border-[var(--color-warning)] shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'bg-skin-tertiary/95 border-skin-border-default'}
        `}
        data-testid="turn-indicator-compact"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isCurrentTurn && (
            <span className="text-sm sm:text-lg animate-pulse" aria-hidden="true">
              👉
            </span>
          )}
          <p
            className={`
              text-[11px] sm:text-sm font-display uppercase tracking-wider
              ${isCurrentTurn ? 'text-[var(--color-warning)] font-bold' : 'text-skin-secondary'}
            `}
          >
            {compactMessage}
          </p>
          {!isCurrentTurn && (
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-skin-text-accent" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

export const TurnIndicator = memo(TurnIndicatorComponent);
