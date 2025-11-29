import { useState, useEffect } from 'react';
import buildInfoJson from '../buildInfo.json';
import { BuildInfo } from '../types/buildInfo';
import { CONFIG } from '../config/constants';
import { Modal, Button, Spinner } from './ui';
import { UICard } from './ui/UICard';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Debug Fun"
      icon={<span>🎮</span>}
      theme="purple"
      size="lg"
    >
      <div className="space-y-4">
          {/* Version */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">🏷️</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Version</h3>
              <p className="text-umber-800 dark:text-gray-300 font-mono text-sm bg-parchment-100 dark:bg-gray-900 px-3 py-2 rounded border border-parchment-400 dark:border-gray-700">
                v{buildInfo.version}
              </p>
            </div>
          </div>

          {/* Build Date */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">📅</span>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Build Date</h3>
              <p className="text-umber-800 dark:text-gray-300 text-sm bg-parchment-100 dark:bg-gray-900 px-3 py-2 rounded border border-parchment-400 dark:border-gray-700">
                {formatDate(buildInfo.buildDate || buildInfo.releaseDate || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Latest Commit */}
          {buildInfo.git && (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">💾</span>
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Latest Commit</h3>
                <div className="bg-parchment-100 dark:bg-gray-900 px-3 py-2 rounded border border-parchment-400 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {buildInfo.git.commitHash}
                    </span>
                    <span className="text-xs text-umber-600 dark:text-gray-400">
                      on {buildInfo.git.branch}
                    </span>
                  </div>
                  <p className="text-sm text-umber-800 dark:text-gray-300 break-words">
                    {getCommitTitle(buildInfo.git.commitMessage)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Latest Done Features (Collapsible) */}
          {buildInfo.latestDoneFeatures && buildInfo.latestDoneFeatures.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">✨</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Latest Done Features</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLatestFeatures(!showLatestFeatures)}
                  >
                    {showLatestFeatures ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {showLatestFeatures && (
                  <div className="space-y-3">
                    {buildInfo.latestDoneFeatures.map((featureGroup, index) => (
                      <div
                        key={index}
                        className="bg-parchment-100 dark:bg-gray-900 px-4 py-3 rounded border border-parchment-400 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                            {featureGroup.title}
                          </span>
                          <span className="text-xs text-umber-600 dark:text-gray-400">
                            {featureGroup.date}
                          </span>
                        </div>
                        <ul className="space-y-1 ml-4">
                          {featureGroup.features.map((feature, fIndex) => (
                            <li
                              key={fIndex}
                              className="flex items-start gap-2 text-sm text-umber-800 dark:text-gray-300"
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
              <span className="text-2xl flex-shrink-0" aria-hidden="true">🚀</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Future Features</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFutureFeatures(!showFutureFeatures)}
                  >
                    {showFutureFeatures ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {showFutureFeatures && (
                  <ul className="space-y-2">
                    {buildInfo.futureTodos.map((todo, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-umber-800 dark:text-gray-300 bg-parchment-100 dark:bg-gray-900 px-3 py-2 rounded border border-parchment-400 dark:border-gray-700"
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
            <span className="text-2xl flex-shrink-0" aria-hidden="true">🏥</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Server Health</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowHealth(!showHealth)}
                >
                  {showHealth ? 'Hide' : 'Show'} Health
                </Button>
              </div>

              {showHealth && (
                <div className="space-y-2">
                  {healthLoading && (
                    <div className="bg-parchment-100 dark:bg-gray-900 px-3 py-4 rounded border border-parchment-400 dark:border-gray-700 text-center">
                      <Spinner size="sm" color="primary" />
                      <p className="text-sm text-umber-700 dark:text-gray-400 mt-2">Loading health data...</p>
                    </div>
                  )}

                  {healthError && (
                    <div className="bg-red-50 dark:bg-red-900/20 px-3 py-3 rounded border border-red-300 dark:border-red-700">
                      <p className="text-sm text-red-700 dark:text-red-300">❌ {healthError}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchHealthData}
                        className="text-red-600 dark:text-red-400 underline mt-1 p-0"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {healthData && !healthLoading && (
                    <div className="bg-parchment-100 dark:bg-gray-900 px-4 py-3 rounded border border-parchment-400 dark:border-gray-700 space-y-3">
                      {/* Status & Uptime */}
                      <div className="flex items-center justify-between pb-2 border-b border-parchment-300 dark:border-gray-700">
                        <div>
                          <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                            {healthData.status.toUpperCase()}
                          </span>
                          <p className="text-xs text-umber-600 dark:text-gray-400 mt-1">
                            Uptime: {healthData.uptime.formatted}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchHealthData}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline p-0"
                        >
                          🔄 Refresh
                        </Button>
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
          <UICard variant="gradient" gradient="team2" size="sm" className="mt-6">
            <p className="text-center text-sm text-white font-semibold">
              <span aria-hidden="true">🎉</span> Made with <span aria-hidden="true">❤️</span> and lots of <span aria-hidden="true">☕</span>
            </p>
          </UICard>
        </div>

        {/* Close Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onClose}
          autoFocus
          className="mt-6"
        >
          Got it!
        </Button>
    </Modal>
  );
}
