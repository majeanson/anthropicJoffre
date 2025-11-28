/**
 * DebugControls Component
 * Debug menu and controls for development/testing
 * Extracted from App.tsx to prevent remounting issues
 *
 * v3.0.0 - Now uses UnifiedDebugPanel consolidating all debug tools
 */

import React from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { UnifiedDebugPanel } from './UnifiedDebugPanel';
import { colors } from '../design-system';

interface DebugControlsProps {
  gameState: GameState | null;
  socket: Socket | null;
  gameId: string;
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
}

const DebugControls: React.FC<DebugControlsProps> = ({
  gameState,
  gameId,
  socket,
  debugMenuOpen,
  setDebugMenuOpen,
  debugPanelOpen,
  setDebugPanelOpen,
  setShowBotManagement,
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
          className={`bg-gradient-to-r ${colors.gradients.secondary} hover:${colors.gradients.secondaryHover} text-white px-4 py-2 rounded-lg shadow-lg font-bold transition-all flex items-center gap-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400`}
          title="Debug Menu"
          aria-label="Open debug menu"
        >
          <span aria-hidden="true">🐛</span> Debug
        </button>

        {/* Dropdown Menu */}
        {debugMenuOpen && (
          <div className="absolute top-12 right-0 bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30 rounded-lg shadow-2xl p-2 min-w-[180px] backdrop-blur-sm">
            <button
              onClick={() => {
                setDebugPanelOpen(true);
                setDebugMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-purple-600/30 transition-colors flex items-center gap-2 text-sm font-medium text-white"
            >
              🐛 Unified Debug Panel
            </button>
            {gameState && (
              <>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={() => {
                    setShowBotManagement(true);
                    setDebugMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-yellow-600/30 transition-colors flex items-center gap-2 text-sm font-medium text-white"
                >
                  🤖 Bot Settings
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Unified Debug Panel */}
      {debugPanelOpen && (
        <UnifiedDebugPanel
          gameState={gameState}
          isOpen={debugPanelOpen}
          gameId={gameId}
          socket={socket}
          onClose={() => setDebugPanelOpen(false)}
        />
      )}
    </>
  );
};

export default React.memo(DebugControls);