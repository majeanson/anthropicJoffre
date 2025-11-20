/**
 * UnifiedDebugPanel Component
 * Version 3.0.0
 *
 * Beautiful unified debug panel consolidating:
 * - DebugInfo.tsx (Build Info, Server Health)
 * - DebugPanel.tsx (Game State, Automation, Server Monitoring)
 * - TestPanel.tsx (Score Manipulation, Sentry Testing)
 *
 * Features:
 * - Tab 1: Build Info (version, git, latest features)
 * - Tab 2: Game State (players, tricks, betting info)
 * - Tab 3: Automation (auto-play, skip betting/trick/round)
 * - Tab 4: Server Health (memory, uptime, active games)
 * - Tab 5: Test Controls (score manipulation, Sentry testing)
 *
 * Design:
 * - Smooth animations and transitions
 * - Gradient backgrounds
 * - Responsive layout
 * - Beautiful tabbed interface
 */

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import buildInfoJson from '../buildInfo.json';
import { BuildInfo, CleanupResult } from '../types/buildInfo';
import * as Sentry from '@sentry/react';

const buildInfo = buildInfoJson as BuildInfo;
const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

type TabType = 'build' | 'gameState' | 'automation' | 'serverHealth' | 'testControls';

interface UnifiedDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState | null;
  gameId: string;
  socket: Socket | null;
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
  timestamp: number;
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

export function UnifiedDebugPanel({ isOpen, onClose, gameState, gameId, socket }: UnifiedDebugPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('build');
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [detailedHealth, setDetailedHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [showLatestFeatures, setShowLatestFeatures] = useState(false);
  const [showFutureFeatures, setShowFutureFeatures] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SHOW_CLEANUP_BUTTON = true;

  // Fetch basic server health (for game state tab)
  const fetchHealthNow = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ping`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setServerHealth(data);
      setHealthError(null);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to fetch');
    }
  };

  // Fetch detailed health (for server health tab)
  const fetchDetailedHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const response = await fetch(`${API_URL}/api/health/detailed`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setDetailedHealth(data);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to fetch health data');
    } finally {
      setHealthLoading(false);
    }
  };

  // Cleanup obsolete games
  const runCleanup = async () => {
    if (!confirm('⚠️ This will DELETE all obsolete 6-character game IDs from the database.\n\nAre you sure you want to continue?')) {
      return;
    }

    setCleanupLoading(true);
    setCleanupError(null);
    setCleanupResult(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/cleanup-obsolete-games`, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setCleanupResult(data);
    } catch (error) {
      setCleanupError(error instanceof Error ? error.message : 'Failed to run cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Listen for clear all games response
  useEffect(() => {
    if (!socket) return;

    const handleAllGamesCleared = (data: { gamesCleared: number; sessionsCleared: number; message: string }) => {
      setClearMessage(`✅ ${data.message}`);
      setIsClearing(false);
      setTimeout(() => setClearMessage(null), 5000);
      fetchHealthNow();
    };

    socket.on('all_games_cleared', handleAllGamesCleared);
    return () => {
      socket.off('all_games_cleared', handleAllGamesCleared);
    };
  }, [socket]);

  // Fetch health data when opening relevant tabs
  useEffect(() => {
    if (isOpen && activeTab === 'gameState') {
      fetchHealthNow();
      const interval = setInterval(fetchHealthNow, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'serverHealth') {
      fetchDetailedHealth();
    }
  }, [isOpen, activeTab]);

  const handleClearAllGames = () => {
    if (!socket) {
      setClearMessage('❌ No socket connection');
      return;
    }
    if (!window.confirm('⚠️ Clear ALL games from memory?\n\nThis will disconnect all active players and remove all game data.\n\nAre you sure?')) {
      return;
    }
    setIsClearing(true);
    setClearMessage('🔄 Clearing all games...');
    socket.emit('clear_all_games');
  };

  const handleSetScores = () => {
    if (socket) {
      socket.emit('__test_set_scores', { team1: team1Score, team2: team2Score });
    }
  };

  const handleTestFrontendSentry = () => {
    Sentry.captureException(new Error('🧪 Test Error - Frontend Sentry Integration'), {
      level: 'error',
      tags: { test: true, source: 'unified_debug_panel', type: 'manual_test' },
      extra: {
        gameId: gameState?.id,
        playerCount: gameState?.players.length,
        phase: gameState?.phase,
        timestamp: new Date().toISOString(),
      },
    });
    alert('✅ Frontend Sentry test error sent! Check your Sentry dashboard.');
  };

  const handleTestBackendSentry = () => {
    if (socket) {
      socket.emit('__test_sentry_error', {
        message: '🧪 Test Error - Backend Sentry Integration',
        gameId: gameState?.id,
      });
      alert('✅ Backend Sentry test request sent! Check your Sentry dashboard in ~10 seconds.');
    } else {
      alert('❌ Socket not connected. Cannot test backend Sentry.');
    }
  };

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

  if (!isOpen) return null;

  const highestBidder = gameState?.highestBet
    ? gameState.players.find(p => p.id === gameState.highestBet?.playerId)
    : null;

  // Tab button component
  const TabButton = ({ tab, icon, label }: { tab: TabType; icon: string; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-3 px-2 font-semibold transition-all text-sm md:text-base ${
        activeTab === tab
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      <span className="hidden sm:inline">{icon} {label}</span>
      <span className="sm:hidden">{icon}</span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col border-2 border-purple-500/30 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-4 sm:px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐛</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Unified Debug Panel</h2>
              <p className="text-xs sm:text-sm text-purple-100">v{buildInfo.version} - All-in-One Developer Tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg px-3 py-2 transition-colors font-bold text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <TabButton tab="build" icon="🏷️" label="Build Info" />
          <TabButton tab="gameState" icon="🎮" label="Game State" />
          <TabButton tab="automation" icon="🤖" label="Automation" />
          <TabButton tab="serverHealth" icon="🖥️" label="Server Health" />
          <TabButton tab="testControls" icon="🧪" label="Test Controls" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-gray-900 to-gray-800">
          {/* Tab 1: Build Info */}
          {activeTab === 'build' && (
            <div className="space-y-4 animate-slide-in">
              {/* Version */}
              <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏷️</span>
                  <h3 className="font-bold text-purple-300 text-lg">Version</h3>
                </div>
                <p className="text-white font-mono text-2xl font-bold">v{buildInfo.version}</p>
                <p className="text-gray-400 text-sm mt-1">{buildInfo.buildStatus}</p>
              </div>

              {/* Build Date */}
              <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📅</span>
                  <h3 className="font-bold text-blue-300 text-lg">Build Date</h3>
                </div>
                <p className="text-white">{formatDate(buildInfo.buildDate)}</p>
              </div>

              {/* Git Info */}
              {buildInfo.git && (
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💾</span>
                    <h3 className="font-bold text-green-300 text-lg">Latest Commit</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-green-400 font-bold bg-green-950 px-2 py-1 rounded">
                      {buildInfo.git.commitHash}
                    </span>
                    <span className="text-xs text-gray-400">on {buildInfo.git.branch}</span>
                  </div>
                  <p className="text-white text-sm">{getCommitTitle(buildInfo.git.commitMessage)}</p>
                </div>
              )}

              {/* Test Status */}
              {buildInfo.testsStatus && (
                <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">✅</span>
                    <h3 className="font-bold text-amber-300 text-lg">Test Status</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400 text-xs">Backend</div>
                      <div className="text-white font-bold">{buildInfo.testsStatus.backend}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400 text-xs">E2E</div>
                      <div className="text-white font-bold">{buildInfo.testsStatus.e2e}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400 text-xs">Overall</div>
                      <div className="text-white font-bold">{buildInfo.testsStatus.overall}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Latest Features */}
              {buildInfo.latestDoneFeatures && buildInfo.latestDoneFeatures.length > 0 && (
                <div className="bg-gradient-to-r from-pink-900/50 to-rose-900/50 border border-pink-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✨</span>
                      <h3 className="font-bold text-pink-300 text-lg">Latest Features</h3>
                    </div>
                    <button
                      onClick={() => setShowLatestFeatures(!showLatestFeatures)}
                      className="text-xs bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 rounded transition-colors"
                    >
                      {showLatestFeatures ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showLatestFeatures && (
                    <div className="space-y-3 animate-slide-in">
                      {buildInfo.latestDoneFeatures.map((featureGroup, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-pink-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-pink-300">{featureGroup.title}</span>
                            <span className="text-xs text-gray-400">{featureGroup.date}</span>
                          </div>
                          <ul className="space-y-1 ml-4">
                            {featureGroup.features.map((feature, fIndex) => (
                              <li key={fIndex} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="text-green-400 flex-shrink-0">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Future Features */}
              {buildInfo.futureTodos && buildInfo.futureTodos.length > 0 && (
                <div className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 border border-violet-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚀</span>
                      <h3 className="font-bold text-violet-300 text-lg">Future Features</h3>
                    </div>
                    <button
                      onClick={() => setShowFutureFeatures(!showFutureFeatures)}
                      className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded transition-colors"
                    >
                      {showFutureFeatures ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showFutureFeatures && (
                    <ul className="space-y-2 animate-slide-in">
                      {buildInfo.futureTodos.map((todo, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300 bg-gray-800/50 px-3 py-2 rounded border border-violet-500/20">
                          <span className="text-violet-400 flex-shrink-0">▸</span>
                          <span>{todo}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Database Cleanup */}
              {SHOW_CLEANUP_BUTTON && (
                <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🗑️</span>
                    <h3 className="font-bold text-red-300 text-lg">Database Cleanup</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Remove obsolete 6-character game IDs from production database
                  </p>
                  <button
                    onClick={runCleanup}
                    disabled={cleanupLoading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    {cleanupLoading ? '⏳ Cleaning...' : '🗑️ Run Cleanup'}
                  </button>

                  {cleanupError && (
                    <div className="mt-2 bg-red-900/30 px-3 py-2 rounded border border-red-500">
                      <p className="text-sm text-red-300">❌ {cleanupError}</p>
                    </div>
                  )}

                  {cleanupResult && (
                    <div className="mt-2 bg-green-900/30 px-3 py-3 rounded border border-green-500">
                      <p className="text-sm font-bold text-green-300 mb-2">✅ {cleanupResult.message}</p>
                      <div className="text-xs text-gray-300 space-y-1">
                        <p>• In-memory games deleted: {cleanupResult.deletedCount?.inMemory || 0}</p>
                        <p>• Active games (DB) deleted: {cleanupResult.deletedCount?.activeGames || 0}</p>
                        <p>• Finished games (DB) deleted: {cleanupResult.deletedCount?.finishedGames || 0}</p>
                        <p>• Sessions deleted: {cleanupResult.deletedCount?.sessions || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Game State */}
          {activeTab === 'gameState' && gameState && (
            <div className="space-y-4 animate-slide-in">
              {/* Game Info */}
              <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <span>📋</span> Game Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded p-3">
                    <span className="text-xs text-gray-400">Game ID</span>
                    <p className="font-mono text-sm text-purple-400 font-bold">{gameId}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <span className="text-xs text-gray-400">Phase</span>
                    <p className="text-sm">
                      <span className={`px-2 py-1 rounded-full font-semibold text-xs ${
                        gameState.phase === 'team_selection' ? 'bg-purple-500/30 text-purple-300' :
                        gameState.phase === 'betting' ? 'bg-orange-500/30 text-orange-300' :
                        gameState.phase === 'playing' ? 'bg-blue-500/30 text-blue-300' :
                        gameState.phase === 'scoring' ? 'bg-green-500/30 text-green-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {gameState.phase.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <span className="text-xs text-gray-400">Round</span>
                    <p className="text-sm font-bold text-white">{gameState.roundNumber}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <span className="text-xs text-gray-400">Trump Suit</span>
                    <p className="text-sm font-bold text-white">{gameState.trump || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Team Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-2 border-orange-500/50 rounded-lg p-4 text-center">
                  <h4 className="text-sm font-semibold text-orange-300 mb-1">Team 1</h4>
                  <p className="text-4xl font-bold text-orange-400">{gameState.teamScores.team1}</p>
                  <p className="text-xs text-orange-300 mt-1">
                    {gameState.teamScores.team1 >= 41 ? '✓ Winner!' : `${41 - gameState.teamScores.team1} to win`}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 border-2 border-purple-500/50 rounded-lg p-4 text-center">
                  <h4 className="text-sm font-semibold text-purple-300 mb-1">Team 2</h4>
                  <p className="text-4xl font-bold text-purple-400">{gameState.teamScores.team2}</p>
                  <p className="text-xs text-purple-300 mt-1">
                    {gameState.teamScores.team2 >= 41 ? '✓ Winner!' : `${41 - gameState.teamScores.team2} to win`}
                  </p>
                </div>
              </div>

              {/* Players */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span>👥</span> Players
                </h3>
                {gameState.players.map((player, index) => {
                  const isCurrentTurn = index === gameState.currentPlayerIndex;
                  const isDealer = index === gameState.dealerIndex;
                  const bet = gameState.currentBets.find(b => b.playerId === player.id);

                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border ${
                        isCurrentTurn
                          ? 'bg-green-900/30 border-green-500 shadow-lg'
                          : 'bg-gray-800/30 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            player.teamId === 1 ? 'bg-orange-500' : 'bg-purple-500'
                          }`}></span>
                          <span className="font-bold text-white text-sm">{player.name}</span>
                          {isDealer && (
                            <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs font-semibold rounded-full">
                              DEALER
                            </span>
                          )}
                          {isCurrentTurn && (
                            <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs font-semibold rounded-full animate-pulse">
                              TURN
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono">Pos {index + 1}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-gray-900/50 rounded px-2 py-1">
                          <span className="text-gray-400">Cards:</span>
                          <span className="ml-1 font-semibold text-white">{player.hand.length}</span>
                        </div>
                        <div className="bg-gray-900/50 rounded px-2 py-1">
                          <span className="text-gray-400">Tricks:</span>
                          <span className="ml-1 font-semibold text-white">{player.tricksWon}</span>
                        </div>
                        <div className="bg-gray-900/50 rounded px-2 py-1">
                          <span className="text-gray-400">Points:</span>
                          <span className="ml-1 font-semibold text-white">{player.pointsWon}</span>
                        </div>
                        {bet && (
                          <div className="bg-gray-900/50 rounded px-2 py-1">
                            <span className="text-gray-400">Bet:</span>
                            <span className="ml-1 font-semibold text-white">
                              {bet.skipped ? 'Skip' : `${bet.amount}${bet.withoutTrump ? ' 🚫' : ''}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current Trick */}
              {gameState.currentTrick.length > 0 && (
                <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-300 mb-3">
                    🎴 Current Trick ({gameState.currentTrick.length}/4 cards)
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {gameState.currentTrick.map((trickCard, index) => {
                      const player = gameState.players.find(p => p.id === trickCard.playerId);
                      return (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">{player?.name}</p>
                          <div className={`inline-block px-2 py-1 rounded font-bold text-white text-sm ${
                            trickCard.card.color === 'blue' ? 'bg-orange-600' :
                            trickCard.card.color === 'green' ? 'bg-green-600' :
                            'bg-amber-800'
                          }`}>
                            {trickCard.card.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Betting Info */}
              {gameState.currentBets.length > 0 && (
                <div className="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 border border-amber-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-amber-300 mb-3">💰 Betting Information</h3>
                  {highestBidder && gameState.highestBet && (
                    <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3 mb-3">
                      <p className="font-semibold text-yellow-300 text-sm">
                        🏅 Highest Bet: {highestBidder.name} - {gameState.highestBet.amount} points
                        {gameState.highestBet.withoutTrump && ' (Without Trump - 2x)'}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.currentBets.map((bet) => {
                      const player = gameState.players.find(p => p.id === bet.playerId);
                      return (
                        <div key={bet.playerId} className="flex items-center justify-between bg-gray-800/50 rounded p-2 border border-gray-700 text-sm">
                          <span className="font-medium text-gray-300">{player?.name}</span>
                          <span className={`font-semibold ${bet.skipped ? 'text-gray-500' : 'text-purple-400'}`}>
                            {bet.skipped ? 'Skipped' : `${bet.amount}${bet.withoutTrump ? ' 🚫' : ''}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gameState' && !gameState && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No active game</p>
              <p className="text-sm">Join or create a game to see game state information</p>
            </div>
          )}

          {/* Tab 3: Automation */}
          {activeTab === 'automation' && (
            <div className="space-y-4 animate-slide-in">
              {gameState && gameState.phase === 'playing' && (
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🎮</span>
                    <span className="font-semibold text-green-300">Playing Phase Controls</span>
                    <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs font-semibold rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => socket?.emit('debug_auto_play_card', { gameId })}
                      disabled={!socket}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      🤖 Auto-Play Card
                    </button>
                    <button
                      onClick={() => socket?.emit('debug_skip_trick', { gameId })}
                      disabled={!socket || gameState.currentTrick.length === 0}
                      className="px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      ⏭️ Skip Trick
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Skip entire round? Auto-play all remaining cards.')) {
                          socket?.emit('debug_skip_round', { gameId });
                        }
                      }}
                      disabled={!socket}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      ⏭️⏭️ Skip Round
                    </button>
                  </div>
                  <p className="text-xs text-green-300 mt-3">
                    Auto-play cards for current player. Use for testing game flow.
                  </p>
                </div>
              )}

              {gameState && gameState.phase === 'betting' && (
                <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border-2 border-orange-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">💰</span>
                    <span className="font-semibold text-orange-300">Betting Phase Controls</span>
                    <span className="px-2 py-0.5 bg-orange-500/30 text-orange-300 text-xs font-semibold rounded-full">
                      ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => socket?.emit('debug_auto_bet', { gameId })}
                      disabled={!socket}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      💰 Auto-Bet
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Skip betting phase? Auto-bet for all players.')) {
                          socket?.emit('debug_skip_betting', { gameId });
                        }
                      }}
                      disabled={!socket}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      ⏭️ Skip Betting
                    </button>
                  </div>

                  <div className="border-t-2 border-orange-500/30 pt-4">
                    <p className="text-sm font-semibold text-orange-300 mb-2">Force Bet Override</p>
                    <div className="grid grid-cols-12 gap-2">
                      {[7, 8, 9, 10, 11, 12].map(amount => (
                        <div key={amount} className="col-span-6 md:col-span-2 flex flex-col gap-1">
                          <button
                            onClick={() => socket?.emit('debug_force_bet', { gameId, amount, withoutTrump: false })}
                            disabled={!socket}
                            className="px-2 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                          >
                            {amount}
                          </button>
                          <button
                            onClick={() => socket?.emit('debug_force_bet', { gameId, amount, withoutTrump: true })}
                            disabled={!socket}
                            className="px-2 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                          >
                            {amount} 🚫
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-orange-300 mt-2">
                      Force bet for current player. 🚫 = Without Trump (2x multiplier)
                    </p>
                  </div>
                </div>
              )}

              {(!gameState || (gameState.phase !== 'playing' && gameState.phase !== 'betting')) && (
                <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400 text-lg">
                    No automation controls available for{' '}
                    <span className="font-semibold text-white">
                      {gameState ? gameState.phase.replace('_', ' ') : 'current'}
                    </span>{' '}
                    phase
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Automation is available during betting and playing phases
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Server Health */}
          {activeTab === 'serverHealth' && (
            <div className="space-y-4 animate-slide-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🖥️</span> Server Health Monitoring
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={fetchDetailedHealth}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={handleClearAllGames}
                    disabled={isClearing || !socket}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      isClearing || !socket
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Games'}
                  </button>
                </div>
              </div>

              {clearMessage && (
                <div className={`p-3 rounded-lg border-2 ${
                  clearMessage.startsWith('✅')
                    ? 'bg-green-900/30 border-green-500 text-green-300'
                    : clearMessage.startsWith('❌')
                    ? 'bg-red-900/30 border-red-500 text-red-300'
                    : 'bg-blue-900/30 border-blue-500 text-blue-300'
                }`}>
                  <p className="font-semibold">{clearMessage}</p>
                </div>
              )}

              {healthLoading && (
                <div className="bg-gray-800/50 px-4 py-8 rounded-lg border border-gray-700 text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-sm text-gray-400 mt-3">Loading health data...</p>
                </div>
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
                        <div className="font-bold text-white text-lg">{detailedHealth.game.activeGames}</div>
                      </div>
                      <div className="bg-gray-800/50 px-3 py-2 rounded">
                        <div className="text-gray-400 text-xs">Sockets</div>
                        <div className="font-bold text-white text-lg">{detailedHealth.game.connectedSockets}</div>
                      </div>
                      <div className="bg-gray-800/50 px-3 py-2 rounded">
                        <div className="text-gray-400 text-xs">Players</div>
                        <div className="font-bold text-white text-lg">{detailedHealth.game.onlinePlayers}</div>
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
                        <div className="font-bold text-white">{detailedHealth.database.pool.utilization}</div>
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
                        <div className="font-bold text-green-400 text-lg">{detailedHealth.errorHandling.successRate}</div>
                      </div>
                      <div className="bg-gray-800/50 px-3 py-2 rounded">
                        <div className="text-gray-400 text-xs">Total Calls</div>
                        <div className="font-bold text-white text-lg">{detailedHealth.errorHandling.totalCalls.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Test Controls */}
          {activeTab === 'testControls' && (
            <div className="space-y-4 animate-slide-in">
              {/* Current State */}
              {gameState && (
                <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                    <span>📊</span> Current State
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-800/50 rounded p-3">
                      <span className="text-xs text-gray-400">Phase</span>
                      <p className="text-sm font-bold capitalize text-white">{gameState.phase.replace('_', ' ')}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <span className="text-xs text-gray-400">Round</span>
                      <p className="text-sm font-bold text-white">{gameState.roundNumber}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <span className="text-xs text-gray-400">Team 1 Score</span>
                      <p className="text-sm font-bold text-orange-400">{gameState.teamScores.team1}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <span className="text-xs text-gray-400">Team 2 Score</span>
                      <p className="text-sm font-bold text-purple-400">{gameState.teamScores.team2}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Manipulation */}
              <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                  <span>🎯</span> Set Team Scores
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">Team 1 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={team1Score}
                      onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">Team 2 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={team2Score}
                      onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800 text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSetScores}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Apply Scores
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-purple-900/50 to-violet-900/50 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <span>⚡</span> Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setTeam1Score(40); setTeam2Score(0); }}
                    className="bg-orange-600/30 hover:bg-orange-600/50 border border-orange-500 text-orange-300 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Team 1 Near Win (40-0)
                  </button>
                  <button
                    onClick={() => { setTeam1Score(0); setTeam2Score(40); }}
                    className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500 text-purple-300 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Team 2 Near Win (0-40)
                  </button>
                  <button
                    onClick={() => { setTeam1Score(35); setTeam2Score(35); }}
                    className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 text-blue-300 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Close Game (35-35)
                  </button>
                  <button
                    onClick={() => { setTeam1Score(0); setTeam2Score(0); }}
                    className="bg-gray-600/30 hover:bg-gray-600/50 border border-gray-500 text-gray-300 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Reset Scores (0-0)
                  </button>
                </div>
              </div>

              {/* Sentry Testing */}
              <div className="bg-gradient-to-r from-red-900/50 to-pink-900/50 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
                  <span>🚨</span> Sentry Error Tracking Tests
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  Test Sentry error tracking integration for both frontend and backend.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleTestFrontendSentry}
                    className="bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-red-300 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📱</span>
                    <span>Test Frontend Sentry</span>
                  </button>
                  <button
                    onClick={handleTestBackendSentry}
                    className="bg-orange-600/30 hover:bg-orange-600/50 border border-orange-500 text-orange-300 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    disabled={!socket}
                  >
                    <span>🖥️</span>
                    <span>Test Backend Sentry</span>
                  </button>
                </div>
                <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 mt-3">
                  <p className="text-xs text-blue-300">
                    <strong>💡 Tip:</strong> After testing, check your Sentry dashboard at{' '}
                    <a
                      href="https://sentry.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-200"
                    >
                      sentry.io
                    </a>
                    {' '}to verify errors appear and configure alerts.
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  <strong>⚠️ Warning:</strong> These actions directly modify the game state.
                  Use for testing purposes only. Changes affect all connected players.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 sm:px-6 py-3 rounded-b-2xl">
          <p className="text-center text-xs sm:text-sm text-gray-400">
            Made with ❤️ and lots of ☕ • v{buildInfo.version} • {buildInfo.buildStatus}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
