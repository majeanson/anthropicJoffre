/**
 * Checkbox Component - Midnight Alchemy Edition
 *
 * Mystical checkbox and toggle switch with brass accents.
 * Features ethereal glow states and alchemical transitions.
 *
 * Features:
 * - 2 variants: checkbox, toggle (switch)
 * - 3 sizes: sm, md, lg
 * - Label and description support
 * - Indeterminate state with arcane styling
 * - Copper glow on checked states
 * - Full accessibility
 *
 * Usage:
 * ```tsx
 * <Checkbox
 *   label="Remember the incantation"
 *   checked={remember}
 *   onChange={(e) => setRemember(e.target.checked)}
 * />
 *
 * <Checkbox
 *   variant="toggle"
 *   label="Dark Laboratory Mode"
 *   description="Enable the midnight aesthetic"
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
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
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
              transition-all duration-300
            `}
            style={{
              backgroundColor: checked
                ? '#4A9C6D'
                : '#1A1F2E',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: checked ? '#4A9C6D' : '#2D3548',
              boxShadow: checked
                ? '0 0 15px rgba(74, 156, 109, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              className={`
                ${toggleSize.knob}
                absolute top-0.5 left-0.5
                rounded-full
                transition-all duration-300
                ${checked ? toggleSize.translate : 'translate-x-0'}
              `}
              style={{
                backgroundColor: checked
                  ? '#E8E4DC'
                  : '#6B7280',
                boxShadow: checked
                  ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 8px rgba(74, 156, 109, 0.3)'
                  : '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          </div>
        </div>

        {/* Label and Description */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span
                className={`font-medium tracking-wide ${labelSizeClasses[size]}`}
                style={{
                  color: '#E8E4DC',
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                }}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                className="text-sm mt-0.5"
                style={{
                  color: '#6B7280',
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                }}
              >
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
      className={`inline-flex items-start gap-2.5 ${disabledClasses} ${containerClassName}`}
    >
      {/* Checkbox */}
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          ref={inputRef}
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`
            ${checkboxSizeClasses[size]}
            rounded-md
            transition-all duration-200
            flex items-center justify-center
            peer-focus-visible:ring-2
            peer-focus-visible:ring-[#C17F59]
            peer-focus-visible:ring-offset-2
            peer-focus-visible:ring-offset-[#0B0E14]
            ${className}
          `}
          style={{
            backgroundColor: checked
              ? '#C17F59'
              : '#0B0E14',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: checked
              ? '#D4A574'
              : '#2D3548',
            boxShadow: checked
              ? '0 0 15px rgba(193, 127, 89, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Checkmark with ethereal glow */}
          {checked && (
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              style={{
                color: '#0B0E14',
                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))',
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {/* Indeterminate dash with copper accent */}
          {!checked && indeterminate && (
            <div
              className="w-2.5 h-0.5 rounded-full"
              style={{
                backgroundColor: '#C17F59',
                boxShadow: '0 0 4px rgba(193, 127, 89, 0.6)',
              }}
            />
          )}
        </div>
      </div>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span
              className={`font-medium ${labelSizeClasses[size]}`}
              style={{
                color: '#E8E4DC',
                fontFamily: '"Cormorant Garamond", Georgia, serif',
              }}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              className="text-sm mt-0.5"
              style={{
                color: '#6B7280',
                fontFamily: '"Cormorant Garamond", Georgia, serif',
              }}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

// ============================================================================
// PRESET CHECKBOX COMPONENTS
// ============================================================================

export interface PresetCheckboxProps extends Omit<CheckboxProps, 'variant'> {}

/** Toggle switch for on/off states */
export const Toggle = forwardRef<HTMLInputElement, PresetCheckboxProps>(
  (props, ref) => <Checkbox ref={ref} variant="toggle" {...props} />
);

export default Checkbox;
