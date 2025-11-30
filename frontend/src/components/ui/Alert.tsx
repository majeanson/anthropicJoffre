/**
 * Alert Component - Multi-Skin Edition
 *
 * Contextual feedback messages with proper CSS variable support.
 * Works correctly across all light and dark themes.
 *
 * Features:
 * - 6 variants: info, success, warning, error, arcane, neutral
 * - Dismissible option with elegant close button
 * - Icon customization
 * - Title + description support
 * - Full accessibility
 */

import { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'arcane' | 'neutral';

export interface AlertProps {
  /** Alert variant */
  variant?: AlertVariant;
  /** Alert title (optional) */
  title?: ReactNode;
  /** Alert content */
  children: ReactNode;
  /** Custom icon (overrides default) */
  icon?: ReactNode;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Called when dismiss button is clicked */
  onDismiss?: () => void;
  /** Additional classes */
  className?: string;
}

// CSS variable-based variant styles
const variantClasses: Record<AlertVariant, {
  border: string;
  bg: string;
  iconColor: string;
  titleColor: string;
}> = {
  info: {
    border: 'border-[var(--color-info)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-info)_10%,var(--color-bg-secondary))]',
    iconColor: 'text-[var(--color-info)]',
    titleColor: 'text-[var(--color-text-primary)]',
  },
  success: {
    border: 'border-[var(--color-success)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-success)_10%,var(--color-bg-secondary))]',
    iconColor: 'text-[var(--color-success)]',
    titleColor: 'text-[var(--color-text-primary)]',
  },
  warning: {
    border: 'border-[var(--color-warning)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--color-bg-secondary))]',
    iconColor: 'text-[var(--color-warning)]',
    titleColor: 'text-[var(--color-text-primary)]',
  },
  error: {
    border: 'border-[var(--color-error)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-bg-secondary))]',
    iconColor: 'text-[var(--color-error)]',
    titleColor: 'text-[var(--color-text-primary)]',
  },
  arcane: {
    border: 'border-[var(--color-text-accent)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-text-accent)_10%,var(--color-bg-secondary))]',
    iconColor: 'text-[var(--color-text-accent)]',
    titleColor: 'text-[var(--color-text-accent)]',
  },
  neutral: {
    border: 'border-[var(--color-border-default)]',
    bg: 'bg-[var(--color-bg-tertiary)]',
    iconColor: 'text-[var(--color-text-muted)]',
    titleColor: 'text-[var(--color-text-primary)]',
  },
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  arcane: (
    <span className="text-lg">⚗</span>
  ),
  neutral: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const style = variantClasses[variant];
  const defaultIcon = defaultIcons[variant];

  return (
    <div
      role="alert"
      className={`
        flex gap-3
        p-4
        rounded-[var(--radius-lg)]
        relative overflow-hidden
        transition-all duration-[var(--duration-normal)]
        border-2
        ${style.border}
        ${style.bg}
        ${className}
      `}
      style={{
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Corner accents */}
      <div className={`absolute top-1 left-1 w-3 h-3 border-l border-t opacity-40 ${style.border}`} />
      <div className={`absolute top-1 right-1 w-3 h-3 border-r border-t opacity-40 ${style.border}`} />
      <div className={`absolute bottom-1 left-1 w-3 h-3 border-l border-b opacity-40 ${style.border}`} />
      <div className={`absolute bottom-1 right-1 w-3 h-3 border-r border-b opacity-40 ${style.border}`} />

      {/* Icon */}
      <div
        className={`flex-shrink-0 text-xl ${style.iconColor}`}
        aria-hidden="true"
      >
        {icon || defaultIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4
            className={`font-display font-semibold mb-1 tracking-wide uppercase text-sm ${style.titleColor}`}
          >
            {title}
          </h4>
        )}
        <div className="text-sm leading-relaxed text-[var(--color-text-secondary)] font-body">
          {children}
        </div>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className={`
            flex-shrink-0
            -mt-1 -mr-1
            p-1.5
            rounded-[var(--radius-md)]
            opacity-60 hover:opacity-100
            transition-all duration-[var(--duration-fast)]
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--color-text-accent)]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[var(--color-bg-secondary)]
            hover:bg-[var(--color-bg-tertiary)]
            ${style.iconColor}
          `}
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// PRESET ALERT COMPONENTS
// ============================================================================

export interface PresetAlertProps extends Omit<AlertProps, 'variant'> {}

/** Info alert */
export const InfoAlert = (props: PresetAlertProps) => (
  <Alert variant="info" {...props} />
);

/** Success alert */
export const SuccessAlert = (props: PresetAlertProps) => (
  <Alert variant="success" {...props} />
);

/** Warning alert */
export const WarningAlert = (props: PresetAlertProps) => (
  <Alert variant="warning" {...props} />
);

/** Error alert */
export const ErrorAlert = (props: PresetAlertProps) => (
  <Alert variant="error" {...props} />
);

/** Arcane alert */
export const ArcaneAlert = (props: PresetAlertProps) => (
  <Alert variant="arcane" {...props} />
);

export default Alert;
