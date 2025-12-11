/**
 * LobbyBrowser Component - Retro Gaming Edition
 * Version 3.0.0 - Modular Architecture with Extracted Hooks
 *
 * Browse and join active games, or watch replays of recent finished games.
 *
 * Refactored structure:
 * - Sub-components: GameCard, RecentGameCard, FilterBar, JoinWithIdSection
 * - Hooks: useLobbyGames, useLobbyFilters, useLobbyKeyboardNav
 */

import { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { sounds } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { Tabs, Tab } from '../ui/Tabs';
import { LobbyGame, LobbyBrowserTabType } from './types';
import { GameCard } from './GameCard';
import { RecentGameCard } from './RecentGameCard';
import { FilterBar } from './FilterBar';
import { JoinWithIdSection } from './JoinWithIdSection';
import { useLobbyGames } from './useLobbyGames';
import { useLobbyFilters } from './useLobbyFilters';
import { useLobbyKeyboardNav } from './useLobbyKeyboardNav';

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
  const [replayGameId, setReplayGameId] = useState<string | null>(null);

  // Use extracted hooks
  const {
    games,
    recentGames,
    loading,
    error,
    correlationId,
    isRetrying,
    refreshGames,
  } = useLobbyGames({ activeTab });

  const {
    filterWithBots,
    setFilterWithBots,
    filterNeedsPlayers,
    setFilterNeedsPlayers,
    filterInProgress,
    setFilterInProgress,
    filterGameMode,
    setFilterGameMode,
    sortBy,
    setSortBy,
    getFilteredGames,
  } = useLobbyFilters();

  // Get filtered games
  const filteredAndSortedGames = useMemo(
    () => getFilteredGames(games),
    [games, getFilteredGames]
  );

  // Get current list for keyboard navigation
  const currentList = activeTab === 'active' ? filteredAndSortedGames : recentGames;

  // Handler to validate join game request
  const handleJoinGameClick = useCallback(
    (game: LobbyGame) => {
      if (game.persistenceMode === 'elo' && !isAuthenticated) {
        if (onShowWhyRegister) {
          onShowWhyRegister();
        }
        return;
      }
      onJoinGame(game.gameId);
    },
    [isAuthenticated, onJoinGame, onShowWhyRegister]
  );

  // Handle keyboard action
  const handleKeyboardAction = useCallback(() => {
    if (currentList.length === 0) return;

    const { selectedIndex } = keyboardNav;
    if (selectedIndex >= currentList.length) return;

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
  }, [activeTab, currentList, filteredAndSortedGames, recentGames, handleJoinGameClick, onSpectateGame, onClose]);

  // Use keyboard navigation hook
  const keyboardNav = useLobbyKeyboardNav({
    activeTab,
    setActiveTab,
    listLength: currentList.length,
    onClose,
    onAction: handleKeyboardAction,
  });

  const { selectedIndex } = keyboardNav;

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
                    onClick={refreshGames}
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
