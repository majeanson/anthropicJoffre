/**
 * IconButton Component
 *
 * Specialized button for icon-only actions (close buttons, action icons, etc.).
 *
 * Features:
 * - 3 variants: circular, square, minimal
 * - 3 sizes: sm, md, lg
 * - Hover effects and transitions
 * - Accessibility (aria-label required)
 * - Dark mode support
 *
 * Usage:
 * ```tsx
 * <IconButton
 *   icon={<XIcon />}
 *   onClick={onClose}
 *   variant="circular"
 *   ariaLabel="Close modal"
 * />
 *
 * <IconButton
 *   icon={<TrashIcon />}
 *   onClick={handleDelete}
 *   variant="square"
 *   size="lg"
 *   ariaLabel="Delete item"
 * />
 * ```
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { sizes } from '../../config/layout';

export type IconButtonVariant = 'circular' | 'square' | 'minimal';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Icon element to display */
  icon: ReactNode;
  /** Button shape */
  variant?: IconButtonVariant;
  /** Button size */
  size?: IconButtonSize;
  /** Accessibility label (required) */
  ariaLabel: string;
  /** Disable button */
  disabled?: boolean;
  /** Additional custom classes */
  className?: string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  circular: `
    rounded-full
    bg-red-600 hover:bg-red-700
    dark:bg-red-700 dark:hover:bg-red-800
    text-white
    shadow-lg
  `,
  square: `
    rounded-lg
    bg-gray-200 hover:bg-gray-300
    dark:bg-gray-700 dark:hover:bg-gray-600
    text-gray-900 dark:text-gray-100
    shadow-md
  `,
  minimal: `
    rounded-lg
    bg-transparent hover:bg-gray-100
    dark:hover:bg-gray-800
    text-gray-700 hover:text-red-600
    dark:text-gray-300 dark:hover:text-red-400
  `,
};

export function IconButton({
  icon,
  variant = 'circular',
  size = 'md',
  ariaLabel,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`
        ${variantClasses[variant]}
        ${sizes.iconButton[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
        inline-flex items-center justify-center
        font-bold text-xl
        transition-all duration-200
        ${className}
      `}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
}
