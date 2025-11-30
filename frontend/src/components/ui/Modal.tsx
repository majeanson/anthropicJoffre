/**
 * Modal Component - Retro Gaming Edition
 *
 * A distinctive modal system with arcade-inspired aesthetics.
 * Features neon borders, scanline effects, and satisfying animations.
 *
 * Themes:
 * - neon: Cyan/pink neon glow (default for retro gaming)
 * - arcade: Classic arcade cabinet style
 * - terminal: Green terminal/hacker aesthetic
 * - hologram: Futuristic holographic effect
 * - classic: Fallback to original parchment style
 *
 * Features:
 * - Multiple size variants (sm, md, lg, xl, full)
 * - Neon glow effects
 * - Scanline overlay option
 * - Mobile full-screen optimization
 * - Keyboard handling (ESC to close)
 * - Body scroll lock
 * - Stacking support for nested modals
 */

import { ReactNode, useEffect, useRef } from 'react';
import { getModalZIndex } from '../../config/zIndex';
import { sizes } from '../../config/layout';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
// New retro gaming themes + backward compatible legacy themes
export type ModalTheme =
  | 'neon' | 'arcade' | 'terminal' | 'hologram' | 'classic'  // New themes
  | 'parchment' | 'blue' | 'purple' | 'green' | 'orange' | 'red';  // Legacy themes (mapped to new)

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;

  // Header customization
  /** Modal title */
  title?: ReactNode;
  /** Subtitle text below title */
  subtitle?: string;
  /** Icon element to show before title */
  icon?: ReactNode;

  // Appearance
  /** Theme preset to use */
  theme?: ModalTheme;
  /** Size preset */
  size?: ModalSize;

  // Layout
  /** Footer content (usually buttons) */
  footer?: ReactNode;

  // Behavior
  /** Show X button in header */
  showCloseButton?: boolean;
  /** Allow closing by clicking backdrop */
  closeOnBackdrop?: boolean;
  /** Allow closing with ESC key */
  closeOnEscape?: boolean;
  /** Lock body scroll when modal is open */
  preventBodyScroll?: boolean;
  /** Make modal full-screen on mobile devices */
  mobileFullScreen?: boolean;

  // Effects
  /** Enable scanline overlay effect */
  scanlines?: boolean;
  /** Enable glow animation on border */
  glowAnimation?: boolean;

  // Advanced
  /** Stacking level for nested modals (0 = base, 1+ = nested) */
  stackLevel?: number;
  /** Custom z-index override */
  customZIndex?: number;
  /** Custom height class (e.g., 'h-[600px]') */
  customHeight?: string;
  /** Custom className for content area */
  contentClassName?: string;

  // Accessibility
  /** aria-label for modal */
  ariaLabel?: string;
  /** data-testid for testing */
  testId?: string;
}

// Theme configurations
const themeConfigs: Record<ModalTheme, {
  backdrop: string;
  container: string;
  header: string;
  border: string;
  title: string;
  closeButton: string;
  footer: string;
  glow: string;
}> = {
  neon: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-gradient-to-r from-[var(--color-bg-accent)] to-[var(--color-team2-primary)]',
    border: 'border-[var(--color-border-accent)]',
    title: 'text-[var(--color-text-primary)]',
    closeButton: 'bg-[var(--color-error)] hover:bg-[var(--color-error)] hover:shadow-[0_0_20px_var(--color-error)]',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: '0 0 30px var(--color-glow), 0 0 60px var(--color-glow)',
  },
  arcade: {
    backdrop: 'bg-black/90',
    container: 'bg-[#1a1a2e]',
    header: 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a]',
    border: 'border-[#ffbe0b]',
    title: 'text-white',
    closeButton: 'bg-red-600 hover:bg-red-500 hover:shadow-[0_0_15px_#ff0000]',
    footer: 'bg-[#0f0f23]',
    glow: '0 0 20px #ffbe0b, 0 0 40px #ffbe0b',
  },
  terminal: {
    backdrop: 'bg-black/95',
    container: 'bg-[#0a0a0a]',
    header: 'bg-[#001100]',
    border: 'border-[#00ff00]',
    title: 'text-[#00ff00]',
    closeButton: 'bg-[#003300] hover:bg-[#004400] text-[#00ff00] hover:shadow-[0_0_15px_#00ff00]',
    footer: 'bg-[#001100]',
    glow: '0 0 20px #00ff00, 0 0 40px #00ff00',
  },
  hologram: {
    backdrop: 'bg-black/80',
    container: 'bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95',
    header: 'bg-gradient-to-r from-[#00d4ff] to-[#9d4edd]',
    border: 'border-[#00d4ff]',
    title: 'text-white',
    closeButton: 'bg-[#ff006e] hover:bg-[#ff2a6d] hover:shadow-[0_0_20px_#ff006e]',
    footer: 'bg-[#0f0f23]/80',
    glow: '0 0 30px #00d4ff, 0 0 60px #9d4edd',
  },
  classic: {
    backdrop: 'bg-black/70',
    container: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900',
    header: 'bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-800',
    border: 'border-amber-900 dark:border-gray-600',
    title: 'text-amber-50',
    closeButton: 'bg-red-600 hover:bg-red-700',
    footer: 'bg-gray-100 dark:bg-gray-800',
    glow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  // Legacy themes (backward compatible - mapped to skin-aware neon style with color accents)
  parchment: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-gradient-to-r from-amber-700 to-orange-700',
    border: 'border-amber-600',
    title: 'text-amber-50',
    closeButton: 'bg-[var(--color-error)] hover:bg-[var(--color-error)] hover:shadow-[0_0_20px_var(--color-error)]',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: '0 0 20px rgba(245, 158, 11, 0.3)',
  },
  blue: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    border: 'border-blue-500',
    title: 'text-white',
    closeButton: 'bg-[var(--color-error)] hover:bg-[var(--color-error)] hover:shadow-[0_0_20px_var(--color-error)]',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: '0 0 20px rgba(59, 130, 246, 0.4)',
  },
  purple: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-gradient-to-r from-purple-600 to-pink-500',
    border: 'border-purple-500',
    title: 'text-white',
    closeButton: 'bg-[var(--color-error)] hover:bg-[var(--color-error)] hover:shadow-[0_0_20px_var(--color-error)]',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: '0 0 20px rgba(168, 85, 247, 0.4)',
  },
  green: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-gradient-to-r from-green-600 to-emerald-500',
    border: 'border-green-500',
    title: 'text-white',
    closeButton: 'bg-[var(--color-error)] hover:bg-[var(--color-error)] hover:shadow-[0_0_20px_var(--color-error)]',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: '0 0 20px rgba(34, 197, 94, 0.4)',
  },
  orange: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-gradient-to-r from-orange-600 to-amber-500',
    border: 'border-orange-500',
    title: 'text-white',
    closeButton: 'bg-[var(--color-error)] hover:bg-[var(--color-error)] hover:shadow-[0_0_20px_var(--color-error)]',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: '0 0 20px rgba(249, 115, 22, 0.4)',
  },
  red: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-gradient-to-r from-red-600 to-rose-500',
    border: 'border-red-500',
    title: 'text-white',
    closeButton: 'bg-[var(--color-error)] hover:bg-[var(--color-error)] hover:shadow-[0_0_20px_var(--color-error)]',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: '0 0 20px rgba(239, 68, 68, 0.4)',
  },
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  theme = 'neon',
  size = 'md',
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  mobileFullScreen = true,
  scanlines = false,
  glowAnimation = true,
  stackLevel = 0,
  customZIndex,
  customHeight,
  contentClassName,
  ariaLabel,
  testId = 'modal',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const config = themeConfigs[theme];
  const modalZIndex = customZIndex || getModalZIndex(stackLevel);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, preventBodyScroll]);

  // Focus trap and initial focus
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  // Stop keyboard events from propagating
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  // Mobile responsive classes
  const mobileClasses = mobileFullScreen
    ? 'sm:rounded-[var(--radius-xl)] sm:max-h-[90vh] max-sm:rounded-none max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-full'
    : 'rounded-[var(--radius-xl)] max-h-[90vh]';

  const hasHeader = title || icon || subtitle || showCloseButton;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${mobileFullScreen ? 'sm:p-4 max-sm:p-0' : 'p-4'}`}
      style={{ zIndex: modalZIndex }}
      data-testid={`${testId}-backdrop`}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0
          ${config.backdrop}
          backdrop-blur-[var(--modal-backdrop-blur)]
          animate-fadeIn
        `}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative
          ${config.container}
          ${sizes.modal[size]}
          w-full
          flex flex-col
          border-[var(--modal-border-width)]
          ${config.border}
          ${mobileClasses}
          overflow-hidden
          ${customHeight || ''}
          animate-slideUp
          ${glowAnimation ? 'transition-shadow duration-[var(--duration-normal)]' : ''}
        `}
        style={{
          boxShadow: glowAnimation ? config.glow : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
        aria-labelledby={title ? `${testId}-title` : undefined}
        data-testid={`${testId}-content`}
      >
        {/* Scanline overlay */}
        {scanlines && (
          <div
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px, transparent 1px, transparent 2px)',
            }}
          />
        )}

        {/* Header */}
        {hasHeader && (
          <div
            className={`
              sticky top-0
              ${config.header}
              px-6 py-4
              flex items-center justify-between
              border-b-[var(--modal-border-width)]
              ${config.border}
              z-10
              ${mobileFullScreen ? 'sm:rounded-t-[calc(var(--radius-xl)-var(--modal-border-width))] max-sm:rounded-t-none' : 'rounded-t-[calc(var(--radius-xl)-var(--modal-border-width))]'}
            `}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {icon && (
                <span className="text-4xl flex-shrink-0 drop-shadow-lg">
                  {icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    id={`${testId}-title`}
                    className={`
                      text-xl md:text-2xl
                      font-display
                      uppercase
                      tracking-wider
                      ${config.title}
                      drop-shadow-lg
                    `}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm md:text-base text-white/80 font-body truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  ml-4
                  ${config.closeButton}
                  text-white
                  w-10 h-10
                  rounded-[var(--radius-md)]
                  font-display
                  text-xl
                  transition-all duration-[var(--duration-fast)]
                  hover:scale-110
                  active:scale-95
                  flex-shrink-0
                  flex items-center justify-center
                  border-2 border-white/20
                `}
                aria-label="Close modal"
                data-testid={`${testId}-close`}
              >
                X
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={contentClassName || 'flex-1 overflow-y-auto p-6'}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={`
              ${config.footer}
              p-4
              border-t-[var(--modal-border-width)]
              ${config.border}
              ${mobileFullScreen ? 'sm:rounded-b-[calc(var(--radius-xl)-var(--modal-border-width))] max-sm:rounded-b-none' : 'rounded-b-[calc(var(--radius-xl)-var(--modal-border-width))]'}
              flex gap-3 justify-end
            `}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PRESET MODAL COMPONENTS
// ============================================================================

export interface PresetModalProps extends Omit<ModalProps, 'theme'> {}

/** Neon-styled modal (default retro gaming) */
export const NeonModal = (props: PresetModalProps) => (
  <Modal theme="neon" glowAnimation scanlines {...props} />
);

/** Arcade cabinet styled modal */
export const ArcadeModal = (props: PresetModalProps) => (
  <Modal theme="arcade" glowAnimation {...props} />
);

/** Terminal/hacker styled modal */
export const TerminalModal = (props: PresetModalProps) => (
  <Modal theme="terminal" scanlines {...props} />
);

/** Holographic styled modal */
export const HologramModal = (props: PresetModalProps) => (
  <Modal theme="hologram" glowAnimation {...props} />
);

/** Classic parchment styled modal (backward compatible) */
export const ClassicModal = (props: PresetModalProps) => (
  <Modal theme="classic" {...props} />
);

export default Modal;
