import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import * as Sentry from '@sentry/react';
import buildInfo from '../buildInfo.json';
import { CONFIG } from '../config/constants';

interface GlobalDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
}

interface GameInfo {
  gameId: string;
  phase: string;
  playerCount: number;
  roundNumber: number;
  uptimeMinutes: number;
}

interface ServerHealth {
  status: string;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  activeGames: number;
  uptime: number;
}

export function GlobalDebugModal({ isOpen, onClose, socket }: GlobalDebugModalProps) {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [sortBy, setSortBy] = useState<'uptime' | 'round'>('uptime');

  // Fetch data every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        console.log('[GlobalDebug] Fetching from:', CONFIG.API_BASE_URL);

        // Fetch server health
        const healthResponse = await fetch(`${CONFIG.API_BASE_URL}/api/ping`);
        console.log('[GlobalDebug] Health response status:', healthResponse.status);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('[GlobalDebug] Health data:', healthData);
          setServerHealth(healthData);
        } else {
          console.error('[GlobalDebug] Health fetch failed:', healthResponse.status, healthResponse.statusText);
        }

        // Fetch games list
        const gamesResponse = await fetch(`${CONFIG.API_BASE_URL}/api/debug/games`);
        console.log('[GlobalDebug] Games response status:', gamesResponse.status);
        if (gamesResponse.ok) {
          const data = await gamesResponse.json();
          console.log('[GlobalDebug] Games data:', data);
          setGames(data.games || []);
        } else {
          console.error('[GlobalDebug] Games fetch failed:', gamesResponse.status, gamesResponse.statusText);
          const errorData = await gamesResponse.text();
          console.error('[GlobalDebug] Error response:', errorData);
        }
      } catch (error) {
        console.error('[GlobalDebug] Failed to fetch debug data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Listen for clear responses
  useEffect(() => {
    if (!socket) return;

    const handleCleared = (data: { message: string }) => {
      setClearMessage(`✅ ${data.message}`);
      setIsClearing(false);
      setTimeout(() => setClearMessage(null), 3000);
    };

    socket.on('game_cleared', handleCleared);
    socket.on('all_games_cleared', handleCleared);
    socket.on('finished_games_cleared', handleCleared);

    return () => {
      socket.off('game_cleared', handleCleared);
      socket.off('all_games_cleared', handleCleared);
      socket.off('finished_games_cleared', handleCleared);
    };
  }, [socket]);

  const handleClearGame = (gameId: string) => {
    if (!socket || !window.confirm(`Clear game ${gameId.slice(0, 8)}?`)) return;
    setIsClearing(true);
    socket.emit('clear_specific_game', { gameId });
  };

  const handleClearFinished = () => {
    if (!socket || !window.confirm('Clear all finished games?')) return;
    setIsClearing(true);
    socket.emit('clear_finished_games');
  };

  const handleClearAll = () => {
    if (!socket || !window.confirm('⚠️ Clear ALL games?')) return;
    setIsClearing(true);
    socket.emit('clear_all_games');
  };

  const handleTestFrontendSentry = async () => {
    console.log('🧪 Testing Frontend Sentry...');
    try {
      const eventId = Sentry.captureException(new Error('🧪 Test Error - Frontend Sentry Integration'), {
        level: 'error',
        tags: {
          test: true,
          source: 'global_debug_panel',
          type: 'manual_test',
        },
        extra: {
          activeGames: games.length,
          serverHealth: serverHealth,
          timestamp: new Date().toISOString(),
        },
      });
      console.log('✅ Sentry event captured with ID:', eventId);

      // Force flush to ensure event is sent immediately
      console.log('⏳ Flushing Sentry queue...');
      await Sentry.flush(2000); // Wait up to 2 seconds for events to send
      console.log('✅ Sentry queue flushed');

      alert('✅ Frontend Sentry test error sent! Event ID: ' + eventId + '\nCheck your Sentry dashboard in ~10 seconds.');
    } catch (error) {
      console.error('❌ Error capturing Sentry event:', error);
      alert('❌ Error sending to Sentry: ' + error);
    }
  };

  const handleTestBackendSentry = () => {
    if (socket) {
      socket.emit('__test_sentry_error', {
        message: '🧪 Test Error - Backend Sentry Integration (Global Debug)',
        gameId: 'global_debug',
      });
      alert('✅ Backend Sentry test request sent! Check your Sentry dashboard in ~10 seconds.');
    } else {
      alert('❌ Socket not connected. Cannot test backend Sentry.');
    }
  };

  const sortedGames = [...games].sort((a, b) =>
    sortBy === 'uptime' ? b.uptimeMinutes - a.uptimeMinutes : b.roundNumber - a.roundNumber
  );

  const finishedGames = games.filter(g => g.phase === 'game_over');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
          <div>
            <h2 className="text-2xl font-bold">🌐 Global Debug - All Games</h2>
            <p className="text-sm text-blue-100">Monitor & Manage Server</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg px-4 py-2 transition-colors font-semibold"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Server Health */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">🖥️ Server Health</h3>
            {clearMessage && (
              <div className={`mb-3 p-3 rounded-lg ${clearMessage.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {clearMessage}
              </div>
            )}
            {serverHealth && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <p className="text-lg font-bold text-green-600">{serverHealth.status.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {Math.floor(serverHealth.uptime / 3600)}h {Math.floor((serverHealth.uptime % 3600) / 60)}m
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Games:</span>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{serverHealth.activeGames}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Heap:</span>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{serverHealth.memory.heapUsedMB}MB</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                    <div
                      className={`h-3 rounded-full ${
                        (serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) > 0.8 ? 'bg-red-500' :
                        (serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {Math.round((serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) * 100)}%
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">⚡ Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleClearFinished}
                disabled={isClearing || finishedGames.length === 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🗑️ Clear Finished ({finishedGames.length})
              </button>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isClearing ? '🔄 Clearing...' : `🗑️ Clear All (${games.length})`}
              </button>
            </div>
          </section>

          {/* Sentry Testing */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-red-200 pb-2">
              🚨 Sentry Error Tracking Tests
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Test Sentry error tracking integration for both frontend and backend.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleTestFrontendSentry}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  <span>Test Frontend Sentry</span>
                </button>
                <button
                  onClick={handleTestBackendSentry}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={!socket}
                >
                  <span>🖥️</span>
                  <span>Test Backend Sentry</span>
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> After testing, check your Sentry dashboard at{' '}
                  <a
                    href="https://sentry.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                  >
                    sentry.io
                  </a>
                  {' '}to verify errors appear and configure alerts.
                </p>
              </div>
            </div>
          </section>

          {/* Games Table */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">🎮 All Games ({games.length})</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'uptime' | 'round')}
                className="px-3 py-1 rounded border text-sm"
              >
                <option value="uptime">Sort by Uptime</option>
                <option value="round">Sort by Round</option>
              </select>
            </div>

            {games.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                <p className="text-gray-500">No active games</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left">Game ID</th>
                      <th className="px-4 py-2 text-left">Phase</th>
                      <th className="px-4 py-2 text-center">Players</th>
                      <th className="px-4 py-2 text-center">Round</th>
                      <th className="px-4 py-2 text-center">Uptime</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGames.map((game) => (
                      <tr key={game.gameId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 font-mono text-xs text-purple-600">{game.gameId.slice(0, 8)}...</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            game.phase === 'team_selection' ? 'bg-purple-100 text-purple-800' :
                            game.phase === 'betting' ? 'bg-orange-100 text-orange-800' :
                            game.phase === 'playing' ? 'bg-green-100 text-green-800' :
                            game.phase === 'scoring' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {game.phase.toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">{game.playerCount}/4</td>
                        <td className="px-4 py-3 text-center">{game.roundNumber}</td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {game.uptimeMinutes < 60 ? `${game.uptimeMinutes}m` : `${Math.floor(game.uptimeMinutes / 60)}h`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleClearGame(game.gameId)}
                            disabled={isClearing}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold disabled:bg-gray-300"
                          >
                            Clear
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Build Info & Features */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">🏗️ Build Information</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Version:</span>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{buildInfo.version}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Commit:</span>
                  <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{buildInfo.git.commitHash}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Branch:</span>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{buildInfo.git.branch}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Build Date:</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {new Date(buildInfo.buildDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Latest Commit:</span>
                <p className="text-sm italic text-gray-700 dark:text-gray-300">{buildInfo.git.commitMessage}</p>
              </div>
              {buildInfo.latestDoneFeatures && buildInfo.latestDoneFeatures.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Recent Features:</span>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {buildInfo.latestDoneFeatures[0]?.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Summary Stats */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">📊 Phase Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-700 font-semibold">Team Selection</p>
                <p className="text-3xl font-bold text-purple-600">{games.filter(g => g.phase === 'team_selection').length}</p>
              </div>
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
                <p className="text-sm text-orange-700 font-semibold">Betting</p>
                <p className="text-3xl font-bold text-orange-600">{games.filter(g => g.phase === 'betting').length}</p>
              </div>
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 font-semibold">Playing</p>
                <p className="text-3xl font-bold text-green-600">{games.filter(g => g.phase === 'playing').length}</p>
              </div>
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700 font-semibold">Finished</p>
                <p className="text-3xl font-bold text-gray-600">{finishedGames.length}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
