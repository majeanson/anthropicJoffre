/**
 * useLobbyKeyboardNav Hook
 *
 * Handles keyboard navigation for the lobby browser.
 */

import { useState, useEffect } from 'react';
import { sounds } from '../../utils/sounds';
import { LobbyBrowserTabType } from './types';

interface UseLobbyKeyboardNavOptions {
  activeTab: LobbyBrowserTabType;
  setActiveTab: (tab: LobbyBrowserTabType) => void;
  listLength: number;
  onClose: () => void;
  onAction: () => void;
}

interface UseLobbyKeyboardNavReturn {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

export function useLobbyKeyboardNav({
  activeTab,
  setActiveTab,
  listLength,
  onClose,
  onAction,
}: UseLobbyKeyboardNavOptions): UseLobbyKeyboardNavReturn {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when tab or list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [activeTab, listLength]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (listLength > 0) {
            setSelectedIndex((prev) => (prev - 1 + listLength) % listLength);
            sounds.buttonClick();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (listLength > 0) {
            setSelectedIndex((prev) => (prev + 1) % listLength);
            sounds.buttonClick();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (activeTab === 'recent') {
            setActiveTab('active');
            sounds.buttonClick();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (activeTab === 'active') {
            setActiveTab('recent');
            sounds.buttonClick();
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (listLength > 0) {
            onAction();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, setActiveTab, listLength, onClose, onAction]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
}
