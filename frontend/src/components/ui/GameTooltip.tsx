/**
 * GameTooltip Component
 * Storybook UI Component
 *
 * A toggle-based tooltip/half-modal for in-game information.
 * On mobile: displays as a bottom sheet / half-modal
 * On desktop: displays as a positioned tooltip near the trigger
 *
 * Used for:
 * - Move suggestions (beginner mode)
 * - Bot thinking indicators
 * - Any in-game contextual information
 *
 * Features:
 * - Click to toggle (not hover)
 * - Closes on click outside or Escape
 * - Mobile-first responsive design
 * - High z-index to appear above game elements
 * - Gradient variants for different contexts
 */

import { ReactNode, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { zIndex } from '../../config/zIndex';

export type GameTooltipVariant = 'info' | 'success' | 'warning' | 'bot';

export interface GameTooltipProps {
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Callback when tooltip should close */
  onClose: () => void;
  /** Tooltip title/header */
  title: string;
  /** Main content */
  children: ReactNode;
  /** Icon to display */
  icon?: ReactNode;
  /** Color variant */
  variant?: GameTooltipVariant;
  /** Additional classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

const variantStyles: Record<
  GameTooltipVariant,
  { gradient: string; border: string; iconBg: string }
> = {
  info: {
    gradient: 'from-blue-600 to-blue-700',
    border: 'border-blue-300',
    iconBg: 'bg-blue-500/30',
  },
  success: {
    gradient: 'from-green-600 to-emerald-700',
    border: 'border-green-300',
    iconBg: 'bg-green-500/30',
  },
  warning: {
    gradient: 'from-orange-500 to-amber-600',
    border: 'border-orange-300',
    iconBg: 'bg-orange-500/30',
  },
  bot: {
    gradient: 'from-indigo-600 to-purple-700',
    border: 'border-indigo-300',
    iconBg: 'bg-indigo-500/30',
  },
};

export function GameTooltip({
  isOpen,
  onClose,
  title,
  children,
  icon,
  variant = 'info',
  className = '',
  testId,
}: GameTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Small delay to prevent immediate close on the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles = variantStyles[variant];

  const tooltipContent = (
    <div
      ref={tooltipRef}
      role="tooltip"
      data-testid={testId}
      className={`
        fixed

        /* Mobile: top sheet style - full width from start */
        left-0 right-0 top-0

        /* Desktop: centered in viewport */
        sm:left-1/2 sm:right-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-auto sm:min-w-[320px] sm:max-w-[400px]

        ${className}
      `}
      style={{ zIndex: zIndex.suggestionTooltip }}
    >
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 sm:bg-black/40 -z-10 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tooltip content - full width on mobile, animation slides content */}
      <div
        className={`
          bg-gradient-to-br ${styles.gradient}
          text-white
          border-2 ${styles.border}
          border-t-0 sm:border-t-2
          rounded-b-2xl sm:rounded-2xl
          shadow-2xl
          p-4 sm:p-5
          w-full sm:w-auto

          /* Safe area for mobile notch/status bar */
          pt-[max(1rem,env(safe-area-inset-top))]
          sm:pt-5

          /* Animation - slide down on mobile, fade on desktop */
          animate-slideDown sm:animate-fadeIn
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div
              className={`
              flex items-center justify-center
              w-10 h-10
              ${styles.iconBg}
              rounded-full
              flex-shrink-0
            `}
            >
              <span className="text-xl">{icon}</span>
            </div>
          )}
          <h3 className="font-bold text-lg flex-1">{title}</h3>

          {/* Close button */}
          <button
            onClick={onClose}
            className="
              w-8 h-8
              flex items-center justify-center
              rounded-full
              bg-white/20 hover:bg-white/30
              transition-colors
              text-white/80 hover:text-white
              text-xl leading-none
            "
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="text-white/95">{children}</div>
      </div>
    </div>
  );

  // Use portal to render at document root for proper z-index
  return createPortal(tooltipContent, document.body);
}

/**
 * GameTooltipTrigger Component
 *
 * A button that toggles the GameTooltip.
 * Provides consistent styling for trigger buttons.
 */
export interface GameTooltipTriggerProps {
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Toggle callback */
  onToggle: () => void;
  /** Button icon */
  icon: ReactNode;
  /** Accessible label */
  label: string;
  /** Visual indicator when there's content */
  hasContent?: boolean;
  /** Show pulsing animation */
  pulse?: boolean;
  /** Additional classes */
  className?: string;
}

export function GameTooltipTrigger({
  isOpen,
  onToggle,
  icon,
  label,
  hasContent = true,
  pulse = false,
  className = '',
}: GameTooltipTriggerProps) {
  if (!hasContent) return null;

  return (
    <button
      onClick={onToggle}
      className={`
        w-10 h-10
        rounded-full
        shadow-lg
        transition-all
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          isOpen
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-110 ring-2 ring-white focus:ring-blue-400'
            : 'bg-parchment-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:scale-105 focus:ring-blue-500'
        }
        ${className}
      `}
      aria-label={label}
      aria-expanded={isOpen}
    >
      <span className={`text-lg ${pulse && !isOpen ? 'animate-pulse' : ''}`}>{icon}</span>
    </button>
  );
}
