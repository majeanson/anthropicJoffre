/**
 * Input Component - Midnight Alchemy Edition
 *
 * Mystical input fields with brass frame aesthetics and ethereal focus states.
 * Each keystroke feels like inscribing ancient runes.
 *
 * Features:
 * - 3 variants: default, filled, arcane
 * - 3 sizes: sm, md, lg
 * - Error state with dragon's blood accent
 * - Icon support (left/right)
 * - Password visibility toggle with eye of seeing
 * - Ethereal glow on focus
 * - Copper accent underline animation
 *
 * Usage:
 * ```tsx
 * <Input
 *   label="Alchemist Name"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 *   placeholder="Enter your name..."
 * />
 * ```
 */

import { InputHTMLAttributes, forwardRef, useState, ReactNode } from 'react';

export type InputVariant = 'default' | 'filled' | 'elegant' | 'arcane';
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
  sm: 'px-3 py-2.5 text-sm',
  md: 'px-4 py-3.5 text-base',
  lg: 'px-5 py-4.5 text-lg',
};

const labelSizeClasses: Record<InputSize, string> = {
  sm: 'text-xs mb-2',
  md: 'text-sm mb-2.5',
  lg: 'text-base mb-3',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
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
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Determine actual input type (for password toggle)
  const actualType = type === 'password' && showPassword ? 'text' : type;

  // Icon padding
  const leftPaddingClass = leftIcon
    ? size === 'sm'
      ? 'pl-10'
      : size === 'lg'
        ? 'pl-14'
        : 'pl-12'
    : '';
  const rightPaddingClass =
    rightIcon || (type === 'password' && showPasswordToggle)
      ? size === 'sm'
        ? 'pr-10'
        : size === 'lg'
          ? 'pr-14'
          : 'pr-12'
      : '';

  // Variant-specific styles
  const variantStyles: Record<InputVariant, string> = {
    default: `
      bg-[var(--color-bg-secondary)]
      border-[var(--input-border-width)] border-[var(--color-border-default)]
      ${!error && isFocused ? 'border-[var(--color-text-accent)]' : ''}
      ${glowOnFocus && isFocused && !error ? 'shadow-[var(--shadow-glow)]' : ''}
    `,
    filled: `
      bg-[var(--color-bg-tertiary)]
      border-[var(--input-border-width)] border-transparent
      ${!error && isFocused ? 'border-[var(--color-text-accent)]' : ''}
      ${glowOnFocus && isFocused && !error ? 'shadow-[var(--shadow-glow)]' : ''}
    `,
    elegant: `
      bg-[var(--color-bg-primary)]
      border-[var(--input-border-width)] border-[var(--color-border-accent)]
      shadow-[var(--shadow-inset)]
      ${isFocused && !error ? 'shadow-[var(--shadow-inset),var(--shadow-glow)]' : ''}
    `,
    arcane: `
      bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)]
      border-[var(--input-border-width)] border-[var(--color-border-accent)]
      shadow-[var(--shadow-inset)]
      ${isFocused && !error ? 'shadow-[var(--shadow-inset),var(--shadow-glow)]' : ''}
    `,
  };

  // Error styles
  const errorStyles = error ? 'border-[var(--color-error)]' : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label with mystical styling */}
      {label && (
        <label
          htmlFor={inputId}
          className={`
            block font-display font-medium tracking-wider uppercase
            text-[var(--color-text-secondary)]
            ${labelSizeClasses[size]}
            ${error ? 'text-[var(--color-error)]' : ''}
            ${isFocused && !error ? 'text-[var(--color-text-accent)]' : ''}
            transition-colors duration-[var(--duration-fast)]
          `}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative group">
        {/* Left Icon */}
        {leftIcon && (
          <div
            className={`
            absolute left-3.5 top-1/2 -translate-y-1/2
            text-[var(--color-text-muted)]
            pointer-events-none
            ${isFocused ? 'text-[var(--color-text-accent)]' : ''}
            ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}
            transition-all duration-[var(--duration-fast)]
            ${isFocused ? 'drop-shadow-[0_0_4px_rgba(212,165,116,0.5)]' : ''}
          `}
          >
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
            font-body text-[1.1em]
            text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-secondary)]
            placeholder:font-body placeholder:italic
            rounded-[var(--radius-md)]
            transition-all duration-[var(--duration-normal)]
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
          <div
            className={`
            absolute right-3.5 top-1/2 -translate-y-1/2
            ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}
          `}
          >
            {type === 'password' && showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`
                  text-[var(--color-text-muted)]
                  hover:text-[var(--color-text-accent)]
                  transition-all duration-[var(--duration-fast)]
                  focus:outline-none
                  focus-visible:ring-[var(--input-focus-ring-width)]
                  focus-visible:ring-[var(--color-text-accent)]
                  rounded-[var(--radius-sm)]
                  p-1.5
                  hover:bg-[color-mix(in_srgb,var(--color-text-accent)_10%,transparent)]
                  ${showPassword ? 'text-[var(--color-text-accent)]' : ''}
                `}
                disabled={disabled}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  // Eye with slash (hidden)
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  // Eye (visible)
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            ) : (
              <div
                className={`
                text-[var(--color-text-muted)]
                pointer-events-none
                ${isFocused ? 'text-[var(--color-text-accent)] drop-shadow-[0_0_4px_rgba(212,165,116,0.5)]' : ''}
                transition-all duration-[var(--duration-fast)]
              `}
              >
                {rightIcon}
              </div>
            )}
          </div>
        )}

        {/* Focus underline accent (for arcane and elegant variants) */}
        {(variant === 'elegant' || variant === 'arcane') && (
          <div
            className={`
              absolute -bottom-px left-1/2 -translate-x-1/2 h-[2px]
              bg-gradient-to-r from-transparent via-[var(--color-border-accent)] to-transparent
              transition-all duration-[var(--duration-normal)]
              ${isFocused && !error ? 'w-full opacity-100' : 'w-0 opacity-0'}
            `}
          />
        )}

        {/* Corner accents for arcane variant */}
        {variant === 'arcane' && (
          <>
            <div
              className={`
              absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 rounded-tl-[var(--radius-md)]
              transition-all duration-[var(--duration-normal)]
              ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
            `}
            />
            <div
              className={`
              absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 rounded-tr-[var(--radius-md)]
              transition-all duration-[var(--duration-normal)]
              ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
            `}
            />
            <div
              className={`
              absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 rounded-bl-[var(--radius-md)]
              transition-all duration-[var(--duration-normal)]
              ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
            `}
            />
            <div
              className={`
              absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 rounded-br-[var(--radius-md)]
              transition-all duration-[var(--duration-normal)]
              ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
            `}
            />
          </>
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p
          className={`
          mt-2.5
          text-sm
          font-body italic
          ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'}
        `}
        >
          {error || helperText}
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
export const SearchInput = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <Input
    ref={ref}
    type="search"
    variant="filled"
    leftIcon={
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    }
    placeholder="Search the archives..."
    {...props}
  />
));
SearchInput.displayName = 'SearchInput';

/** Password input with visibility toggle */
export const PasswordInput = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <Input
    ref={ref}
    type="password"
    showPasswordToggle
    leftIcon={
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    }
    {...props}
  />
));
PasswordInput.displayName = 'PasswordInput';

/** Arcane-styled input for special forms */
export const ArcaneInput = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <Input ref={ref} variant="arcane" glowOnFocus {...props} />
));
ArcaneInput.displayName = 'ArcaneInput';

/** Elegant-styled input for forms */
export const ElegantInput = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <Input ref={ref} variant="elegant" glowOnFocus {...props} />
));
ElegantInput.displayName = 'ElegantInput';

export default Input;
