/**
 * usePlayerStats Hook
 *
 * Reusable hook for fetching player statistics via WebSocket.
 * Used in PlayerStatsModal, PlayerProfileModal, and PersonalHub.
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { ERROR_MESSAGES } from '../config/errorMessages';
import logger from '../utils/logger';

export interface PlayerStats {
  player_name: string;

  // Game-level stats
  games_played: number;
  games_won: number;
  games_lost: number;
  games_abandoned: number;
  win_percentage: number;
  elo_rating: number;
  highest_rating: number;
  lowest_rating: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  current_win_streak: number;
  best_win_streak: number;
  current_loss_streak: number;
  worst_loss_streak: number;
  fastest_win: number;
  longest_game: number;
  avg_game_duration_minutes: number;

  // Round-level stats
  total_rounds_played: number;
  rounds_won: number;
  rounds_lost: number;
  rounds_win_percentage: number;

  // Trick stats
  total_tricks_won: number;
  avg_tricks_per_round: number;
  most_tricks_in_round: number;
  zero_trick_rounds: number;

  // Betting stats
  total_bets_placed: number;
  bets_made: number;
  bets_failed: number;
  bet_success_rate: number;
  avg_bet_amount: number;
  highest_bet: number;
  without_trump_bets: number;

  // Points stats
  total_points_earned: number;
  avg_points_per_round: number;
  highest_points_in_round: number;

  // Special cards
  trump_cards_played: number;
  red_zeros_collected: number;
  brown_zeros_received: number;

  // Achievement expansion tracking
  perfect_bets_won?: number;
  clean_games_won?: number;
  clean_game_streak?: number;
  max_bet_won?: number;
  double_red_zeros?: number;

  created_at: string;
  updated_at: string;
}

interface UsePlayerStatsOptions {
  /** Whether to fetch stats immediately */
  enabled?: boolean;
}

interface UsePlayerStatsResult {
  stats: PlayerStats | null;
  loading: boolean;
  error: string | null;
  correlationId: string | null;
  refetch: () => void;
}

export function usePlayerStats(
  playerName: string | null,
  socket: Socket | null,
  options: UsePlayerStatsOptions = {}
): UsePlayerStatsResult {
  const { enabled = true } = options;

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    if (!socket || !playerName) {
      return;
    }

    setLoading(true);
    setError(null);
    setCorrelationId(null);
    socket.emit('get_player_stats', { playerName });
  }, [socket, playerName]);

  useEffect(() => {
    if (!enabled || !socket || !playerName) {
      return;
    }

    fetchStats();

    const handleStatsResponse = ({
      stats: receivedStats,
      playerName: responseName,
    }: {
      stats: PlayerStats | null;
      playerName: string;
    }) => {
      if (responseName === playerName) {
        setStats(receivedStats);
        setError(null);
        setCorrelationId(null);
        setLoading(false);
      }
    };

    const handleError = (errorData: {
      message?: string;
      correlationId?: string;
      correlation_id?: string;
      context?: string;
    }) => {
      // Only handle errors related to player stats
      if (errorData?.context && errorData.context !== 'get_player_stats') {
        return;
      }

      logger.error('[usePlayerStats] Socket error:', errorData);

      const corrId = errorData?.correlationId || errorData?.correlation_id || null;
      if (corrId) {
        setCorrelationId(corrId);
      }

      const errorMessage = errorData?.message || ERROR_MESSAGES.PLAYER_STATS_FAILED;
      setError(errorMessage);
      setLoading(false);
    };

    socket.on('player_stats_response', handleStatsResponse);
    socket.on('error', handleError);

    return () => {
      socket.off('player_stats_response', handleStatsResponse);
      socket.off('error', handleError);
    };
  }, [enabled, socket, playerName, fetchStats]);

  return {
    stats,
    loading,
    error,
    correlationId,
    refetch: fetchStats,
  };
}
