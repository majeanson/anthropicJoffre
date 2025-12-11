/**
 * useFormKeyboardNav Hook
 *
 * Reusable grid-based keyboard navigation for form components.
 * Provides GameBoy-style arrow key navigation across form elements.
 *
 * Features:
 * - Arrow key navigation (Up/Down for rows, Left/Right for columns)
 * - Escape key handling
 * - Auto-focus on navigation changes
 * - Skip rows support (e.g., skip name input when authenticated)
 * - Sound effects integration
 * - Input field awareness (don't intercept typing)
 */

import { useState, useEffect, useCallback, RefObject } from 'react';
import { sounds } from '../utils/sounds';

export interface FormGridConfig {
  /** Number of columns for each row (e.g., [1, 1, 2] = row0: 1 col, row1: 1 col, row2: 2 cols) */
  colsPerRow: number[];
  /** Number of rows to skip from the beginning (e.g., 1 to skip row 0) */
  skipRows?: number;
  /** Initial row to focus (after skipRows adjustment) */
  initialRow?: number;
  /** Initial column to focus */
  initialCol?: number;
}

export interface UseFormKeyboardNavOptions {
  /** Grid configuration */
  grid: FormGridConfig;
  /** Function to get the focusable element at a given row/col position */
  getFocusableElement: (row: number, col: number) => HTMLElement | null;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Refs to input elements that should allow typing (navigation keys still work) */
  inputRefs?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>[];
  /** Optional callback when navigation changes (row, col) */
  onNavigate?: (row: number, col: number) => void;
  /** Enable/disable sound effects (default: true) */
  enableSounds?: boolean;
  /** Enable/disable the keyboard navigation (useful for conditional activation) */
  enabled?: boolean;
}

export interface UseFormKeyboardNavReturn {
  /** Current row index */
  navRow: number;
  /** Current column index */
  navCol: number;
  /** Set row programmatically */
  setNavRow: React.Dispatch<React.SetStateAction<number>>;
  /** Set column programmatically */
  setNavCol: React.Dispatch<React.SetStateAction<number>>;
  /** Focus the current element */
  focusCurrentElement: () => void;
  /** Get max columns for a given row */
  getMaxCols: (row: number) => number;
  /** Get total number of navigable rows */
  getMaxRows: () => number;
}

export function useFormKeyboardNav({
  grid,
  getFocusableElement,
  onEscape,
  inputRefs = [],
  onNavigate,
  enableSounds = true,
  enabled = true,
}: UseFormKeyboardNavOptions): UseFormKeyboardNavReturn {
  const { colsPerRow, skipRows = 0, initialRow = 0, initialCol = 0 } = grid;

  const [navRow, setNavRow] = useState(initialRow);
  const [navCol, setNavCol] = useState(initialCol);

  // Calculate effective row (accounting for skipped rows)
  const getEffectiveRow = useCallback(
    (row: number): number => {
      return row + skipRows;
    },
    [skipRows]
  );

  // Get max columns for a given navigation row
  const getMaxCols = useCallback(
    (row: number): number => {
      const effectiveRow = getEffectiveRow(row);
      return colsPerRow[effectiveRow] ?? 1;
    },
    [colsPerRow, getEffectiveRow]
  );

  // Get total navigable rows (excluding skipped rows)
  const getMaxRows = useCallback((): number => {
    return colsPerRow.length - skipRows;
  }, [colsPerRow.length, skipRows]);

  // Focus the element at current position
  const focusCurrentElement = useCallback(() => {
    const element = getFocusableElement(navRow, navCol);
    element?.focus();
  }, [navRow, navCol, getFocusableElement]);

  // Play navigation sound
  const playSound = useCallback(() => {
    if (enableSounds) {
      sounds.buttonClick();
    }
  }, [enableSounds]);

  // Check if currently focused element is an input that should allow typing
  const isTypingInInput = useCallback((): boolean => {
    const activeElement = document.activeElement;
    return inputRefs.some((ref) => ref.current === activeElement);
  }, [inputRefs]);

  // Keyboard navigation handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow typing in inputs, but still handle navigation keys
      if (isTypingInInput() && !['ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            playSound();
            onEscape();
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          setNavRow((prev) => {
            const maxRows = getMaxRows();
            const newRow = prev > 0 ? prev - 1 : maxRows - 1;
            setNavCol((c) => Math.min(c, getMaxCols(newRow) - 1));
            return newRow;
          });
          playSound();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setNavRow((prev) => {
            const maxRows = getMaxRows();
            const newRow = prev < maxRows - 1 ? prev + 1 : 0;
            setNavCol((c) => Math.min(c, getMaxCols(newRow) - 1));
            return newRow;
          });
          playSound();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          setNavCol((prev) => {
            const maxCols = getMaxCols(navRow);
            return prev > 0 ? prev - 1 : maxCols - 1;
          });
          playSound();
          break;

        case 'ArrowRight':
          e.preventDefault();
          setNavCol((prev) => {
            const maxCols = getMaxCols(navRow);
            return prev < maxCols - 1 ? prev + 1 : 0;
          });
          playSound();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, navRow, getMaxRows, getMaxCols, onEscape, playSound, isTypingInInput]);

  // Focus element when navigation changes
  useEffect(() => {
    if (enabled) {
      focusCurrentElement();
      onNavigate?.(navRow, navCol);
    }
  }, [navRow, navCol, focusCurrentElement, onNavigate, enabled]);

  // Auto-focus first element on mount
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => {
        focusCurrentElement();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [enabled, focusCurrentElement]);

  return {
    navRow,
    navCol,
    setNavRow,
    setNavCol,
    focusCurrentElement,
    getMaxCols,
    getMaxRows,
  };
}
