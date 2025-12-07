/**
 * useReplayData Hook
 * Fetches and manages game replay data
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import logger from '../../utils/logger';
import type { ReplayData } from './types';

interface UseReplayDataOptions {
  gameId: string;
  socket: Socket | null;
}

interface UseReplayDataResult {
  replayData: ReplayData | null;
  loading: boolean;
  error: string | null;
  correlationId: string | null;
  retry: () => void;
}

export function useReplayData({ gameId, socket }: UseReplayDataOptions): UseReplayDataResult {
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  // Fetch replay data on mount
  useEffect(() => {
    if (!socket) {
      logger.error('[GameReplay] Socket is null');
      return;
    }

    const handleReplayData = ({ replayData }: { replayData: ReplayData }) => {
      // Validate replay data structure
      if (!replayData) {
        logger.error('[GameReplay] Replay data is null or undefined');
        setError('Replay data is missing');
        setLoading(false);
        return;
      }

      if (!replayData.round_history || !Array.isArray(replayData.round_history)) {
        logger.error(
          '[GameReplay] round_history is missing or not an array:',
          replayData.round_history
        );
        setError('Replay data is malformed (missing round history)');
        setLoading(false);
        return;
      }

      setReplayData(replayData);
      setError(null);
      setCorrelationId(null);
      setLoading(false);
    };

    const handleError = (errorData: {
      message?: string;
      correlationId?: string;
      correlation_id?: string;
    }) => {
      logger.error('[GameReplay] Error loading replay', undefined, { errorData, gameId });

      // Extract correlation ID if available
      const corrId = errorData?.correlationId || errorData?.correlation_id || null;
      if (corrId) {
        setCorrelationId(corrId);
      }

      // Set user-friendly error message
      const errorMessage = errorData?.message || 'Failed to load game replay';
      setError(errorMessage);
      setLoading(false);
    };

    socket.on('game_replay_data', handleReplayData);
    socket.on('error', handleError);

    // Request replay data
    socket.emit('get_game_replay', { gameId });

    return () => {
      socket.off('game_replay_data', handleReplayData);
      socket.off('error', handleError);
    };
  }, [socket, gameId]);

  const retry = () => {
    setError(null);
    setCorrelationId(null);
    setLoading(true);
    if (socket) {
      socket.emit('get_game_replay', { gameId });
    }
  };

  return {
    replayData,
    loading,
    error,
    correlationId,
    retry,
  };
}
