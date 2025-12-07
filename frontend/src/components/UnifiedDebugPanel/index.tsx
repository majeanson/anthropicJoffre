/**
 * UnifiedDebugPanel Component
 * Version 4.0.0 - Modular Architecture
 *
 * Refactored into separate tab components:
 * - BuildInfoTab: Version, git, latest features
 * - GameStateTab: Players, tricks, betting info
 * - AutomationTab: Auto-play, skip betting/trick/round
 * - ServerHealthTab: Memory, uptime, active games
 * - TestControlsTab: Score manipulation, Sentry testing
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../../types/game';
import buildInfoJson from '../../buildInfo.json';
import { BuildInfo } from '../../types/buildInfo';
import { Modal, Tabs } from '../ui';
import { DebugPanelTabType } from './types';
import { BuildInfoTab } from './BuildInfoTab';
import { GameStateTab } from './GameStateTab';
import { AutomationTab } from './AutomationTab';
import { ServerHealthTab } from './ServerHealthTab';
import { TestControlsTab } from './TestControlsTab';

const buildInfo = buildInfoJson as BuildInfo;

interface UnifiedDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState | null;
  gameId: string;
  socket: Socket | null;
}

const tabs = [
  { id: 'build' as const, label: '🏷️ Build Info' },
  { id: 'gameState' as const, label: '🎮 Game State' },
  { id: 'automation' as const, label: '🤖 Automation' },
  { id: 'serverHealth' as const, label: '🖥️ Server Health' },
  { id: 'testControls' as const, label: '🧪 Test Controls' },
];

export function UnifiedDebugPanel({
  isOpen,
  onClose,
  gameState,
  gameId,
  socket,
}: UnifiedDebugPanelProps) {
  const [activeTab, setActiveTab] = useState<DebugPanelTabType>('build');

  // Reset to build tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('build');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unified Debug Panel"
      icon="🐛"
      size="xl"
      theme="purple"
      subtitle={`v${buildInfo.version} - All-in-One Developer Tools`}
    >
      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as DebugPanelTabType)}
        variant="pills"
        size="md"
        className="mb-4"
      />

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'build' && <BuildInfoTab />}
        {activeTab === 'gameState' && <GameStateTab gameState={gameState} gameId={gameId} />}
        {activeTab === 'automation' && (
          <AutomationTab gameState={gameState} gameId={gameId} socket={socket} />
        )}
        {activeTab === 'serverHealth' && (
          <ServerHealthTab socket={socket} isActive={activeTab === 'serverHealth'} />
        )}
        {activeTab === 'testControls' && (
          <TestControlsTab gameState={gameState} socket={socket} />
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-center text-xs sm:text-sm text-gray-400">
          Made with ❤️ and lots of ☕ • v{buildInfo.version} • {buildInfo.buildStatus}
        </p>
      </div>
    </Modal>
  );
}

// Re-export for backwards compatibility
export default UnifiedDebugPanel;
export * from './types';
