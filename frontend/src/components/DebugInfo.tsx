import { useState, useEffect } from 'react';
import buildInfoJson from '../buildInfo.json';
import { BuildInfo } from '../types/buildInfo';
import { CONFIG } from '../config/constants';

// Type the imported JSON
const buildInfo = buildInfoJson as BuildInfo;

interface DebugInfoProps {
  isOpen: boolean;
  onClose: () => void;
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

export function DebugInfo({ isOpen, onClose }: DebugInfoProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const [showLatestFeatures, setShowLatestFeatures] = useState(false);
  const [showFutureFeatures, setShowFutureFeatures] = useState(false);


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


  useEffect(() => {
    if (showHealth && !healthData) {
      fetchHealthData();
    }
  }, [showHealth]);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose} onKeyDown={(e) => e.stopPropagation()}>
      <div
        className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-indigo-600 dark:border-indigo-500"
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
          autoFocus
          className="w-full mt-8 bg-indigo-600 dark:bg-indigo-700 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors border-2 border-indigo-700 dark:border-indigo-600 text-lg focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:ring-offset-2"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
