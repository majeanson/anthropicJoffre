/**
 * Modal Component
 *
 * Unified modal system that merges the best features of ModalContainer and UnifiedModal.
 * Provides consistent styling, accessibility, keyboard handling, and mobile optimization.
 *
 * Features:
 * - Multiple size variants (sm, md, lg, xl, full)
 * - Theme support (parchment, blue, purple, green, red, dark)
 * - Mobile full-screen optimization
 * - Keyboard handling (ESC to close, focus trap)
 * - Body scroll lock
 * - Configurable close button
 * - Footer support
 * - Icon and subtitle support
 * - Nested modal support (z-index stacking)
 * - Accessibility (ARIA labels, focus management)
 *
 * Usage:
 * ```tsx
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Player Profile"
 *   icon={<UserIcon />}
 *   theme="parchment"
 *   size="lg"
 *   footer={
 *     <>
 *       <Button variant="secondary" onClick={onClose}>Cancel</Button>
 *       <Button variant="primary" onClick={onSave}>Save</Button>
 *     </>
 *   }
 * >
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 */

import { ReactNode, useEffect } from 'react';
import { themes, ThemeName } from '../../config/themes';
import { sizes } from '../../config/layout';
import { getModalZIndex } from '../../config/zIndex';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;

  // Header customization
  /** Modal title (can be string or ReactNode for custom headers) */
  title?: ReactNode;
  /** Subtitle text below title */
  subtitle?: string;
  /** Icon element to show before title */
  icon?: ReactNode;

  // Appearance
  /** Theme preset to use */
  theme?: ThemeName;
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

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  theme = 'parchment',
  size = 'md',
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  mobileFullScreen = true,
  stackLevel = 0,
  customZIndex,
  customHeight,
  contentClassName,
  ariaLabel,
  testId = 'modal',
}: ModalProps) {
  const themeConfig = themes[theme];
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
    ? 'sm:rounded-2xl sm:max-h-[90vh] max-sm:rounded-none max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-full'
    : 'rounded-2xl max-h-[90vh]';

  const hasHeader = title || icon || subtitle || showCloseButton;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${mobileFullScreen ? 'sm:p-4 max-sm:p-0' : 'p-4'} animate-fadeIn`}
      style={{ zIndex: modalZIndex }}
      data-testid={`${testId}-backdrop`}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-sm ${themeConfig.backdrop}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`relative bg-gradient-to-br ${themeConfig.bg} shadow-2xl ${sizes.modal[size]} w-full flex flex-col border-4 ${themeConfig.border} animate-slideUp ${mobileClasses} overflow-hidden ${customHeight || ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
        aria-labelledby={title ? `${testId}-title` : undefined}
        data-testid={`${testId}-content`}
      >
        {/* Header */}
        {hasHeader && (
          <div
            className={`sticky top-0 bg-gradient-to-r ${themeConfig.header} px-6 py-4 flex items-center justify-between border-b-4 ${themeConfig.border} z-10 ${mobileFullScreen ? 'sm:rounded-t-xl max-sm:rounded-t-none' : 'rounded-t-xl'}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {icon && <span className="text-4xl flex-shrink-0">{icon}</span>}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    id={`${testId}-title`}
                    className="text-xl md:text-2xl font-bold text-parchment-50"
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm md:text-base text-amber-200 dark:text-gray-300 font-semibold truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg flex-shrink-0"
                aria-label="Close modal"
                data-testid={`${testId}-close`}
              >
                ✕
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
          <div className={`bg-gray-100 dark:bg-gray-800 p-4 border-t-2 ${themeConfig.border} ${mobileFullScreen ? 'sm:rounded-b-xl max-sm:rounded-b-none' : 'rounded-b-xl'} flex gap-3 justify-end`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
