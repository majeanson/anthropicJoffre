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

export type IconButtonVariant = 'circular' | 'square' | 'minimal' | 'header';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
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
    bg-red-700 hover:bg-red-800
    text-white
    shadow-lg
  `,
  square: `
    rounded-lg
    bg-skin-secondary hover:bg-skin-tertiary
    text-skin-primary
    shadow-md
  `,
  minimal: `
    rounded-lg
    bg-transparent hover:bg-skin-tertiary
    text-skin-secondary hover:text-red-400
  `,
  header: `
    rounded
    bg-black/30 hover:bg-black/40
    backdrop-blur-sm
    border border-skin-default
    text-skin-primary
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
