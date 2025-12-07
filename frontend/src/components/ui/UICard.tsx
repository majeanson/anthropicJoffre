/**
 * UICard Component
 * Sprint 21 - Reusable card container component
 *
 * A flexible card component for containing content with various visual styles.
 * Supports variants (default, elevated, bordered, gradient), sizes, and dark mode.
 *
 * @example
 * ```tsx
 * <UICard variant="elevated" size="md">
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </UICard>
 * ```
 *
 * @example Gradient card
 * ```tsx
 * <UICard variant="gradient" gradient="team1">
 *   <div>Team 1 content</div>
 * </UICard>
 * ```
 */

import React, { ReactNode } from 'react';

export type UICardVariant = 'default' | 'elevated' | 'bordered' | 'gradient';
export type UICardSize = 'sm' | 'md' | 'lg';
export type UICardPadding = 'none' | 'sm' | 'md' | 'lg';
export type UICardGradient =
  | 'team1'
  | 'team2'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'primary';

export interface UICardProps {
  /** Visual style variant */
  variant?: UICardVariant;
  /** Card size (affects default padding) */
  size?: UICardSize;
  /** Override padding (overrides size-based padding) */
  padding?: UICardPadding;
  /** Gradient color scheme (only applies when variant="gradient") */
  gradient?: UICardGradient;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Card content */
  children: ReactNode;
  /** Optional click handler (makes card interactive) */
  onClick?: () => void;
}

/**
 * UICard - Flexible container component with multiple visual styles
 *
 * Variants:
 * - default: White/dark card with subtle shadow
 * - elevated: Higher shadow for emphasis
 * - bordered: Border with color, subtle shadow
 * - gradient: Uses gradient prop with design tokens
 *
 * All variants support dark mode automatically.
 */
export const UICard: React.FC<UICardProps> = ({
  variant = 'default',
  size = 'md',
  padding,
  gradient = 'primary',
  className = '',
  style,
  children,
  onClick,
}) => {
  // Base styles (always applied)
  const baseStyles = 'rounded-lg transition-all duration-200';

  // Size-based padding (only if padding prop not explicitly set)
  const sizeStyles = padding
    ? ''
    : {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      }[size];

  // Padding override styles
  const paddingStyles = padding
    ? {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      }[padding]
    : '';

  // Variant-specific styles - use skin-aware CSS variables for all themes
  const variantStyles = {
    default: 'bg-skin-secondary shadow-md',
    elevated: 'bg-skin-secondary shadow-lg',
    bordered: 'bg-skin-secondary border-2 shadow-sm',
    gradient: '',
  }[variant];

  // Border color for bordered variant
  const borderColor = variant === 'bordered' ? 'border-skin-default' : '';

  // Gradient styles (only for gradient variant) - skin-aware backgrounds
  const gradientStyles =
    variant === 'gradient'
      ? {
          team1: 'bg-team1-10 border border-team1',
          team2: 'bg-team2-10 border border-team2',
          success: 'bg-skin-success border border-skin-success',
          warning: 'bg-skin-warning border border-skin-warning',
          error: 'bg-skin-error border border-skin-error',
          info: 'bg-skin-info border border-skin-info',
          primary: 'bg-skin-tertiary border border-skin-accent',
        }[gradient]
      : '';

  // Interactive styles (when onClick is provided)
  const interactiveStyles = onClick
    ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
    : '';

  const allStyles = [
    baseStyles,
    paddingStyles || sizeStyles,
    variantStyles,
    borderColor,
    gradientStyles,
    interactiveStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={allStyles} style={style} onClick={onClick}>
      {children}
    </div>
  );
};
