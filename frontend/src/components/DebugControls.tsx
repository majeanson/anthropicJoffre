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
import { Button } from './ui/Button';
import { UICard } from './ui/UICard';

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
        <Button
          variant="secondary"
          size="md"
          onClick={() => setDebugMenuOpen(!debugMenuOpen)}
          className="flex items-center gap-2 backdrop-blur-sm"
          title="Debug Menu"
          aria-label="Open debug menu"
        >
          <span aria-hidden="true">🐛</span> Debug
        </Button>

        {/* Dropdown Menu */}
        {debugMenuOpen && (
          <UICard variant="elevated" size="sm" className="absolute top-12 right-0 min-w-[180px] backdrop-blur-sm bg-gray-900">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDebugPanelOpen(true);
                setDebugMenuOpen(false);
              }}
              className="w-full justify-start text-white hover:bg-purple-600/30"
            >
              🐛 Unified Debug Panel
            </Button>
            {gameState && (
              <>
                <div className="border-t border-gray-700 my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBotManagement(true);
                    setDebugMenuOpen(false);
                  }}
                  className="w-full justify-start text-white hover:bg-yellow-600/30"
                >
                  🤖 Bot Settings
                </Button>
              </>
            )}
          </UICard>
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