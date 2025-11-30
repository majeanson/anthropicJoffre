/**
 * MoveSuggestionButton Component
 * Toggle button for move suggestions
 *
 * Click to show/hide suggestion tooltip
 * User controls when to see beginner mode hints
 */

import { GameTooltip, GameTooltipTrigger, UICard } from './ui';

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
  showTutorial = false,
}: MoveSuggestionButtonProps) {
  return (
    <>
      <div className="relative inline-flex motion-safe:animate-fade-in-scale">
        {/* Tutorial Tooltip - Shows on first appearance */}
        {showTutorial && !isOpen && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-[10001] pointer-events-none animate-bounce-once">
            <UICard
              variant="elevated"
              size="sm"
              className="!bg-gray-900 dark:!bg-gray-800 text-white !px-3 !py-2 text-xs whitespace-nowrap !border-gray-700"
            >
              Tap to see hint
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45 border-r border-b border-gray-700" />
            </UICard>
          </div>
        )}

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
