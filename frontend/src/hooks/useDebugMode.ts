/**
 * Debug Mode Hook
 * Manages debug panel visibility and debug features
 * Sprint 3 Refactoring - Phase 1.2
 *
 * v2.0.0 - Cleaned up unused states (testPanelOpen, debugInfoOpen)
 *          These are now consolidated into UnifiedDebugPanel
 */

import { useState, useCallback } from 'react';

interface UseDebugModeReturn {
  debugMode: boolean;
  debugPanelOpen: boolean;
  debugMenuOpen: boolean;
  toggleDebugPanel: () => void;
  toggleDebugMenu: () => void;
  setDebugPanelOpen: (open: boolean) => void;
  setDebugMenuOpen: (open: boolean) => void;
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
  const [debugMenuOpen, setDebugMenuOpen] = useState<boolean>(false);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelOpen((prev) => !prev);
  }, []);

  const toggleDebugMenu = useCallback(() => {
    setDebugMenuOpen((prev) => !prev);
  }, []);

  return {
    debugMode,
    debugPanelOpen,
    debugMenuOpen,
    toggleDebugPanel,
    toggleDebugMenu,
    setDebugPanelOpen,
    setDebugMenuOpen,
  };
}
