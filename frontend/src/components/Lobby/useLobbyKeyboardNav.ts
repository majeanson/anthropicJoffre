/**
 * Lobby Keyboard Navigation Hook
 * Grid-based navigation like GameBoy for the lobby menu
 */

import { useEffect, useCallback } from 'react';
import { sounds } from '../../utils/sounds';
import type { LobbyMainTab, LobbySocialTab, LobbyMode } from './types';
import type { User } from '../../types/auth';

interface UseLobbyKeyboardNavOptions {
  mode: LobbyMode;
  mainTab: LobbyMainTab;
  socialTab: LobbySocialTab;
  navRow: number;
  navCol: number;
  user: User | null;
  setNavRow: (row: number) => void;
  setNavCol: (col: number) => void;
  setMainTab: (tab: LobbyMainTab) => void;
  setSocialTab: (tab: LobbySocialTab) => void;
}

export function useLobbyKeyboardNav({
  mode,
  mainTab,
  socialTab,
  navRow,
  navCol,
  user,
  setNavRow,
  setNavCol,
  setMainTab,
  setSocialTab,
}: UseLobbyKeyboardNavOptions) {
  // Get items for current navigation row
  const getItemsForRow = useCallback(
    (row: number): HTMLElement[] => {
      const effectiveRow = user ? row + 1 : row; // Skip login row if logged in

      if (effectiveRow === 0) {
        // Row 0: Login/Register buttons
        const items: HTMLElement[] = [];
        const loginBtn = document.querySelector('[data-keyboard-nav="login-btn"]') as HTMLElement;
        const registerBtn = document.querySelector(
          '[data-keyboard-nav="register-btn"]'
        ) as HTMLElement;
        if (loginBtn) items.push(loginBtn);
        if (registerBtn) items.push(registerBtn);
        return items;
      } else if (effectiveRow === 1) {
        // Row 1: Main tabs (PLAY, SOCIAL, STATS, SETTINGS)
        return Array.from(document.querySelectorAll('[data-nav-tab]')) as HTMLElement[];
      } else if (effectiveRow === 2) {
        // Row 2: Sub-tabs (for SOCIAL panel) or first content row
        const subTabs = document.querySelectorAll('[data-nav-subtab]');
        if (subTabs.length > 0) {
          return Array.from(subTabs) as HTMLElement[];
        }
        // No sub-tabs, return content buttons
        const tabContent = document.querySelector('[data-tab-content]');
        if (tabContent) {
          return Array.from(tabContent.querySelectorAll('[data-keyboard-nav]')) as HTMLElement[];
        }
      } else if (effectiveRow === 3) {
        // Row 3: Content buttons (when sub-tabs exist)
        const tabContent = document.querySelector('[data-tab-content]');
        if (tabContent) {
          // Get content buttons excluding sub-tabs
          const allButtons = Array.from(
            tabContent.querySelectorAll('[data-keyboard-nav]')
          ) as HTMLElement[];
          return allButtons.filter((btn) => !btn.hasAttribute('data-nav-subtab'));
        }
      }
      return [];
    },
    [user]
  );

  // Check if current tab has sub-tabs
  const hasSubTabs = useCallback((): boolean => {
    return mainTab === 'social';
  }, [mainTab]);

  // Get max row based on current state
  const getMaxRow = useCallback((): number => {
    const baseRows = user ? 1 : 2; // 0=login (if not logged in), 1=tabs
    if (hasSubTabs()) {
      return baseRows + 2; // +subtabs +content
    }
    return baseRows + 1; // +content
  }, [user, hasSubTabs]);

  // Keyboard navigation for lobby menu - grid-based like GameBoy
  useEffect(() => {
    if (mode !== 'menu') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = getItemsForRow(navRow);

      // Left/Right: Navigate within current row
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        if (items.length === 0) return;

        let newCol: number;
        if (e.key === 'ArrowRight') {
          newCol = (navCol + 1) % items.length;
        } else {
          newCol = navCol === 0 ? items.length - 1 : navCol - 1;
        }

        setNavCol(newCol);
        items[newCol]?.focus();

        // If on main tab row, also switch the tab
        const effectiveRow = user ? navRow + 1 : navRow;
        if (effectiveRow === 1) {
          const tabs: LobbyMainTab[] = ['play', 'social', 'stats', 'settings'];
          if (tabs[newCol]) {
            setMainTab(tabs[newCol]);
          }
        }
        // If on social sub-tab row, switch the sub-tab
        if (effectiveRow === 2 && mainTab === 'social') {
          const subTabs: LobbySocialTab[] = ['messages', 'friends', 'online', 'profile', 'chat'];
          if (subTabs[newCol]) {
            setSocialTab(subTabs[newCol]);
          }
        }

        sounds.buttonClick();
      }

      // Down: Move to next row OR next item in single-column content
      else if (e.key === 'ArrowDown') {
        e.preventDefault();

        const effectiveRow = user ? navRow + 1 : navRow;
        const contentRow = hasSubTabs() ? 3 : 2;

        // If we're in content row with single column layout, navigate within items
        if (effectiveRow >= contentRow && items.length > 1) {
          const newCol = (navCol + 1) % items.length;
          setNavCol(newCol);
          items[newCol]?.focus();
        } else {
          // Move to next row
          const maxRow = getMaxRow();
          if (navRow < maxRow - 1) {
            const nextRow = navRow + 1;
            setNavRow(nextRow);

            // Clamp column to new row's item count
            setTimeout(() => {
              const newItems = getItemsForRow(nextRow);
              const clampedCol = Math.min(navCol, newItems.length - 1);
              setNavCol(Math.max(0, clampedCol));
              if (newItems.length > 0) {
                newItems[Math.max(0, clampedCol)]?.focus();
              }
            }, 50);
          }
        }

        sounds.buttonClick();
      }

      // Up: Move to previous row OR previous item in single-column content
      else if (e.key === 'ArrowUp') {
        e.preventDefault();

        const effectiveRow = user ? navRow + 1 : navRow;
        const contentRow = hasSubTabs() ? 3 : 2;

        // If we're in content row and not at first item, navigate within items
        if (effectiveRow >= contentRow && navCol > 0) {
          const newCol = navCol - 1;
          setNavCol(newCol);
          items[newCol]?.focus();
        } else if (navRow > 0) {
          // Move to previous row
          const prevRow = navRow - 1;
          setNavRow(prevRow);

          // Clamp column to new row's item count, preserve tab position
          setTimeout(() => {
            const newItems = getItemsForRow(prevRow);
            let newCol = navCol;

            // If going back to main tabs, try to preserve the tab position
            const effectivePrevRow = user ? prevRow + 1 : prevRow;
            if (effectivePrevRow === 1) {
              const tabs: LobbyMainTab[] = ['play', 'social', 'stats', 'settings'];
              newCol = tabs.indexOf(mainTab);
            }

            newCol = Math.min(Math.max(0, newCol), newItems.length - 1);
            setNavCol(newCol);
            if (newItems.length > 0) {
              newItems[newCol]?.focus();
            }
          }, 50);
        }

        sounds.buttonClick();
      }

      // Enter: Activate focused item
      else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[navCol];
        if (item) {
          item.click();
        }
      }

      // Escape: Go back one row (or clear focus at top)
      else if (e.key === 'Escape') {
        if (navRow > 0) {
          setNavRow(navRow - 1);
          setTimeout(() => {
            const newItems = getItemsForRow(navRow - 1);
            if (newItems.length > 0) {
              const newCol = Math.min(navCol, newItems.length - 1);
              setNavCol(newCol);
              newItems[newCol]?.focus();
            }
          }, 50);
        } else {
          (document.activeElement as HTMLElement)?.blur();
        }
        sounds.buttonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode,
    mainTab,
    socialTab,
    navRow,
    navCol,
    user,
    getItemsForRow,
    getMaxRow,
    hasSubTabs,
    setNavRow,
    setNavCol,
    setMainTab,
    setSocialTab,
  ]);

  return {
    getItemsForRow,
    hasSubTabs,
    getMaxRow,
  };
}
