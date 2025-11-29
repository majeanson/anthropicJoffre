/**
 * Tooltip Component
 * Storybook UI Component
 *
 * Lightweight tooltip for additional context on hover/focus.
 * Uses CSS-only approach for performance.
 *
 * Features:
 * - 4 positions: top, bottom, left, right
 * - 3 variants: dark, light, colored
 * - Delay support
 * - Dark mode support
 * - Full accessibility (aria-describedby)
 *
 * Usage:
 * ```tsx
 * <Tooltip content="This is helpful info">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * <Tooltip
 *   content="Click to copy game link"
 *   position="bottom"
 *   variant="light"
 * >
 *   <span>Game ID: ABC123</span>
 * </Tooltip>
 * ```
 */

import { ReactNode, useState, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipVariant = 'dark' | 'light' | 'info' | 'success' | 'warning' | 'error';

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Element to attach tooltip to */
  children: ReactNode;
  /** Tooltip position */
  position?: TooltipPosition;
  /** Tooltip variant */
  variant?: TooltipVariant;
  /** Delay before showing (ms) */
  delay?: number;
  /** Additional classes for tooltip */
  className?: string;
  /** Disable tooltip */
  disabled?: boolean;
}

const positionClasses: Record<TooltipPosition, { container: string; arrow: string }> = {
  top: {
    container: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow: 'top-full left-1/2 -translate-x-1/2 border-t-current border-x-transparent border-b-transparent',
  },
  bottom: {
    container: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-current border-x-transparent border-t-transparent',
  },
  left: {
    container: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow: 'left-full top-1/2 -translate-y-1/2 border-l-current border-y-transparent border-r-transparent',
  },
  right: {
    container: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow: 'right-full top-1/2 -translate-y-1/2 border-r-current border-y-transparent border-l-transparent',
  },
};

const variantClasses: Record<TooltipVariant, string> = {
  dark: 'bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100',
  light: 'bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 shadow-lg border border-gray-200 dark:border-gray-600',
  info: 'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-orange-500 text-white',
  error: 'bg-red-600 text-white',
};

export function Tooltip({
  content,
  children,
  position = 'top',
  variant = 'dark',
  delay = 0,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  // Handle show with delay
  const handleShow = () => {
    if (disabled) return;

    if (delay > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setShouldRender(true);
        // Small delay for animation
        requestAnimationFrame(() => setIsVisible(true));
      }, delay);
    } else {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
    }
  };

  // Handle hide
  const handleHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    // Wait for animation to complete
    setTimeout(() => setShouldRender(false), 150);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyle = positionClasses[position];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
    >
      {/* Trigger Element */}
      <div aria-describedby={shouldRender ? tooltipId.current : undefined}>
        {children}
      </div>

      {/* Tooltip */}
      {shouldRender && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`
            absolute z-50
            ${positionStyle.container}
            px-3 py-2
            text-sm font-medium
            rounded-lg
            whitespace-nowrap
            pointer-events-none
            transition-all duration-150
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
            ${variantClasses[variant]}
            ${className}
          `}
        >
          {content}

          {/* Arrow */}
          <div
            className={`
              absolute
              w-0 h-0
              border-4
              ${positionStyle.arrow}
              ${variant === 'light' ? 'text-white dark:text-gray-700' : variantClasses[variant].split(' ')[0].replace('bg-', 'text-')}
            `}
            style={{
              borderColor: variant === 'dark' ? '#111827' : undefined,
            }}
          />
        </div>
      )}
    </div>
  );
}
