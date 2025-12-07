/**
 * BotThinkingIndicator Component
 * Toggle button for bot thinking insights
 *
 * Click to show/hide what the bot is thinking
 * User controls when to see bot decision-making process
 */

import { useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { UICard } from './ui/UICard';

export interface BotThinkingIndicatorProps {
  /** Name of the bot */
  botName: string;
  /** Current action/thought the bot is considering */
  action: string;
  /** Whether the tooltip is currently visible */
  isOpen: boolean;
  /** Callback to toggle visibility */
  onToggle: () => void;
  /** Position of tooltip relative to button */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function BotThinkingIndicator({
  botName,
  action,
  isOpen,
  onToggle,
  position = 'top',
}: BotThinkingIndicatorProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    // Close on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onToggle]);

  // Position classes for tooltip - using portal-like fixed positioning
  const getTooltipStyle = () => {
    if (!buttonRef.current) return {};

    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 250;
    const tooltipHeight = 80; // Approximate height
    const padding = 8;

    switch (position) {
      case 'top':
        return {
          bottom: window.innerHeight - rect.top + padding,
          left: Math.max(
            padding,
            Math.min(
              rect.left + rect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - padding
            )
          ),
        };
      case 'bottom':
        return {
          top: rect.bottom + padding,
          left: Math.max(
            padding,
            Math.min(
              rect.left + rect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - padding
            )
          ),
        };
      case 'left':
        return {
          top: Math.max(
            padding,
            Math.min(
              rect.top + rect.height / 2 - tooltipHeight / 2,
              window.innerHeight - tooltipHeight - padding
            )
          ),
          right: window.innerWidth - rect.left + padding,
        };
      case 'right':
        return {
          top: Math.max(
            padding,
            Math.min(
              rect.top + rect.height / 2 - tooltipHeight / 2,
              window.innerHeight - tooltipHeight - padding
            )
          ),
          left: rect.right + padding,
        };
      default:
        return {
          bottom: window.innerHeight - rect.top + padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
    }
  };

  return (
    <>
      <div className="relative inline-flex">
        {/* Toggle Button */}
        <Button
          ref={buttonRef}
          variant={isOpen ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggle}
          className={`w-11 h-11 md:w-10 md:h-10 rounded-full p-0 ${isOpen ? 'scale-110' : ''}`}
          aria-label={isOpen ? 'Hide bot thinking' : 'Show bot thinking'}
          aria-expanded={isOpen}
          title="Click to toggle bot thinking"
        >
          <span
            className={`text-base md:text-lg ${isOpen ? 'animate-pulse' : ''}`}
            aria-hidden="true"
          >
            🤖
          </span>
        </Button>
      </div>

      {/* Tooltip - Fixed position portal-like rendering for proper z-index */}
      {isOpen && (
        <div
          ref={tooltipRef}
          className="fixed z-[10000]"
          style={{ ...getTooltipStyle(), width: 250 }}
          role="tooltip"
        >
          <UICard
            variant="gradient"
            gradient="info"
            size="sm"
            className="text-white !border-2 !border-blue-300 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex-shrink-0">
                <span className="text-sm md:text-lg" aria-hidden="true">
                  🤖
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{botName}</div>
                <div className="text-xs md:text-sm font-bold mt-0.5">{action}</div>
              </div>
            </div>
          </UICard>
        </div>
      )}
    </>
  );
}
