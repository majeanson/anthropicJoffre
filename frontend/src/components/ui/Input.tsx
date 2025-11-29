/**
 * Input Component
 * Storybook UI Component
 *
 * Unified input field with multiple variants and states.
 * Supports text, email, password, search, and number types.
 *
 * Features:
 * - 3 variants: default, filled, outlined
 * - 3 sizes: sm, md, lg
 * - Error state with message
 * - Icon support (left/right)
 * - Password visibility toggle
 * - Dark mode support
 * - Full accessibility
 *
 * Usage:
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   placeholder="Enter your email"
 * />
 *
 * <Input
 *   label="Password"
 *   type="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   showPasswordToggle
 *   error="Password is required"
 * />
 * ```
 */

import { InputHTMLAttributes, forwardRef, useState, ReactNode } from 'react';

export type InputVariant = 'default' | 'filled' | 'outlined';
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
  /** Additional classes */
  className?: string;
  /** Container classes */
  containerClassName?: string;
}

const variantClasses: Record<InputVariant, string> = {
  default: `
    bg-parchment-100 dark:bg-gray-800
    border-2 border-parchment-400 dark:border-gray-600
    focus:border-blue-500 dark:focus:border-blue-400
  `,
  filled: `
    bg-parchment-200 dark:bg-gray-700
    border-2 border-transparent
    focus:border-blue-500 dark:focus:border-blue-400
  `,
  outlined: `
    bg-transparent
    border-2 border-parchment-400 dark:border-gray-600
    focus:border-blue-500 dark:focus:border-blue-400
  `,
};

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

const labelSizeClasses: Record<InputSize, string> = {
  sm: 'text-xs mb-1',
  md: 'text-sm mb-2',
  lg: 'text-base mb-2',
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
  className = '',
  containerClassName = '',
  type = 'text',
  disabled,
  id,
  ...props
}, ref) {
  const [showPassword, setShowPassword] = useState(false);

  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Determine actual input type (for password toggle)
  const actualType = type === 'password' && showPassword ? 'text' : type;

  // Error state styles
  const errorClasses = error
    ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400'
    : '';

  // Disabled state styles
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : '';

  // Icon padding
  const leftPaddingClass = leftIcon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '';
  const rightPaddingClass = (rightIcon || (type === 'password' && showPasswordToggle))
    ? (size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10')
    : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`block font-semibold text-umber-800 dark:text-gray-200 ${labelSizeClasses[size]}`}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-umber-500 dark:text-gray-400 pointer-events-none ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}>
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          disabled={disabled}
          className={`
            w-full
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${leftPaddingClass}
            ${rightPaddingClass}
            ${errorClasses}
            ${disabledClasses}
            text-umber-900 dark:text-gray-100
            placeholder-umber-400 dark:placeholder-gray-500
            rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
            ${className}
          `}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || (type === 'password' && showPasswordToggle)) && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}>
            {type === 'password' && showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-umber-500 dark:text-gray-400 hover:text-umber-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                disabled={disabled}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span aria-hidden="true">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
              </button>
            ) : (
              <div className="text-umber-500 dark:text-gray-400 pointer-events-none">
                {rightIcon}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500 dark:text-red-400' : 'text-umber-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});
