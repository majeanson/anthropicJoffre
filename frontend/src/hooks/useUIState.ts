/**
 * UI State Hook
 * Manages modal and panel visibility state
 * Sprint 3 Refactoring - Phase 1.3
 * Sprint 19: Added quests and rewards calendar
 */

import { useState, useCallback } from 'react';

interface UseUIStateReturn {
  showBotManagement: boolean;
  showFriendsPanel: boolean;
  showReplayModal: boolean;
  showAchievementsPanel: boolean;
  showQuestsPanel: boolean;
  showRewardsCalendar: boolean;
  showPersonalHub: boolean;

  setShowBotManagement: (show: boolean) => void;
  setShowFriendsPanel: (show: boolean) => void;
  setShowReplayModal: (show: boolean) => void;
  setShowAchievementsPanel: (show: boolean) => void;
  setShowQuestsPanel: (show: boolean) => void;
  setShowRewardsCalendar: (show: boolean) => void;
  setShowPersonalHub: (show: boolean) => void;

  toggleBotManagement: () => void;
  toggleFriendsPanel: () => void;
  toggleReplayModal: () => void;
  toggleAchievementsPanel: () => void;
  toggleQuestsPanel: () => void;
  toggleRewardsCalendar: () => void;
  togglePersonalHub: () => void;

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
  const [showQuestsPanel, setShowQuestsPanel] = useState<boolean>(false);
  const [showRewardsCalendar, setShowRewardsCalendar] = useState<boolean>(false);
  const [showPersonalHub, setShowPersonalHub] = useState<boolean>(false);

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

  const toggleQuestsPanel = useCallback(() => {
    setShowQuestsPanel(prev => !prev);
  }, []);

  const toggleRewardsCalendar = useCallback(() => {
    setShowRewardsCalendar(prev => !prev);
  }, []);

  const togglePersonalHub = useCallback(() => {
    setShowPersonalHub(prev => !prev);
  }, []);

  const closeAllPanels = useCallback(() => {
    setShowBotManagement(false);
    setShowFriendsPanel(false);
    setShowReplayModal(false);
    setShowAchievementsPanel(false);
    setShowQuestsPanel(false);
    setShowRewardsCalendar(false);
    setShowPersonalHub(false);
  }, []);

  return {
    showBotManagement,
    showFriendsPanel,
    showReplayModal,
    showAchievementsPanel,
    showQuestsPanel,
    showRewardsCalendar,
    showPersonalHub,

    setShowBotManagement,
    setShowFriendsPanel,
    setShowReplayModal,
    setShowAchievementsPanel,
    setShowQuestsPanel,
    setShowRewardsCalendar,
    setShowPersonalHub,

    toggleBotManagement,
    toggleFriendsPanel,
    toggleReplayModal,
    toggleAchievementsPanel,
    toggleQuestsPanel,
    toggleRewardsCalendar,
    togglePersonalHub,

    closeAllPanels,
  };
}
