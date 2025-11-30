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

  // Variant-specific styles - use parchment theme for light mode consistency
  // Using parchment-100 for warmer, less white backgrounds
  const variantStyles = {
    default: 'bg-parchment-100 dark:bg-gray-800 shadow-md',
    elevated: 'bg-parchment-100 dark:bg-gray-800 shadow-lg',
    bordered: 'bg-parchment-100 dark:bg-gray-800 border-2 shadow-sm',
    gradient: '',
  }[variant];

  // Border color for bordered variant
  const borderColor =
    variant === 'bordered'
      ? 'border-parchment-400 dark:border-gray-600'
      : '';

  // Gradient styles (only for gradient variant) - fully opaque backgrounds
  const gradientStyles =
    variant === 'gradient'
      ? {
          team1:
            'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border border-orange-200 dark:border-orange-600',
          team2:
            'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border border-purple-200 dark:border-purple-600',
          success:
            'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-600',
          warning:
            'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 border border-yellow-200 dark:border-yellow-600',
          error:
            'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border border-red-200 dark:border-red-600',
          info: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-600',
          primary:
            'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 border border-indigo-200 dark:border-indigo-600',
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
