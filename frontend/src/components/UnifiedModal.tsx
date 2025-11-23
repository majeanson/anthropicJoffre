import { ReactNode, useEffect } from 'react';

interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  /** Makes modal full-screen on mobile devices (< 640px) */
  mobileFullScreen?: boolean;
}

export function UnifiedModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  mobileFullScreen = true
}: UnifiedModalProps) {
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl'
  };

  // Mobile full-screen classes
  const mobileClasses = mobileFullScreen
    ? 'sm:rounded-xl sm:max-h-[90vh] max-sm:rounded-none max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-full'
    : 'rounded-xl max-h-[90vh]';

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  // Stop all keyboard events from propagating to underlying components
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center animate-fadeIn ${mobileFullScreen ? 'sm:p-4 max-sm:p-0' : 'p-4'}`}
      data-testid="unified-modal-backdrop"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`relative bg-parchment-50 dark:bg-gray-800 shadow-2xl ${sizeClasses[size]} w-full flex flex-col border-2 border-amber-700 dark:border-gray-600 animate-slideUp ${mobileClasses}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        data-testid="unified-modal-content"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between px-6 py-4 border-b-2 border-parchment-300 dark:border-gray-700 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-700 dark:to-gray-800 ${mobileFullScreen ? 'sm:rounded-t-xl max-sm:rounded-t-none' : 'rounded-t-xl'}`}>
            {title && (
              <h2
                id="modal-title"
                className="text-xl md:text-2xl font-bold text-umber-900 dark:text-gray-100"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto text-umber-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors text-2xl font-bold p-2 rounded-lg hover:bg-parchment-200 dark:hover:bg-gray-700"
                aria-label="Close modal"
                data-testid="unified-modal-close"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
