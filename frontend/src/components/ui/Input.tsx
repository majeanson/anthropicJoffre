/**
 * Input Component - Retro Gaming Edition
 *
 * A distinctive input field with arcade-inspired aesthetics.
 * Features neon focus states, pixel-perfect borders, and glowing effects.
 *
 * Features:
 * - 3 variants: default, filled, neon
 * - 3 sizes: sm, md, lg
 * - Error state with glitch effect
 * - Icon support (left/right)
 * - Password visibility toggle
 * - Neon glow on focus
 * - Full accessibility
 *
 * Usage:
 * ```tsx
 * <Input
 *   label="PLAYER NAME"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 *   placeholder="Enter your name..."
 * />
 * ```
 */

import { InputHTMLAttributes, forwardRef, useState, ReactNode } from 'react';

export type InputVariant = 'default' | 'filled' | 'neon';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input variant */
  variant?: InputVariant;
  /** Input size */
  size?: InputSize;
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Icon on the left */
  leftIcon?: ReactNode;
  /** Icon on the right */
  rightIcon?: ReactNode;
  /** Show password toggle for password inputs */
  showPasswordToggle?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Enable glow effect on focus */
  glowOnFocus?: boolean;
  /** Additional classes */
  className?: string;
  /** Container classes */
  containerClassName?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

const labelSizeClasses: Record<InputSize, string> = {
  sm: 'text-xs mb-1.5',
  md: 'text-sm mb-2',
  lg: 'text-base mb-2.5',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  variant = 'default',
  size = 'md',
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  fullWidth = false,
  glowOnFocus = true,
  className = '',
  containerClassName = '',
  type = 'text',
  disabled,
  id,
  ...props
}, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Determine actual input type (for password toggle)
  const actualType = type === 'password' && showPassword ? 'text' : type;

  // Icon padding
  const leftPaddingClass = leftIcon ? (size === 'sm' ? 'pl-9' : size === 'lg' ? 'pl-14' : 'pl-11') : '';
  const rightPaddingClass = (rightIcon || (type === 'password' && showPasswordToggle))
    ? (size === 'sm' ? 'pr-9' : size === 'lg' ? 'pr-14' : 'pr-11')
    : '';

  // Variant-specific styles
  const variantStyles: Record<InputVariant, string> = {
    default: `
      bg-[var(--color-bg-secondary)]
      border-[var(--input-border-width)] border-[var(--color-border-default)]
      ${!error && isFocused ? 'border-[var(--color-text-accent)]' : ''}
      ${glowOnFocus && isFocused && !error ? 'shadow-[0_0_15px_var(--color-glow)]' : ''}
    `,
    filled: `
      bg-[var(--color-bg-tertiary)]
      border-[var(--input-border-width)] border-transparent
      ${!error && isFocused ? 'border-[var(--color-text-accent)]' : ''}
      ${glowOnFocus && isFocused && !error ? 'shadow-[0_0_15px_var(--color-glow)]' : ''}
    `,
    neon: `
      bg-transparent
      border-[var(--input-border-width)] border-[var(--color-glow)]
      ${isFocused && !error ? 'shadow-[inset_0_0_10px_var(--color-glow),0_0_20px_var(--color-glow)]' : 'shadow-[0_0_5px_var(--color-glow)]'}
    `,
  };

  // Error styles
  const errorStyles = error
    ? 'border-[var(--color-error)] shadow-[0_0_10px_var(--color-error)]'
    : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`
            block font-display uppercase tracking-wider
            text-[var(--color-text-secondary)]
            ${labelSizeClasses[size]}
            ${error ? 'text-[var(--color-error)]' : ''}
          `}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={`
            absolute left-3 top-1/2 -translate-y-1/2
            text-[var(--color-text-muted)]
            pointer-events-none
            ${isFocused ? 'text-[var(--color-text-accent)]' : ''}
            ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}
            transition-colors duration-[var(--duration-fast)]
          `}>
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full
            font-body
            text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)]
            placeholder:font-body
            rounded-[var(--radius-md)]
            transition-all duration-[var(--duration-fast)]
            focus:outline-none
            ${sizeClasses[size]}
            ${leftPaddingClass}
            ${rightPaddingClass}
            ${variantStyles[variant]}
            ${errorStyles}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || (type === 'password' && showPasswordToggle)) && (
          <div className={`
            absolute right-3 top-1/2 -translate-y-1/2
            ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}
          `}>
            {type === 'password' && showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`
                  text-[var(--color-text-muted)]
                  hover:text-[var(--color-text-accent)]
                  transition-colors duration-[var(--duration-fast)]
                  focus:outline-none
                  focus-visible:ring-[var(--input-focus-ring-width)]
                  focus-visible:ring-[var(--color-text-accent)]
                  rounded-[var(--radius-sm)]
                  p-1
                `}
                disabled={disabled}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            ) : (
              <div className={`
                text-[var(--color-text-muted)]
                pointer-events-none
                ${isFocused ? 'text-[var(--color-text-accent)]' : ''}
                transition-colors duration-[var(--duration-fast)]
              `}>
                {rightIcon}
              </div>
            )}
          </div>
        )}

        {/* Focus glow effect (additional decorative element) */}
        {isFocused && glowOnFocus && !error && (
          <div
            className="absolute inset-0 rounded-[var(--radius-md)] pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, var(--color-glow), transparent)`,
              opacity: 0.1,
              animation: 'loading-shimmer 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p className={`
          mt-1.5
          text-sm
          font-body
          ${error
            ? 'text-[var(--color-error)] animate-pulse'
            : 'text-[var(--color-text-muted)]'
          }
        `}>
          {error ? `> ${error}` : helperText}
        </p>
      )}
    </div>
  );
});

// ============================================================================
// SPECIALIZED INPUT VARIANTS
// ============================================================================

export interface SpecializedInputProps extends Omit<InputProps, 'type'> {}

/** Search input with magnifying glass icon */
export const SearchInput = forwardRef<HTMLInputElement, SpecializedInputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      type="search"
      variant="default"
      leftIcon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      placeholder="Search..."
      {...props}
    />
  )
);
SearchInput.displayName = 'SearchInput';

/** Password input with visibility toggle */
export const PasswordInput = forwardRef<HTMLInputElement, SpecializedInputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      type="password"
      showPasswordToggle
      leftIcon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
      {...props}
    />
  )
);
PasswordInput.displayName = 'PasswordInput';

/** Neon-styled input for special forms */
export const NeonInput = forwardRef<HTMLInputElement, SpecializedInputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      variant="neon"
      glowOnFocus
      {...props}
    />
  )
);
NeonInput.displayName = 'NeonInput';

export default Input;
