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
          className={isOpen
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
        <div className="space-y-2">
          <div className="text-lg font-bold">{suggestion}</div>
          <p className="text-sm">{details}</p>

          {/* Alternatives Section */}
          {alternatives && (
            <div className="pt-2 border-t border-white/20">
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                <span>💭</span>
                <span>Alternative:</span>
              </div>
              <p className="text-xs">{alternatives}</p>
            </div>
          )}
        </div>
      </GameTooltip>
    </>
  );
}
