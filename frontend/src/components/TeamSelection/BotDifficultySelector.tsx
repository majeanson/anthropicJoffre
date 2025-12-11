/**
 * BotDifficultySelector Component
 *
 * Selector for bot difficulty level (easy, medium, hard).
 * Used in team selection when adding bots to the game.
 */

import { memo, RefObject } from 'react';
import { BotDifficulty } from '../../utils/botPlayerEnhanced';
import { sounds } from '../../utils/sounds';

interface BotDifficultySelectorProps {
  /** Current selected difficulty */
  difficulty: BotDifficulty;
  /** Callback when difficulty changes */
  onDifficultyChange: (difficulty: BotDifficulty) => void;
  /** Refs for keyboard navigation */
  easyRef?: RefObject<HTMLButtonElement>;
  mediumRef?: RefObject<HTMLButtonElement>;
  hardRef?: RefObject<HTMLButtonElement>;
}

const DIFFICULTIES: { value: BotDifficulty; emoji: string; label: string }[] = [
  { value: 'easy', emoji: '😊', label: 'Easy' },
  { value: 'medium', emoji: '🤔', label: 'Medium' },
  { value: 'hard', emoji: '😈', label: 'Hard' },
];

function BotDifficultySelectorComponent({
  difficulty,
  onDifficultyChange,
  easyRef,
  mediumRef,
  hardRef,
}: BotDifficultySelectorProps) {
  const refs = [easyRef, mediumRef, hardRef];

  return (
    <div
      className="
        p-4
        rounded-[var(--radius-lg)]
        border border-[var(--color-border-default)]
        bg-[var(--color-bg-tertiary)]
        max-w-md mx-auto
      "
    >
      <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
        Bot Difficulty
      </label>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((diff, index) => (
          <button
            key={diff.value}
            ref={refs[index] as RefObject<HTMLButtonElement>}
            onClick={() => {
              sounds.buttonClick();
              onDifficultyChange(diff.value);
            }}
            className={`
              px-3 py-2
              rounded-[var(--radius-md)]
              font-display text-xs uppercase tracking-wider
              border-2 transition-all duration-[var(--duration-fast)]
              ${
                difficulty === diff.value
                  ? 'border-skin-accent bg-skin-accent/20 text-skin-accent shadow-skin-glow'
                  : 'border-skin-default bg-transparent text-skin-muted hover:border-skin-accent'
              }
            `}
          >
            {diff.emoji} {diff.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const BotDifficultySelector = memo(BotDifficultySelectorComponent);
