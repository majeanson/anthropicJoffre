import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
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
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <div className="text-2xl font-bold">{icon}</div>
        <div className="flex-1 font-semibold">{message}</div>
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
}
