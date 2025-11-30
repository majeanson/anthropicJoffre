/**
 * Spinner Component - Midnight Alchemy Edition
 *
 * Mystical loading spinners with ethereal glows and alchemical animations.
 * Features transmutation-style effects and brass accents.
 *
 * Features:
 * - 4 sizes: xs, sm, md, lg
 * - 4 variants: default (ring), dots, pulse, arcane (sacred geometry)
 * - Color themes with elemental glows
 * - Accessible (role="status", aria-label)
 *
 * Usage:
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" color="accent" />
 * <Spinner variant="arcane" />
 * ```
 */

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'default' | 'dots' | 'pulse' | 'arcane';
export type SpinnerColor = 'accent' | 'primary' | 'white' | 'muted' | 'success' | 'warning' | 'error';

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
  xs: { ring: 'h-4 w-4', dots: 'gap-1', dotSize: 'h-1 w-1' },
  sm: { ring: 'h-6 w-6', dots: 'gap-1', dotSize: 'h-1.5 w-1.5' },
  md: { ring: 'h-8 w-8', dots: 'gap-1.5', dotSize: 'h-2 w-2' },
  lg: { ring: 'h-12 w-12', dots: 'gap-2', dotSize: 'h-3 w-3' },
};

// Color styles with Midnight Alchemy ethereal glows
const colorStyles: Record<SpinnerColor, { color: string; glow: string }> = {
  accent: {
    color: '#C17F59',
    glow: 'rgba(193, 127, 89, 0.5)',
  },
  primary: {
    color: '#D4A574',
    glow: 'rgba(212, 165, 116, 0.4)',
  },
  white: {
    color: '#E8E4DC',
    glow: 'rgba(232, 228, 220, 0.3)',
  },
  muted: {
    color: '#6B7280',
    glow: 'rgba(107, 114, 128, 0.3)',
  },
  success: {
    color: '#4A9C6D',
    glow: 'rgba(74, 156, 109, 0.5)',
  },
  warning: {
    color: '#D4A574',
    glow: 'rgba(212, 165, 116, 0.5)',
  },
  error: {
    color: '#A63D3D',
    glow: 'rgba(166, 61, 61, 0.5)',
  },
};

export function Spinner({
  size = 'md',
  variant = 'default',
  color = 'accent',
  label = 'Transmuting...',
  className = '',
}: SpinnerProps) {
  const sizeStyle = sizeClasses[size];
  const colorStyle = colorStyles[color];

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
          ${className}
        `}
        style={{
          borderWidth: size === 'lg' ? '3px' : '2px',
          borderStyle: 'solid',
          borderColor: colorStyle.color,
          borderTopColor: 'transparent',
          filter: `drop-shadow(0 0 6px ${colorStyle.glow})`,
        }}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Dots spinner (bouncing alchemical orbs)
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
              animate-bounce
            `}
            style={{
              backgroundColor: colorStyle.color,
              boxShadow: `0 0 8px ${colorStyle.glow}`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Pulse spinner (pulsing ethereal orb)
  if (variant === 'pulse') {
    return (
      <div
        role="status"
        aria-label={label}
        className={`
          inline-block rounded-full
          animate-pulse
          ${sizeStyle.ring}
          ${className}
        `}
        style={{
          backgroundColor: colorStyle.color,
          boxShadow: `0 0 20px ${colorStyle.glow}, 0 0 40px ${colorStyle.glow}`,
        }}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Arcane spinner (sacred geometry - rotating alchemical symbol)
  if (variant === 'arcane') {
    const arcaneSize = {
      xs: 16,
      sm: 24,
      md: 32,
      lg: 48,
    }[size];

    return (
      <div
        role="status"
        aria-label={label}
        className={`
          inline-flex items-center justify-center
          ${sizeStyle.ring}
          ${className}
        `}
        style={{
          animation: 'spin 3s linear infinite',
        }}
      >
        <svg
          width={arcaneSize}
          height={arcaneSize}
          viewBox="0 0 48 48"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 8px ${colorStyle.glow})`,
          }}
        >
          {/* Outer circle */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke={colorStyle.color}
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.6"
          />
          {/* Inner triangle (Fire) */}
          <path
            d="M24 8 L40 36 L8 36 Z"
            stroke={colorStyle.color}
            strokeWidth="2"
            fill="none"
            style={{
              animation: 'ethereal-pulse 2s ease-in-out infinite',
            }}
          />
          {/* Inverted triangle (Water) */}
          <path
            d="M24 40 L40 12 L8 12 Z"
            stroke={colorStyle.color}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          {/* Center circle */}
          <circle
            cx="24"
            cy="24"
            r="4"
            fill={colorStyle.color}
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return null;
}

// ============================================================================
// PRESET SPINNER COMPONENTS
// ============================================================================

export interface PresetSpinnerProps extends Omit<SpinnerProps, 'variant'> {}

/** Arcane spinner with sacred geometry */
export const ArcaneSpinner = (props: PresetSpinnerProps) => (
  <Spinner variant="arcane" {...props} />
);

/** Dots spinner for subtle loading */
export const DotsSpinner = (props: PresetSpinnerProps) => (
  <Spinner variant="dots" {...props} />
);

/** Pulse spinner for prominent loading */
export const PulseSpinner = (props: PresetSpinnerProps) => (
  <Spinner variant="pulse" {...props} />
);

export default Spinner;
