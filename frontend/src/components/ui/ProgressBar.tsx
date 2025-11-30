/**
 * ProgressBar Component - Multi-Skin Edition
 *
 * Progress bar with proper CSS variable support for all themes.
 *
 * Features:
 * - 3 variants: default, gradient, arcane (striped with glow)
 * - 3 sizes: sm, md, lg
 * - Color themes
 * - Animated transitions
 * - Optional label and value display
 *
 * Usage:
 * ```tsx
 * <ProgressBar value={75} max={100} />
 *
 * <ProgressBar
 *   value={5}
 *   max={10}
 *   label="Progress"
 *   showValue
 *   variant="arcane"
 *   color="accent"
 * />
 * ```
 */

import React from 'react';

export type ProgressBarVariant = 'default' | 'gradient' | 'arcane' | 'striped';
export type ProgressBarSize = 'sm' | 'md' | 'lg';
export type ProgressBarColor = 'accent' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'primary' | 'gray';

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
  /** Inline styles for container */
  style?: React.CSSProperties;
}

const sizeClasses: Record<ProgressBarSize, { bar: string; text: string }> = {
  sm: { bar: 'h-1.5', text: 'text-xs' },
  md: { bar: 'h-3', text: 'text-sm' },
  lg: { bar: 'h-4', text: 'text-base' },
};

// Color to CSS variable mappings
const colorVars: Record<ProgressBarColor, string> = {
  accent: 'var(--color-text-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  muted: 'var(--color-text-muted)',
  primary: 'var(--color-text-accent)',
  gray: 'var(--color-text-muted)',
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  color = 'accent',
  label,
  showValue = false,
  valueFormatter,
  animated = true,
  className = '',
  style,
}: ProgressBarProps) {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Format value display
  const displayValue = valueFormatter
    ? valueFormatter(value, max)
    : `${Math.round(percentage)}%`;

  const sizeStyle = sizeClasses[size];
  const colorVar = colorVars[color];

  // Determine fill style based on variant
  const getFillStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: `${percentage}%`,
      boxShadow: `0 0 12px color-mix(in srgb, ${colorVar} 50%, transparent), 0 0 20px color-mix(in srgb, ${colorVar} 30%, transparent)`,
    };

    if (variant === 'gradient' || variant === 'arcane') {
      return {
        ...baseStyle,
        background: `linear-gradient(90deg, color-mix(in srgb, ${colorVar} 80%, black), ${colorVar}, color-mix(in srgb, ${colorVar} 80%, white))`,
        backgroundSize: variant === 'arcane' ? '200% 100%' : '100% 100%',
        animation: variant === 'arcane' ? 'shimmer-slide 2s ease-in-out infinite' : undefined,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: colorVar,
    };
  };

  // Arcane animation styles (striped pattern)
  const arcaneStyle: React.CSSProperties = variant === 'arcane' ? {
    backgroundImage: `
      linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.1) 75%, transparent 75%, transparent),
      linear-gradient(90deg, color-mix(in srgb, ${colorVar} 80%, black), ${colorVar}, color-mix(in srgb, ${colorVar} 80%, white))
    `,
    backgroundSize: '1rem 1rem, 200% 100%',
  } : {};

  return (
    <div className={`w-full ${className}`} style={style}>
      {/* Label and Value Row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span
              className={`font-display font-semibold tracking-wider uppercase ${sizeStyle.text}`}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              className={`font-display font-semibold ${sizeStyle.text}`}
              style={{
                color: colorVar,
                textShadow: `0 0 8px color-mix(in srgb, ${colorVar} 40%, transparent)`,
              }}
            >
              {displayValue}
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        className={`
          w-full rounded-full overflow-hidden relative
          ${sizeStyle.bar}
        `}
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          boxShadow: 'var(--shadow-inset)',
        }}
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
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{
            ...getFillStyle(),
            ...arcaneStyle,
          }}
        />

        {/* Arcane shimmer overlay */}
        {variant === 'arcane' && percentage > 0 && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shimmer-slide 1.5s ease-in-out infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PRESET PROGRESS BAR COMPONENTS
// ============================================================================

export interface PresetProgressBarProps extends Omit<ProgressBarProps, 'variant' | 'color'> {}

/** Arcane progress with animated effect */
export const ArcaneProgressBar = (props: PresetProgressBarProps) => (
  <ProgressBar variant="arcane" color="accent" {...props} />
);

/** Success progress */
export const SuccessProgressBar = (props: PresetProgressBarProps) => (
  <ProgressBar variant="gradient" color="success" {...props} />
);

/** Warning progress */
export const WarningProgressBar = (props: PresetProgressBarProps) => (
  <ProgressBar variant="gradient" color="warning" {...props} />
);

export default ProgressBar;
