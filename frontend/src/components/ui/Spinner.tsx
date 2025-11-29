/**
 * Spinner Component
 * Storybook UI Component
 *
 * Unified loading spinner with multiple sizes and variants.
 * Used for indeterminate loading states across the application.
 *
 * Features:
 * - 4 sizes: xs, sm, md, lg
 * - 3 variants: default (ring), dots, pulse
 * - Color themes
 * - Dark mode support
 * - Accessible (role="status", aria-label)
 *
 * Usage:
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" color="primary" />
 * <Spinner variant="dots" />
 * ```
 */

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'default' | 'dots' | 'pulse';
export type SpinnerColor = 'primary' | 'white' | 'gray' | 'success' | 'warning' | 'error';

export interface SpinnerProps {
  /** Spinner size */
  size?: SpinnerSize;
  /** Spinner variant */
  variant?: SpinnerVariant;
  /** Color theme */
  color?: SpinnerColor;
  /** Accessible label */
  label?: string;
  /** Additional classes */
  className?: string;
}

const sizeClasses: Record<SpinnerSize, { ring: string; dots: string; dotSize: string }> = {
  xs: { ring: 'h-4 w-4 border-2', dots: 'gap-1', dotSize: 'h-1 w-1' },
  sm: { ring: 'h-6 w-6 border-2', dots: 'gap-1', dotSize: 'h-1.5 w-1.5' },
  md: { ring: 'h-8 w-8 border-2', dots: 'gap-1.5', dotSize: 'h-2 w-2' },
  lg: { ring: 'h-12 w-12 border-3', dots: 'gap-2', dotSize: 'h-3 w-3' },
};

const colorClasses: Record<SpinnerColor, { ring: string; dot: string }> = {
  primary: {
    ring: 'border-blue-500 dark:border-blue-400 border-t-transparent dark:border-t-transparent',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  white: {
    ring: 'border-white border-t-transparent',
    dot: 'bg-white',
  },
  gray: {
    ring: 'border-gray-500 dark:border-gray-400 border-t-transparent dark:border-t-transparent',
    dot: 'bg-gray-500 dark:bg-gray-400',
  },
  success: {
    ring: 'border-green-500 dark:border-green-400 border-t-transparent dark:border-t-transparent',
    dot: 'bg-green-500 dark:bg-green-400',
  },
  warning: {
    ring: 'border-yellow-500 dark:border-yellow-400 border-t-transparent dark:border-t-transparent',
    dot: 'bg-yellow-500 dark:bg-yellow-400',
  },
  error: {
    ring: 'border-red-500 dark:border-red-400 border-t-transparent dark:border-t-transparent',
    dot: 'bg-red-500 dark:bg-red-400',
  },
};

export function Spinner({
  size = 'md',
  variant = 'default',
  color = 'primary',
  label = 'Loading...',
  className = '',
}: SpinnerProps) {
  const sizeStyle = sizeClasses[size];
  const colorStyle = colorClasses[color];

  // Default ring spinner
  if (variant === 'default') {
    return (
      <div
        role="status"
        aria-label={label}
        className={`
          inline-block rounded-full
          animate-spin
          ${sizeStyle.ring}
          ${colorStyle.ring}
          ${className}
        `}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Dots spinner (bouncing dots)
  if (variant === 'dots') {
    return (
      <div
        role="status"
        aria-label={label}
        className={`inline-flex items-center ${sizeStyle.dots} ${className}`}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`
              ${sizeStyle.dotSize}
              rounded-full
              ${colorStyle.dot}
              animate-bounce
            `}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Pulse spinner (pulsing circle)
  if (variant === 'pulse') {
    return (
      <div
        role="status"
        aria-label={label}
        className={`
          inline-block rounded-full
          animate-pulse
          ${sizeStyle.ring}
          ${colorStyle.dot}
          ${className}
        `}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return null;
}
