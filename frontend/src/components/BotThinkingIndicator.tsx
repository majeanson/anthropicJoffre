/**
 * BotThinkingIndicator Component
 * Press-to-show button for bot thinking insights
 *
 * Hold button to peek at what the bot is thinking, release to hide
 * User controls when to see bot decision-making process
 */

import { Button } from './ui/Button';
import { UICard } from './ui/UICard';

interface BotThinkingIndicatorProps {
  botName: string;
  action: string;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right'; // Position relative to player
}

export function BotThinkingIndicator({ botName, action, isOpen, onToggle, position = 'top' }: BotThinkingIndicatorProps) {
  // Position classes for tooltip
  const tooltipPosition = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div className="relative inline-flex z-[60]">
      {/* Press-to-Show Button - Hold to peek */}
      <Button
        variant={isOpen ? 'primary' : 'secondary'}
        size="sm"
        onMouseDown={onToggle}
        onMouseUp={onToggle}
        onMouseLeave={isOpen ? onToggle : undefined}
        onTouchStart={onToggle}
        onTouchEnd={onToggle}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full p-0 ${isOpen ? 'scale-110' : ''}`}
        aria-label="Press to show bot thinking"
        title="Press and hold to see what the bot is thinking"
      >
        <span className={`text-base md:text-lg ${isOpen ? 'animate-pulse' : ''}`} aria-hidden="true">
          🤖
        </span>
      </Button>

      {/* Tooltip - Appears while pressed */}
      {isOpen && (
        <div
          className={`absolute z-[70] ${tooltipPosition} whitespace-nowrap pointer-events-none`}
          style={{ maxWidth: '90vw' }}
        >
          <UICard variant="gradient" gradient="info" size="sm" className="text-white border-2 border-blue-300">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex-shrink-0">
                <span className="text-sm md:text-lg" aria-hidden="true">🤖</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold opacity-90 truncate">{botName}</div>
                <div className="text-xs md:text-sm font-bold mt-0.5">{action}</div>
              </div>
            </div>
          </UICard>
        </div>
      )}
    </div>
  );
}
