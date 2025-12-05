import { useEffect, memo } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
  action?: ToastAction;
}

export const Toast = memo(function Toast({ message, type, duration = 3000, onClose, action }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }[type];

  const icon = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕',
  }[type];

  return (
    <div className="fixed top-[68px] left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <div className="text-2xl font-bold">{icon}</div>
        <div className="flex-1 font-semibold">{message}</div>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded font-bold text-sm transition-colors"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 font-bold text-xl"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
});
