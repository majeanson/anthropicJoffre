/**
 * ProgressBar Component
 * Storybook UI Component
 *
 * Unified progress bar with multiple variants and animations.
 * Used for loading states, achievements, quests, and form validation.
 *
 * Features:
 * - 3 variants: default, gradient, striped
 * - 3 sizes: sm, md, lg
 * - Color themes
 * - Animated transitions
 * - Optional label and value display
 * - Dark mode support
 *
 * Usage:
 * ```tsx
 * <ProgressBar value={75} max={100} />
 *
 * <ProgressBar
 *   value={5}
 *   max={10}
 *   label="Quest Progress"
 *   showValue
 *   variant="gradient"
 *   color="success"
 * />
 * ```
 */

export type ProgressBarVariant = 'default' | 'gradient' | 'striped';
export type ProgressBarSize = 'sm' | 'md' | 'lg';
export type ProgressBarColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray';

export interface ProgressBarProps {
  /** Current value */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Progress bar variant */
  variant?: ProgressBarVariant;
  /** Progress bar size */
  size?: ProgressBarSize;
  /** Color theme */
  color?: ProgressBarColor;
  /** Label above progress bar */
  label?: string;
  /** Show value text (e.g., "75%") */
  showValue?: boolean;
  /** Custom value formatter */
  valueFormatter?: (value: number, max: number) => string;
  /** Animate progress changes */
  animated?: boolean;
  /** Additional classes for container */
  className?: string;
}

const sizeClasses: Record<ProgressBarSize, { bar: string; text: string }> = {
  sm: { bar: 'h-1.5', text: 'text-xs' },
  md: { bar: 'h-2', text: 'text-sm' },
  lg: { bar: 'h-3', text: 'text-base' },
};

const colorClasses: Record<ProgressBarColor, { bg: string; track: string }> = {
  primary: {
    bg: 'bg-blue-500 dark:bg-blue-400',
    track: 'bg-blue-100 dark:bg-blue-900/30',
  },
  success: {
    bg: 'bg-green-500 dark:bg-green-400',
    track: 'bg-green-100 dark:bg-green-900/30',
  },
  warning: {
    bg: 'bg-yellow-500 dark:bg-yellow-400',
    track: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  error: {
    bg: 'bg-red-500 dark:bg-red-400',
    track: 'bg-red-100 dark:bg-red-900/30',
  },
  info: {
    bg: 'bg-cyan-500 dark:bg-cyan-400',
    track: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  gray: {
    bg: 'bg-gray-500 dark:bg-gray-400',
    track: 'bg-gray-200 dark:bg-gray-700',
  },
};

const gradientClasses: Record<ProgressBarColor, string> = {
  primary: 'bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700',
  success: 'bg-gradient-to-r from-green-400 to-green-600 dark:from-green-500 dark:to-green-700',
  warning: 'bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700',
  error: 'bg-gradient-to-r from-red-400 to-red-600 dark:from-red-500 dark:to-red-700',
  info: 'bg-gradient-to-r from-cyan-400 to-cyan-600 dark:from-cyan-500 dark:to-cyan-700',
  gray: 'bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700',
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  color = 'primary',
  label,
  showValue = false,
  valueFormatter,
  animated = true,
  className = '',
}: ProgressBarProps) {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Format value display
  const displayValue = valueFormatter
    ? valueFormatter(value, max)
    : `${Math.round(percentage)}%`;

  const sizeStyle = sizeClasses[size];
  const colorStyle = colorClasses[color];

  // Determine bar color based on variant
  const barColorClass = variant === 'gradient' ? gradientClasses[color] : colorStyle.bg;

  // Striped animation classes
  const stripedClasses = variant === 'striped'
    ? 'bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] animate-[stripes_1s_linear_infinite]'
    : '';

  return (
    <div className={`w-full ${className}`}>
      {/* Label and Value Row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className={`font-medium text-umber-800 dark:text-gray-200 ${sizeStyle.text}`}>
              {label}
            </span>
          )}
          {showValue && (
            <span className={`font-semibold text-umber-700 dark:text-gray-300 ${sizeStyle.text}`}>
              {displayValue}
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        className={`
          w-full rounded-full overflow-hidden
          ${colorStyle.track}
          ${sizeStyle.bar}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        {/* Progress Fill */}
        <div
          className={`
            h-full rounded-full
            ${barColorClass}
            ${stripedClasses}
            ${animated ? 'transition-all duration-300 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
