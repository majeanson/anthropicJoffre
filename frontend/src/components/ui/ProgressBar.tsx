/**
 * ProgressBar Component - Midnight Alchemy Edition
 *
 * Mystical progress bar with ethereal glows and alchemical aesthetics.
 * Features transmutation-style animations and brass accents.
 *
 * Features:
 * - 3 variants: default, gradient, arcane (striped with glow)
 * - 3 sizes: sm, md, lg
 * - Color themes with elemental glows
 * - Animated transitions like transmutation
 * - Optional label and value display
 *
 * Usage:
 * ```tsx
 * <ProgressBar value={75} max={100} />
 *
 * <ProgressBar
 *   value={5}
 *   max={10}
 *   label="Transmutation Progress"
 *   showValue
 *   variant="arcane"
 *   color="accent"
 * />
 * ```
 */

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
}

const sizeClasses: Record<ProgressBarSize, { bar: string; text: string }> = {
  sm: { bar: 'h-1.5', text: 'text-xs' },
  md: { bar: 'h-3', text: 'text-sm' },
  lg: { bar: 'h-4', text: 'text-base' },
};

// Color styles with Midnight Alchemy ethereal glows
const colorStyles: Record<ProgressBarColor, {
  fill: string;
  track: string;
  glow: string;
  gradient: string;
}> = {
  accent: {
    fill: '#C17F59',
    track: '#1A1F2E',
    glow: 'rgba(193, 127, 89, 0.5)',
    gradient: 'linear-gradient(90deg, #C17F59, #D4A574, #C17F59)',
  },
  success: {
    fill: '#4A9C6D',
    track: '#1A1F2E',
    glow: 'rgba(74, 156, 109, 0.5)',
    gradient: 'linear-gradient(90deg, #3d8b63, #4A9C6D, #5AAD7D)',
  },
  warning: {
    fill: '#D4A574',
    track: '#1A1F2E',
    glow: 'rgba(212, 165, 116, 0.5)',
    gradient: 'linear-gradient(90deg, #C99227, #D4A574, #E6C557)',
  },
  error: {
    fill: '#A63D3D',
    track: '#1A1F2E',
    glow: 'rgba(166, 61, 61, 0.5)',
    gradient: 'linear-gradient(90deg, #8B3D3D, #A63D3D, #C54545)',
  },
  info: {
    fill: '#4682B4',
    track: '#1A1F2E',
    glow: 'rgba(70, 130, 180, 0.5)',
    gradient: 'linear-gradient(90deg, #3D6B8B, #4682B4, #5A9FD4)',
  },
  muted: {
    fill: '#6B7280',
    track: '#1A1F2E',
    glow: 'rgba(107, 114, 128, 0.3)',
    gradient: 'linear-gradient(90deg, #4A4A4A, #6B7280, #8A8A8A)',
  },
  primary: {
    fill: '#C17F59',
    track: '#1A1F2E',
    glow: 'rgba(193, 127, 89, 0.5)',
    gradient: 'linear-gradient(90deg, #C17F59, #D4A574, #C17F59)',
  },
  gray: {
    fill: '#6B7280',
    track: '#1A1F2E',
    glow: 'rgba(107, 114, 128, 0.3)',
    gradient: 'linear-gradient(90deg, #4A4A4A, #6B7280, #8A8A8A)',
  },
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
}: ProgressBarProps) {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Format value display
  const displayValue = valueFormatter
    ? valueFormatter(value, max)
    : `${Math.round(percentage)}%`;

  const sizeStyle = sizeClasses[size];
  const colorStyle = colorStyles[color];

  // Determine fill style based on variant
  const getFillStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: `${percentage}%`,
      boxShadow: `0 0 12px ${colorStyle.glow}, 0 0 20px ${colorStyle.glow}`,
    };

    if (variant === 'gradient' || variant === 'arcane') {
      return {
        ...baseStyle,
        background: colorStyle.gradient,
        backgroundSize: variant === 'arcane' ? '200% 100%' : '100% 100%',
        animation: variant === 'arcane' ? 'shimmer-slide 2s ease-in-out infinite' : undefined,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: colorStyle.fill,
    };
  };

  // Arcane animation styles (mystical energy flow)
  const arcaneStyle: React.CSSProperties = variant === 'arcane' ? {
    backgroundImage: `
      linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.1) 75%, transparent 75%, transparent),
      ${colorStyle.gradient}
    `,
    backgroundSize: '1rem 1rem, 200% 100%',
  } : {};

  return (
    <div className={`w-full ${className}`}>
      {/* Label and Value Row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span
              className={`font-semibold tracking-wider uppercase ${sizeStyle.text}`}
              style={{
                color: '#9CA3AF',
                fontFamily: '"Cinzel", Georgia, serif',
              }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              className={`font-semibold ${sizeStyle.text}`}
              style={{
                color: '#D4A574',
                fontFamily: '"Cinzel", Georgia, serif',
                textShadow: `0 0 8px ${colorStyle.glow}`,
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
          backgroundColor: colorStyle.track,
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(45, 53, 72, 0.5)',
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        {/* Progress Fill with ethereal glow */}
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

/** Arcane progress with mystical energy effect */
export const ArcaneProgressBar = (props: PresetProgressBarProps) => (
  <ProgressBar variant="arcane" color="accent" {...props} />
);

/** Success progress for completed transmutations */
export const SuccessProgressBar = (props: PresetProgressBarProps) => (
  <ProgressBar variant="gradient" color="success" {...props} />
);

/** Warning progress for volatile reactions */
export const WarningProgressBar = (props: PresetProgressBarProps) => (
  <ProgressBar variant="gradient" color="warning" {...props} />
);

export default ProgressBar;
