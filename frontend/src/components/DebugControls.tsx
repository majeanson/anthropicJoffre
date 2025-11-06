/**
 * DebugControls Component
 * Debug menu and controls for development/testing
 * Extracted from App.tsx to prevent remounting issues
 */

import React from 'react';
import { GameState } from '../types/game';
import { TestPanel } from './TestPanel';
import { DebugPanel } from './DebugPanel';
import { DebugInfo } from './DebugInfo';
import { DebugMultiPlayerView } from './DebugMultiPlayerView';

interface DebugControlsProps {
  gameState: GameState | null;
  socket: any;
  debugMenuOpen: boolean;
  setDebugMenuOpen: (open: boolean) => void;
  testPanelOpen: boolean;
  setTestPanelOpen: (open: boolean) => void;
  debugPanelOpen: boolean;
  setDebugPanelOpen: (open: boolean) => void;
  debugInfoOpen: boolean;
  setDebugInfoOpen: (open: boolean) => void;
  showBotManagement: boolean;
  setShowBotManagement: (open: boolean) => void;
  showMultiPlayerDebug: boolean;
  setShowMultiPlayerDebug: (open: boolean) => void;
}

const DebugControls: React.FC<DebugControlsProps> = ({
  gameState,
  socket,
  debugMenuOpen,
  setDebugMenuOpen,
  testPanelOpen,
  setTestPanelOpen,
  debugPanelOpen,
  setDebugPanelOpen,
  debugInfoOpen,
  setDebugInfoOpen,
  showBotManagement,
  setShowBotManagement,
  showMultiPlayerDebug,
  setShowMultiPlayerDebug,
}) => {
  // Debug controls - can be controlled via environment variable
  const DEBUG_ENABLED = import.meta.env.VITE_DEBUG_ENABLED !== 'false';

  if (!DEBUG_ENABLED) return null;

  return (
    <>
      {/* Debug Menu Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setDebugMenuOpen(!debugMenuOpen)}
          className="bg-gray-800 bg-opacity-80 hover:bg-opacity-90 text-white px-3 py-2 rounded-lg shadow-lg font-bold transition-all flex items-center gap-2 backdrop-blur-sm"
          title="Debug Menu"
          aria-label="Open debug menu"
        >
          ⚙️ Debug
        </button>

        {/* Dropdown Menu */}
        {debugMenuOpen && (
          <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 rounded-lg shadow-2xl p-2 min-w-[160px] backdrop-blur-sm">
            <button
              onClick={() => {
                setTestPanelOpen(true);
                setDebugMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              🧪 Test Panel
            </button>
            <button
              onClick={() => {
                setDebugPanelOpen(true);
                setDebugMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              🔍 Debug Panel
            </button>
            <button
              onClick={() => {
                setDebugInfoOpen(true);
                setDebugMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              📊 Debug Info
            </button>
            {gameState && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => {
                    setShowBotManagement(true);
                    setDebugMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  🤖 Bot Settings
                </button>
                <button
                  onClick={() => {
                    setShowMultiPlayerDebug(true);
                    setDebugMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  👥 Multi-View
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Debug Panels */}
      {testPanelOpen && (
        <TestPanel
          gameState={gameState}
          socket={socket}
          isOpen={testPanelOpen}
          onClose={() => setTestPanelOpen(false)}
        />
      )}
      {debugPanelOpen && (
        <DebugPanel
          gameState={gameState}
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
      )}
      {debugInfoOpen && (
        <DebugInfo
          isOpen={debugInfoOpen}
          onClose={() => setDebugInfoOpen(false)}
        />
      )}
      {showMultiPlayerDebug && gameState && (
        <DebugMultiPlayerView
          gameState={gameState}
          socket={socket}
          isOpen={showMultiPlayerDebug}
          onClose={() => setShowMultiPlayerDebug(false)}
        />
      )}
    </>
  );
};

export default React.memo(DebugControls);