import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { CONFIG } from '../../config/constants';
import { Button, UICard, Spinner } from '../ui';
import { HealthData } from './types';

interface ServerHealthTabProps {
  socket: Socket | null;
  isActive: boolean;
}

export function ServerHealthTab({ socket, isActive }: ServerHealthTabProps) {
  const [detailedHealth, setDetailedHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchDetailedHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/health/detailed`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setDetailedHealth(data);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to fetch health data');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleClearAllGames = () => {
    if (!socket) {
      setClearMessage('❌ No socket connection');
      return;
    }
    if (
      !window.confirm(
        '⚠️ Clear ALL games from memory?\n\nThis will disconnect all active players and remove all game data.\n\nAre you sure?'
      )
    ) {
      return;
    }
    setIsClearing(true);
    setClearMessage('🔄 Clearing all games...');
    socket.emit('clear_all_games');
  };

  // Listen for clear all games response
  useEffect(() => {
    if (!socket) return;

    const handleAllGamesCleared = (data: {
      gamesCleared: number;
      sessionsCleared: number;
      message: string;
    }) => {
      setClearMessage(`✅ ${data.message}`);
      setIsClearing(false);
      setTimeout(() => setClearMessage(null), 5000);
      fetchDetailedHealth();
    };

    socket.on('all_games_cleared', handleAllGamesCleared);
    return () => {
      socket.off('all_games_cleared', handleAllGamesCleared);
    };
  }, [socket]);

  // Fetch health data when tab becomes active
  useEffect(() => {
    if (isActive) {
      fetchDetailedHealth();
    }
  }, [isActive]);

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🖥️</span> Server Health Monitoring
        </h3>
        <div className="flex gap-2">
          <Button onClick={fetchDetailedHealth} variant="primary" size="sm">
            🔄 Refresh
          </Button>
          <Button
            onClick={handleClearAllGames}
            disabled={isClearing || !socket}
            variant="danger"
            size="sm"
          >
            {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Games'}
          </Button>
        </div>
      </div>

      {clearMessage && (
        <div
          className={`p-3 rounded-lg border-2 ${
            clearMessage.startsWith('✅')
              ? 'bg-green-900/30 border-green-500 text-green-300'
              : clearMessage.startsWith('❌')
                ? 'bg-red-900/30 border-red-500 text-red-300'
                : 'bg-blue-900/30 border-blue-500 text-blue-300'
          }`}
        >
          <p className="font-semibold">{clearMessage}</p>
        </div>
      )}

      {healthLoading && (
        <UICard variant="elevated" size="lg" className="text-center py-8">
          <Spinner size="lg" color="primary" />
          <p className="text-sm text-gray-400 mt-3">Loading health data...</p>
        </UICard>
      )}

      {healthError && (
        <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4 text-center">
          <p className="text-red-300 font-semibold">⚠️ Unable to fetch server health</p>
          <p className="text-sm text-red-400 mt-1">{healthError}</p>
        </div>
      )}

      {detailedHealth && !healthLoading && (
        <div className="space-y-4">
          {/* Status & Uptime */}
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-green-500/30 text-green-300 text-sm font-semibold rounded-full">
                  {detailedHealth.status.toUpperCase()}
                </span>
                <p className="text-xs text-gray-400 mt-2">
                  Uptime: {detailedHealth.uptime.formatted}
                </p>
              </div>
            </div>
          </div>

          {/* Game State */}
          <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
              <span>🎮</span> Game State
            </h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-800/50 px-3 py-2 rounded">
                <div className="text-gray-400 text-xs">Games</div>
                <div className="font-bold text-white text-lg">
                  {detailedHealth.game.activeGames}
                </div>
              </div>
              <div className="bg-gray-800/50 px-3 py-2 rounded">
                <div className="text-gray-400 text-xs">Sockets</div>
                <div className="font-bold text-white text-lg">
                  {detailedHealth.game.connectedSockets}
                </div>
              </div>
              <div className="bg-gray-800/50 px-3 py-2 rounded">
                <div className="text-gray-400 text-xs">Players</div>
                <div className="font-bold text-white text-lg">
                  {detailedHealth.game.onlinePlayers}
                </div>
              </div>
            </div>
          </div>

          {/* Database & Cache */}
          <div className="bg-gradient-to-r from-purple-900/50 to-violet-900/50 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
              <span>💾</span> Database & Cache
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800/50 px-3 py-2 rounded">
                <div className="text-gray-400 text-xs">Pool Utilization</div>
                <div className="font-bold text-white">
                  {detailedHealth.database.pool.utilization}
                </div>
              </div>
              <div className="bg-gray-800/50 px-3 py-2 rounded">
                <div className="text-gray-400 text-xs">Cache Keys</div>
                <div className="font-bold text-white">{detailedHealth.cache.keys}</div>
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
              <span>🧠</span> Memory Usage
            </h4>
            <div className="bg-gray-800/50 px-3 py-3 rounded text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Heap Used / Total</span>
                <span className="font-bold text-white">
                  {detailedHealth.memory.heapUsedMB} / {detailedHealth.memory.heapTotalMB} MB
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                  style={{ width: detailedHealth.memory.heapUtilization }}
                ></div>
              </div>
            </div>
          </div>

          {/* Error Handling */}
          <div className="bg-gradient-to-r from-red-900/50 to-pink-900/50 border border-red-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-red-300 mb-3 flex items-center gap-2">
              <span>🛡️</span> Error Handling
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800/50 px-3 py-2 rounded">
                <div className="text-gray-400 text-xs">Success Rate</div>
                <div className="font-bold text-green-400 text-lg">
                  {detailedHealth.errorHandling.successRate}
                </div>
              </div>
              <div className="bg-gray-800/50 px-3 py-2 rounded">
                <div className="text-gray-400 text-xs">Total Calls</div>
                <div className="font-bold text-white text-lg">
                  {detailedHealth.errorHandling.totalCalls.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
