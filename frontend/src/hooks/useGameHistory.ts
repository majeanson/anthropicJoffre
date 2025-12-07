/**
 * useGameHistory Hook
 *
 * Reusable hook for fetching player game history via WebSocket.
 * Used in PlayerStatsModal, PlayerProfileModal.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { GameHistoryEntry } from '../types/game';
import { ERROR_MESSAGES } from '../config/errorMessages';
import logger from '../utils/logger';

export type ResultFilter = 'all' | 'won' | 'lost';
export type SortBy = 'date' | 'score' | 'rounds';
export type SortOrder = 'desc' | 'asc';
export type HistoryTab = 'finished' | 'unfinished';

interface UseGameHistoryOptions {
  /** Whether to fetch history immediately */
  enabled?: boolean;
  /** Maximum number of games to fetch */
  limit?: number;
}

interface UseGameHistoryResult {
  games: GameHistoryEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  // Filtering
  historyTab: HistoryTab;
  setHistoryTab: (tab: HistoryTab) => void;
  resultFilter: ResultFilter;
  setResultFilter: (filter: ResultFilter) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  // Filtered and sorted games
  filteredGames: GameHistoryEntry[];
}

export function useGameHistory(
  playerName: string | null,
  socket: Socket | null,
  options: UseGameHistoryOptions = {}
): UseGameHistoryResult {
  const { enabled = true, limit = 20 } = options;

  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtering state
  const [historyTab, setHistoryTab] = useState<HistoryTab>('finished');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchHistory = useCallback(() => {
    if (!socket || !playerName) {
      return;
    }

    setLoading(true);
    setError(null);
    socket.emit('get_player_history', { playerName, limit });
  }, [socket, playerName, limit]);

  useEffect(() => {
    if (!enabled || !socket || !playerName) {
      return;
    }

    fetchHistory();

    const handleHistoryResponse = ({
      games: receivedGames,
      playerName: responseName,
    }: {
      games: GameHistoryEntry[];
      playerName: string;
    }) => {
      if (responseName === playerName) {
        setGames(receivedGames);
        setError(null);
        setLoading(false);
      }
    };

    const handleError = (errorData: {
      message?: string;
      context?: string;
    }) => {
      // Only handle errors related to game history
      if (errorData?.context && errorData.context !== 'get_player_history') {
        return;
      }

      logger.error('[useGameHistory] Socket error:', errorData);
      const errorMessage = errorData?.message || ERROR_MESSAGES.GAME_HISTORY_FAILED;
      setError(errorMessage);
      setLoading(false);
    };

    socket.on('player_history_response', handleHistoryResponse);
    socket.on('error', handleError);

    return () => {
      socket.off('player_history_response', handleHistoryResponse);
      socket.off('error', handleError);
    };
  }, [enabled, socket, playerName, fetchHistory]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let filtered = games.filter((game) =>
      historyTab === 'finished' ? game.is_finished : !game.is_finished
    );

    // Apply result filter for finished games
    if (historyTab === 'finished' && resultFilter !== 'all') {
      filtered = filtered.filter((game) => {
        const playerTeamId = game.team_id;
        const didWin = game.winning_team === playerTeamId;
        return resultFilter === 'won' ? didWin : !didWin;
      });
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
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
  }, [games, historyTab, resultFilter, sortBy, sortOrder]);

  return {
    games,
    loading,
    error,
    refetch: fetchHistory,
    historyTab,
    setHistoryTab,
    resultFilter,
    setResultFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredGames,
  };
}
