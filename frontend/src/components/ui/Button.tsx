/**
 * Button Component
 * Sprint 21: Refactored with design token system
 *
 * Unified button system with multiple variants, sizes, and states.
 * Supports icons, loading states, and full dark mode.
 *
 * Features:
 * - 6 variants: primary, secondary, success, warning, danger, ghost, link
 * - 5 sizes: xs, sm, md, lg, xl
 * - Icon support (left, right, or icon-only)
 * - Loading state with spinner
 * - Disabled state
 * - Full width option
 * - Dark mode support
 * - Uses design token system for consistency
 *
 * Usage:
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click Me
 * </Button>
 *
 * <Button
 *   variant="danger"
 *   leftIcon={<TrashIcon />}
 *   loading={isDeleting}
 *   onClick={handleDelete}
 * >
 *   Delete Account
 * </Button>
 * ```
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { colors, spacing, shadows } from '../../design-system';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Button visual style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button content */
  children?: ReactNode;

  // Icons
  /** Icon to show on the left */
  leftIcon?: ReactNode;
  /** Icon to show on the right */
  rightIcon?: ReactNode;

  // States
  /** Show loading spinner */
  loading?: boolean;
  /** Disable button */
  disabled?: boolean;

  // Layout
  /** Make button full width */
  fullWidth?: boolean;

  // Additional classes (use sparingly)
  /** Additional custom classes */
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r ${colors.gradients.primary}
    hover:${colors.gradients.primaryHover}
    dark:${colors.gradients.primaryDark}
    dark:hover:${colors.gradients.primaryDarkHover}
    border-2 border-blue-800 dark:border-blue-900
    text-white ${shadows.button}
  `,
  secondary: `
    bg-white dark:bg-gray-800
    hover:bg-gray-100 dark:hover:bg-gray-700
    border-2 ${colors.borders.light.default} dark:${colors.borders.dark.default}
    text-gray-900 dark:text-gray-100
    ${shadows.md}
  `,
  success: `
    bg-gradient-to-r ${colors.gradients.success}
    hover:${colors.gradients.successHover}
    dark:${colors.gradients.successDark}
    border-2 border-green-800 dark:border-green-900
    text-white ${shadows.button}
  `,
  warning: `
    bg-gradient-to-r ${colors.gradients.warning}
    hover:${colors.gradients.warningHover}
    dark:${colors.gradients.warningDark}
    border-2 border-orange-800 dark:border-orange-900
    text-white ${shadows.button}
  `,
  danger: `
    bg-gradient-to-r ${colors.gradients.error}
    hover:${colors.gradients.errorHover}
    dark:${colors.gradients.errorDark}
    border-2 border-red-800 dark:border-red-900
    text-white ${shadows.button}
  `,
  ghost: `
    bg-transparent
    hover:bg-gray-100 dark:hover:bg-gray-800
    border-2 border-transparent
    text-gray-700 dark:text-gray-300
  `,
  link: `
    bg-transparent
    hover:bg-transparent
    border-2 border-transparent
    text-blue-600 dark:text-blue-400
    hover:text-blue-800 dark:hover:text-blue-300
    underline
  `,
};

// Button size variants using design tokens
const sizeClasses: Record<ButtonSize, string> = {
  xs: `${spacing.button.sm} text-xs`,    // py-2 px-3 text-xs
  sm: `${spacing.button.sm} text-sm`,    // py-2 px-3 text-sm
  md: `${spacing.button.md} text-base`,  // py-3 px-4 text-base
  lg: `${spacing.button.lg} text-lg`,    // py-4 px-6 text-lg
  xl: `${spacing.button.xl} text-xl`,    // py-4 px-8 text-xl
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Loading spinner
  const spinner = (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      type={type}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        inline-flex items-center justify-center ${spacing.gap.sm}
        rounded-lg font-bold
        transition-all duration-200
        ${colors.focus.light} dark:${colors.focus.dark}
        focus-visible:ring-2 focus-visible:ring-offset-2
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && spinner}
      {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}
