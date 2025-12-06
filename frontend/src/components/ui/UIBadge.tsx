/**
 * UIBadge Component - Multi-Skin Edition
 *
 * Badge/tag component with proper CSS variable support for all themes.
 *
 * Features:
 * - 4 variants: solid, outline, subtle, arcane
 * - Multiple color schemes
 * - Pulse animation for status indicators
 * - Corner accents for arcane variant
 *
 * @example
 * ```tsx
 * <UIBadge color="success" variant="solid">Active</UIBadge>
 * ```
 *
 * @example With icon
 * ```tsx
 * <UIBadge color="warning" icon={<span>⚠</span>}>Unstable</UIBadge>
 * ```
 *
 * @example Pulsing status indicator
 * ```tsx
 * <UIBadge color="success" pulse>Online</UIBadge>
 * ```
 */

import React, { ReactNode } from 'react';

export type UIBadgeVariant = 'solid' | 'outline' | 'subtle' | 'arcane' | 'translucent';
export type UIBadgeColor =
  | 'team1'
  | 'team2'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'accent'
  | 'gray'
  | 'primary';
export type UIBadgeSize = 'xs' | 'sm' | 'md';
export type UIBadgeShape = 'rounded' | 'pill';

export interface UIBadgeProps {
  /** Visual style variant */
  variant?: UIBadgeVariant;
  /** Color scheme */
  color?: UIBadgeColor;
  /** Badge size */
  size?: UIBadgeSize;
  /** Shape style */
  shape?: UIBadgeShape;
  /** Optional icon (displayed left of text) */
  icon?: ReactNode;
  /** Enable pulse animation (for status indicators) */
  pulse?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Badge content */
  children: ReactNode;
}

// Size-based styles
const sizeStyles: Record<UIBadgeSize, { padding: string; text: string; icon: string }> = {
  xs: { padding: 'px-2 py-0.5', text: 'text-xs', icon: 'w-3 h-3' },
  sm: { padding: 'px-2.5 py-1', text: 'text-sm', icon: 'w-3.5 h-3.5' },
  md: { padding: 'px-3 py-1.5', text: 'text-base', icon: 'w-4 h-4' },
};

// Color to CSS variable mappings
const colorVars: Record<UIBadgeColor, string> = {
  team1: 'var(--color-team1-primary)',
  team2: 'var(--color-team2-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  muted: 'var(--color-text-muted)',
  accent: 'var(--color-text-accent)',
  gray: 'var(--color-text-muted)',
  primary: 'var(--color-text-accent)',
};

/**
 * UIBadge - Badge component for labels and status indicators
 *
 * Variants:
 * - solid: Full background
 * - outline: Border with colored text
 * - subtle: Muted background
 * - arcane: Corner accents with glow
 * - translucent: Semi-transparent with blur
 */
export const UIBadge: React.FC<UIBadgeProps> = ({
  variant = 'solid',
  color = 'muted',
  size = 'sm',
  shape = 'rounded',
  icon,
  pulse = false,
  className = '',
  children,
}) => {
  const sizeStyle = sizeStyles[size];
  const colorVar = colorVars[color];

  // Get variant-specific styles (dynamic colors and effects that require CSS variables)
  const getStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: colorVar,
          color: 'var(--color-text-inverse)',
          boxShadow: `0 2px 10px color-mix(in srgb, ${colorVar} 40%, transparent)`,
        };
      case 'outline':
        return {
          borderColor: colorVar,
          color: colorVar,
        };
      case 'subtle':
        return {
          backgroundColor: `color-mix(in srgb, ${colorVar} 15%, var(--color-bg-secondary))`,
          color: colorVar,
        };
      case 'arcane':
        return {
          backgroundColor: `color-mix(in srgb, ${colorVar} 10%, var(--color-bg-secondary))`,
          borderColor: colorVar,
          color: colorVar,
          boxShadow: `0 0 15px color-mix(in srgb, ${colorVar} 30%, transparent)`,
        };
      case 'translucent':
        return {
          backgroundColor: `color-mix(in srgb, ${colorVar} 20%, transparent)`,
          color: colorVar,
        };
      default:
        return {
          backgroundColor: colorVar,
          color: 'var(--color-text-inverse)',
        };
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-display font-semibold tracking-wide uppercase
        transition-all duration-[var(--duration-normal)]
        ${sizeStyle.padding}
        ${sizeStyle.text}
        ${shape === 'pill' ? 'rounded-full' : 'rounded-[var(--radius-md)]'}
        ${pulse ? 'animate-pulse' : ''}
        ${variant === 'arcane' ? 'relative' : ''}
        ${variant === 'outline' ? 'bg-transparent border border-solid' : ''}
        ${variant === 'translucent' ? 'backdrop-blur-sm' : ''}
        ${className}
      `}
      style={getStyles()}
    >
      {/* Arcane corner accents */}
      {variant === 'arcane' && (
        <>
          <span
            className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t rounded-tl-sm"
            style={{ borderColor: colorVar }}
          />
          <span
            className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t rounded-tr-sm"
            style={{ borderColor: colorVar }}
          />
          <span
            className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b rounded-bl-sm"
            style={{ borderColor: colorVar }}
          />
          <span
            className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b rounded-br-sm"
            style={{ borderColor: colorVar }}
          />
        </>
      )}

      {icon && <span className={sizeStyle.icon}>{icon}</span>}
      {children}
    </span>
  );
};

// ============================================================================
// PRESET BADGE COMPONENTS
// ============================================================================

export interface PresetBadgeProps extends Omit<UIBadgeProps, 'variant' | 'color'> {}

/** Arcane badge with corner accents */
export const ArcaneBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="arcane" color="accent" {...props} />
);

/** Success badge for positive states */
export const SuccessBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="solid" color="success" {...props} />
);

/** Warning badge for caution states */
export const WarningBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="solid" color="warning" {...props} />
);

/** Error badge for critical states */
export const ErrorBadge: React.FC<PresetBadgeProps> = (props) => (
  <UIBadge variant="solid" color="error" {...props} />
);

export default UIBadge;
