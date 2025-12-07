/**
 * MoveSuggestionButton Component
 * Toggle button for move suggestions
 *
 * Click to show/hide suggestion tooltip
 * User controls when to see beginner mode hints
 */

import { GameTooltip, GameTooltipTrigger } from './ui';

export interface MoveSuggestionButtonProps {
  /** The main suggestion text */
  suggestion: string;
  /** Detailed explanation of the suggestion */
  details: string;
  /** Optional alternative moves */
  alternatives?: string;
  /** Whether the tooltip is currently visible */
  isOpen: boolean;
  /** Callback to toggle visibility */
  onToggle: () => void;
  /** Position of tooltip relative to button (kept for API compatibility, not used) */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Show first-time tutorial tooltip */
  showTutorial?: boolean;
}

export function MoveSuggestionButton({
  suggestion,
  details,
  alternatives,
  isOpen,
  onToggle,
  // showTutorial kept for API compatibility but no longer used
  showTutorial: _showTutorial = false,
}: MoveSuggestionButtonProps) {
  return (
    <>
      <div className="relative inline-flex motion-safe:animate-fade-in-scale">
        {/* Toggle Button */}
        <GameTooltipTrigger
          isOpen={isOpen}
          onToggle={onToggle}
          icon="💡"
          label={isOpen ? 'Hide move suggestion' : 'Show move suggestion'}
          pulse={!isOpen}
          className={
            isOpen
              ? '!bg-gradient-to-r !from-green-500 !to-emerald-600'
              : '!text-green-600 dark:!text-green-400'
          }
        />
      </div>

      {/* GameTooltip - Handles positioning and z-index properly */}
      <GameTooltip
        isOpen={isOpen}
        onClose={onToggle}
        title="Suggested Move"
        icon="💡"
        variant="success"
        testId="move-suggestion-tooltip"
      >
        <div className="space-y-3">
          {/* Recommended card */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{suggestion}</span>
            <div className="text-lg font-bold">Play this card</div>
          </div>

          {/* Why this move */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs font-semibold mb-1 flex items-center gap-1 opacity-80">
              <span>🎯</span>
              <span>Why this move:</span>
            </div>
            <p className="text-sm">{details}</p>
          </div>

          {/* Alternatives Section */}
          {alternatives && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs font-semibold mb-1 flex items-center gap-1 opacity-80">
                <span>💭</span>
                <span>Other options:</span>
              </div>
              <p className="text-sm">{alternatives}</p>
            </div>
          )}

          {/* Tip */}
          <p className="text-xs opacity-70 text-center">
            Tap the suggested card in your hand to play it
          </p>
        </div>
      </GameTooltip>
    </>
  );
}
