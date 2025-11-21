/**
 * Focus Trap Hook
 * Provides focus management for modals and dialogs
 *
 * Features:
 * - Traps Tab/Shift+Tab focus within container
 * - Auto-focuses first focusable element on mount
 * - Restores focus to previous element on unmount
 * - Supports Escape key to close
 */

import { useEffect, useRef, useCallback, useReducer } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the trap is active */
  isActive: boolean;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Whether to auto-focus first element */
  autoFocus?: boolean;
  /** Whether to restore focus on unmount */
  restoreFocus?: boolean;
}

export function useFocusTrap(options: UseFocusTrapOptions) {
  const { isActive, onEscape, autoFocus = true, restoreFocus = true } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => el.offsetParent !== null); // Filter out hidden elements
  }, []);

  // Handle Tab key to trap focus
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive || !containerRef.current) return;

    // Handle Escape
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
      return;
    }

    // Handle Tab
    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isActive, onEscape, getFocusableElements]);

  // Store previous focus and auto-focus first element
  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Auto-focus first element
      if (autoFocus) {
        // Small delay to ensure the modal is rendered
        const timeoutId = setTimeout(() => {
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isActive, autoFocus, getFocusableElements]);

  // Restore focus on unmount/close
  useEffect(() => {
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [restoreFocus]);

  // Add keyboard listener
  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);

  return {
    containerRef,
    /** Props to spread on the container element */
    containerProps: {
      ref: containerRef,
      role: 'dialog',
      'aria-modal': true,
    },
  };
}

/**
 * Hook for list keyboard navigation (up/down arrows)
 * Use for game lists, player lists, etc.
 */
interface UseListNavigationOptions {
  /** Total number of items */
  itemCount: number;
  /** Whether navigation is enabled */
  enabled?: boolean;
  /** Callback when Enter is pressed on selected item */
  onSelect?: (index: number) => void;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Whether to wrap around at ends */
  wrap?: boolean;
}

export function useListNavigation(options: UseListNavigationOptions) {
  const { itemCount, enabled = true, onSelect, onEscape, wrap = true } = options;

  const selectedIndexRef = useRef(0);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const setSelectedIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
    forceUpdate();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || itemCount === 0) return;

    // Don't handle if in input field
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (wrap) {
          setSelectedIndex((selectedIndexRef.current - 1 + itemCount) % itemCount);
        } else {
          setSelectedIndex(Math.max(0, selectedIndexRef.current - 1));
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (wrap) {
          setSelectedIndex((selectedIndexRef.current + 1) % itemCount);
        } else {
          setSelectedIndex(Math.min(itemCount - 1, selectedIndexRef.current + 1));
        }
        break;

      case 'Home':
        e.preventDefault();
        setSelectedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setSelectedIndex(itemCount - 1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(selectedIndexRef.current);
        break;

      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
    }
  }, [enabled, itemCount, wrap, onSelect, onEscape, setSelectedIndex]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  // Reset to 0 if itemCount changes and current index is out of bounds
  useEffect(() => {
    if (selectedIndexRef.current >= itemCount && itemCount > 0) {
      setSelectedIndex(0);
    }
  }, [itemCount, setSelectedIndex]);

  return {
    selectedIndex: selectedIndexRef.current,
    setSelectedIndex,
  };
}

