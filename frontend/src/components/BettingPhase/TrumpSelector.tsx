/**
 * TrumpSelector Component
 *
 * Toggle between "With Trump" and "Without Trump" options.
 * Without Trump doubles the bet risk/reward.
 */

import { memo } from 'react';
import { sounds } from '../../utils/sounds';

interface TrumpSelectorProps {
  /** Whether betting without trump */
  withoutTrump: boolean;
  /** Callback when trump option changes */
  onToggle: (withoutTrump: boolean) => void;
  /** Whether this level is currently focused for keyboard nav */
  isNavActive: boolean;
}

const TRUMP_OPTIONS = [
  { value: false, label: 'With Trump (1x)', icon: '🃏' },
  { value: true, label: 'Without Trump (2x)', icon: '✨' },
] as const;

function TrumpSelectorComponent({ withoutTrump, onToggle, isNavActive }: TrumpSelectorProps) {
  return (
    <div
      id="bet-level-trump"
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
        Trump Option
        <span className="hidden sm:inline text-[10px]">(← → to toggle)</span>
      </label>
      <div className="space-y-2">
        {TRUMP_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => {
              sounds.buttonClick();
              onToggle(option.value);
            }}
            className={`
              w-full flex items-center min-h-[48px] p-3 sm:p-4
              rounded-[var(--radius-md)]
              border-2 transition-all duration-[var(--duration-fast)]
              touch-manipulation select-none
              active:scale-[0.98]
              ${
                withoutTrump === option.value
                  ? 'border-[var(--color-text-accent)] bg-[var(--color-text-accent)]/20'
                  : 'border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-accent)]'
              }
            `}
          >
            <span className="mr-3 text-lg sm:text-xl">{option.icon}</span>
            <span
              className={`font-body text-sm sm:text-base ${
                withoutTrump === option.value ? 'text-skin-accent' : 'text-skin-secondary'
              }`}
            >
              {option.label}
            </span>
            {withoutTrump === option.value && (
              <span className="ml-auto text-lg text-skin-accent">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export const TrumpSelector = memo(TrumpSelectorComponent);
