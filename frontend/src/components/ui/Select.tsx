/**
 * Select Component - Multi-Skin Edition
 *
 * Dropdown select with proper CSS variable support for all themes.
 *
 * Features:
 * - 4 variants: default, filled, arcane, outlined
 * - 3 sizes: sm, md, lg
 * - Error state
 * - Icon support
 * - Full accessibility (native select)
 */

import { SelectHTMLAttributes, forwardRef, ReactNode, useState } from 'react';

export type SelectVariant = 'default' | 'filled' | 'arcane' | 'outlined';
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

const sizeClasses: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-sm pr-8',
  md: 'px-4 py-2.5 text-base pr-10',
  lg: 'px-5 py-3 text-lg pr-12',
};

const labelSizeClasses: Record<SelectSize, string> = {
  sm: 'text-xs mb-1',
  md: 'text-sm mb-2',
  lg: 'text-base mb-2',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
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
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique ID if not provided
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  // Icon padding
  const leftPaddingClass = leftIcon
    ? size === 'sm'
      ? 'pl-8'
      : size === 'lg'
        ? 'pl-12'
        : 'pl-10'
    : '';

  // Variant-specific classes
  const getVariantClasses = () => {
    const baseClasses = `
      bg-[var(--color-bg-secondary)]
      border-[var(--input-border-width)]
      text-[var(--color-text-primary)]
      font-body
    `;

    switch (variant) {
      case 'filled':
        return `
          ${baseClasses}
          bg-[var(--color-bg-tertiary)]
          ${error ? 'border-[var(--color-error)]' : 'border-transparent'}
        `;
      case 'arcane':
        return `
          ${baseClasses}
          bg-[var(--color-bg-primary)]
          ${
            error
              ? 'border-[var(--color-error)]'
              : isFocused
                ? 'border-[var(--color-text-accent)]'
                : 'border-[var(--color-border-default)]'
          }
        `;
      case 'outlined':
        return `
          ${baseClasses}
          bg-transparent
          ${
            error
              ? 'border-[var(--color-error)]'
              : isFocused
                ? 'border-[var(--color-text-accent)]'
                : 'border-[var(--color-border-default)]'
          }
        `;
      default:
        return `
          ${baseClasses}
          ${
            error
              ? 'border-[var(--color-error)]'
              : isFocused
                ? 'border-[var(--color-text-accent)]'
                : 'border-[var(--color-border-default)]'
          }
        `;
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className={`
            block font-display font-semibold uppercase tracking-wider
            transition-colors duration-[var(--duration-fast)]
            ${labelSizeClasses[size]}
            ${isFocused ? 'text-[var(--color-text-accent)]' : 'text-[var(--color-text-secondary)]'}
          `}
        >
          {label}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none
              transition-colors duration-[var(--duration-fast)]
              ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}
              ${isFocused ? 'text-[var(--color-text-accent)]' : 'text-[var(--color-text-muted)]'}
            `}
          >
            {leftIcon}
          </div>
        )}

        {/* Arcane corner decorations */}
        {variant === 'arcane' && (
          <>
            <div
              className={`
                absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 rounded-tl-[var(--radius-sm)] pointer-events-none
                transition-colors duration-[var(--duration-fast)]
                ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
              `}
            />
            <div
              className={`
                absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 rounded-tr-[var(--radius-sm)] pointer-events-none
                transition-colors duration-[var(--duration-fast)]
                ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
              `}
            />
            <div
              className={`
                absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 rounded-bl-[var(--radius-sm)] pointer-events-none
                transition-colors duration-[var(--duration-fast)]
                ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
              `}
            />
            <div
              className={`
                absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 rounded-br-[var(--radius-sm)] pointer-events-none
                transition-colors duration-[var(--duration-fast)]
                ${isFocused ? 'border-[var(--color-text-accent)]' : 'border-[var(--color-border-default)]'}
              `}
            />
          </>
        )}

        {/* Select */}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full
            ${sizeClasses[size]}
            ${leftPaddingClass}
            rounded-[var(--radius-md)]
            appearance-none
            cursor-pointer
            transition-all duration-[var(--duration-fast)]
            focus:outline-none
            focus-visible:ring-[var(--input-focus-ring-width)]
            focus-visible:ring-[var(--color-text-accent)]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[var(--color-bg-primary)]
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${getVariantClasses()}
            ${className}
          `}
          style={{
            boxShadow:
              isFocused && variant === 'arcane'
                ? '0 0 20px color-mix(in srgb, var(--color-text-accent) 20%, transparent)'
                : 'var(--shadow-sm)',
          }}
          {...props}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled className="text-[var(--color-text-muted)]">
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={`
                bg-[var(--color-bg-secondary)]
                ${option.disabled ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}
              `}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow */}
        <div
          className={`
            absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
            transition-colors duration-[var(--duration-fast)]
            ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}
            ${isFocused ? 'text-[var(--color-text-accent)]' : 'text-[var(--color-text-accent)]/70'}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p
          className={`
            mt-1.5 text-sm font-body
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
// PRESET SELECT COMPONENTS
// ============================================================================

export interface PresetSelectProps extends Omit<SelectProps, 'variant'> {}

/** Arcane select with corner accents */
export const ArcaneSelect = forwardRef<HTMLSelectElement, PresetSelectProps>((props, ref) => (
  <Select ref={ref} variant="arcane" {...props} />
));

/** Filled select with subtle background */
export const FilledSelect = forwardRef<HTMLSelectElement, PresetSelectProps>((props, ref) => (
  <Select ref={ref} variant="filled" {...props} />
));

export default Select;
