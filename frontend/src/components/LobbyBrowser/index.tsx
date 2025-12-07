/**
 * LobbyBrowser Component - Retro Gaming Edition
 * Version 2.0.0 - Modular Architecture
 *
 * Browse and join active games, or watch replays of recent finished games.
 * Refactored into sub-components:
 * - GameCard: Individual active game display
 * - RecentGameCard: Individual recent game display
 * - FilterBar: Filter and sort controls
 * - JoinWithIdSection: Join game by ID input
 */

import { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/constants';
import { ERROR_MESSAGES, getErrorMessage } from '../../config/errorMessages';
import logger from '../../utils/logger';
import { sounds } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { Tabs, Tab } from '../ui/Tabs';
import { LobbyGame, RecentGame, LobbyBrowserTabType, GameModeFilter, SortOption } from './types';
import { GameCard } from './GameCard';
import { RecentGameCard } from './RecentGameCard';
import { FilterBar } from './FilterBar';
import { JoinWithIdSection } from './JoinWithIdSection';

// Lazy load GameReplay component
const GameReplay = lazy(() => import('../GameReplay').then((m) => ({ default: m.GameReplay })));

interface LobbyBrowserProps {
  socket: Socket | null;
  onJoinGame: (gameId: string) => void;
  onSpectateGame: (gameId: string) => void;
  onClose: () => void;
  onShowWhyRegister?: () => void;
}

export function LobbyBrowser({
  socket,
  onJoinGame,
  onSpectateGame,
  onClose,
  onShowWhyRegister,
}: LobbyBrowserProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<LobbyBrowserTabType>('active');
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [replayGameId, setReplayGameId] = useState<string | null>(null);

  // Filter and sort state
  const [filterWithBots, setFilterWithBots] = useState(false);
  const [filterNeedsPlayers, setFilterNeedsPlayers] = useState(false);
  const [filterInProgress, setFilterInProgress] = useState(false);
  const [filterGameMode, setFilterGameMode] = useState<GameModeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Keyboard navigation state
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Track if we've done the initial load for each tab
  const hasLoadedActiveGames = useRef(false);
  const hasLoadedRecentGames = useRef(false);

  // Handler to validate join game request
  const handleJoinGameClick = (game: LobbyGame) => {
    if (game.persistenceMode === 'elo' && !isAuthenticated) {
      if (onShowWhyRegister) {
        onShowWhyRegister();
      }
      return;
    }
    onJoinGame(game.gameId);
  };

  const fetchGames = async (isInitialLoad = false, retryCount = 0) => {
    try {
      if (isInitialLoad && !hasLoadedActiveGames.current) {
        setLoading(true);
      }
      if (retryCount > 0) {
        setIsRetrying(true);
      }

      const response = await fetch(API_ENDPOINTS.gamesLobby(), {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        let errorData: { message?: string; correlationId?: string; correlation_id?: string };
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        logger.error('[LobbyBrowser] Server error:', errorData);
        const corrId = errorData.correlationId || errorData.correlation_id || null;
        if (corrId) {
          setCorrelationId(corrId);
        }

        if (response.status >= 500 && retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
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
      if (err instanceof TypeError && err.message.includes('fetch')) {
        logger.error('[LobbyBrowser] Network error:', err);
        setError(ERROR_MESSAGES.NETWORK_ERROR);

        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
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
      if (isInitialLoad && !hasLoadedRecentGames.current) {
        setLoading(true);
      }
      if (retryCount > 0) {
        setIsRetrying(true);
      }

      const response = await fetch(API_ENDPOINTS.recentGames(), {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        let errorData: { message?: string; correlationId?: string; correlation_id?: string };
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: await response.text() };
        }

        logger.error('[LobbyBrowser] Server error:', errorData);
        const corrId = errorData.correlationId || errorData.correlation_id || null;
        if (corrId) {
          setCorrelationId(corrId);
        }

        if (response.status >= 500 && retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
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
      if (err instanceof TypeError && err.message.includes('fetch')) {
        const errorMessage = 'Network error. Please check your connection.';
        logger.error('[LobbyBrowser] Network error:', err);
        setError(errorMessage);

        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchRecentGames(isInitialLoad, retryCount + 1);
        }
      } else {
        const errorMessage = getErrorMessage(err, 'UNKNOWN_ERROR');
        logger.error('[LobbyBrowser] Failed to load recent games:', errorMessage, {
          error: String(err),
        });
        setError(`${ERROR_MESSAGES.RECENT_GAMES_LOAD_FAILED}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'active') {
      fetchGames(true);
      const interval = setInterval(() => fetchGames(false), 5000);
      return () => clearInterval(interval);
    } else {
      fetchRecentGames(true);
    }
  }, [activeTab]);

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...games];

    if (filterWithBots) {
      filtered = filtered.filter((game) => game.botPlayerCount > 0);
    }
    if (filterNeedsPlayers) {
      filtered = filtered.filter((game) => game.humanPlayerCount < 4 || game.botPlayerCount > 0);
    }
    if (filterInProgress) {
      filtered = filtered.filter((game) => game.isInProgress);
    }
    if (filterGameMode === 'ranked') {
      filtered = filtered.filter((game) => game.persistenceMode === 'elo');
    } else if (filterGameMode === 'casual') {
      filtered = filtered.filter((game) => game.persistenceMode === 'casual');
    }

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
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
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
            setSelectedIndex((prev) => (prev - 1 + currentListLength) % currentListLength);
            sounds.buttonClick();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentListLength > 0) {
            setSelectedIndex((prev) => (prev + 1) % currentListLength);
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
  }, [
    activeTab,
    currentListLength,
    selectedIndex,
    filteredAndSortedGames,
    recentGames,
    onClose,
    onSpectateGame,
  ]);

  // Show GameReplay if a game is selected for replay
  if (replayGameId) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
            <div className="text-[var(--color-text-accent)] font-display animate-pulse">
              Loading replay...
            </div>
          </div>
        }
      >
        <GameReplay gameId={replayGameId} socket={socket} onClose={() => setReplayGameId(null)} />
      </Suspense>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="
          bg-[var(--color-bg-secondary)]
          rounded-[var(--radius-xl)]
          max-w-4xl w-full max-h-[90vh]
          overflow-hidden
          border-2 border-[var(--color-border-accent)]
          shadow-[var(--shadow-glow),var(--shadow-lg)]
        "
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between relative bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-primary)] border-b-2 border-skin-accent">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display uppercase tracking-wider text-skin-primary drop-shadow-[0_0_20px_var(--color-glow)]">
              Game Lobby
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 font-body">
              {activeTab === 'active'
                ? `${games.length} active game${games.length !== 1 ? 's' : ''}`
                : `${recentGames.length} recent game${recentGames.length !== 1 ? 's' : ''}`}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <Tabs
          tabs={
            [
              { id: 'active', label: 'Active Games', icon: '🎮' },
              { id: 'recent', label: 'Recent Games', icon: '📜' },
            ] as Tab[]
          }
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as LobbyBrowserTabType);
            sounds.buttonClick();
          }}
          variant="underline"
          size="md"
          fullWidth
        />

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 space-y-3">
          {/* Join with Game ID Section */}
          {activeTab === 'active' && <JoinWithIdSection onJoinGame={onJoinGame} onClose={onClose} />}

          {/* Filter Bar */}
          {activeTab === 'active' && games.length > 0 && (
            <FilterBar
              filterWithBots={filterWithBots}
              setFilterWithBots={setFilterWithBots}
              filterNeedsPlayers={filterNeedsPlayers}
              setFilterNeedsPlayers={setFilterNeedsPlayers}
              filterInProgress={filterInProgress}
              setFilterInProgress={setFilterInProgress}
              filterGameMode={filterGameMode}
              setFilterGameMode={setFilterGameMode}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalGames={games.length}
              filteredCount={filteredAndSortedGames.length}
            />
          )}

          {/* Loading State */}
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
                shadow-[0_0_20px_rgba(255,0,110,0.3)]
              "
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
                  <h3 className="font-display text-lg uppercase tracking-wider text-[var(--color-text-primary)] mb-2 drop-shadow-[0_0_10px_var(--color-glow)]">
                    No Active Games
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] font-body">
                    Create a new game to get started!
                  </p>
                </div>
              ) : filteredAndSortedGames.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl block mb-4">🔍</span>
                  <h3 className="font-display text-lg uppercase tracking-wider text-[var(--color-text-primary)] mb-2 drop-shadow-[0_0_10px_var(--color-glow)]">
                    No Matches
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] font-body">
                    Try adjusting your filters to see more games
                  </p>
                </div>
              ) : (
                filteredAndSortedGames.map((game, index) => (
                  <GameCard
                    key={game.gameId}
                    game={game}
                    isSelected={selectedIndex === index}
                    onJoin={() => handleJoinGameClick(game)}
                    onSpectate={() => {
                      onSpectateGame(game.gameId);
                      onClose();
                    }}
                  />
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
                  <h3 className="font-display text-lg uppercase tracking-wider text-skin-primary mb-2 text-shadow-glow">
                    No Recent Games
                  </h3>
                  <p className="text-sm text-skin-muted font-body">
                    Completed games will appear here
                  </p>
                </div>
              ) : (
                recentGames.map((game, index) => (
                  <RecentGameCard
                    key={game.game_id}
                    game={game}
                    isSelected={selectedIndex === index}
                    onWatchReplay={() => setReplayGameId(game.game_id)}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-export for backwards compatibility
export default LobbyBrowser;
export * from './types';
