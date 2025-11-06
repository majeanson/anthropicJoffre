/**
 * Debug Mode Hook
 * Manages debug panel visibility and debug features
 * Sprint 3 Refactoring - Phase 1.2
 */

import { useState, useCallback } from 'react';

interface UseDebugModeReturn {
  debugMode: boolean;
  debugPanelOpen: boolean;
  testPanelOpen: boolean;
  debugMenuOpen: boolean;
  debugInfoOpen: boolean;
  toggleDebugPanel: () => void;
  toggleTestPanel: () => void;
  toggleDebugMenu: () => void;
  toggleDebugInfo: () => void;
  setDebugPanelOpen: (open: boolean) => void;
  setTestPanelOpen: (open: boolean) => void;
  setDebugMenuOpen: (open: boolean) => void;
  setDebugInfoOpen: (open: boolean) => void;
}

/**
 * Hook to manage debug mode and debug panel visibility
 *
 * In production, debugMode is always false.
 * Debug panels are only available in development.
 */
export function useDebugMode(): UseDebugModeReturn {
  // Debug mode is always false in production
  const debugMode = import.meta.env.MODE !== 'production' && false;

  const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);
  const [testPanelOpen, setTestPanelOpen] = useState<boolean>(false);
  const [debugMenuOpen, setDebugMenuOpen] = useState<boolean>(false);
  const [debugInfoOpen, setDebugInfoOpen] = useState<boolean>(false);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelOpen(prev => !prev);
  }, []);

  const toggleTestPanel = useCallback(() => {
    setTestPanelOpen(prev => !prev);
  }, []);

  const toggleDebugMenu = useCallback(() => {
    setDebugMenuOpen(prev => !prev);
  }, []);

  const toggleDebugInfo = useCallback(() => {
    setDebugInfoOpen(prev => !prev);
  }, []);

  return {
    debugMode,
    debugPanelOpen,
    testPanelOpen,
    debugMenuOpen,
    debugInfoOpen,
    toggleDebugPanel,
    toggleTestPanel,
    toggleDebugMenu,
    toggleDebugInfo,
    setDebugPanelOpen,
    setTestPanelOpen,
    setDebugMenuOpen,
    setDebugInfoOpen,
  };
}
