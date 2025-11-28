/**
 * Toast Component
 * Sprint 21: Notification toast with design tokens
 *
 * Features:
 * - 4 variants: success, warning, error, info
 * - Auto-dismiss with timer
 * - Manual close button
 * - Slide-in animation
 * - Icon support
 * - Uses design token system
 *
 * Usage:
 * ```tsx
 * <Toast
 *   variant="success"
 *   message="Quest completed!"
 *   onClose={() => setShowToast(false)}
 *   autoD ismiss={3000}
 * />
 * ```
 */

import { useEffect, useState } from 'react';
import { colors, spacing, shadows, typography } from '../../design-system';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  /** Visual style variant */
  variant?: ToastVariant;
  /** Toast message */
  message: string;
  /** Optional title */
  title?: string;
  /** Optional icon (overrides default) */
  icon?: React.ReactNode;
  /** Auto-dismiss after milliseconds (0 = no auto-dismiss) */
  autoDismiss?: number;
  /** Close handler */
  onClose: () => void;
  /** Show close button */
  showCloseButton?: boolean;
}

const variantStyles: Record<ToastVariant, {
  container: string;
  icon: string;
  defaultIcon: string;
}> = {
  success: {
    container: `bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600`,
    icon: 'text-green-600 dark:text-green-400',
    defaultIcon: '✓',
  },
  warning: {
    container: `bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 dark:border-yellow-600`,
    icon: 'text-yellow-600 dark:text-yellow-400',
    defaultIcon: '⚠',
  },
  error: {
    container: `bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600`,
    icon: 'text-red-600 dark:text-red-400',
    defaultIcon: '✕',
  },
  info: {
    container: `bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600`,
    icon: 'text-blue-600 dark:text-blue-400',
    defaultIcon: 'ℹ',
  },
};

export function Toast({
  variant = 'info',
  message,
  title,
  icon,
  autoDismiss = 0,
  onClose,
  showCloseButton = true,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoDismiss > 0) {
      // Auto-dismiss timer
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, autoDismiss);

      // Progress bar animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.max(0, prev - (100 / (autoDismiss / 100))));
      }, 100);

      return () => {
        clearTimeout(dismissTimer);
        clearInterval(progressInterval);
      };
    }
  }, [autoDismiss, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const variantStyle = variantStyles[variant];
  const displayIcon = icon !== undefined ? icon : variantStyle.defaultIcon;

  return (
    <div
      className={`
        ${variantStyle.container}
        ${isVisible ? 'animate-slide-in-right' : 'animate-fadeOut'}
        ${spacing.padding.md} ${spacing.gap.sm}
        ${shadows.lg}
        rounded-lg
        min-w-[300px] max-w-md
        flex items-start
        relative overflow-hidden
      `}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${variantStyle.icon} ${typography.h4}`}>
        {displayIcon}
      </div>

      {/* Content */}
      <div className="flex-1 ml-3">
        {title && (
          <p className={`${typography.label} ${variantStyle.icon} font-semibold`}>
            {title}
          </p>
        )}
        <p className={`${typography.bodySmall} text-gray-900 dark:text-gray-100 ${title ? 'mt-1' : ''}`}>
          {message}
        </p>
      </div>

      {/* Close button */}
      {showCloseButton && (
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 ml-4
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
            transition-colors duration-200
            ${colors.focus.light} dark:${colors.focus.dark}
            focus-visible:ring-2 focus-visible:ring-offset-2
            rounded
          `}
          aria-label="Close notification"
        >
          <span className="text-xl">×</span>
        </button>
      )}

      {/* Progress bar */}
      {autoDismiss > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}
