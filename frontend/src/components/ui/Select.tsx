/**
 * Select Component
 * Storybook UI Component
 *
 * Styled select dropdown with consistent design.
 * Wrapper around native select for accessibility.
 *
 * Features:
 * - 3 variants: default, filled, outlined
 * - 3 sizes: sm, md, lg
 * - Error state with message
 * - Icon support
 * - Dark mode support
 * - Full accessibility (native select)
 *
 * Usage:
 * ```tsx
 * <Select
 *   label="Difficulty"
 *   value={difficulty}
 *   onChange={(e) => setDifficulty(e.target.value)}
 *   options={[
 *     { value: 'easy', label: 'Easy' },
 *     { value: 'medium', label: 'Medium' },
 *     { value: 'hard', label: 'Hard' },
 *   ]}
 * />
 * ```
 */

import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

export type SelectVariant = 'default' | 'filled' | 'outlined';
export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select variant */
  variant?: SelectVariant;
  /** Select size */
  size?: SelectSize;
  /** Label text */
  label?: string;
  /** Helper text below select */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Options array */
  options: SelectOption[];
  /** Placeholder text (shown as first disabled option) */
  placeholder?: string;
  /** Icon on the left */
  leftIcon?: ReactNode;
  /** Full width */
  fullWidth?: boolean;
  /** Additional classes */
  className?: string;
  /** Container classes */
  containerClassName?: string;
}

const variantClasses: Record<SelectVariant, string> = {
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

const sizeClasses: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-sm pr-8',
  md: 'px-4 py-2 text-base pr-10',
  lg: 'px-5 py-3 text-lg pr-12',
};

const labelSizeClasses: Record<SelectSize, string> = {
  sm: 'text-xs mb-1',
  md: 'text-sm mb-2',
  lg: 'text-base mb-2',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({
  variant = 'default',
  size = 'md',
  label,
  helperText,
  error,
  options,
  placeholder,
  leftIcon,
  fullWidth = false,
  className = '',
  containerClassName = '',
  disabled,
  id,
  ...props
}, ref) {
  // Generate unique ID if not provided
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

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

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className={`block font-semibold text-umber-800 dark:text-gray-200 ${labelSizeClasses[size]}`}
        >
          {label}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-umber-500 dark:text-gray-400 pointer-events-none ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}>
            {leftIcon}
          </div>
        )}

        {/* Select */}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${leftPaddingClass}
            ${errorClasses}
            ${disabledClasses}
            text-umber-900 dark:text-gray-100
            rounded-lg
            appearance-none
            cursor-pointer
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
            ${className}
          `}
          {...props}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow */}
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-umber-500 dark:text-gray-400 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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
