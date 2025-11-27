/**
 * MoveSuggestionButton Component
 * Mobile-friendly toggle button for move suggestions
 *
 * Small floating button that shows/hides the move suggestion tooltip
 * User controls when to see beginner mode hints
 */

interface MoveSuggestionButtonProps {
  suggestion: string;
  details: string;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function MoveSuggestionButton({ suggestion, details, isOpen, onToggle, position = 'bottom' }: MoveSuggestionButtonProps) {
  // Position classes for tooltip
  const tooltipPosition = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div className="relative inline-flex">
      {/* Toggle Button - Small, mobile-friendly */}
      <button
        onClick={onToggle}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center ${
          isOpen
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white scale-110'
            : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:scale-105'
        }`}
        aria-label={`${isOpen ? 'Hide' : 'Show'} move suggestion`}
        title={`${isOpen ? 'Hide' : 'Show'} suggested move`}
      >
        <span className={`text-base md:text-lg ${isOpen ? 'animate-pulse' : ''}`}>
          💡
        </span>
      </button>

      {/* Tooltip - Appears on toggle */}
      {isOpen && (
        <div
          className={`absolute z-50 ${tooltipPosition} pointer-events-none`}
          style={{ maxWidth: '90vw', minWidth: '200px' }}
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-2xl border-2 border-green-300">
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex-shrink-0">
                <span className="text-sm md:text-lg">💡</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold opacity-90">Suggestion</div>
                <div className="text-sm md:text-base font-bold mt-0.5">{suggestion}</div>
                <div className="text-xs md:text-sm mt-1 opacity-90">{details}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
