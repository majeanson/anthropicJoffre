/**
 * MoveSuggestionButton Component
 * Press-to-show button for move suggestions
 *
 * Hold button to peek at suggestion, release to hide
 * User controls when to see beginner mode hints
 */

import { designTokens } from '../styles/designTokens';

interface MoveSuggestionButtonProps {
  suggestion: string;
  details: string;
  alternatives?: string;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showTutorial?: boolean;
}

export function MoveSuggestionButton({ suggestion, details, alternatives, isOpen, onToggle, position = 'bottom', showTutorial = false }: MoveSuggestionButtonProps) {
  // Position classes for tooltip
  const tooltipPosition = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div className="relative inline-flex z-[100] motion-safe:animate-fade-in-scale">
      {/* Tutorial Tooltip - Shows on first appearance */}
      {showTutorial && !isOpen && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-[101] pointer-events-none animate-bounce-once">
          <div className="bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-2xl border border-gray-700">
            👆 Press and hold to peek
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45 border-r border-b border-gray-700" />
          </div>
        </div>
      )}

      {/* Press-to-Show Button - Hold to peek */}
      <button
        onMouseDown={onToggle}
        onMouseUp={onToggle}
        onMouseLeave={isOpen ? onToggle : undefined}
        onTouchStart={onToggle}
        onTouchEnd={onToggle}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center z-[100] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isOpen
            ? `bg-gradient-to-r ${designTokens.gradients.success} text-white scale-110 focus:ring-green-400`
            : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:scale-105 focus:ring-green-500'
        }`}
        aria-label="Press to show move suggestion"
        title="Press and hold to see suggestion"
      >
        <span className={`text-base md:text-lg ${isOpen ? 'animate-pulse' : ''}`} aria-hidden="true">
          💡
        </span>
      </button>

      {/* Tooltip - Appears on toggle */}
      {isOpen && (
        <div
          className={`fixed z-[9999] ${tooltipPosition} pointer-events-none`}
          style={{ maxWidth: '90vw', minWidth: '200px' }}
        >
          <div className={`bg-gradient-to-r ${designTokens.gradients.success} text-white px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-2xl border-2 border-green-300`}>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex-shrink-0">
                <span className="text-sm md:text-lg" aria-hidden="true">💡</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold opacity-90">Suggestion</div>
                <div className="text-sm md:text-base font-bold mt-0.5">{suggestion}</div>
                <div className="text-xs md:text-sm mt-1 opacity-90 whitespace-normal">{details}</div>

                {/* Alternatives Section - Visually Separated */}
                {alternatives && (
                  <div className="mt-2 pt-2 border-t border-white/30">
                    <div className="text-xs font-semibold opacity-70 flex items-center gap-1">
                      <span aria-hidden="true">💭</span>
                      <span>Alternative:</span>
                    </div>
                    <div className="text-xs mt-0.5 opacity-80 whitespace-normal">{alternatives}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
