import { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/constants';
import { ERROR_MESSAGES, getErrorMessage } from '../config/errorMessages';

// Lazy load GameReplay component
const GameReplay = lazy(() => import('./GameReplay').then(m => ({ default: m.GameReplay })));

// Sprint 8 Task 2: Move pure helper functions outside component for performance
const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'team_selection': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'betting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'playing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'scoring': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'game_over': return 'bg-gray-100 text-gray-800 dark:text-gray-200 dark:bg-gray-800 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800 dark:text-gray-200 dark:bg-gray-800 dark:text-gray-200';
  }
};

const getPhaseLabel = (phase: string) => {
  switch (phase) {
    case 'team_selection': return 'Team Selection';
    case 'betting': return 'Betting';
    case 'playing': return 'Playing';
    case 'scoring': return 'Scoring';
    case 'game_over': return 'Game Over';
    default: return phase;
  }
};

interface LobbyGame {
  gameId: string;
  phase: string;
  persistenceMode: 'elo' | 'casual';
  playerCount: number;
  humanPlayerCount: number;
  botPlayerCount: number;
  isJoinable: boolean;
  isInProgress: boolean;
  teamScores: {
    team1: number;
    team2: number;
  };
  roundNumber: number;
  createdAt: number;
  players: Array<{
    name: string;
    teamId: 1 | 2;
    isBot: boolean;
  }>;
}

interface RecentGame {
  game_id: string;
  winning_team: 1 | 2;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names: string[];
  player_teams: (1 | 2)[];
  is_bot_game: boolean;
  game_duration_seconds: number;
  created_at: string;
  finished_at: string;
}

interface LobbyBrowserProps {
  socket: Socket | null;
  onJoinGame: (gameId: string) => void;
  onSpectateGame: (gameId: string) => void;
  onClose: () => void;
}


export function LobbyBrowser({ socket, onJoinGame, onSpectateGame, onClose }: LobbyBrowserProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'recent'>('active');
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [gameId, setGameId] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [replayGameId, setReplayGameId] = useState<string | null>(null);

  // Sprint 6: Filter and sort state
  const [filterWithBots, setFilterWithBots] = useState(false);
  const [filterNeedsPlayers, setFilterNeedsPlayers] = useState(false);
  const [filterInProgress, setFilterInProgress] = useState(false);
  const [filterGameMode, setFilterGameMode] = useState<'all' | 'ranked' | 'casual'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'players' | 'score'>('newest');

  // Track if we've done the initial load for each tab
  const hasLoadedActiveGames = useRef(false);
  const hasLoadedRecentGames = useRef(false);

  // Handler to validate join game request
  const handleJoinGameClick = (game: LobbyGame) => {
    // Check if game is ranked and user is not authenticated
    if (game.persistenceMode === 'elo' && !isAuthenticated) {
      setError('Please register to join ranked games');
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Valid - proceed with join
    onJoinGame(game.gameId);
  };

  const fetchGames = async (isInitialLoad = false, retryCount = 0) => {
    try {
      // Only show loading spinner on first ever load
      if (isInitialLoad && !hasLoadedActiveGames.current) {
        setLoading(true);
      }
      if (retryCount > 0) {
        setIsRetrying(true);
      }

      const response = await fetch(API_ENDPOINTS.gamesLobby(), {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        // Try to parse error as JSON to extract correlation ID
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        console.error('[LobbyBrowser] Server error:', errorData);

        // Extract correlation ID if available
        const corrId = errorData.correlationId || errorData.correlation_id || null;
        if (corrId) {
          setCorrelationId(corrId);
        }

        // Retry on 5xx errors (server errors) or network issues
        if (response.status >= 500 && retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return fetchGames(isInitialLoad, retryCount + 1);
        }

        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setGames(data.games);
      setError(null);
      setCorrelationId(null);
      hasLoadedActiveGames.current = true;
    } catch (err) {
      // Network errors (fetch failed)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('[LobbyBrowser] Network error:', err);
        setError(ERROR_MESSAGES.NETWORK_ERROR);

        // Retry on network errors
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchGames(isInitialLoad, retryCount + 1);
        }
      } else {
        const errorMessage = getErrorMessage(err, 'UNKNOWN_ERROR');
        console.error('[LobbyBrowser] Failed to load games:', errorMessage, err);
        setError(`${ERROR_MESSAGES.GAMES_LOAD_FAILED}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const fetchRecentGames = async (isInitialLoad = false, retryCount = 0) => {
    try {
      // Only show loading spinner on first ever load
      if (isInitialLoad && !hasLoadedRecentGames.current) {
        setLoading(true);
      }
      if (retryCount > 0) {
        setIsRetrying(true);
      }

      const response = await fetch(API_ENDPOINTS.recentGames(), {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        // Try to parse error as JSON to extract correlation ID
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        console.error('[LobbyBrowser] Server error:', errorData);

        // Extract correlation ID if available
        const corrId = errorData.correlationId || errorData.correlation_id || null;
        if (corrId) {
          setCorrelationId(corrId);
        }

        // Retry on 5xx errors (server errors)
        if (response.status >= 500 && retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchRecentGames(isInitialLoad, retryCount + 1);
        }

        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setRecentGames(data.games);
      setError(null);
      setCorrelationId(null);
      hasLoadedRecentGames.current = true;
    } catch (err) {
      // Network errors (fetch failed)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        const errorMessage = 'Network error. Please check your connection.';
        console.error('[LobbyBrowser] Network error:', err);
        setError(errorMessage);

        // Retry on network errors
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchRecentGames(isInitialLoad, retryCount + 1);
        }
      } else {
        const errorMessage = getErrorMessage(err, 'UNKNOWN_ERROR');
        console.error('[LobbyBrowser] Failed to load recent games:', errorMessage, err);
        setError(`${ERROR_MESSAGES.RECENT_GAMES_LOAD_FAILED}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'active') {
      fetchGames(true); // Initial load
      // Refresh active games every 5 seconds (background refresh, no loading spinner)
      const interval = setInterval(() => fetchGames(false), 5000);
      return () => clearInterval(interval);
    } else {
      fetchRecentGames(true); // Initial load
    }
  }, [activeTab]);

  // Sprint 6: Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...games];

    // Apply filters
    if (filterWithBots) {
      filtered = filtered.filter(game => game.botPlayerCount > 0);
    }
    if (filterNeedsPlayers) {
      filtered = filtered.filter(game =>
        game.humanPlayerCount < 4 || game.botPlayerCount > 0
      );
    }
    if (filterInProgress) {
      filtered = filtered.filter(game => game.isInProgress);
    }
    if (filterGameMode === 'ranked') {
      filtered = filtered.filter(game => game.persistenceMode === 'elo');
    } else if (filterGameMode === 'casual') {
      filtered = filtered.filter(game => game.persistenceMode === 'casual');
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'players':
          return b.humanPlayerCount - a.humanPlayerCount;
        case 'score':
          const aScore = a.teamScores.team1 + a.teamScores.team2;
          const bScore = b.teamScores.team1 + b.teamScores.team2;
          return bScore - aScore;
        default:
          return 0;
      }
    });

    return filtered;
  }, [games, filterWithBots, filterNeedsPlayers, filterInProgress, filterGameMode, sortBy]);

  // Show GameReplay if a game is selected for replay
  if (replayGameId) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading replay...</div></div>}>
        <GameReplay
          gameId={replayGameId}
          socket={socket}
          onClose={() => setReplayGameId(null)}
        />
      </Suspense>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-parchment-50 dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 border-amber-700 dark:border-gray-600 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black font-serif">Game Lobby</h2>
            <p className="text-sm opacity-90 mt-1">
              {activeTab === 'active'
                ? `${games.length} active game${games.length !== 1 ? 's' : ''}`
                : `${recentGames.length} recent game${recentGames.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-parchment-300 dark:border-gray-600 bg-parchment-100 dark:bg-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
              activeTab === 'active'
                ? 'bg-parchment-50 dark:bg-gray-800 text-amber-700 dark:text-amber-500 border-b-4 border-amber-700 dark:border-amber-500'
                : 'text-umber-600 dark:text-gray-400 hover:bg-parchment-200 dark:hover:bg-gray-600'
            }`}
          >
            🎮 Active Games
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
              activeTab === 'recent'
                ? 'bg-parchment-50 dark:bg-gray-800 text-amber-700 dark:text-amber-500 border-b-4 border-amber-700 dark:border-amber-500'
                : 'text-umber-600 dark:text-gray-400 hover:bg-parchment-200 dark:hover:bg-gray-600'
            }`}
          >
            📜 Recent Finished Games
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 space-y-3">
          {/* Join with Game ID Section - Only in Active Games tab */}
          {activeTab === 'active' && (
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600">
              <button
                onClick={() => setShowJoinInput(!showJoinInput)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  <span className="font-semibold text-umber-900 dark:text-gray-100">Join with Game ID</span>
                </div>
                <span className="text-sm text-umber-600 dark:text-gray-400">{showJoinInput ? '▲' : '▼'}</span>
              </button>

              {showJoinInput && (
                <div className="mt-3 space-y-2 animate-fadeIn origin-top">
                  <input
                    type="text"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-parchment-100 dark:bg-gray-600 text-umber-900 dark:text-gray-100 text-sm"
                    placeholder="Enter Game ID"
                  />
                  <button
                    data-testid="join-game-button"
                    onClick={() => {
                      if (gameId.trim()) {
                        onJoinGame(gameId.trim());
                        onClose();
                      }
                    }}
                    disabled={!gameId.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join Game
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sprint 6: Filter and Sort Bar - Only in Active Games tab */}
          {activeTab === 'active' && games.length > 0 && (
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600">
              <div className="flex flex-wrap items-center gap-4">
                {/* Filter Checkboxes */}
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterWithBots}
                      onChange={(e) => setFilterWithBots(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-umber-900 dark:text-gray-100">
                      🤖 With Bots
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterNeedsPlayers}
                      onChange={(e) => setFilterNeedsPlayers(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-umber-900 dark:text-gray-100">
                      💺 Needs Players
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterInProgress}
                      onChange={(e) => setFilterInProgress(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-umber-900 dark:text-gray-100">
                      🎮 In Progress
                    </span>
                  </label>
                </div>

                {/* Game Mode Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-umber-900 dark:text-gray-100">
                    Mode:
                  </span>
                  <select
                    value={filterGameMode}
                    onChange={(e) => setFilterGameMode(e.target.value as 'all' | 'ranked' | 'casual')}
                    className="px-3 py-1.5 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-parchment-100 dark:bg-gray-600 text-umber-900 dark:text-gray-100 text-sm font-medium cursor-pointer"
                  >
                    <option value="all">🎯 All Games</option>
                    <option value="ranked">🏆 Ranked</option>
                    <option value="casual">🎲 Casual</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm font-medium text-umber-900 dark:text-gray-100">
                    Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'players' | 'score')}
                    className="px-3 py-1.5 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-parchment-100 dark:bg-gray-600 text-umber-900 dark:text-gray-100 text-sm font-medium cursor-pointer"
                  >
                    <option value="newest">⏰ Newest</option>
                    <option value="players">👥 Most Players</option>
                    <option value="score">📊 Highest Score</option>
                  </select>
                </div>
              </div>

              {/* Active filter count */}
              {(filterWithBots || filterNeedsPlayers || filterInProgress || filterGameMode !== 'all') && (
                <div className="mt-2 text-xs text-umber-600 dark:text-gray-400">
                  Showing {filteredAndSortedGames.length} of {games.length} games
                </div>
              )}
            </div>
          )}

          {/* Loading State - Sprint 6: Skeleton Loaders */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600 animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Game ID skeleton */}
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-24 bg-parchment-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-6 w-20 bg-parchment-300 dark:bg-gray-600 rounded-full"></div>
                      </div>
                      {/* Player info skeleton */}
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-16 bg-parchment-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 w-16 bg-parchment-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 w-20 bg-parchment-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    {/* Button skeleton */}
                    <div className="flex gap-2">
                      <div className="h-10 w-16 bg-parchment-300 dark:bg-gray-600 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State - Sprint 6: Enhanced with correlation ID and retry */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-800 dark:text-red-200 font-semibold mb-1">
                    {error}
                  </p>
                  {correlationId && (
                    <p className="text-xs text-red-700 dark:text-red-300 font-mono mt-2">
                      Error ID: {correlationId}
                      <br />
                      <span className="text-xs opacity-75">
                        Please include this ID when reporting the issue
                      </span>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setError(null);
                      setCorrelationId(null);
                      if (activeTab === 'active') {
                        fetchGames(true);
                      } else {
                        fetchRecentGames(true);
                      }
                    }}
                    disabled={isRetrying}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRetrying ? '🔄 Retrying...' : '🔄 Try Again'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Games Tab */}
          {activeTab === 'active' && !loading && !error && (
            <>
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">🎮</p>
                  <p className="text-umber-700 dark:text-gray-300 font-semibold">No active games</p>
                  <p className="text-umber-600 dark:text-gray-400 text-sm mt-1">
                    Create a new game to get started!
                  </p>
                </div>
              ) : filteredAndSortedGames.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-umber-700 dark:text-gray-300 font-semibold">No games match your filters</p>
                  <p className="text-umber-600 dark:text-gray-400 text-sm mt-1">
                    Try adjusting your filters to see more games
                  </p>
                </div>
              ) : (
                filteredAndSortedGames.map(game => (
                  <div
                    key={game.gameId}
                    className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600 hover:border-amber-500 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-black text-xl text-umber-900 dark:text-gray-100">
                            Game {game.gameId}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPhaseColor(game.phase)}`}>
                            {getPhaseLabel(game.phase)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            game.persistenceMode === 'elo'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {game.persistenceMode === 'elo' ? '🏆 Ranked' : '🎲 Casual'}
                          </span>
                        </div>
                        <div className="text-sm text-umber-600 dark:text-gray-400 flex items-center gap-4">
                          <span>👥 {game.humanPlayerCount} player{game.humanPlayerCount !== 1 ? 's' : ''}</span>
                          {game.botPlayerCount > 0 && (
                            <span>🤖 {game.botPlayerCount} bot{game.botPlayerCount !== 1 ? 's' : ''}</span>
                          )}
                          {(() => {
                            const emptySeats = 4 - (game.humanPlayerCount + game.botPlayerCount);
                            return emptySeats > 0 && (
                              <span className="text-gray-500 dark:text-gray-500 italic">
                                💺 {emptySeats} empty seat{emptySeats !== 1 ? 's' : ''}
                              </span>
                            );
                          })()}
                          {game.isInProgress && (
                            <span>📊 Round {game.roundNumber}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Show Join button for:
                            1. Team selection games with open spots or bots
                            2. In-progress games with bots (to replace them) */}
                        {(game.isJoinable || (game.isInProgress && game.botPlayerCount > 0)) && (
                          <button
                            onClick={() => handleJoinGameClick(game)}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 md:px-4 py-2 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105 text-sm"
                          >
                            Join
                          </button>
                        )}
                        {game.isInProgress && (
                          <button
                            onClick={() => {
                              onSpectateGame(game.gameId);
                              onClose();
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 border-2 border-blue-800 shadow-lg transform hover:scale-105 flex items-center gap-1 md:gap-2 text-sm"
                          >
                            <span>👁️</span>
                            Spectate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Recent Games Tab */}
          {activeTab === 'recent' && !loading && !error && (
            <>
              {recentGames.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-2">📜</p>
                  <p className="text-umber-700 dark:text-gray-300 font-semibold">No recent games</p>
                  <p className="text-umber-600 dark:text-gray-400 text-sm mt-1">
                    Completed games will appear here
                  </p>
                </div>
              ) : (
                recentGames.map(game => {
                  const durationMinutes = Math.floor(game.game_duration_seconds / 60);
                  const finishedDate = new Date(game.finished_at);
                  const timeAgo = getTimeAgo(finishedDate);

                  return (
                    <div
                      key={game.game_id}
                      className="bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-parchment-300 dark:border-gray-600 hover:border-amber-500 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-black text-xl text-umber-900 dark:text-gray-100">
                              Game {game.game_id}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              game.winning_team === 1
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                            }`}>
                              🏆 Team {game.winning_team} Won
                            </span>
                          </div>
                          <div className="text-sm text-umber-600 dark:text-gray-400 flex items-center gap-4">
                            <span>📊 Score: {game.team1_score} - {game.team2_score}</span>
                            <span>🎯 {game.rounds} rounds</span>
                            <span>⏱️ {durationMinutes}m</span>
                            <span>🕒 {timeAgo}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setReplayGameId(game.game_id)}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 border-2 border-purple-800 shadow-lg transform hover:scale-105 flex items-center gap-2"
                        >
                          <span>📺</span>
                          Watch Replay
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
