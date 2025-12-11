/**
 * PlayerStatsModal Component
 * Version 2.1.0 - Modular Architecture with Hooks
 *
 * Refactored into separate tab components:
 * - RoundStatsTab: Round performance, tricks, betting, points
 * - GameStatsTab: Win/loss record, streaks, game records
 * - HistoryTab: Game history with filtering and sorting
 * - ProfileTab: Profile editing (own profile only)
 *
 * Now uses reusable hooks:
 * - usePlayerStats: Fetches player statistics
 * - useGameHistory: Fetches and filters game history
 */

import { useState, Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { getTierColor, getTierIcon } from '../../utils/tierBadge';
import { StatsGridSkeleton, CardSkeleton, TableSkeleton } from '../ui/Skeleton';
import Avatar from '../Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button, Tabs } from '../ui';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { useGameHistory } from '../../hooks/useGameHistory';
import { PlayerStatsModalTabType } from './types';
import { RoundStatsTab } from './RoundStatsTab';
import { GameStatsTab } from './GameStatsTab';
import { HistoryTab } from './HistoryTab';
import { ProfileTab } from './ProfileTab';

// Lazy load heavy modal
const MatchStatsModal = lazy(() =>
  import('../MatchStatsModal').then((m) => ({ default: m.MatchStatsModal }))
);

interface PlayerStatsModalProps {
  playerName: string;
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
  onViewReplay?: (gameId: string) => void;
  onResumeGame?: (gameId: string) => void;
}

export function PlayerStatsModal({
  playerName,
  socket,
  isOpen,
  onClose,
  onViewReplay,
  onResumeGame,
}: PlayerStatsModalProps) {
  // CRITICAL: Check isOpen BEFORE any hooks
  if (!isOpen) return null;

  // Tab state
  const [activeTab, setActiveTab] = useState<PlayerStatsModalTabType>('round');

  // Match details modal state
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showMatchStatsModal, setShowMatchStatsModal] = useState(false);

  // Authentication
  const { user, isAuthenticated } = useAuth();
  const isOwnProfile = isAuthenticated && user?.username === playerName;

  // Use reusable hooks for data fetching
  const {
    stats,
    loading,
    error,
    correlationId,
    refetch: refetchStats,
  } = usePlayerStats(playerName, socket);

  const {
    filteredGames: gameHistory,
    loading: historyLoading,
    error: historyError,
    refetch: fetchHistory,
  } = useGameHistory(playerName, socket, {
    enabled: activeTab === 'history',
  });

  const handleRetryStats = () => {
    refetchStats();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-4">
          <Avatar username={playerName} avatarUrl={user?.avatar_url} size="xl" />
          <div>
            <h2 className="text-2xl font-bold text-parchment-50">{playerName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-amber-200 text-sm">
                {stats ? `Joined ${new Date(stats.created_at).toLocaleDateString()}` : 'Loading...'}
              </span>
              {isOwnProfile && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  You
                </span>
              )}
            </div>
          </div>
        </div>
      }
      theme="minimal"
      size="xl"
    >
      <div className="space-y-6">
        {loading && (
          <div className="space-y-6">
            <CardSkeleton count={1} hasAvatar={false} />
            <StatsGridSkeleton columns={2} rows={3} />
            <TableSkeleton rows={5} columns={5} showHeader={true} />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">
                ⚠️
              </span>
              <div className="flex-1">
                <p className="text-red-800 font-semibold mb-1">{error}</p>
                {correlationId && (
                  <p className="text-xs text-red-700 font-mono mt-2">
                    Error ID: {correlationId}
                    <br />
                    <span className="text-xs opacity-75">
                      Please include this ID when reporting the issue
                    </span>
                  </p>
                )}
                <Button variant="danger" size="md" onClick={handleRetryStats}>
                  🔄 Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !stats && (
          <div className="text-center py-12">
            <span className="text-6xl" aria-hidden="true">
              ❌
            </span>
            <p className="mt-4 text-skin-primary font-bold text-lg">
              No statistics found for {playerName}
            </p>
            <p className="text-skin-secondary">Play some games to start building your stats!</p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* Ranking Tier Card */}
            <div
              className={`bg-gradient-to-r ${getTierColor(stats.ranking_tier)} rounded-xl p-6 text-white shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-90">Current Rank</p>
                  <p className="text-4xl font-bold flex items-center gap-2 mt-1">
                    {getTierIcon(stats.ranking_tier)} {stats.ranking_tier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold opacity-90">ELO Rating</p>
                  <p className="text-4xl font-bold mt-1">{stats.elo_rating}</p>
                  <p className="text-xs opacity-75">
                    Peak: {stats.highest_rating} • Low: {stats.lowest_rating || stats.elo_rating}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <Tabs
              tabs={[
                { id: 'round', label: '📊 Round Stats' },
                { id: 'game', label: '🏆 Game Stats' },
                { id: 'history', label: '📜 Game History' },
                ...(isOwnProfile ? [{ id: 'profile', label: '👤 Profile' }] : []),
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as PlayerStatsModalTabType)}
              variant="pills"
              size="md"
              fullWidth
            />

            {/* Tab Content */}
            {activeTab === 'round' && <RoundStatsTab stats={stats} />}
            {activeTab === 'game' && <GameStatsTab stats={stats} />}
            {activeTab === 'history' && (
              <HistoryTab
                playerName={playerName}
                socket={socket}
                gameHistory={gameHistory}
                historyLoading={historyLoading}
                historyError={historyError}
                onRetry={fetchHistory}
                onViewReplay={onViewReplay}
                onViewDetails={(gameId) => {
                  setSelectedMatchId(gameId);
                  setShowMatchStatsModal(true);
                }}
                onResumeGame={onResumeGame}
                onClose={onClose}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab isOwnProfile={isOwnProfile} onSwitchTab={setActiveTab} />
            )}

            {/* Footer */}
            <div className="text-center text-sm text-skin-muted pt-4 border-t-2 border-skin-default">
              <p>Member since: {new Date(stats.created_at).toLocaleDateString()}</p>
              <p>Last updated: {new Date(stats.updated_at).toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      {/* Match Stats Modal */}
      {selectedMatchId && (
        <Suspense fallback={<div />}>
          <MatchStatsModal
            gameId={selectedMatchId}
            socket={socket}
            isOpen={showMatchStatsModal}
            onClose={() => {
              setShowMatchStatsModal(false);
              setSelectedMatchId(null);
            }}
            onViewReplay={onViewReplay}
          />
        </Suspense>
      )}
    </Modal>
  );
}

// Re-export for backwards compatibility
export default PlayerStatsModal;
export * from './types';
