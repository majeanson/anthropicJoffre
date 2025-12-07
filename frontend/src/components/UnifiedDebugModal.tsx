import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import * as Sentry from '@sentry/react';
import buildInfoJson from '../buildInfo.json';
import { BuildInfo } from '../types/buildInfo';
import { CONFIG } from '../config/constants';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';

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
      const eventId = Sentry.captureException(
        new Error('🧪 Test Error - Frontend Sentry Integration'),
        {
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
        }
      );
      console.log('✅ Sentry event captured with ID:', eventId);
      await Sentry.flush(2000);
      console.log('✅ Sentry queue flushed');
      alert(
        '✅ Frontend Sentry test error sent! Event ID: ' +
          eventId +
          '\nCheck your Sentry dashboard in ~10 seconds.'
      );
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
      timeZoneName: 'short',
    });
  };

  const getCommitTitle = (message: string) => {
    return message.split('\n')[0];
  };

  const sortedGames = [...games].sort((a, b) =>
    sortBy === 'uptime' ? b.uptimeMinutes - a.uptimeMinutes : b.roundNumber - a.roundNumber
  );

  const finishedGames = games.filter((g) => g.phase === 'game_over');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Debug Fun"
      icon="🎮"
      theme="blue"
      size="xl"
      footer={
        <Button variant="primary" size="lg" onClick={onClose} fullWidth>
          Got it!
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Version */}
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🏷️</span>
          <div className="flex-1">
            <h3 className="font-bold text-skin-accent mb-1">Version</h3>
            <p className="text-skin-secondary font-mono text-sm bg-skin-primary px-3 py-2 rounded border border-skin-default">
              v{buildInfo.version}
            </p>
          </div>
        </div>

        {/* Build Date */}
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">📅</span>
          <div className="flex-1">
            <h3 className="font-bold text-skin-accent mb-1">Build Date</h3>
            <p className="text-skin-secondary text-sm bg-skin-primary px-3 py-2 rounded border border-skin-default">
              {formatDate(buildInfo.buildDate || buildInfo.releaseDate || new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Latest Commit */}
        {buildInfo.git && (
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💾</span>
            <div className="flex-1">
              <h3 className="font-bold text-skin-accent mb-1">Latest Commit</h3>
              <div className="bg-skin-primary px-3 py-2 rounded border border-skin-default">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-skin-accent font-bold">
                    {buildInfo.git.commitHash}
                  </span>
                  <span className="text-xs text-skin-muted">
                    on {buildInfo.git.branch}
                  </span>
                </div>
                <p className="text-sm text-skin-secondary break-words">
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
                <h3 className="font-bold text-skin-accent">
                  Latest Done Features
                </h3>
                <Button
                  onClick={() => setShowLatestFeatures(!showLatestFeatures)}
                  variant="secondary"
                  size="xs"
                >
                  {showLatestFeatures ? 'Hide' : 'Show'}
                </Button>
              </div>

              {showLatestFeatures && (
                <div className="space-y-3">
                  {buildInfo.latestDoneFeatures.map((featureGroup, index) => (
                    <div
                      key={index}
                      className="bg-skin-primary px-4 py-3 rounded border border-skin-default"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-skin-accent">
                          {featureGroup.title}
                        </span>
                        <span className="text-xs text-skin-muted">
                          {featureGroup.date}
                        </span>
                      </div>
                      <ul className="space-y-1 ml-4">
                        {featureGroup.features.map((feature, fIndex) => (
                          <li
                            key={fIndex}
                            className="flex items-start gap-2 text-sm text-skin-secondary"
                          >
                            <span className="text-skin-success flex-shrink-0">
                              ✓
                            </span>
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
                <h3 className="font-bold text-skin-accent">Future Features</h3>
                <Button
                  onClick={() => setShowFutureFeatures(!showFutureFeatures)}
                  variant="secondary"
                  size="xs"
                >
                  {showFutureFeatures ? 'Hide' : 'Show'}
                </Button>
              </div>

              {showFutureFeatures && (
                <ul className="space-y-2">
                  {buildInfo.futureTodos.map((todo, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-skin-secondary bg-skin-primary px-3 py-2 rounded border border-skin-default"
                    >
                      <span className="text-skin-accent flex-shrink-0">▸</span>
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
              <h3 className="font-bold text-skin-accent">Server Health</h3>
              <Button onClick={() => setShowHealth(!showHealth)} variant="secondary" size="xs">
                {showHealth ? 'Hide' : 'Show'} Health
              </Button>
            </div>

            {showHealth && (
              <div className="space-y-2">
                {healthLoading && (
                  <div className="bg-skin-primary px-3 py-4 rounded border border-skin-default text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full"></div>
                    <p className="text-sm text-skin-secondary mt-2">
                      Loading health data...
                    </p>
                  </div>
                )}

                {healthError && (
                  <div className="bg-skin-error px-3 py-3 rounded border border-skin-error">
                    <p className="text-sm text-skin-error">❌ {healthError}</p>
                    <Button
                      onClick={fetchHealthData}
                      variant="link"
                      size="xs"
                      className="text-skin-error mt-1"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {healthData && !healthLoading && (
                  <div className="bg-skin-primary px-4 py-3 rounded border border-skin-default space-y-3">
                    {/* Status & Uptime */}
                    <div className="flex items-center justify-between pb-2 border-b border-skin-subtle">
                      <div>
                        <span className="inline-block px-2 py-1 bg-skin-success/30 text-skin-success text-xs font-semibold rounded">
                          {healthData.status.toUpperCase()}
                        </span>
                        <p className="text-xs text-skin-muted mt-1">
                          Uptime: {healthData.uptime.formatted}
                        </p>
                      </div>
                      <Button onClick={fetchHealthData} variant="link" size="xs">
                        🔄 Refresh
                      </Button>
                    </div>

                    {/* Game State */}
                    <div>
                      <h4 className="text-xs font-bold text-skin-secondary mb-1">
                        🎮 Game State
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-skin-secondary px-2 py-1 rounded">
                          <div className="text-skin-muted">Games</div>
                          <div className="font-bold text-skin-primary">
                            {healthData.game.activeGames}
                          </div>
                        </div>
                        <div className="bg-skin-secondary px-2 py-1 rounded">
                          <div className="text-skin-muted">Sockets</div>
                          <div className="font-bold text-skin-primary">
                            {healthData.game.connectedSockets}
                          </div>
                        </div>
                        <div className="bg-skin-secondary px-2 py-1 rounded">
                          <div className="text-skin-muted">Players</div>
                          <div className="font-bold text-skin-primary">
                            {healthData.game.onlinePlayers}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Database & Cache */}
                    <div>
                      <h4 className="text-xs font-bold text-skin-secondary mb-1">
                        💾 Database & Cache
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-skin-secondary px-2 py-1 rounded">
                          <div className="text-skin-muted">Pool Utilization</div>
                          <div className="font-bold text-skin-primary">
                            {healthData.database.pool.utilization}
                          </div>
                        </div>
                        <div className="bg-skin-secondary px-2 py-1 rounded">
                          <div className="text-skin-muted">Cache Keys</div>
                          <div className="font-bold text-skin-primary">
                            {healthData.cache.keys}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Memory */}
                    <div>
                      <h4 className="text-xs font-bold text-skin-secondary mb-1">
                        🧠 Memory
                      </h4>
                      <div className="bg-skin-secondary px-2 py-1 rounded text-xs">
                        <div className="flex justify-between">
                          <span className="text-skin-muted">
                            Heap Used / Total
                          </span>
                          <span className="font-bold text-skin-primary">
                            {healthData.memory.heapUsedMB} / {healthData.memory.heapTotalMB} MB
                          </span>
                        </div>
                        <div className="mt-1 w-full bg-skin-tertiary rounded-full h-2">
                          <div
                            className="bg-skin-accent h-2 rounded-full transition-all"
                            style={{ width: healthData.memory.heapUtilization }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Error Handling */}
                    <div>
                      <h4 className="text-xs font-bold text-skin-secondary mb-1">
                        🛡️ Error Handling
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-skin-secondary px-2 py-1 rounded">
                          <div className="text-skin-muted">Success Rate</div>
                          <div className="font-bold text-skin-success">
                            {healthData.errorHandling.successRate}
                          </div>
                        </div>
                        <div className="bg-skin-secondary px-2 py-1 rounded">
                          <div className="text-skin-muted">Total Calls</div>
                          <div className="font-bold text-skin-primary">
                            {healthData.errorHandling.totalCalls.toLocaleString()}
                          </div>
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
              <h3 className="font-bold text-skin-accent">
                Game Monitoring ({games.length} active)
              </h3>
              <Button onClick={() => setShowGames(!showGames)} variant="secondary" size="xs">
                {showGames ? 'Hide' : 'Show'} Games
              </Button>
            </div>

            {showGames && (
              <div className="space-y-3">
                {clearMessage && (
                  <div className="bg-skin-success text-skin-success px-3 py-2 rounded border border-skin-success text-sm">
                    {clearMessage}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={handleClearFinished}
                    disabled={isClearing || finishedGames.length === 0}
                  >
                    🗑️ Clear Finished ({finishedGames.length})
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleClearAll} disabled={isClearing}>
                    {isClearing ? '🔄 Clearing...' : `🗑️ Clear All (${games.length})`}
                  </Button>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'uptime' | 'round')}
                    options={[
                      { value: 'uptime', label: 'Sort by Uptime' },
                      { value: 'round', label: 'Sort by Round' },
                    ]}
                    size="sm"
                  />
                </div>

                {/* Games Table */}
                {games.length === 0 ? (
                  <div className="bg-skin-secondary rounded px-4 py-6 text-center text-sm text-skin-muted">
                    No active games
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-skin-primary rounded border border-skin-default">
                    <table className="w-full text-xs">
                      <thead className="bg-skin-secondary">
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
                          <tr
                            key={game.gameId}
                            className="border-b border-skin-subtle hover:bg-skin-tertiary"
                          >
                            <td className="px-3 py-2 font-mono text-team2">
                              {game.gameId.slice(0, 8)}...
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  game.phase === 'team_selection'
                                    ? 'bg-team2/20 text-team2'
                                    : game.phase === 'betting'
                                      ? 'bg-team1/20 text-team1'
                                      : game.phase === 'playing'
                                        ? 'bg-skin-success text-skin-success'
                                        : game.phase === 'scoring'
                                          ? 'bg-skin-info text-skin-info'
                                          : 'bg-skin-secondary text-skin-secondary'
                                }`}
                              >
                                {game.phase.toUpperCase().replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-semibold">
                              {game.playerCount}/4
                            </td>
                            <td className="px-3 py-2 text-center">{game.roundNumber}</td>
                            <td className="px-3 py-2 text-center text-skin-secondary">
                              {game.uptimeMinutes < 60
                                ? `${game.uptimeMinutes}m`
                                : `${Math.floor(game.uptimeMinutes / 60)}h`}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={() => handleClearGame(game.gameId)}
                                disabled={isClearing}
                              >
                                Clear
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Phase Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-team2/10 border border-team2 rounded px-3 py-2 text-center">
                    <p className="text-xs text-team2 font-semibold">
                      Team Selection
                    </p>
                    <p className="text-xl font-bold text-team2">
                      {games.filter((g) => g.phase === 'team_selection').length}
                    </p>
                  </div>
                  <div className="bg-team1/10 border border-team1 rounded px-3 py-2 text-center">
                    <p className="text-xs text-team1 font-semibold">
                      Betting
                    </p>
                    <p className="text-xl font-bold text-team1">
                      {games.filter((g) => g.phase === 'betting').length}
                    </p>
                  </div>
                  <div className="bg-skin-success border border-skin-success rounded px-3 py-2 text-center">
                    <p className="text-xs text-skin-success font-semibold">
                      Playing
                    </p>
                    <p className="text-xl font-bold text-skin-success">
                      {games.filter((g) => g.phase === 'playing').length}
                    </p>
                  </div>
                  <div className="bg-skin-secondary border border-skin-default rounded px-3 py-2 text-center">
                    <p className="text-xs text-skin-secondary font-semibold">
                      Finished
                    </p>
                    <p className="text-xl font-bold text-skin-secondary">
                      {finishedGames.length}
                    </p>
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
              <h3 className="font-bold text-skin-accent">
                Sentry Error Tracking Tests
              </h3>
              <Button onClick={() => setShowSentry(!showSentry)} variant="secondary" size="xs">
                {showSentry ? 'Hide' : 'Show'} Tests
              </Button>
            </div>

            {showSentry && (
              <div className="space-y-2">
                <p className="text-xs text-skin-secondary">
                  Test Sentry error tracking integration for both frontend and backend.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button variant="warning" size="md" onClick={handleTestFrontendSentry}>
                    <span>📱</span>
                    <span>Test Frontend Sentry</span>
                  </Button>
                  <Button
                    variant="warning"
                    size="md"
                    onClick={handleTestBackendSentry}
                    disabled={!socket}
                  >
                    <span>🖥️</span>
                    <span>Test Backend Sentry</span>
                  </Button>
                </div>
                <div className="bg-skin-info border border-skin-info rounded px-3 py-2">
                  <p className="text-xs text-skin-info">
                    <strong>💡 Tip:</strong> After testing, check your Sentry dashboard at{' '}
                    <a
                      href="https://sentry.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-skin-accent"
                    >
                      sentry.io
                    </a>{' '}
                    to verify errors appear.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fun Stats */}
        <div className="mt-6 p-4 bg-skin-secondary rounded-lg border-2 border-skin-accent">
          <p className="text-center text-sm text-skin-accent font-semibold">
            🎉 Made with ❤️ and lots of ☕
          </p>
        </div>
      </div>
    </Modal>
  );
}
