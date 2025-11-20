import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import * as Sentry from '@sentry/react';
import buildInfoJson from '../buildInfo.json';
import { BuildInfo, CleanupResult } from '../types/buildInfo';
import { CONFIG } from '../config/constants';

// Type the imported JSON
const buildInfo = buildInfoJson as BuildInfo;

interface UnifiedDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
}

interface HealthData {
  status: string;
  timestamp: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  database: {
    pool: {
      total: number;
      idle: number;
      utilization: string;
    };
  };
  cache: {
    size: number;
    keys: number;
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    heapUtilization: string;
  };
  game: {
    activeGames: number;
    connectedSockets: number;
    onlinePlayers: number;
  };
  errorHandling: {
    totalCalls: number;
    totalErrors: number;
    errorRate: string;
    successRate: string;
  };
}

interface GameInfo {
  gameId: string;
  phase: string;
  playerCount: number;
  roundNumber: number;
  uptimeMinutes: number;
}

export function UnifiedDebugModal({ isOpen, onClose, socket }: UnifiedDebugModalProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const [showLatestFeatures, setShowLatestFeatures] = useState(false);
  const [showFutureFeatures, setShowFutureFeatures] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showSentry, setShowSentry] = useState(false);

  // Game monitoring state
  const [games, setGames] = useState<GameInfo[]>([]);
  const [sortBy, setSortBy] = useState<'uptime' | 'round'>('uptime');
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Temporary cleanup state (remove after production cleanup is done)
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const SHOW_CLEANUP_BUTTON = true; // Set to false after cleanup is complete

  const fetchHealthData = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/health/detailed`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to fetch health data');
      console.error('Health check failed:', error);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchGamesData = async () => {
    try {
      const gamesResponse = await fetch(`${CONFIG.API_BASE_URL}/api/debug/games`);
      if (gamesResponse.ok) {
        const data = await gamesResponse.json();
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('[UnifiedDebug] Failed to fetch games data:', error);
    }
  };

  const runCleanup = async () => {
    if (!confirm('⚠️ This will DELETE all obsolete 6-character game IDs from the database.\n\nAre you sure you want to continue?')) {
      return;
    }

    setCleanupLoading(true);
    setCleanupError(null);
    setCleanupResult(null);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/cleanup-obsolete-games`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setCleanupResult(data);
      console.log('[UnifiedDebug] Cleanup successful:', data);
    } catch (error) {
      setCleanupError(error instanceof Error ? error.message : 'Failed to run cleanup');
      console.error('Cleanup failed:', error);
    } finally {
      setCleanupLoading(false);
    }
  };

  // Game monitoring handlers
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

  // Sentry testing handlers
  const handleTestFrontendSentry = async () => {
    console.log('🧪 Testing Frontend Sentry...');
    try {
      const eventId = Sentry.captureException(new Error('🧪 Test Error - Frontend Sentry Integration'), {
        level: 'error',
        tags: {
          test: true,
          source: 'unified_debug_panel',
          type: 'manual_test',
        },
        extra: {
          activeGames: games.length,
          serverHealth: healthData,
          timestamp: new Date().toISOString(),
        },
      });
      console.log('✅ Sentry event captured with ID:', eventId);
      await Sentry.flush(2000);
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
        message: '🧪 Test Error - Backend Sentry Integration (Unified Debug)',
        gameId: 'unified_debug',
      });
      alert('✅ Backend Sentry test request sent! Check your Sentry dashboard in ~10 seconds.');
    } else {
      alert('❌ Socket not connected. Cannot test backend Sentry.');
    }
  };

  useEffect(() => {
    if (showHealth && !healthData) {
      fetchHealthData();
    }
  }, [showHealth]);

  // Fetch games data periodically when games section is shown
  useEffect(() => {
    if (!isOpen || !showGames) return;

    fetchGamesData();
    const interval = setInterval(fetchGamesData, 5000);
    return () => clearInterval(interval);
  }, [isOpen, showGames]);

  // Listen for game clear responses
  useEffect(() => {
    if (!socket) return;

    const handleCleared = (data: { message: string }) => {
      setClearMessage(`✅ ${data.message}`);
      setIsClearing(false);
      setTimeout(() => setClearMessage(null), 3000);
      fetchGamesData(); // Refresh games list
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

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getCommitTitle = (message: string) => {
    return message.split('\n')[0];
  };

  const sortedGames = [...games].sort((a, b) =>
    sortBy === 'uptime' ? b.uptimeMinutes - a.uptimeMinutes : b.roundNumber - a.roundNumber
  );

  const finishedGames = games.filter(g => g.phase === 'game_over');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-4 border-indigo-600 dark:border-indigo-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎮</span>
            <h2 className="text-4xl font-bold text-indigo-900 dark:text-indigo-100 font-serif">Debug Fun</h2>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Version */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🏷️</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Version</h3>
              <p className="text-gray-700 dark:text-gray-300 font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700">
                v{buildInfo.version}
              </p>
            </div>
          </div>

          {/* Build Date */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📅</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Build Date</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700">
                {formatDate(buildInfo.buildDate || buildInfo.releaseDate || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Latest Commit */}
          {buildInfo.git && (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💾</span>
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Latest Commit</h3>
                <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {buildInfo.git.commitHash}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      on {buildInfo.git.branch}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    {getCommitTitle(buildInfo.git.commitMessage)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Latest Done Features (Collapsible) */}
          {buildInfo.latestDoneFeatures && buildInfo.latestDoneFeatures.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">✨</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Latest Done Features</h3>
                  <button
                    onClick={() => setShowLatestFeatures(!showLatestFeatures)}
                    className="text-xs bg-indigo-600 dark:bg-indigo-700 text-white px-3 py-1 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                  >
                    {showLatestFeatures ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showLatestFeatures && (
                  <div className="space-y-3">
                    {buildInfo.latestDoneFeatures.map((featureGroup, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-900 px-4 py-3 rounded border border-gray-300 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                            {featureGroup.title}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {featureGroup.date}
                          </span>
                        </div>
                        <ul className="space-y-1 ml-4">
                          {featureGroup.features.map((feature, fIndex) => (
                            <li
                              key={fIndex}
                              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <span className="text-green-500 dark:text-green-400 flex-shrink-0">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Future Features (Collapsible) */}
          {buildInfo.futureTodos && buildInfo.futureTodos.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🚀</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Future Features</h3>
                  <button
                    onClick={() => setShowFutureFeatures(!showFutureFeatures)}
                    className="text-xs bg-indigo-600 dark:bg-indigo-700 text-white px-3 py-1 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                  >
                    {showFutureFeatures ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showFutureFeatures && (
                  <ul className="space-y-2">
                    {buildInfo.futureTodos.map((todo, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-300 dark:border-gray-700"
                    >
                      <span className="text-indigo-500 dark:text-indigo-400 flex-shrink-0">▸</span>
                      <span>{todo}</span>
                    </li>
                  ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Server Health Monitoring */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🏥</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Server Health</h3>
                <button
                  onClick={() => setShowHealth(!showHealth)}
                  className="text-xs bg-indigo-600 dark:bg-indigo-700 text-white px-3 py-1 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  {showHealth ? 'Hide' : 'Show'} Health
                </button>
              </div>

              {showHealth && (
                <div className="space-y-2">
                  {healthLoading && (
                    <div className="bg-white dark:bg-gray-900 px-3 py-4 rounded border border-gray-300 dark:border-gray-700 text-center">
                      <div className="animate-spin inline-block w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading health data...</p>
                    </div>
                  )}

                  {healthError && (
                    <div className="bg-red-50 dark:bg-red-900/20 px-3 py-3 rounded border border-red-300 dark:border-red-700">
                      <p className="text-sm text-red-700 dark:text-red-300">❌ {healthError}</p>
                      <button
                        onClick={fetchHealthData}
                        className="text-xs text-red-600 dark:text-red-400 underline mt-1"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {healthData && !healthLoading && (
                    <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded border border-gray-300 dark:border-gray-700 space-y-3">
                      {/* Status & Uptime */}
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div>
                          <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                            {healthData.status.toUpperCase()}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Uptime: {healthData.uptime.formatted}
                          </p>
                        </div>
                        <button
                          onClick={fetchHealthData}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          🔄 Refresh
                        </button>
                      </div>

                      {/* Game State */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">🎮 Game State</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <div className="text-gray-500 dark:text-gray-400">Games</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{healthData.game.activeGames}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <div className="text-gray-500 dark:text-gray-400">Sockets</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{healthData.game.connectedSockets}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <div className="text-gray-500 dark:text-gray-400">Players</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{healthData.game.onlinePlayers}</div>
                          </div>
                        </div>
                      </div>

                      {/* Database & Cache */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">💾 Database & Cache</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <div className="text-gray-500 dark:text-gray-400">Pool Utilization</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{healthData.database.pool.utilization}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <div className="text-gray-500 dark:text-gray-400">Cache Keys</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{healthData.cache.keys}</div>
                          </div>
                        </div>
                      </div>

                      {/* Memory */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">🧠 Memory</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Heap Used / Total</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              {healthData.memory.heapUsedMB} / {healthData.memory.heapTotalMB} MB
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                              style={{ width: healthData.memory.heapUtilization }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Error Handling */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">🛡️ Error Handling</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <div className="text-gray-500 dark:text-gray-400">Success Rate</div>
                            <div className="font-bold text-green-600 dark:text-green-400">{healthData.errorHandling.successRate}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <div className="text-gray-500 dark:text-gray-400">Total Calls</div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{healthData.errorHandling.totalCalls.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game Monitoring */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🌐</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Game Monitoring ({games.length} active)</h3>
                <button
                  onClick={() => setShowGames(!showGames)}
                  className="text-xs bg-indigo-600 dark:bg-indigo-700 text-white px-3 py-1 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  {showGames ? 'Hide' : 'Show'} Games
                </button>
              </div>

              {showGames && (
                <div className="space-y-3">
                  {clearMessage && (
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-2 rounded border border-green-300 dark:border-green-700 text-sm">
                      {clearMessage}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleClearFinished}
                      disabled={isClearing || finishedGames.length === 0}
                      className="text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      🗑️ Clear Finished ({finishedGames.length})
                    </button>
                    <button
                      onClick={handleClearAll}
                      disabled={isClearing}
                      className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isClearing ? '🔄 Clearing...' : `🗑️ Clear All (${games.length})`}
                    </button>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'uptime' | 'round')}
                      className="text-xs px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <option value="uptime">Sort by Uptime</option>
                      <option value="round">Sort by Round</option>
                    </select>
                  </div>

                  {/* Games Table */}
                  {games.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No active games
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-3 py-2 text-left">Game ID</th>
                            <th className="px-3 py-2 text-left">Phase</th>
                            <th className="px-3 py-2 text-center">Players</th>
                            <th className="px-3 py-2 text-center">Round</th>
                            <th className="px-3 py-2 text-center">Uptime</th>
                            <th className="px-3 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedGames.map((game) => (
                            <tr key={game.gameId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-3 py-2 font-mono text-purple-600 dark:text-purple-400">{game.gameId.slice(0, 8)}...</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  game.phase === 'team_selection' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                  game.phase === 'betting' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                  game.phase === 'playing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                  game.phase === 'scoring' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {game.phase.toUpperCase().replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center font-semibold">{game.playerCount}/4</td>
                              <td className="px-3 py-2 text-center">{game.roundNumber}</td>
                              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                {game.uptimeMinutes < 60 ? `${game.uptimeMinutes}m` : `${Math.floor(game.uptimeMinutes / 60)}h`}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleClearGame(game.gameId)}
                                  disabled={isClearing}
                                  className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold disabled:bg-gray-300"
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

                  {/* Phase Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded px-3 py-2 text-center">
                      <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Team Selection</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{games.filter(g => g.phase === 'team_selection').length}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded px-3 py-2 text-center">
                      <p className="text-xs text-orange-700 dark:text-orange-300 font-semibold">Betting</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{games.filter(g => g.phase === 'betting').length}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded px-3 py-2 text-center">
                      <p className="text-xs text-green-700 dark:text-green-300 font-semibold">Playing</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{games.filter(g => g.phase === 'playing').length}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-center">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Finished</p>
                      <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{finishedGames.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sentry Testing */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Sentry Error Tracking Tests</h3>
                <button
                  onClick={() => setShowSentry(!showSentry)}
                  className="text-xs bg-indigo-600 dark:bg-indigo-700 text-white px-3 py-1 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  {showSentry ? 'Hide' : 'Show'} Tests
                </button>
              </div>

              {showSentry && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Test Sentry error tracking integration for both frontend and backend.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      onClick={handleTestFrontendSentry}
                      className="bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-800 dark:text-red-300 font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <span>📱</span>
                      <span>Test Frontend Sentry</span>
                    </button>
                    <button
                      onClick={handleTestBackendSentry}
                      className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-800 dark:text-orange-300 font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 text-sm"
                      disabled={!socket}
                    >
                      <span>🖥️</span>
                      <span>Test Backend Sentry</span>
                    </button>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded px-3 py-2">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>💡 Tip:</strong> After testing, check your Sentry dashboard at{' '}
                      <a
                        href="https://sentry.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        sentry.io
                      </a>
                      {' '}to verify errors appear.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TEMPORARY: Database Cleanup (remove after cleanup is done) */}
          {SHOW_CLEANUP_BUTTON && (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🗑️</span>
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Database Cleanup</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Remove obsolete 6-character game IDs from production database
                </p>

                <button
                  onClick={runCleanup}
                  disabled={cleanupLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  {cleanupLoading ? '⏳ Cleaning...' : '🗑️ Run Cleanup'}
                </button>

                {cleanupError && (
                  <div className="mt-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded border border-red-300 dark:border-red-700">
                    <p className="text-sm text-red-700 dark:text-red-300">❌ {cleanupError}</p>
                  </div>
                )}

                {cleanupResult && (
                  <div className="mt-2 bg-green-50 dark:bg-green-900/20 px-3 py-3 rounded border border-green-300 dark:border-green-700">
                    <p className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                      ✅ {cleanupResult.message}
                    </p>
                    <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                      <p>• In-memory games deleted: {cleanupResult.deletedCount?.inMemory || 0}</p>
                      <p>• Active games (DB) deleted: {cleanupResult.deletedCount?.activeGames || 0}</p>
                      <p>• Finished games (DB) deleted: {cleanupResult.deletedCount?.finishedGames || 0}</p>
                      <p>• Sessions deleted: {cleanupResult.deletedCount?.sessions || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fun Stats */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
            <p className="text-center text-sm text-purple-900 dark:text-purple-200 font-semibold">
              🎉 Made with ❤️ and lots of ☕
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-8 bg-indigo-600 dark:bg-indigo-700 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors border-2 border-indigo-700 dark:border-indigo-600 text-lg"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
