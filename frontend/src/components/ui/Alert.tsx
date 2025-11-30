/**
 * Alert Component - Midnight Alchemy Edition
 *
 * Mystical contextual feedback messages with ethereal styling.
 * Features brass accents and alchemical iconography.
 *
 * Features:
 * - 5 variants: info, success, warning, error, arcane
 * - Dismissible option with elegant close button
 * - Icon customization with element theming
 * - Title + description support
 * - Sacred geometry corner decorations
 * - Full accessibility
 *
 * Usage:
 * ```tsx
 * <Alert variant="error" title="Volatile Reaction">
 *   The mixture has become unstable. Handle with care.
 * </Alert>
 *
 * <Alert
 *   variant="success"
 *   dismissible
 *   onDismiss={() => setShowAlert(false)}
 * >
 *   The transmutation was successful!
 * </Alert>
 * ```
 */

import { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'arcane';

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

// Midnight Alchemy themed variants
const variantStyles: Record<AlertVariant, {
  bg: string;
  border: string;
  text: string;
  icon: string;
  title: string;
  shadow: string;
}> = {
  info: {
    bg: 'linear-gradient(135deg, rgba(70, 130, 180, 0.1) 0%, #131824 100%)',
    border: '#4682B4',
    text: '#9CA3AF',
    icon: '#4682B4',
    title: '#E8E4DC',
    shadow: '0 4px 20px rgba(70, 130, 180, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  },
  success: {
    bg: 'linear-gradient(135deg, rgba(74, 156, 109, 0.1) 0%, #131824 100%)',
    border: '#4A9C6D',
    text: '#9CA3AF',
    icon: '#4A9C6D',
    title: '#E8E4DC',
    shadow: '0 4px 20px rgba(74, 156, 109, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, #131824 100%)',
    border: '#D4A574',
    text: '#9CA3AF',
    icon: '#D4A574',
    title: '#E8E4DC',
    shadow: '0 4px 20px rgba(212, 165, 116, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  },
  error: {
    bg: 'linear-gradient(135deg, rgba(166, 61, 61, 0.1) 0%, #131824 100%)',
    border: '#8B3D3D',
    text: '#9CA3AF',
    icon: '#A63D3D',
    title: '#E8E4DC',
    shadow: '0 4px 20px rgba(166, 61, 61, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  },
  arcane: {
    bg: 'linear-gradient(135deg, rgba(193, 127, 89, 0.1) 0%, #131824 100%)',
    border: '#C17F59',
    text: '#9CA3AF',
    icon: '#D4A574',
    title: '#D4A574',
    shadow: '0 4px 20px rgba(193, 127, 89, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
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
  const style = variantStyles[variant];
  const defaultIcon = defaultIcons[variant];

  return (
    <div
      role="alert"
      className={`
        flex gap-3
        p-4
        rounded-lg
        relative overflow-hidden
        transition-all duration-300
        ${className}
      `}
      style={{
        background: style.bg,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: style.border,
        boxShadow: style.shadow,
        color: style.text,
        fontFamily: '"Cormorant Garamond", Georgia, serif',
      }}
    >
      {/* Sacred geometry corner accents */}
      <div className="absolute top-1 left-1 w-3 h-3 border-l border-t opacity-40" style={{ borderColor: style.border }} />
      <div className="absolute top-1 right-1 w-3 h-3 border-r border-t opacity-40" style={{ borderColor: style.border }} />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-l border-b opacity-40" style={{ borderColor: style.border }} />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-r border-b opacity-40" style={{ borderColor: style.border }} />

      {/* Icon with ethereal glow */}
      <div
        className="flex-shrink-0 text-xl"
        aria-hidden="true"
        style={{
          color: style.icon,
          filter: `drop-shadow(0 0 6px ${style.icon})`,
        }}
      >
        {icon || defaultIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4
            className="font-semibold mb-1 tracking-wide uppercase text-sm"
            style={{
              color: style.title,
              fontFamily: '"Cinzel", Georgia, serif',
            }}
          >
            {title}
          </h4>
        )}
        <div className="text-sm leading-relaxed">
          {children}
        </div>
      </div>

      {/* Dismiss Button with brass styling */}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="
            flex-shrink-0
            -mt-1 -mr-1
            p-1.5
            rounded-md
            opacity-60 hover:opacity-100
            transition-all duration-200
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#C17F59]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[#131824]
            hover:bg-[#2D3548]
          "
          style={{ color: style.icon }}
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

/** Info alert - Ancient knowledge */
export const InfoAlert = (props: PresetAlertProps) => (
  <Alert variant="info" {...props} />
);

/** Success alert - Transmutation complete */
export const SuccessAlert = (props: PresetAlertProps) => (
  <Alert variant="success" {...props} />
);

/** Warning alert - Unstable mixture */
export const WarningAlert = (props: PresetAlertProps) => (
  <Alert variant="warning" {...props} />
);

/** Error alert - Volatile reaction */
export const ErrorAlert = (props: PresetAlertProps) => (
  <Alert variant="error" {...props} />
);

/** Arcane alert - Mystical message */
export const ArcaneAlert = (props: PresetAlertProps) => (
  <Alert variant="arcane" {...props} />
);

export default Alert;
