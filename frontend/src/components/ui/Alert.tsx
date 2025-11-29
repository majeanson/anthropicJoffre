/**
 * Alert Component
 * Storybook UI Component
 *
 * Contextual feedback messages for user actions.
 * Supports multiple variants and dismissibility.
 *
 * Features:
 * - 5 variants: info, success, warning, error, neutral
 * - Dismissible option
 * - Icon customization
 * - Title + description support
 * - Dark mode support
 * - Full accessibility
 *
 * Usage:
 * ```tsx
 * <Alert variant="error" title="Login Failed">
 *   Invalid username or password
 * </Alert>
 *
 * <Alert
 *   variant="success"
 *   dismissible
 *   onDismiss={() => setShowAlert(false)}
 * >
 *   Your changes have been saved!
 * </Alert>
 * ```
 */

import { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

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

const variantClasses: Record<AlertVariant, { container: string; icon: string; title: string }> = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    icon: 'text-green-500 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    icon: 'text-amber-500 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
  },
  neutral: {
    container: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
    icon: 'text-gray-500 dark:text-gray-400',
    title: 'text-gray-900 dark:text-gray-100',
  },
};

const defaultIcons: Record<AlertVariant, string> = {
  info: 'ℹ️',
  success: '✓',
  warning: '⚠️',
  error: '✕',
  neutral: '📌',
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
  const variantStyle = variantClasses[variant];
  const defaultIcon = defaultIcons[variant];

  return (
    <div
      role="alert"
      className={`
        flex gap-3
        p-4
        border-2 rounded-lg
        ${variantStyle.container}
        ${className}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 text-xl ${variantStyle.icon}`} aria-hidden="true">
        {icon || defaultIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-bold mb-1 ${variantStyle.title}`}>
            {title}
          </h4>
        )}
        <div className="text-sm">
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
            p-1
            rounded-full
            opacity-60 hover:opacity-100
            transition-opacity
            focus:outline-none focus-visible:ring-2 focus-visible:ring-current
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
