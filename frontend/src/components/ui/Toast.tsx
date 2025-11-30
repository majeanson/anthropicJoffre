/**
 * Toast Component - Midnight Alchemy Edition
 *
 * Mystical notification toasts with ethereal glows and arcane animations.
 * Features brass frame aesthetics and alchemical progress indicators.
 *
 * Features:
 * - 4 variants: success, warning, error, info
 * - Auto-dismiss with arcane progress bar
 * - Manual close button with copper accents
 * - Slide-in animation with ethereal glow
 * - Icon support with element theming
 *
 * Usage:
 * ```tsx
 * <Toast
 *   variant="success"
 *   message="The transmutation was successful!"
 *   onClose={() => setShowToast(false)}
 *   autoDismiss={3000}
 * />
 * ```
 */

import { useEffect, useState, ReactNode } from 'react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  /** Visual style variant */
  variant?: ToastVariant;
  /** Toast message */
  message: string;
  /** Optional title */
  title?: string;
  /** Optional icon (overrides default) */
  icon?: ReactNode;
  /** Auto-dismiss after milliseconds (0 = no auto-dismiss) */
  autoDismiss?: number;
  /** Close handler */
  onClose: () => void;
  /** Show close button */
  showCloseButton?: boolean;
}

const variantStyles: Record<ToastVariant, {
  border: string;
  icon: string;
  iconGlow: string;
  progressBar: string;
  gradientFrom: string;
  defaultIcon: ReactNode;
  alchemySymbol: string;
}> = {
  success: {
    border: '#4A9C6D',
    icon: '#4A9C6D',
    iconGlow: 'rgba(74, 156, 109, 0.5)',
    progressBar: '#4A9C6D',
    gradientFrom: 'rgba(74, 156, 109, 0.1)',
    alchemySymbol: '☿', // Mercury - transformation complete
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    border: '#D4A574',
    icon: '#D4A574',
    iconGlow: 'rgba(212, 165, 116, 0.5)',
    progressBar: '#D4A574',
    gradientFrom: 'rgba(212, 165, 116, 0.1)',
    alchemySymbol: '△', // Fire - caution
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  error: {
    border: '#8B3D3D',
    icon: '#A63D3D',
    iconGlow: 'rgba(166, 61, 61, 0.5)',
    progressBar: '#A63D3D',
    gradientFrom: 'rgba(166, 61, 61, 0.1)',
    alchemySymbol: '☠', // Danger
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  },
  info: {
    border: '#4682B4',
    icon: '#4682B4',
    iconGlow: 'rgba(70, 130, 180, 0.5)',
    progressBar: '#4682B4',
    gradientFrom: 'rgba(70, 130, 180, 0.1)',
    alchemySymbol: '☽', // Moon - knowledge
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
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

  const style = variantStyles[variant];
  const displayIcon = icon !== undefined ? icon : style.defaultIcon;

  return (
    <div
      className={`
        min-w-[320px] max-w-md
        flex items-start gap-3
        p-4
        rounded-lg
        relative overflow-hidden
        transition-all duration-300
        ${isVisible ? 'animate-slide-in-right' : 'opacity-0 translate-x-4'}
      `}
      style={{
        background: `linear-gradient(135deg, ${style.gradientFrom} 0%, #131824 50%, #0B0E14 100%)`,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: style.border,
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.5),
          0 0 30px ${style.iconGlow},
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
        fontFamily: '"Cormorant Garamond", Georgia, serif',
      }}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      {/* Sacred geometry corner accents */}
      <div className="absolute top-1 left-1 w-3 h-3 border-l border-t opacity-40" style={{ borderColor: style.border }} />
      <div className="absolute top-1 right-1 w-3 h-3 border-r border-t opacity-40" style={{ borderColor: style.border }} />

      {/* Icon with ethereal glow effect */}
      <div
        className="flex-shrink-0 text-xl mt-0.5"
        style={{
          color: style.icon,
          filter: `drop-shadow(0 0 8px ${style.iconGlow})`,
        }}
      >
        {displayIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p
            className="font-semibold text-sm tracking-wide uppercase"
            style={{
              color: '#E8E4DC',
              fontFamily: '"Cinzel", Georgia, serif',
            }}
          >
            {title}
          </p>
        )}
        <p
          className={`text-sm leading-relaxed ${title ? 'mt-1' : ''}`}
          style={{ color: '#9CA3AF' }}
        >
          {message}
        </p>
      </div>

      {/* Close button with brass styling */}
      {showCloseButton && (
        <button
          onClick={handleClose}
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
            hover:bg-[#2D3548]
          "
          style={{ color: '#6B7280' }}
          aria-label="Dismiss notification"
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

      {/* Progress bar with ethereal glow */}
      {autoDismiss > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${style.progressBar}, ${style.icon})`,
            boxShadow: `0 0 12px ${style.iconGlow}`,
          }}
        />
      )}

      {/* Bottom corner accents */}
      <div className="absolute bottom-1 left-1 w-3 h-3 border-l border-b opacity-40" style={{ borderColor: style.border }} />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-r border-b opacity-40" style={{ borderColor: style.border }} />
    </div>
  );
}

// ============================================================================
// TOAST CONTAINER (for positioning multiple toasts)
// ============================================================================

export interface ToastContainerProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export function ToastContainer({ children, position = 'top-right' }: ToastContainerProps) {
  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-3`}
      role="region"
      aria-label="Notifications"
    >
      {children}
    </div>
  );
}

// ============================================================================
// PRESET TOAST COMPONENTS
// ============================================================================

export interface PresetToastProps extends Omit<ToastProps, 'variant'> {}

/** Success toast - Transmutation complete */
export const SuccessToast = (props: PresetToastProps) => (
  <Toast variant="success" {...props} />
);

/** Warning toast - Unstable mixture */
export const WarningToast = (props: PresetToastProps) => (
  <Toast variant="warning" {...props} />
);

/** Error toast - Volatile reaction */
export const ErrorToast = (props: PresetToastProps) => (
  <Toast variant="error" {...props} />
);

/** Info toast - Ancient knowledge */
export const InfoToast = (props: PresetToastProps) => (
  <Toast variant="info" {...props} />
);

export default Toast;
