/**
 * Toast Notifications Hook
 * Sprint 5 Phase 1: Extracted from App.tsx
 *
 * Manages toast notification state with duplicate prevention
 */

import { useState, useRef } from 'react';
import { ToastProps, ToastAction } from '../components/Toast';

/**
 * Toast notifications management hook
 *
 * Features:
 * - Duplicate prevention via lastToastRef
 * - Auto-clear ref after duration
 * - Optional action button support
 *
 * @returns Toast state, setter, and show function with duplicate prevention
 */
export function useToast() {
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const lastToastRef = useRef<string>('');

  /**
   * Show toast notification with duplicate prevention
   * Prevents showing the same message twice in succession
   *
   * @param message - Toast message
   * @param type - Toast type (info, success, error, warning)
   * @param duration - Duration in milliseconds (default: 3000)
   * @param action - Optional action button with label and onClick handler
   */
  const showToast = (
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info',
    duration: number = 3000,
    action?: ToastAction
  ) => {
    // Prevent duplicate toasts
    if (lastToastRef.current === message) {
      return;
    }

    lastToastRef.current = message;
    setToast({ message, type, duration, action });

    // Clear the ref after duration
    setTimeout(() => {
      if (lastToastRef.current === message) {
        lastToastRef.current = '';
      }
    }, duration);
  };

  return {
    toast,
    setToast,
    showToast,
  };
}
