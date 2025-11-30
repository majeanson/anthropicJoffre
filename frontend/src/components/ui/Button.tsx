/**
 * Button Component - Retro Gaming Edition
 *
 * A distinctive button system with arcade-inspired aesthetics.
 * Features neon glows, pixel-perfect borders, and satisfying press effects.
 *
 * Variants:
 * - primary: Hot pink neon with cyan glow
 * - secondary: Outlined with subtle glow
 * - success: Neon green arcade style
 * - warning: Arcade yellow
 * - danger: Hot pink-red with glitch effect on hover
 * - ghost: Transparent with neon border on hover
 * - link: Neon underline effect
 *
 * Special Effects:
 * - Arcade button press (translateY effect)
 * - Neon glow on hover
 * - Pixel-perfect borders (for retro skin)
 * - Scanline overlay on focus
 */

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { useSkin } from '../../contexts/SkinContext';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'link'
  | 'neon';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Button visual style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button content */
  children?: ReactNode;
  /** Icon to show on the left */
  leftIcon?: ReactNode;
  /** Icon to show on the right */
  rightIcon?: ReactNode;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable button */
  disabled?: boolean;
  /** Make button full width */
  fullWidth?: boolean;
  /** Enable arcade-style press effect */
  arcade?: boolean;
  /** Enable pulsing glow effect */
  glow?: boolean;
  /** Additional custom classes */
  className?: string;
}

// Retro-styled spinner
const RetroSpinner = () => (
  <svg
    className="animate-spin h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="31.4 31.4"
      strokeLinecap="square"
    />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    children,
    leftIcon,
    rightIcon,
    loading = false,
    disabled = false,
    fullWidth = false,
    arcade = false,
    glow = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  useSkin(); // Provides skin context for CSS variables
  const isDisabled = disabled || loading;

  // Size classes
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-3 py-1.5 text-xs gap-1.5',
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
    xl: 'px-10 py-5 text-xl gap-3',
  };

  // Base styles that apply to all variants
  const baseClasses = `
    inline-flex items-center justify-center
    font-display tracking-wider
    border-[length:var(--button-border-width)]
    rounded-[var(--radius-lg)]
    transition-all duration-[var(--duration-fast)]
    focus-visible:outline-none focus-visible:ring-[var(--input-focus-ring-width)]
    focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2
    focus-visible:ring-offset-[var(--color-bg-primary)]
    uppercase
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${fullWidth ? 'w-full' : ''}
    ${arcade && !isDisabled ? 'arcade-button' : ''}
    ${glow && !isDisabled ? 'pulse-glow' : ''}
  `;

  // Variant-specific styles
  const variantClasses: Record<ButtonVariant, string> = {
    primary: `
      bg-[var(--color-bg-accent)]
      border-[var(--color-highlight)]
      text-[var(--color-text-primary)]
      shadow-[0_0_10px_var(--color-bg-accent)]
      ${!isDisabled ? `
        hover:shadow-[0_0_20px_var(--color-bg-accent),0_0_40px_var(--color-bg-accent)]
        hover:scale-105
        active:scale-95
      ` : ''}
    `,
    secondary: `
      bg-transparent
      border-[var(--color-border-accent)]
      text-[var(--color-text-accent)]
      ${!isDisabled ? `
        hover:bg-[var(--color-bg-tertiary)]
        hover:shadow-[0_0_15px_var(--color-glow)]
        hover:scale-105
        active:scale-95
      ` : ''}
    `,
    success: `
      bg-[var(--color-success)]
      border-[var(--color-success)]
      text-[var(--color-text-inverse)]
      shadow-[0_0_10px_var(--color-success)]
      ${!isDisabled ? `
        hover:shadow-[0_0_20px_var(--color-success),0_0_40px_var(--color-success)]
        hover:scale-105
        active:scale-95
      ` : ''}
    `,
    warning: `
      bg-[var(--color-warning)]
      border-[var(--color-warning)]
      text-[var(--color-text-inverse)]
      shadow-[0_0_10px_var(--color-warning)]
      ${!isDisabled ? `
        hover:shadow-[0_0_20px_var(--color-warning),0_0_40px_var(--color-warning)]
        hover:scale-105
        active:scale-95
      ` : ''}
    `,
    danger: `
      bg-[var(--color-error)]
      border-[var(--color-error)]
      text-[var(--color-text-primary)]
      shadow-[0_0_10px_var(--color-error)]
      ${!isDisabled ? `
        hover:shadow-[0_0_20px_var(--color-error),0_0_40px_var(--color-error)]
        hover:scale-105
        hover:animate-pulse
        active:scale-95
      ` : ''}
    `,
    ghost: `
      bg-transparent
      border-transparent
      text-[var(--color-text-secondary)]
      ${!isDisabled ? `
        hover:text-[var(--color-text-accent)]
        hover:border-[var(--color-border-accent)]
        hover:bg-[var(--color-bg-secondary)]
        active:scale-95
      ` : ''}
    `,
    link: `
      bg-transparent
      border-transparent
      text-[var(--color-text-accent)]
      underline underline-offset-4
      decoration-2 decoration-[var(--color-text-accent)]
      p-0
      ${!isDisabled ? `
        hover:decoration-[var(--color-bg-accent)]
        hover:text-[var(--color-bg-accent)]
      ` : ''}
    `,
    neon: `
      bg-transparent
      border-[var(--color-glow)]
      text-[var(--color-glow)]
      shadow-[inset_0_0_10px_var(--color-glow),0_0_10px_var(--color-glow)]
      ${!isDisabled ? `
        hover:bg-[var(--color-glow)]
        hover:text-[var(--color-text-inverse)]
        hover:shadow-[inset_0_0_20px_var(--color-glow),0_0_30px_var(--color-glow),0_0_60px_var(--color-glow)]
        active:scale-95
      ` : ''}
    `,
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <RetroSpinner />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

// ============================================================================
// PRESET BUTTON COMPONENTS
// ============================================================================

export interface PresetButtonProps extends Omit<ButtonProps, 'variant'> {}

/** Primary action button with arcade effect */
export const PrimaryButton = forwardRef<HTMLButtonElement, PresetButtonProps>(
  (props, ref) => <Button ref={ref} variant="primary" arcade {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

/** Secondary/outline button */
export const SecondaryButton = forwardRef<HTMLButtonElement, PresetButtonProps>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = 'SecondaryButton';

/** Success/confirm button with glow */
export const SuccessButton = forwardRef<HTMLButtonElement, PresetButtonProps>(
  (props, ref) => <Button ref={ref} variant="success" glow {...props} />
);
SuccessButton.displayName = 'SuccessButton';

/** Danger/delete button */
export const DangerButton = forwardRef<HTMLButtonElement, PresetButtonProps>(
  (props, ref) => <Button ref={ref} variant="danger" {...props} />
);
DangerButton.displayName = 'DangerButton';

/** Full neon glow button */
export const NeonButton = forwardRef<HTMLButtonElement, PresetButtonProps>(
  (props, ref) => <Button ref={ref} variant="neon" {...props} />
);
NeonButton.displayName = 'NeonButton';

/** Ghost button for subtle actions */
export const GhostButton = forwardRef<HTMLButtonElement, PresetButtonProps>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);
GhostButton.displayName = 'GhostButton';

export default Button;
