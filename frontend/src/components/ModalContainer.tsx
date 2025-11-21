import { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '6xl';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: ModalSize;
  headerGradient?: string;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

const maxWidthClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
};

export function ModalContainer({
  isOpen,
  onClose,
  title,
  titleIcon,
  subtitle,
  children,
  maxWidth = '4xl',
  headerGradient = 'from-amber-700 to-amber-900 dark:from-gray-700 dark:to-gray-800',
  showCloseButton = true,
  footer,
}: ModalContainerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className={`bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-900 dark:border-gray-600`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`sticky top-0 bg-gradient-to-r ${headerGradient} p-6 flex items-center justify-between rounded-t-xl border-b-4 border-amber-950 dark:border-gray-900 z-10`}>
            <div className="flex items-center gap-3">
              {titleIcon && <span className="text-4xl">{titleIcon}</span>}
              <div>
                {title && <h2 className="text-2xl font-bold text-parchment-50">{title}</h2>}
                {subtitle && <p className="text-amber-200 dark:text-gray-300 font-semibold">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-b-xl border-t-2 border-gray-300 dark:border-gray-600">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
