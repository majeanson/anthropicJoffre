/**
 * MoveSuggestionButton Component
 * Toggle button for move suggestions
 *
 * Click to show/hide suggestion tooltip
 * User controls when to see beginner mode hints
 */

import { useRef, useEffect } from 'react';
import { UICard } from './ui';

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
  /** Position of tooltip relative to button */
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
  position = 'bottom',
  showTutorial = false,
}: MoveSuggestionButtonProps) {
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
  // On mobile, always center horizontally for better visibility
  const getTooltipStyle = () => {
    if (!buttonRef.current) return {};

    const rect = buttonRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const tooltipWidth = isMobile ? Math.min(300, window.innerWidth - 32) : 280;
    const tooltipHeight = 150; // Approximate height
    const padding = 16;

    // On mobile, always position at bottom center of screen for visibility
    if (isMobile) {
      return {
        bottom: padding,
        left: padding,
        right: padding,
        width: 'auto',
      };
    }

    switch (position) {
      case 'top':
        return {
          bottom: window.innerHeight - rect.top + padding,
          left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          width: tooltipWidth,
        };
      case 'bottom':
        return {
          top: rect.bottom + padding,
          left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          width: tooltipWidth,
        };
      case 'left':
        return {
          top: Math.max(padding, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
          right: window.innerWidth - rect.left + padding,
          width: tooltipWidth,
        };
      case 'right':
        return {
          top: Math.max(padding, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
          left: rect.right + padding,
          width: tooltipWidth,
        };
      default:
        return {
          top: rect.bottom + padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          width: tooltipWidth,
        };
    }
  };

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
              👆 Tap to see hint
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45 border-r border-b border-gray-700" />
            </UICard>
          </div>
        )}

        {/* Toggle Button */}
        <button
          ref={buttonRef}
          onClick={onToggle}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isOpen
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white scale-110 focus:ring-green-400'
              : 'bg-parchment-50 dark:bg-gray-700 text-green-600 dark:text-green-400 hover:scale-105 focus:ring-green-500'
          }`}
          aria-label={isOpen ? 'Hide move suggestion' : 'Show move suggestion'}
          aria-expanded={isOpen}
          title="Click to toggle suggestion"
        >
          <span className={`text-base md:text-lg ${isOpen ? 'animate-pulse' : ''}`} aria-hidden="true">
            💡
          </span>
        </button>
      </div>

      {/* Tooltip - Fixed position portal-like rendering for proper z-index */}
      {isOpen && (
        <div
          ref={tooltipRef}
          className="fixed z-[10000]"
          style={getTooltipStyle()}
          role="tooltip"
        >
          <UICard
            variant="gradient"
            gradient="success"
            size="sm"
            className="!border-2 !border-green-300 !px-3 !py-2 md:!px-4 md:!py-3 shadow-2xl"
          >
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex-shrink-0">
                <span className="text-sm md:text-lg" aria-hidden="true">
                  💡
                </span>
              </div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-xs font-semibold">Suggestion</div>
                <div className="text-sm md:text-base font-bold mt-0.5">{suggestion}</div>
                <div className="text-xs md:text-sm mt-1 whitespace-normal">{details}</div>

                {/* Alternatives Section - Visually Separated */}
                {alternatives && (
                  <div className="mt-2 pt-2 border-t border-white/30">
                    <div className="text-xs font-semibold flex items-center gap-1">
                      <span aria-hidden="true">💭</span>
                      <span>Alternative:</span>
                    </div>
                    <div className="text-xs mt-0.5 whitespace-normal">{alternatives}</div>
                  </div>
                )}
              </div>
            </div>
          </UICard>
        </div>
      )}
    </>
  );
}
