/**
 * UI State Hook
 * Manages modal and panel visibility state
 * Sprint 3 Refactoring - Phase 1.3
 */

import { useState, useCallback } from 'react';

interface UseUIStateReturn {
  showBotManagement: boolean;
  showFriendsPanel: boolean;
  showReplayModal: boolean;
  showAchievementsPanel: boolean;

  setShowBotManagement: (show: boolean) => void;
  setShowFriendsPanel: (show: boolean) => void;
  setShowReplayModal: (show: boolean) => void;
  setShowAchievementsPanel: (show: boolean) => void;

  toggleBotManagement: () => void;
  toggleFriendsPanel: () => void;
  toggleReplayModal: () => void;
  toggleAchievementsPanel: () => void;

  closeAllPanels: () => void;
}

/**
 * Hook to manage UI state for modals and panels
 *
 * Consolidates scattered UI state into a single hook
 * Note: showCatchUpModal is in useGameState, botTakeoverModal is in useBotManagement
 */
export function useUIState(): UseUIStateReturn {
  const [showBotManagement, setShowBotManagement] = useState<boolean>(false);
  const [showFriendsPanel, setShowFriendsPanel] = useState<boolean>(false);
  const [showReplayModal, setShowReplayModal] = useState<boolean>(false);
  const [showAchievementsPanel, setShowAchievementsPanel] = useState<boolean>(false);

  const toggleBotManagement = useCallback(() => {
    setShowBotManagement(prev => !prev);
  }, []);

  const toggleFriendsPanel = useCallback(() => {
    setShowFriendsPanel(prev => !prev);
  }, []);

  const toggleReplayModal = useCallback(() => {
    setShowReplayModal(prev => !prev);
  }, []);

  const toggleAchievementsPanel = useCallback(() => {
    setShowAchievementsPanel(prev => !prev);
  }, []);

  const closeAllPanels = useCallback(() => {
    setShowBotManagement(false);
    setShowFriendsPanel(false);
    setShowReplayModal(false);
    setShowAchievementsPanel(false);
  }, []);

  return {
    showBotManagement,
    showFriendsPanel,
    showReplayModal,
    showAchievementsPanel,

    setShowBotManagement,
    setShowFriendsPanel,
    setShowReplayModal,
    setShowAchievementsPanel,

    toggleBotManagement,
    toggleFriendsPanel,
    toggleReplayModal,
    toggleAchievementsPanel,

    closeAllPanels,
  };
}
