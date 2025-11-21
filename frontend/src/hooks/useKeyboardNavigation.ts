/**
 * Keyboard Navigation Hook
 * Task 10 - Phase 2: Comprehensive keyboard shortcuts
 *
 * Provides Game Boy-style keyboard navigation for the entire app.
 * All phases can be controlled keyboard-only.
 */

import { useEffect, useCallback, useRef, useState } from 'react';

export type KeyboardContext =
  | 'lobby'
  | 'team_selection'
  | 'betting'
  | 'playing'
  | 'global';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  context?: KeyboardContext;
}

export interface UseKeyboardNavigationOptions {
  context: KeyboardContext;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for registering keyboard shortcuts in a specific context
 *
 * Usage:
 * ```typescript
 * const { registerShortcut, setFocusIndex, focusIndex } = useKeyboardNavigation({
 *   context: 'playing',
 *   enabled: isMyTurn
 * });
 *
 * useEffect(() => {
 *   const shortcuts: KeyboardShortcut[] = [
 *     {
 *       key: 'ArrowLeft',
 *       description: 'Select previous card',
 *       action: () => setFocusIndex(prev => Math.max(0, prev - 1))
 *     },
 *     {
 *       key: 'Enter',
 *       description: 'Play selected card',
 *       action: () => handlePlayCard(hand[focusIndex])
 *     }
 *   ];
 *
 *   shortcuts.forEach(registerShortcut);
 * }, [registerShortcut, focusIndex, hand]);
 * ```
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const { context, enabled = true, preventDefault = true } = options;

  const [focusIndex, setFocusIndex] = useState(0);
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());

  /**
   * Register a keyboard shortcut
   */
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const key = getShortcutKey(shortcut);
    shortcutsRef.current.set(key, shortcut);

    return () => {
      shortcutsRef.current.delete(key);
    };
  }, []);

  /**
   * Clear all registered shortcuts
   */
  const clearShortcuts = useCallback(() => {
    shortcutsRef.current.clear();
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't intercept if user is typing in an input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = getEventKey(event);
    const shortcut = shortcutsRef.current.get(key);

    if (shortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      shortcut.action();
    }
  }, [enabled, preventDefault]);

  /**
   * Register global keyboard event listener
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  /**
   * Helper to navigate list with arrow keys
   */
  const navigateList = useCallback((direction: 'up' | 'down' | 'left' | 'right', maxIndex: number) => {
    setFocusIndex(prev => {
      if (direction === 'up' || direction === 'left') {
        return Math.max(0, prev - 1);
      } else {
        return Math.min(maxIndex, prev + 1);
      }
    });
  }, []);

  /**
   * Reset focus index (useful when list changes)
   */
  const resetFocus = useCallback(() => {
    setFocusIndex(0);
  }, []);

  return {
    registerShortcut,
    clearShortcuts,
    focusIndex,
    setFocusIndex,
    navigateList,
    resetFocus,
    context,
  };
}

/**
 * Generate unique key for shortcut
 */
function getShortcutKey(shortcut: KeyboardShortcut): string {
  const modifiers = [
    shortcut.ctrl && 'Ctrl',
    shortcut.shift && 'Shift',
    shortcut.alt && 'Alt',
  ]
    .filter(Boolean)
    .join('+');

  return modifiers ? `${modifiers}+${shortcut.key}` : shortcut.key;
}

/**
 * Generate key string from keyboard event
 */
function getEventKey(event: KeyboardEvent): string {
  const modifiers = [
    event.ctrlKey && 'Ctrl',
    event.shiftKey && 'Shift',
    event.altKey && 'Alt',
  ]
    .filter(Boolean)
    .join('+');

  return modifiers ? `${modifiers}+${event.key}` : event.key;
}

/**
 * Global keyboard shortcuts (always active)
 */
export const GLOBAL_SHORTCUTS = {
  HELP: '?',
  CLOSE: 'Escape',
  TOGGLE_CHAT: 'c',
  TOGGLE_DEBUG: 'd',
} as const;

/**
 * Lobby phase shortcuts
 */
export const LOBBY_SHORTCUTS = {
  CREATE_GAME: 'c',
  REFRESH: 'r',
  TOGGLE_LEADERBOARD: 'l',
  TOGGLE_FRIENDS: 'f',
  QUICK_JOIN_1: '1',
  QUICK_JOIN_2: '2',
  QUICK_JOIN_3: '3',
} as const;

/**
 * Team selection shortcuts
 */
export const TEAM_SELECTION_SHORTCUTS = {
  SELECT_TEAM_1: '1',
  SELECT_TEAM_2: '2',
  START_GAME: 's',
  SWAP_POSITION: ' ', // Space
  NAVIGATE_LEFT: 'ArrowLeft',
  NAVIGATE_RIGHT: 'ArrowRight',
} as const;

/**
 * Betting phase shortcuts
 */
export const BETTING_SHORTCUTS = {
  INCREASE_BET: 'ArrowUp',
  DECREASE_BET: 'ArrowDown',
  TOGGLE_WITHOUT_TRUMP: 't',
  PLACE_BET: 'Enter',
  SKIP_BET: 's',
} as const;

/**
 * Playing phase shortcuts
 */
export const PLAYING_SHORTCUTS = {
  SELECT_PREV_CARD: 'ArrowLeft',
  SELECT_NEXT_CARD: 'ArrowRight',
  HIGHLIGHT_CARD: 'ArrowUp',
  PLAY_CARD: 'Enter',
  PLAY_CARD_ALT: ' ', // Space
  QUICK_PLAY_1: '1',
  QUICK_PLAY_2: '2',
  QUICK_PLAY_3: '3',
  QUICK_PLAY_4: '4',
  QUICK_PLAY_5: '5',
  QUICK_PLAY_6: '6',
  QUICK_PLAY_7: '7',
  QUICK_PLAY_8: '8',
  TOGGLE_PREVIOUS_TRICK: 'p',
} as const;
