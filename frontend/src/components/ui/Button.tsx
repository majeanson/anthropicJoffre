/**
 * Button Component - Midnight Alchemy Edition
 *
 * Mystical buttons with alchemical aesthetics - copper accents, ethereal glows,
 * and brass mechanical textures. Each interaction feels like activating ancient machinery.
 *
 * Variants:
 * - primary: Burnished copper with rose gold glow
 * - secondary: Brass outline with ethereal hover
 * - success: Alchemical teal (transmutation complete)
 * - warning: Molten gold (caution)
 * - danger: Dragon's blood crimson
 * - ghost: Transparent with mystic reveal
 * - link: Underlined accent text
 * - arcane: Sacred geometry borders with mystical glow
 *
 * Special Effects:
 * - Mechanical press with gear-like precision
 * - Copper glow pulse animation
 * - Alchemical shimmer on hover
 */

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { useSkin } from '../../contexts/SkinContext';
import { Tooltip } from './Tooltip';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'link'
  | 'elegant'
  | 'arcane';

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
  /** Explanation shown in tooltip when button is disabled */
  disabledReason?: string;
  /** Make button full width */
  fullWidth?: boolean;
  /** Enable mechanical press effect with shadow */
  arcade?: boolean;
  /** Enable pulsing ethereal glow effect */
  glow?: boolean;
  /** Additional custom classes */
  className?: string;
}

// Alchemical spinner with mystical animation
const AlchemicalSpinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeOpacity="0.2"
      strokeDasharray="4 2"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Alchemical symbol hint */}
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
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
    disabledReason,
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
  const showDisabledTooltip = isDisabled && disabledReason;

  // Size classes with alchemical proportions (golden ratio inspired)
  // Mobile touch targets: min 44x44px per WCAG 2.1 guidelines
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-3 py-1.5 text-xs gap-1.5 min-h-[44px] min-w-[44px]',
    sm: 'px-4 py-2 text-sm gap-2 min-h-[44px]',
    md: 'px-5 sm:px-6 py-3 text-base gap-2.5 min-h-[48px]',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg gap-3 min-h-[48px]',
    xl: 'px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl gap-3 min-h-[52px]',
  };

  // Base styles with mystical typography
  const baseClasses = `
    inline-flex items-center justify-center
    font-display font-semibold
    tracking-[var(--button-letter-spacing)]
    border-[length:var(--button-border-width)]
    rounded-[var(--radius-md)]
    transition-all duration-[var(--duration-normal)] ease-[var(--easing)]
    focus-visible:outline-none focus-visible:ring-[var(--input-focus-ring-width)]
    focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2
    focus-visible:ring-offset-[var(--color-bg-primary)]
    relative overflow-hidden
    touch-manipulation select-none
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
    ${fullWidth ? 'w-full' : ''}
    ${arcade && !isDisabled ? 'mechanical-press' : ''}
    ${glow && !isDisabled ? 'ethereal-pulse' : ''}
  `;

  // Variant-specific styles with proper hover effects
  const variantClasses: Record<ButtonVariant, string> = {
    primary: `
      bg-gradient-to-b from-[var(--color-bg-accent)] to-[color-mix(in_srgb,var(--color-bg-accent)_80%,black)]
      border-[color-mix(in_srgb,var(--color-bg-accent)_70%,black)]
      text-[var(--color-text-inverse)]
      shadow-[var(--shadow-md)]
      ${
        !isDisabled
          ? `
        hover:from-[color-mix(in_srgb,var(--color-bg-accent)_85%,white)]
        hover:to-[color-mix(in_srgb,var(--color-bg-accent)_95%,white)]
        hover:shadow-[var(--shadow-lg)]
        hover:-translate-y-0.5
        hover:brightness-110
        active:translate-y-0.5
        active:shadow-[var(--shadow-sm)]
        active:brightness-95
      `
          : ''
      }
    `,
    secondary: `
      bg-transparent
      border-[var(--color-border-accent)]
      text-[var(--color-text-accent)]
      shadow-none
      ${
        !isDisabled
          ? `
        hover:bg-[color-mix(in_srgb,var(--color-bg-accent)_15%,transparent)]
        hover:border-[var(--color-text-accent)]
        hover:shadow-[var(--shadow-glow)]
        hover:-translate-y-0.5
        active:translate-y-0
        active:bg-[color-mix(in_srgb,var(--color-bg-accent)_25%,transparent)]
      `
          : ''
      }
    `,
    success: `
      bg-gradient-to-b from-[var(--color-success)] to-[color-mix(in_srgb,var(--color-success)_75%,black)]
      border-[color-mix(in_srgb,var(--color-success)_60%,black)]
      text-white
      font-bold
      shadow-[var(--shadow-md)]
      ${
        !isDisabled
          ? `
        hover:from-[color-mix(in_srgb,var(--color-success)_80%,white)]
        hover:to-[color-mix(in_srgb,var(--color-success)_90%,white)]
        hover:shadow-[var(--shadow-lg)]
        hover:-translate-y-0.5
        hover:brightness-110
        active:translate-y-0.5
        active:brightness-95
      `
          : ''
      }
    `,
    warning: `
      bg-gradient-to-b from-[var(--color-warning)] to-[color-mix(in_srgb,var(--color-warning)_75%,black)]
      border-[color-mix(in_srgb,var(--color-warning)_60%,black)]
      text-[var(--color-text-inverse)]
      font-bold
      shadow-[var(--shadow-md)]
      ${
        !isDisabled
          ? `
        hover:from-[color-mix(in_srgb,var(--color-warning)_80%,white)]
        hover:to-[color-mix(in_srgb,var(--color-warning)_90%,white)]
        hover:shadow-[var(--shadow-lg)]
        hover:-translate-y-0.5
        hover:brightness-110
        active:translate-y-0.5
        active:brightness-95
      `
          : ''
      }
    `,
    danger: `
      bg-gradient-to-b from-[var(--color-error)] to-[color-mix(in_srgb,var(--color-error)_70%,black)]
      border-[color-mix(in_srgb,var(--color-error)_50%,black)]
      text-white
      shadow-[var(--shadow-md)]
      ${
        !isDisabled
          ? `
        hover:from-[color-mix(in_srgb,var(--color-error)_80%,white)]
        hover:to-[color-mix(in_srgb,var(--color-error)_90%,white)]
        hover:shadow-[var(--shadow-lg)]
        hover:-translate-y-0.5
        hover:brightness-110
        active:translate-y-0.5
        active:brightness-95
      `
          : ''
      }
    `,
    ghost: `
      bg-transparent
      border-transparent
      text-[var(--color-text-secondary)]
      ${
        !isDisabled
          ? `
        hover:text-[var(--color-text-accent)]
        hover:bg-[color-mix(in_srgb,var(--color-bg-accent)_12%,transparent)]
        active:bg-[color-mix(in_srgb,var(--color-bg-accent)_20%,transparent)]
      `
          : ''
      }
    `,
    link: `
      bg-transparent
      border-transparent
      text-[var(--color-text-accent)]
      underline underline-offset-4
      decoration-1 decoration-[var(--color-text-accent)]/50
      p-0
      ${
        !isDisabled
          ? `
        hover:decoration-2
        hover:decoration-[var(--color-text-accent)]
        hover:brightness-125
      `
          : ''
      }
    `,
    elegant: `
      bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]
      border-[var(--color-border-accent)]
      text-[var(--color-text-accent)]
      shadow-[var(--shadow-md)]
      ${
        !isDisabled
          ? `
        hover:from-[color-mix(in_srgb,var(--color-bg-secondary)_90%,white)]
        hover:to-[var(--color-bg-secondary)]
        hover:shadow-[var(--shadow-lg)]
        hover:-translate-y-0.5
        hover:brightness-110
        active:translate-y-0
        active:brightness-95
      `
          : ''
      }
    `,
    arcane: `
      bg-[var(--color-bg-primary)]
      border-[var(--color-border-accent)]
      text-[var(--color-text-accent)]
      shadow-[var(--shadow-glow)]
      ${
        !isDisabled
          ? `
        hover:bg-[color-mix(in_srgb,var(--color-bg-accent)_20%,var(--color-bg-primary))]
        hover:shadow-[var(--shadow-lg),var(--shadow-glow)]
        hover:-translate-y-1
        hover:brightness-110
        active:translate-y-0
        active:brightness-95
      `
          : ''
      }
    `,
  };

  // Text transform based on variant
  const textTransform = variant === 'link' || variant === 'ghost' ? '' : 'uppercase';

  const buttonElement = (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${textTransform}
        ${className}
      `}
      {...props}
    >
      {/* Alchemical shimmer overlay */}
      {!isDisabled && variant !== 'ghost' && variant !== 'link' && (
        <span
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-slide 3s ease-in-out infinite',
          }}
        />
      )}

      {loading ? (
        <AlchemicalSpinner />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0 drop-shadow-sm">{leftIcon}</span>}
          {children && <span className="relative z-10">{children}</span>}
          {rightIcon && <span className="flex-shrink-0 drop-shadow-sm">{rightIcon}</span>}
        </>
      )}
    </button>
  );

  // Wrap in tooltip when disabled with a reason
  // Using span wrapper because disabled buttons don't receive pointer events
  if (showDisabledTooltip) {
    return (
      <Tooltip content={disabledReason} variant="warning" position="top">
        <span className={`inline-block ${fullWidth ? 'w-full' : ''}`}>{buttonElement}</span>
      </Tooltip>
    );
  }

  return buttonElement;
});

// ============================================================================
// PRESET BUTTON COMPONENTS
// ============================================================================

export interface PresetButtonProps extends Omit<ButtonProps, 'variant'> {}

/** Primary action button with mechanical press effect */
export const PrimaryButton = forwardRef<HTMLButtonElement, PresetButtonProps>((props, ref) => (
  <Button ref={ref} variant="primary" arcade {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

/** Secondary/outline button */
export const SecondaryButton = forwardRef<HTMLButtonElement, PresetButtonProps>((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

/** Success/confirm button with ethereal glow */
export const SuccessButton = forwardRef<HTMLButtonElement, PresetButtonProps>((props, ref) => (
  <Button ref={ref} variant="success" glow {...props} />
));
SuccessButton.displayName = 'SuccessButton';

/** Danger/delete button */
export const DangerButton = forwardRef<HTMLButtonElement, PresetButtonProps>((props, ref) => (
  <Button ref={ref} variant="danger" {...props} />
));
DangerButton.displayName = 'DangerButton';

/** Elegant styled button */
export const ElegantButton = forwardRef<HTMLButtonElement, PresetButtonProps>((props, ref) => (
  <Button ref={ref} variant="elegant" {...props} />
));
ElegantButton.displayName = 'ElegantButton';

/** Arcane mystical button with sacred geometry */
export const ArcaneButton = forwardRef<HTMLButtonElement, PresetButtonProps>((props, ref) => (
  <Button ref={ref} variant="arcane" glow {...props} />
));
ArcaneButton.displayName = 'ArcaneButton';

/** Ghost button for subtle actions */
export const GhostButton = forwardRef<HTMLButtonElement, PresetButtonProps>((props, ref) => (
  <Button ref={ref} variant="ghost" {...props} />
));
GhostButton.displayName = 'GhostButton';

export default Button;
