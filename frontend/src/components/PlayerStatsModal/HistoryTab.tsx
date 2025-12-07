import { useState, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { GameHistoryEntry } from '../../types/game';
import { MatchCard } from '../MatchCard';
import { Button, Spinner, Tabs } from '../ui';
import { HistoryTabType, ResultFilterType, SortByType, SortOrderType } from './types';

interface HistoryTabProps {
  playerName: string;
  socket: Socket;
  gameHistory: GameHistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
  onRetry: () => void;
  onViewReplay?: (gameId: string) => void;
  onViewDetails: (gameId: string) => void;
  onClose: () => void;
}

export function HistoryTab({
  gameHistory,
  historyLoading,
  historyError,
  onRetry,
  onViewReplay,
  onViewDetails,
  onClose,
}: HistoryTabProps) {
  const [historyTab, setHistoryTab] = useState<HistoryTabType>('finished');
  const [resultFilter, setResultFilter] = useState<ResultFilterType>('all');
  const [sortBy, setSortBy] = useState<SortByType>('date');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('desc');

  // Filter and sort game history for display
  const filteredAndSortedGames = useMemo(() => {
    let filteredGames = gameHistory.filter((game) =>
      historyTab === 'finished' ? game.is_finished : !game.is_finished
    );

    // Apply result filter for finished games
    if (historyTab === 'finished' && resultFilter !== 'all') {
      filteredGames = filteredGames.filter((game) => {
        const playerTeamId = game.team_id;
        const didWin = game.winning_team === playerTeamId;
        return resultFilter === 'won' ? didWin : !didWin;
      });
    }

    // Apply sorting
    return [...filteredGames].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.finished_at || a.created_at).getTime();
          const dateB = new Date(b.finished_at || b.created_at).getTime();
          comparison = dateB - dateA;
          break;
        case 'score':
          const scoreA = Math.abs(a.team1_score - a.team2_score);
          const scoreB = Math.abs(b.team1_score - b.team2_score);
          comparison = scoreB - scoreA;
          break;
        case 'rounds':
          comparison = b.rounds - a.rounds;
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [gameHistory, historyTab, resultFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Sub-tabs for Finished/Unfinished */}
      <Tabs
        tabs={[
          { id: 'finished', label: '✓ Finished Games' },
          { id: 'unfinished', label: '⏸ Unfinished Games' },
        ]}
        activeTab={historyTab}
        onChange={(id) => setHistoryTab(id as HistoryTabType)}
        variant="underline"
        size="sm"
      />

      {/* Result Filter - Only show for finished games */}
      {historyTab === 'finished' && (
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm font-semibold text-skin-secondary">Filter:</span>
          <Button
            onClick={() => setResultFilter('all')}
            variant={resultFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
          >
            All Games
          </Button>
          <Button
            onClick={() => setResultFilter('won')}
            variant={resultFilter === 'won' ? 'success' : 'ghost'}
            size="sm"
          >
            🏆 Wins
          </Button>
          <Button
            onClick={() => setResultFilter('lost')}
            variant={resultFilter === 'lost' ? 'danger' : 'ghost'}
            size="sm"
          >
            ❌ Losses
          </Button>

          <span className="text-sm font-semibold text-skin-secondary ml-4">Sort by:</span>
          <Button
            onClick={() => setSortBy('date')}
            variant={sortBy === 'date' ? 'primary' : 'ghost'}
            size="sm"
          >
            📅 Date
          </Button>
          <Button
            onClick={() => setSortBy('score')}
            variant={sortBy === 'score' ? 'primary' : 'ghost'}
            size="sm"
          >
            ⚡ Score
          </Button>
          <Button
            onClick={() => setSortBy('rounds')}
            variant={sortBy === 'rounds' ? 'primary' : 'ghost'}
            size="sm"
          >
            🔄 Rounds
          </Button>

          <Button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            variant="ghost"
            size="sm"
            title={sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </Button>
        </div>
      )}

      {historyLoading && (
        <div className="text-center py-12">
          <Spinner size="lg" color="success" />
          <p className="mt-4 text-skin-muted font-semibold">Loading game history...</p>
        </div>
      )}

      {/* History Error State */}
      {!historyLoading && historyError && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">{historyError}</p>
              <Button variant="danger" size="md" onClick={onRetry}>
                🔄 Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {!historyLoading && !historyError && gameHistory.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl" aria-hidden="true">
            📭
          </span>
          <p className="mt-4 text-skin-secondary font-bold text-lg">No game history found</p>
          <p className="text-skin-muted">Play some games to build your history!</p>
        </div>
      )}

      {!historyLoading && gameHistory.length > 0 && (
        <>
          {filteredAndSortedGames.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl" aria-hidden="true">
                🔍
              </span>
              <p className="mt-4 text-skin-secondary font-bold">
                No{' '}
                {resultFilter === 'won'
                  ? 'wins'
                  : resultFilter === 'lost'
                    ? 'losses'
                    : historyTab + ' games'}{' '}
                found
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-skin-muted">
                Showing {filteredAndSortedGames.length} {historyTab} game
                {filteredAndSortedGames.length !== 1 ? 's' : ''}
                {historyTab === 'finished' && resultFilter !== 'all' && (
                  <span className="font-semibold">
                    {' '}
                    ({resultFilter === 'won' ? 'wins only' : 'losses only'})
                  </span>
                )}
              </p>
              <div className="space-y-3">
                {filteredAndSortedGames.map((game) => (
                  <MatchCard
                    key={game.game_id}
                    game={game}
                    onViewReplay={
                      onViewReplay
                        ? (gameId) => {
                            onViewReplay(gameId);
                            onClose();
                          }
                        : undefined
                    }
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
