/**
 * BetAmountSelector Component
 *
 * Grid of bet amount buttons (7-12) with validation state.
 * Shows which amounts are valid based on current highest bet.
 */

import { memo } from 'react';
import { sounds } from '../../utils/sounds';

interface BetAmountSelectorProps {
  /** Currently selected amount */
  selectedAmount: number;
  /** Callback when amount is selected */
  onSelectAmount: (amount: number) => void;
  /** Check if a bet amount is valid */
  isBetAmountValid: (amount: number) => boolean;
  /** Whether this level is currently focused for keyboard nav */
  isNavActive: boolean;
}

function BetAmountSelectorComponent({
  selectedAmount,
  onSelectAmount,
  isBetAmountValid,
  isNavActive,
}: BetAmountSelectorProps) {
  return (
    <div
      id="bet-level-amount"
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
        Select Bet Amount
        <span className="hidden sm:inline text-[10px]">(← → to adjust)</span>
      </label>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[7, 8, 9, 10, 11, 12].map((amount) => {
          const isValid = isBetAmountValid(amount);
          const isSelected = selectedAmount === amount;
          return (
            <button
              key={amount}
              onClick={() => {
                sounds.buttonClick();
                onSelectAmount(amount);
              }}
              disabled={!isValid}
              className={`
                min-h-[48px] py-3 sm:py-4 px-3 sm:px-4
                rounded-[var(--radius-md)]
                font-display text-lg sm:text-xl
                border-2 transition-all duration-[var(--duration-fast)]
                touch-manipulation select-none
                active:scale-95
                ${
                  !isValid
                    ? 'opacity-40 cursor-not-allowed border-skin-subtle text-skin-muted'
                    : isSelected
                      ? 'border-skin-accent bg-skin-accent/20 text-skin-accent shadow-btn-selected'
                      : 'border-skin-default bg-transparent text-skin-secondary hover:border-skin-accent'
                }
              `}
            >
              {amount}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const BetAmountSelector = memo(BetAmountSelectorComponent);
