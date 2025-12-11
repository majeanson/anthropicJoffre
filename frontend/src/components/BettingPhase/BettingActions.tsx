/**
 * BettingActions Component
 *
 * Skip and Place Bet action buttons.
 * Shows validation state and keyboard navigation focus.
 */

import { memo } from 'react';
import { Button, ElegantButton } from '../ui/Button';

interface BettingActionsProps {
  /** Whether skip is allowed */
  canSkip: boolean;
  /** Whether the current bet is valid */
  isCurrentBetValid: boolean;
  /** Selected bet amount */
  selectedAmount: number;
  /** Whether betting without trump */
  withoutTrump: boolean;
  /** Handle skip action */
  onSkip: () => void;
  /** Handle place bet action */
  onPlaceBet: () => void;
  /** Whether this level is currently focused for keyboard nav */
  isNavActive: boolean;
  /** Current action index (0=skip, 1=bet) */
  actionIndex: number;
}

function BettingActionsComponent({
  canSkip,
  isCurrentBetValid,
  selectedAmount,
  withoutTrump,
  onSkip,
  onPlaceBet,
  isNavActive,
  actionIndex,
}: BettingActionsProps) {
  return (
    <div
      id="bet-level-action"
      className={`
        p-4 rounded-[var(--radius-lg)]
        border-2 transition-all duration-[var(--duration-fast)]
        ${
          isNavActive
            ? 'border-skin-accent bg-skin-accent/10 shadow-nav-active'
            : 'border-skin-default bg-skin-tertiary'
        }
      `}
    >
      <label className="block text-xs font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-skin-muted">
        {isNavActive && <span className="text-skin-accent">▶</span>}
        Action
        <span className="hidden sm:inline text-[10px]">(← → select, Enter confirm)</span>
      </label>
      <div className="flex gap-3">
        {canSkip && (
          <Button
            data-testid="skip-bet-button"
            onClick={onSkip}
            variant="ghost"
            size="lg"
            className={`flex-1 ${isNavActive && actionIndex === 0 ? 'ring-2 ring-[var(--color-text-accent)]' : ''}`}
          >
            Skip
          </Button>
        )}
        <ElegantButton
          onClick={onPlaceBet}
          disabled={!isCurrentBetValid}
          size="lg"
          glow={isCurrentBetValid}
          className={`flex-1 ${isNavActive && (actionIndex === 1 || !canSkip) ? 'ring-2 ring-[var(--color-text-accent)]' : ''}`}
        >
          Bet {selectedAmount} {withoutTrump ? '(No Trump)' : ''}
        </ElegantButton>
      </div>
    </div>
  );
}

export const BettingActions = memo(BettingActionsComponent);
