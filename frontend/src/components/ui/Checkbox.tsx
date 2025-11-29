/**
 * Checkbox Component
 * Storybook UI Component
 *
 * Unified checkbox with optional toggle switch variant.
 * Supports labels, descriptions, and controlled/uncontrolled modes.
 *
 * Features:
 * - 2 variants: checkbox, toggle (switch)
 * - 3 sizes: sm, md, lg
 * - Label and description support
 * - Indeterminate state
 * - Dark mode support
 * - Full accessibility
 *
 * Usage:
 * ```tsx
 * <Checkbox
 *   label="Remember me"
 *   checked={rememberMe}
 *   onChange={(e) => setRememberMe(e.target.checked)}
 * />
 *
 * <Checkbox
 *   variant="toggle"
 *   label="Dark Mode"
 *   description="Enable dark theme"
 *   checked={darkMode}
 *   onChange={(e) => setDarkMode(e.target.checked)}
 * />
 * ```
 */

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

export type CheckboxVariant = 'checkbox' | 'toggle';
export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Checkbox variant */
  variant?: CheckboxVariant;
  /** Checkbox size */
  size?: CheckboxSize;
  /** Label text */
  label?: ReactNode;
  /** Description text below label */
  description?: string;
  /** Indeterminate state (checkbox only) */
  indeterminate?: boolean;
  /** Additional classes for the label container */
  containerClassName?: string;
}

const checkboxSizeClasses: Record<CheckboxSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const toggleSizeClasses: Record<CheckboxSize, { container: string; knob: string; translate: string }> = {
  sm: {
    container: 'w-8 h-4',
    knob: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    container: 'w-10 h-5',
    knob: 'w-4 h-4',
    translate: 'translate-x-5',
  },
  lg: {
    container: 'w-12 h-6',
    knob: 'w-5 h-5',
    translate: 'translate-x-6',
  },
};

const labelSizeClasses: Record<CheckboxSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({
  variant = 'checkbox',
  size = 'md',
  label,
  description,
  indeterminate = false,
  containerClassName = '',
  className = '',
  disabled,
  checked,
  id,
  ...props
}, ref) {
  // Generate unique ID if not provided
  const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  // Handle indeterminate state
  const inputRef = (node: HTMLInputElement | null) => {
    if (node) {
      node.indeterminate = indeterminate;
    }
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  // Disabled state styles
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  if (variant === 'toggle') {
    const toggleSize = toggleSizeClasses[size];

    return (
      <label
        htmlFor={inputId}
        className={`inline-flex items-start gap-3 ${disabledClasses} ${containerClassName}`}
      >
        {/* Toggle Switch */}
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={`
              ${toggleSize.container}
              rounded-full
              transition-colors duration-200
              ${checked
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600'
              }
            `}
          >
            <div
              className={`
                ${toggleSize.knob}
                absolute top-0.5 left-0.5
                bg-white rounded-full shadow-md
                transition-transform duration-200
                ${checked ? toggleSize.translate : 'translate-x-0'}
              `}
            />
          </div>
        </div>

        {/* Label and Description */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className={`font-medium text-umber-900 dark:text-gray-100 ${labelSizeClasses[size]}`}>
                {label}
              </span>
            )}
            {description && (
              <span className="text-sm text-umber-600 dark:text-gray-400 mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }

  // Default checkbox variant
  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-start gap-2 ${disabledClasses} ${containerClassName}`}
    >
      {/* Checkbox */}
      <input
        ref={inputRef}
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className={`
          ${checkboxSizeClasses[size]}
          flex-shrink-0 mt-0.5
          text-blue-600 dark:text-blue-500
          bg-parchment-100 dark:bg-gray-700
          border-2 border-parchment-400 dark:border-gray-500
          rounded
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          transition-colors duration-200
          ${disabled ? '' : 'hover:border-blue-500 dark:hover:border-blue-400'}
          ${className}
        `}
        {...props}
      />

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={`font-medium text-umber-800 dark:text-gray-200 ${labelSizeClasses[size]}`}>
              {label}
            </span>
          )}
          {description && (
            <span className="text-sm text-umber-600 dark:text-gray-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});
