/**
 * Select Component - Midnight Alchemy Edition
 *
 * Mystical dropdown select with brass frame aesthetics.
 * Features ethereal hover states and sacred geometry accents.
 *
 * Features:
 * - 3 variants: default, filled, arcane
 * - 3 sizes: sm, md, lg
 * - Error state with crimson glow
 * - Icon support with element theming
 * - Sacred geometry corner decorations
 * - Full accessibility (native select)
 *
 * Usage:
 * ```tsx
 * <Select
 *   label="Element Type"
 *   value={element}
 *   onChange={(e) => setElement(e.target.value)}
 *   options={[
 *     { value: 'fire', label: 'Fire △' },
 *     { value: 'water', label: 'Water ▽' },
 *     { value: 'earth', label: 'Earth ◇' },
 *     { value: 'air', label: 'Air ○' },
 *   ]}
 * />
 * ```
 */

import { SelectHTMLAttributes, forwardRef, ReactNode, useState } from 'react';

export type SelectVariant = 'default' | 'filled' | 'arcane';
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
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique ID if not provided
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  // Icon padding
  const leftPaddingClass = leftIcon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '';

  // Variant-specific styles
  const getVariantStyles = () => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: '#131824',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: error ? '#8B3D3D' : '#2D3548',
      color: '#E8E4DC',
      fontFamily: '"Cormorant Garamond", Georgia, serif',
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: '#1A1F2E',
          borderColor: error ? '#8B3D3D' : 'transparent',
        };
      case 'arcane':
        return {
          ...baseStyle,
          backgroundColor: '#0B0E14',
          borderColor: error ? '#8B3D3D' : isFocused ? '#C17F59' : '#2D3548',
          boxShadow: isFocused
            ? '0 0 20px rgba(193, 127, 89, 0.2), inset 0 0 30px rgba(193, 127, 89, 0.05)'
            : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
        };
      default:
        return {
          ...baseStyle,
          borderColor: error ? '#8B3D3D' : isFocused ? '#C17F59' : '#2D3548',
        };
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label with Cinzel font */}
      {label && (
        <label
          htmlFor={selectId}
          className={`block font-semibold uppercase tracking-wider ${labelSizeClasses[size]}`}
          style={{
            color: isFocused ? '#D4A574' : '#9CA3AF',
            fontFamily: '"Cinzel", Georgia, serif',
            transition: 'color 0.2s ease',
          }}
        >
          {label}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}
            style={{
              color: isFocused ? '#D4A574' : '#6B7280',
              filter: isFocused ? 'drop-shadow(0 0 4px rgba(212, 165, 116, 0.4))' : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            {leftIcon}
          </div>
        )}

        {/* Arcane corner decorations */}
        {variant === 'arcane' && (
          <>
            <div
              className={`absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 rounded-tl-md pointer-events-none transition-colors duration-200 ${
                isFocused ? 'border-[#C17F59]' : 'border-[#2D3548]'
              }`}
            />
            <div
              className={`absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 rounded-tr-md pointer-events-none transition-colors duration-200 ${
                isFocused ? 'border-[#C17F59]' : 'border-[#2D3548]'
              }`}
            />
            <div
              className={`absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 rounded-bl-md pointer-events-none transition-colors duration-200 ${
                isFocused ? 'border-[#C17F59]' : 'border-[#2D3548]'
              }`}
            />
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 rounded-br-md pointer-events-none transition-colors duration-200 ${
                isFocused ? 'border-[#C17F59]' : 'border-[#2D3548]'
              }`}
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
            rounded-md
            appearance-none
            cursor-pointer
            transition-all duration-200
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#C17F59]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[#0B0E14]
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          style={getVariantStyles()}
          {...props}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled style={{ color: '#6B7280' }}>
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              style={{
                backgroundColor: '#131824',
                color: option.disabled ? '#6B7280' : '#E8E4DC',
              }}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow with copper accent */}
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}
          style={{
            color: isFocused ? '#D4A574' : '#C17F59',
            filter: isFocused ? 'drop-shadow(0 0 4px rgba(212, 165, 116, 0.4))' : undefined,
            transition: 'all 0.2s ease',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p
          className="mt-1.5 text-sm"
          style={{
            color: error ? '#A63D3D' : '#6B7280',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
          }}
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

/** Arcane select with sacred geometry corners */
export const ArcaneSelect = forwardRef<HTMLSelectElement, PresetSelectProps>(
  (props, ref) => <Select ref={ref} variant="arcane" {...props} />
);

/** Filled select with subtle background */
export const FilledSelect = forwardRef<HTMLSelectElement, PresetSelectProps>(
  (props, ref) => <Select ref={ref} variant="filled" {...props} />
);

export default Select;
