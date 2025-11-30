/**
 * Checkbox Component - Multi-Skin Edition
 *
 * Checkbox and toggle switch with proper CSS variable support.
 *
 * Features:
 * - 2 variants: checkbox, toggle (switch)
 * - 3 sizes: sm, md, lg
 * - Label and description support
 * - Indeterminate state
 * - Full accessibility
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
              transition-all duration-[var(--duration-normal)]
              border-2
              ${checked
                ? 'bg-[var(--color-success)] border-[var(--color-success)]'
                : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border-default)]'
              }
            `}
            style={{
              boxShadow: checked
                ? '0 0 15px color-mix(in srgb, var(--color-success) 40%, transparent)'
                : 'var(--shadow-inset)',
            }}
          >
            <div
              className={`
                ${toggleSize.knob}
                absolute top-0.5 left-0.5
                rounded-full
                transition-all duration-[var(--duration-normal)]
                ${checked ? toggleSize.translate : 'translate-x-0'}
                ${checked
                  ? 'bg-[var(--color-text-primary)]'
                  : 'bg-[var(--color-text-muted)]'
                }
              `}
              style={{
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>
        </div>

        {/* Label and Description */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span
                className={`font-body font-medium tracking-wide text-[var(--color-text-primary)] ${labelSizeClasses[size]}`}
              >
                {label}
              </span>
            )}
            {description && (
              <span className="text-sm mt-0.5 font-body text-[var(--color-text-muted)]">
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
            rounded-[var(--radius-md)]
            transition-all duration-[var(--duration-fast)]
            flex items-center justify-center
            peer-focus-visible:ring-2
            peer-focus-visible:ring-[var(--color-text-accent)]
            peer-focus-visible:ring-offset-2
            peer-focus-visible:ring-offset-[var(--color-bg-primary)]
            border-2
            ${checked
              ? 'bg-[var(--color-text-accent)] border-[var(--color-text-accent)]'
              : 'bg-[var(--color-bg-primary)] border-[var(--color-border-default)]'
            }
            ${className}
          `}
          style={{
            boxShadow: checked
              ? '0 0 15px color-mix(in srgb, var(--color-text-accent) 40%, transparent)'
              : 'var(--shadow-inset)',
          }}
        >
          {/* Checkmark */}
          {checked && (
            <svg
              className="w-3 h-3 text-[var(--color-text-inverse)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {/* Indeterminate dash */}
          {!checked && indeterminate && (
            <div
              className="w-2.5 h-0.5 rounded-full bg-[var(--color-text-accent)]"
              style={{
                boxShadow: '0 0 4px var(--color-glow)',
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
              className={`font-body font-medium text-[var(--color-text-primary)] ${labelSizeClasses[size]}`}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-sm mt-0.5 font-body text-[var(--color-text-muted)]">
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
