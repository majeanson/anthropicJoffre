/**
 * LobbyBrowser Component - Retro Gaming Edition
 *
 * Browse and join active games, or watch replays of recent finished games.
 * Features neon-styled cards, arcade tab navigation, and retro aesthetic.
 */

import { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/constants';
import { ERROR_MESSAGES, getErrorMessage } from '../config/errorMessages';
import logger from '../utils/logger';
import { sounds } from '../utils/sounds';
import { Button, NeonButton } from './ui/Button';
import { Input } from './ui/Input';
import { Tabs, Tab } from './ui/Tabs';
import { Checkbox } from './ui/Checkbox';
import { Select } from './ui/Select';

// Lazy load GameReplay component
const GameReplay = lazy(() => import('./GameReplay').then(m => ({ default: m.GameReplay })));

// Sprint 8 Task 2: Move pure helper functions outside component for performance
const getPhaseColor = (phase: string): string => {
  switch (phase) {
    case 'team_selection': return 'var(--color-info)';
    case 'betting': return 'var(--color-warning)';
    case 'playing': return 'var(--color-success)';
    case 'scoring': return 'var(--color-team2-primary)';
    case 'game_over': return 'var(--color-text-muted)';
    default: return 'var(--color-text-muted)';
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

  // Keyboard navigation state
  const [selectedIndex, setSelectedIndex] = useState(0);

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
        let errorData: { message?: string; correlationId?: string; correlation_id?: string };
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        logger.error('[LobbyBrowser] Server error:', errorData);

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
        logger.error('[LobbyBrowser] Network error:', err);
        setError(ERROR_MESSAGES.NETWORK_ERROR);

        // Retry on network errors
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchGames(isInitialLoad, retryCount + 1);
        }
      } else {
        const errorMessage = getErrorMessage(err, 'UNKNOWN_ERROR');
        logger.error('[LobbyBrowser] Failed to load games:', errorMessage, { error: String(err) });
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
        let errorData: { message?: string; correlationId?: string; correlation_id?: string };
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        logger.error('[LobbyBrowser] Server error:', errorData);

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
        logger.error('[LobbyBrowser] Network error:', err);
        setError(errorMessage);

        // Retry on network errors
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchRecentGames(isInitialLoad, retryCount + 1);
        }
      } else {
        const errorMessage = getErrorMessage(err, 'UNKNOWN_ERROR');
        logger.error('[LobbyBrowser] Failed to load recent games:', errorMessage, { error: String(err) });
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

  // Get current list for keyboard navigation
  const currentList = activeTab === 'active' ? filteredAndSortedGames : recentGames;
  const currentListLength = currentList.length;

  // Reset selection when tab or list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [activeTab, currentListLength]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if in input/select
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentListLength > 0) {
            setSelectedIndex(prev => (prev - 1 + currentListLength) % currentListLength);
            sounds.buttonClick();
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (currentListLength > 0) {
            setSelectedIndex(prev => (prev + 1) % currentListLength);
            sounds.buttonClick();
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (activeTab === 'recent') {
            setActiveTab('active');
            sounds.buttonClick();
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (activeTab === 'active') {
            setActiveTab('recent');
            sounds.buttonClick();
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentListLength > 0 && selectedIndex < currentListLength) {
            if (activeTab === 'active') {
              const game = filteredAndSortedGames[selectedIndex];
              if (game.isJoinable || (game.isInProgress && game.botPlayerCount > 0)) {
                handleJoinGameClick(game);
              } else if (game.isInProgress) {
                onSpectateGame(game.gameId);
                onClose();
              }
            } else {
              // Recent games - open replay
              const game = recentGames[selectedIndex];
              setReplayGameId(game.game_id);
            }
          }
          break;

        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          if (currentListLength > 0) {
            setSelectedIndex(currentListLength - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentListLength, selectedIndex, filteredAndSortedGames, recentGames, onClose, onSpectateGame, handleJoinGameClick]);

  // Show GameReplay if a game is selected for replay
  if (replayGameId) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
          <div className="text-[var(--color-text-accent)] font-display animate-pulse">Loading replay...</div>
        </div>
      }>
        <GameReplay
          gameId={replayGameId}
          socket={socket}
          onClose={() => setReplayGameId(null)}
        />
      </Suspense>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: 'blur(8px)' }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="
          bg-[var(--color-bg-secondary)]
          rounded-[var(--radius-xl)]
          max-w-4xl w-full max-h-[90vh]
          overflow-hidden
          border-2 border-[var(--color-border-accent)]
        "
        style={{
          boxShadow: 'var(--shadow-glow), var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          className="p-6 flex items-center justify-between relative"
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-primary) 100%)',
            borderBottom: '2px solid var(--color-border-accent)',
          }}
        >
          <div>
            <h2
              className="text-2xl sm:text-3xl font-display uppercase tracking-wider"
              style={{
                color: 'var(--color-text-primary)',
                textShadow: '0 0 20px var(--color-glow), 0 0 40px var(--color-glow)',
              }}
            >
              Game Lobby
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 font-body">
              {activeTab === 'active'
                ? `${games.length} active game${games.length !== 1 ? 's' : ''}`
                : `${recentGames.length} recent game${recentGames.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              p-2 rounded-[var(--radius-md)]
              text-[var(--color-text-muted)]
              hover:text-[var(--color-text-primary)]
              hover:bg-[var(--color-bg-tertiary)]
              transition-all duration-[var(--duration-fast)]
            "
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation - Arcade Style */}
        <Tabs
          tabs={[
            { id: 'active', label: 'Active Games', icon: '🎮' },
            { id: 'recent', label: 'Recent Games', icon: '📜' },
          ] as Tab[]}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as 'active' | 'recent');
            sounds.buttonClick();
          }}
          variant="underline"
          size="md"
          fullWidth
        />

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 space-y-3">
          {/* Join with Game ID Section - Only in Active Games tab */}
          {activeTab === 'active' && (
            <div
              className="
                rounded-[var(--radius-lg)]
                border border-[var(--color-border-default)]
                bg-[var(--color-bg-tertiary)]
                overflow-hidden
              "
            >
              <button
                onClick={() => { setShowJoinInput(!showJoinInput); sounds.buttonClick(); }}
                className="
                  w-full px-4 py-3
                  flex items-center justify-between
                  text-left
                  hover:bg-[var(--color-bg-secondary)]
                  transition-colors duration-[var(--duration-fast)]
                "
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  <span className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm">
                    Join with Game ID
                  </span>
                </div>
                <span className="text-[var(--color-text-muted)]">{showJoinInput ? '▲' : '▼'}</span>
              </button>

              {showJoinInput && (
                <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border-subtle)]">
                  <div className="pt-3">
                    <Input
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value)}
                      placeholder="Enter Game ID"
                      variant="default"
                      size="md"
                      leftIcon={<span className="text-sm">🎮</span>}
                    />
                  </div>
                  <Button
                    data-testid="join-game-button"
                    onClick={() => {
                      if (gameId.trim()) {
                        onJoinGame(gameId.trim());
                        onClose();
                      }
                    }}
                    disabled={!gameId.trim()}
                    variant="success"
                    size="md"
                    fullWidth
                  >
                    Join Game
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Sprint 6: Filter and Sort Bar - Only in Active Games tab */}
          {activeTab === 'active' && games.length > 0 && (
            <div
              className="
                p-4
                rounded-[var(--radius-lg)]
                border border-[var(--color-border-default)]
                bg-[var(--color-bg-tertiary)]
              "
            >
              <div className="flex flex-wrap items-center gap-4">
                {/* Filter Checkboxes */}
                <div className="flex items-center gap-4 flex-wrap">
                  <Checkbox
                    checked={filterWithBots}
                    onChange={(e) => setFilterWithBots(e.target.checked)}
                    label="🤖 With Bots"
                    size="sm"
                  />
                  <Checkbox
                    checked={filterNeedsPlayers}
                    onChange={(e) => setFilterNeedsPlayers(e.target.checked)}
                    label="💺 Needs Players"
                    size="sm"
                  />
                  <Checkbox
                    checked={filterInProgress}
                    onChange={(e) => setFilterInProgress(e.target.checked)}
                    label="🎮 In Progress"
                    size="sm"
                  />
                </div>

                {/* Game Mode Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-muted)] font-body whitespace-nowrap">Mode:</span>
                  <Select
                    value={filterGameMode}
                    onChange={(e) => setFilterGameMode(e.target.value as 'all' | 'ranked' | 'casual')}
                    options={[
                      { value: 'all', label: 'All Games' },
                      { value: 'ranked', label: 'Ranked' },
                      { value: 'casual', label: 'Casual' },
                    ]}
                    size="sm"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-[var(--color-text-muted)] font-body whitespace-nowrap">Sort:</span>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'players' | 'score')}
                    options={[
                      { value: 'newest', label: 'Newest' },
                      { value: 'players', label: 'Most Players' },
                      { value: 'score', label: 'Highest Score' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Active filter count */}
              {(filterWithBots || filterNeedsPlayers || filterInProgress || filterGameMode !== 'all') && (
                <div className="mt-3 text-xs text-[var(--color-text-muted)] font-body">
                  Showing {filteredAndSortedGames.length} of {games.length} games
                </div>
              )}
            </div>
          )}

          {/* Loading State - Retro Skeleton Loaders */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="
                    rounded-[var(--radius-lg)]
                    border border-[var(--color-border-default)]
                    bg-[var(--color-bg-tertiary)]
                    p-4
                    animate-pulse
                  "
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-24 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
                        <div className="h-6 w-20 bg-[var(--color-bg-secondary)] rounded-full" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-16 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
                        <div className="h-4 w-16 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
                        <div className="h-4 w-20 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 w-16 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              className="
                p-4
                rounded-[var(--radius-lg)]
                border-2 border-[var(--color-error)]
                bg-[var(--color-error)]/10
              "
              style={{
                boxShadow: '0 0 20px rgba(255, 0, 110, 0.3)',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-[var(--color-error)] font-display text-sm uppercase tracking-wider mb-1">
                    {error}
                  </p>
                  {correlationId && (
                    <p className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
                      Error ID: {correlationId}
                      <br />
                      <span className="opacity-75">
                        Please include this ID when reporting the issue
                      </span>
                    </p>
                  )}
                  <Button
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
                    variant="danger"
                    size="sm"
                    className="mt-3"
                  >
                    {isRetrying ? '🔄 Retrying...' : '🔄 Try Again'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Games Tab */}
          {activeTab === 'active' && !loading && !error && (
            <>
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl block mb-4">🎮</span>
                  <h3
                    className="font-display text-lg uppercase tracking-wider text-[var(--color-text-primary)] mb-2"
                    style={{ textShadow: '0 0 10px var(--color-glow)' }}
                  >
                    No Active Games
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] font-body">
                    Create a new game to get started!
                  </p>
                </div>
              ) : filteredAndSortedGames.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl block mb-4">🔍</span>
                  <h3
                    className="font-display text-lg uppercase tracking-wider text-[var(--color-text-primary)] mb-2"
                    style={{ textShadow: '0 0 10px var(--color-glow)' }}
                  >
                    No Matches
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] font-body">
                    Try adjusting your filters to see more games
                  </p>
                </div>
              ) : (
                filteredAndSortedGames.map((game, index) => (
                  <div
                    key={game.gameId}
                    className={`
                      rounded-[var(--radius-lg)]
                      border-2
                      p-4
                      transition-all duration-[var(--duration-fast)]
                      ${selectedIndex === index
                        ? 'border-[var(--color-text-accent)] bg-[var(--color-text-accent)]/10'
                        : 'border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-accent)]'
                      }
                    `}
                    style={selectedIndex === index ? { boxShadow: '0 0 15px var(--color-glow)' } : {}}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Game ID and badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className="font-display text-lg sm:text-xl uppercase tracking-wider"
                            style={{
                              color: 'var(--color-text-primary)',
                              textShadow: '0 0 5px var(--color-glow)',
                            }}
                          >
                            Game {game.gameId}
                          </span>
                          <span
                            className="
                              px-2 py-0.5
                              rounded-full
                              text-xs font-display uppercase
                            "
                            style={{
                              backgroundColor: getPhaseColor(game.phase),
                              color: 'var(--color-text-inverse)',
                              boxShadow: `0 0 8px ${getPhaseColor(game.phase)}`,
                            }}
                          >
                            {getPhaseLabel(game.phase)}
                          </span>
                          <span
                            className={`
                              px-2 py-0.5
                              rounded-full
                              text-xs font-display uppercase
                              ${game.persistenceMode === 'elo'
                                ? 'bg-[var(--color-warning)] text-black'
                                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                              }
                            `}
                            style={game.persistenceMode === 'elo' ? { boxShadow: '0 0 8px var(--color-warning)' } : {}}
                          >
                            {game.persistenceMode === 'elo' ? '🏆 Ranked' : '🎲 Casual'}
                          </span>
                        </div>
                        {/* Player info */}
                        <div className="text-sm text-[var(--color-text-muted)] font-body flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>👥 {game.humanPlayerCount} player{game.humanPlayerCount !== 1 ? 's' : ''}</span>
                          {game.botPlayerCount > 0 && (
                            <span>🤖 {game.botPlayerCount} bot{game.botPlayerCount !== 1 ? 's' : ''}</span>
                          )}
                          {game.isInProgress && (
                            <span>📊 Round {game.roundNumber}</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 sm:flex-shrink-0">
                        {(game.isJoinable || (game.isInProgress && game.botPlayerCount > 0)) && (
                          <Button
                            onClick={() => handleJoinGameClick(game)}
                            variant="success"
                            size="sm"
                            className="flex-1 sm:flex-none"
                          >
                            Join
                          </Button>
                        )}
                        {game.isInProgress && (
                          <NeonButton
                            onClick={() => {
                              onSpectateGame(game.gameId);
                              onClose();
                            }}
                            size="sm"
                            className="flex-1 sm:flex-none"
                          >
                            <span>👁️</span>
                            Spectate
                          </NeonButton>
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
                  <span className="text-6xl block mb-4">📜</span>
                  <h3
                    className="font-display text-lg uppercase tracking-wider text-[var(--color-text-primary)] mb-2"
                    style={{ textShadow: '0 0 10px var(--color-glow)' }}
                  >
                    No Recent Games
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] font-body">
                    Completed games will appear here
                  </p>
                </div>
              ) : (
                recentGames.map((game, index) => {
                  const durationMinutes = Math.floor(game.game_duration_seconds / 60);
                  const finishedDate = new Date(game.finished_at);
                  const timeAgo = getTimeAgo(finishedDate);

                  return (
                    <div
                      key={game.game_id}
                      className={`
                        rounded-[var(--radius-lg)]
                        border-2
                        p-4
                        transition-all duration-[var(--duration-fast)]
                        ${selectedIndex === index
                          ? 'border-[var(--color-text-accent)] bg-[var(--color-text-accent)]/10'
                          : 'border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-accent)]'
                        }
                      `}
                      style={selectedIndex === index ? { boxShadow: '0 0 15px var(--color-glow)' } : {}}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span
                              className="font-display text-lg sm:text-xl uppercase tracking-wider"
                              style={{
                                color: 'var(--color-text-primary)',
                                textShadow: '0 0 5px var(--color-glow)',
                              }}
                            >
                              Game {game.game_id}
                            </span>
                            <span
                              className="
                                px-2 py-0.5
                                rounded-full
                                text-xs font-display uppercase
                              "
                              style={{
                                backgroundColor: game.winning_team === 1 ? 'var(--color-team1-primary)' : 'var(--color-team2-primary)',
                                color: 'white',
                                boxShadow: `0 0 8px ${game.winning_team === 1 ? 'var(--color-team1-primary)' : 'var(--color-team2-primary)'}`,
                              }}
                            >
                              🏆 Team {game.winning_team} Won
                            </span>
                          </div>
                          <div className="text-sm text-[var(--color-text-muted)] font-body flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>📊 Score: {game.team1_score} - {game.team2_score}</span>
                            <span>🎯 {game.rounds} rounds</span>
                            <span>⏱️ {durationMinutes}m</span>
                            <span>🕒 {timeAgo}</span>
                          </div>
                        </div>

                        <NeonButton
                          onClick={() => setReplayGameId(game.game_id)}
                          size="sm"
                          glow
                        >
                          <span aria-hidden="true">📺</span>
                          Watch Replay
                        </NeonButton>
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
